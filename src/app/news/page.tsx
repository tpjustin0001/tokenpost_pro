'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ContentModal from '@/components/ContentModal';
import { supabase, News } from '@/lib/supabase';
import styles from './page.module.css';

// Top crypto tickers for filtering
const CRYPTO_TICKERS = [
    'BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'DOGE', 'ADA', 'TRX', 'AVAX', 'LINK',
    'TON', 'SHIB', 'DOT', 'PEPE', 'UNI', 'NEAR', 'APT', 'ARB', 'OP', 'SUI'
];

const TICKER_FILTERS = ['ALL', 'BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'ADA', 'DOGE'];

// Extract tickers from content
function extractTickers(content: string): string[] {
    const found: string[] = [];
    const upperContent = content.toUpperCase();

    for (const ticker of CRYPTO_TICKERS) {
        const regex = new RegExp(`\\b${ticker}\\b`, 'i');
        if (regex.test(upperContent)) {
            found.push(ticker);
        }
    }
    return found.slice(0, 4);
}

function getTimeAgo(dateString: string): string {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
}

export default function NewsPage() {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    useEffect(() => {
        async function fetchNews() {
            if (!supabase) return;
            try {
                const { data, error } = await supabase
                    .from('news')
                    .select('*')
                    .order('published_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                if (data) setNews(data);
            } catch (error) {
                console.error('Failed to fetch news', error);
            } finally {
                setLoading(false);
            }
        }
        fetchNews();
    }, []);

    // Filter news by ticker
    const filteredNews = activeFilter === 'ALL'
        ? news
        : news.filter(item => {
            const searchText = `${item.title || ''} ${item.content || ''} ${item.summary || ''}`;
            const tickers = extractTickers(searchText);
            return tickers.includes(activeFilter);
        });

    return (
        <div className={styles.appLayout}>
            <Sidebar />

            <div className={styles.mainArea}>
                <main className={styles.content}>
                    <div className={styles.header}>
                        <h1 className={styles.pageTitle}>뉴스</h1>
                        <p className={styles.subtitle}>크립토 시장의 최신 소식을 빠르게 전달합니다</p>
                    </div>

                    {/* Ticker Filters */}
                    <div className={styles.filters}>
                        {TICKER_FILTERS.map(ticker => (
                            <button
                                key={ticker}
                                className={`${styles.filterBtn} ${activeFilter === ticker ? styles.active : ''}`}
                                onClick={() => setActiveFilter(ticker)}
                            >
                                {ticker === 'ALL' ? '전체' : ticker}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className={styles.loading}>뉴스 로딩 중...</div>
                    ) : (
                        <div className={styles.timelineFeed}>
                            {filteredNews.map((item) => {
                                const searchText = `${item.title || ''} ${item.content || ''} ${item.summary || ''}`;
                                const tickers = extractTickers(searchText);
                                const isImportant = item.is_important === true;

                                return (
                                    <article
                                        key={item.id}
                                        className={`${styles.newsItem} ${isImportant ? styles.important : ''}`}
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        <div className={styles.itemHeader}>
                                            <span className={styles.time}>
                                                {item.published_at
                                                    ? new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : getTimeAgo(item.created_at || new Date().toISOString())}
                                            </span>
                                            <span className={styles.sourceBadge}>{item.source || 'TokenPost'}</span>
                                            {isImportant && <span className={styles.importantBadge}>⭐ 중요</span>}
                                        </div>

                                        <h3 className={styles.title}>{item.title}</h3>
                                        <p className={styles.summary}>{item.summary || item.content?.substring(0, 120) + '...'}</p>

                                        {tickers.length > 0 && (
                                            <div className={styles.tickerTags}>
                                                {tickers.map(ticker => (
                                                    <span key={ticker} className={styles.tickerTag}>{ticker}</span>
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            <ContentModal
                contentData={selectedItem ? {
                    ...selectedItem,
                    time: selectedItem.published_at || selectedItem.created_at,
                    thumbnail: selectedItem.image_url
                } : null}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </div>
    );
}
