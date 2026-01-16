import { useEffect, useState } from 'react';
import { Newspaper } from 'lucide-react';
import { supabase, News } from '@/lib/supabase';
import { NewsFeedSkeleton } from './LoadingSkeleton';
import EmptyState from './EmptyState';
import ContentModal from './ContentModal';
import styles from './NewsFeed.module.css';

interface NewsItem {
    id: string;
    time: string;
    source: string;
    title: string;
    summary?: string;
    content?: string;
    tickers: string[];
}

// Top crypto tickers for filtering
const CRYPTO_TICKERS = [
    'BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'DOGE', 'ADA', 'TRX', 'AVAX', 'LINK',
    'TON', 'SHIB', 'DOT', 'XLM', 'BCH', 'SUI', 'HBAR', 'LTC', 'PEPE', 'UNI',
    'NEAR', 'APT', 'ICP', 'ETC', 'MATIC', 'TAO', 'AAVE', 'FIL', 'STX', 'VET',
    'ATOM', 'INJ', 'RNDR', 'IMX', 'ARB', 'OP', 'MKR', 'GRT', 'THETA', 'FTM'
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawNewsData = News & Record<string, any>;

// Extract tickers from content
function extractTickers(content: string): string[] {
    const found: string[] = [];
    const upperContent = content.toUpperCase();

    for (const ticker of CRYPTO_TICKERS) {
        // Check for ticker as standalone word (with word boundaries)
        const regex = new RegExp(`\\b${ticker}\\b`, 'i');
        if (regex.test(upperContent)) {
            found.push(ticker);
        }
    }
    return found.slice(0, 3); // Max 3 tickers
}

export default function NewsFeed() {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
    const [filter, setFilter] = useState<string>('ALL');

    useEffect(() => {
        fetchNews();

        // Subscribe to changes
        const channel = supabase
            ? supabase.channel('public:news')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news' }, (payload) => {
                    const newRow = payload.new as RawNewsData;
                    setNewsItems(prev => [mapNewsToItem(newRow), ...prev].slice(0, 30));
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
            .limit(30);

        if (error) {
            console.error('Error fetching news:', error);
            return;
        }

        if (data) {
            setNewsItems(data.map(mapNewsToItem));
        }
        setLoading(false);
    }

    function mapNewsToItem(row: RawNewsData): NewsItem {
        const date = new Date(row.published_at || new Date().toISOString());
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Extract tickers from title and content
        const searchText = `${row.title || ''} ${row.content || ''} ${row.summary || ''}`;
        const tickers = extractTickers(searchText);

        return {
            id: row.id.toString(),
            time: timeStr,
            source: row.source || 'TokenPost',
            title: row.title,
            summary: row.summary || undefined,
            content: row.content || undefined,
            tickers,
        };
    }

    const filteredNews = filter === 'ALL'
        ? newsItems
        : newsItems.filter(news => news.tickers.includes(filter));

    const tickerFilters = ['ALL', 'BTC', 'ETH', 'XRP', 'SOL', 'BNB'];

    return (
        <div className={styles.feedContainer}>
            <div className={styles.header}>
                <h3 className={styles.headerTitle}>실시간 뉴스</h3>
                <div className={styles.headerControls}>
                    <span className="badge badge-live">실시간</span>
                </div>
            </div>

            {/* Ticker Filters */}
            <div className={styles.filters}>
                {tickerFilters.map(ticker => (
                    <button
                        key={ticker}
                        className={`${styles.filterBtn} ${filter === ticker ? styles.active : ''}`}
                        onClick={() => setFilter(ticker)}
                    >
                        {ticker === 'ALL' ? '전체' : ticker}
                    </button>
                ))}
            </div>

            <div className={styles.list}>
                {loading ? (
                    <NewsFeedSkeleton />
                ) : filteredNews.length === 0 ? (
                    <EmptyState
                        icon={<Newspaper size={48} />}
                        title="해당 뉴스가 없습니다"
                        description="다른 필터를 선택해보세요."
                    />
                ) : (
                    filteredNews.map((news) => (
                        <article
                            key={news.id}
                            className={styles.item}
                            onClick={() => setSelectedNews(news)}
                        >
                            <div className={styles.itemMeta}>
                                <span className={styles.time}>{news.time}</span>
                                <span className={styles.source}>{news.source}</span>
                            </div>

                            <div className={styles.itemContent}>
                                <h3 className={styles.title}>{news.title}</h3>
                                {news.tickers.length > 0 && (
                                    <div className={styles.tickerTags}>
                                        {news.tickers.map(ticker => (
                                            <span key={ticker} className={styles.tickerTag}>{ticker}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </article>
                    ))
                )}
            </div>

            {/* Right-side Modal */}
            <ContentModal
                contentData={selectedNews ? {
                    title: selectedNews.title,
                    source: selectedNews.source,
                    readTime: '2분',
                    summary: selectedNews.summary || '',
                    content: selectedNews.content || selectedNews.summary || '',
                    tags: selectedNews.tickers || []
                } : null}
                isOpen={!!selectedNews}
                onClose={() => setSelectedNews(null)}
            />
        </div>
    );
}
