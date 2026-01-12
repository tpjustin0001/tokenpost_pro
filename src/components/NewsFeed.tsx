import { useEffect, useState } from 'react';
import { supabase, News } from '@/lib/supabase';
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
        // Simple time formatting (e.g., 10:30 AM)
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Determine sentiment based on score (mock logic if score is null)
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (row.sentiment_score !== null) {
            if (row.sentiment_score > 0.3) sentiment = 'positive';
            else if (row.sentiment_score < -0.3) sentiment = 'negative';
        }

        return {
            id: row.id.toString(),
            time: timeStr,
            source: row.source || 'TokenPost',
            title: row.title,
            sentiment: sentiment,
            summary: row.summary || undefined,
            tags: [], // Tags not yet in DB schema for news, strictly
        };
    }

    if (loading) {
        return <div className={styles.feedContainer} style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading news...</div>;
    }

    return (
        <div className={styles.feedContainer}>
            <div className={styles.timeline}>
                {newsItems.length === 0 ? (
                    <div style={{ padding: '0 20px', color: 'var(--text-muted)' }}>No recent news.</div>
                ) : (
                    newsItems.map((news, index) => (
                        <article key={news.id} className={`${styles.item} ${styles[news.sentiment || 'neutral']}`}>
                            {index === 0 && <div className={styles.liveIndicator} />}
                            <span className={styles.time}>{news.time}</span>

                            <div className={styles.header}>
                                {news.sentiment && (
                                    <span className={`${styles.sentimentBadge} ${styles[news.sentiment]}`}>
                                        {news.sentiment === 'positive' ? 'Bullish' : news.sentiment === 'negative' ? 'Bearish' : 'Neutral'}
                                    </span>
                                )}
                                <span className={styles.source}>{news.source}</span>
                            </div>

                            <h3 className={styles.title}>{news.title}</h3>
                            {news.summary && <p className={styles.summary}>{news.summary}</p>}
                        </article>
                    ))
                )}
            </div>
        </div>
    );
}
