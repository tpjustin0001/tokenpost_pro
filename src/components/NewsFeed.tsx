import { useEffect, useState } from 'react';
import { Newspaper } from 'lucide-react';
import { supabase, News } from '@/lib/supabase';
import { NewsFeedSkeleton } from './LoadingSkeleton';
import EmptyState from './EmptyState';
import styles from './NewsFeed.module.css';

interface NewsItem {
    id: string;
    time: string;
    source: string;
    title: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    summary?: string;
    tags?: string[];
}

export default function NewsFeed() {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews();

        // Subscribe to changes
        const channel = supabase
            ? supabase.channel('public:news')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news' }, (payload) => {
                    const newRow = payload.new as News;
                    setNewsItems(prev => [mapNewsToItem(newRow), ...prev].slice(0, 20));
                })
                .subscribe()
            : null;

        return () => {
            if (channel) supabase?.removeChannel(channel);
        };
    }, []);

    async function fetchNews() {
        if (!supabase) return;

        const { data, error } = await supabase
            .from('news')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching news:', error);
            return;
        }

        if (data) {
            setNewsItems(data.map(mapNewsToItem));
        }
        setLoading(false);
    }

    function mapNewsToItem(row: News): NewsItem {
        const date = new Date(row.published_at || new Date().toISOString());
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        let importance: 'high' | 'normal' = 'normal';

        if (row.sentiment_score !== null) {
            if (row.sentiment_score > 0.3) sentiment = 'positive';
            else if (row.sentiment_score < -0.3) sentiment = 'negative';

            // High magnitude = High importance
            if (Math.abs(row.sentiment_score) > 0.6) {
                importance = 'high';
            }
        }

        return {
            id: row.id.toString(),
            time: timeStr,
            source: row.source || 'TokenPost',
            title: row.title,
            sentiment: sentiment,
            summary: row.summary || undefined,
            // importance property isn't in interface yet, we will just use it in render
            tags: importance === 'high' ? ['중요'] : [],
        };
    }

    return (
        <div className={styles.feedContainer}>
            <div className={styles.header}>
                <h3 className={styles.headerTitle}>실시간 뉴스</h3>
                <div className={styles.headerControls}>
                    <span className={styles.liveBadge} />
                    <span className={styles.liveText}>LIVE</span>
                </div>
            </div>

            <div className={styles.list}>
                {loading ? (
                    <NewsFeedSkeleton />
                ) : newsItems.length === 0 ? (
                    <EmptyState
                        icon={<Newspaper size={48} />}
                        title="뉴스를 불러오는 중입니다"
                        description="최신 암호화폐 뉴스가 곧 표시됩니다."
                    />
                ) : (
                    newsItems.map((news) => (
                        <article key={news.id} className={`${styles.item} ${styles[news.sentiment || 'neutral']}`}>
                            <div className={styles.itemMeta}>
                                <span className={styles.time}>{news.time}</span>
                                <span className={styles.source}>{news.source}</span>
                            </div>

                            <div className={styles.itemContent}>
                                <div className={styles.titleRow}>
                                    {news.tags && news.tags.includes('중요') && (
                                        <span className={styles.importanceBadge}>⭐️ 중요</span>
                                    )}
                                    <h3
                                        className={styles.title}
                                        title={news.summary} // Native tooltip for quick summary
                                    >
                                        {news.title}
                                    </h3>
                                </div>
                                <div className={styles.indicators}>
                                    <span className={`${styles.sentimentPill} ${styles[news.sentiment || 'neutral']}`}>
                                        {news.sentiment === 'positive' ? '▲ 호재' : news.sentiment === 'negative' ? '▼ 악재' : '- 중립'}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>
    );
}
