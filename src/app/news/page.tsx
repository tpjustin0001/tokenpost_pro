'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ContentModal from '@/components/ContentModal';
import { supabase, News } from '@/lib/supabase';
import { flaskApi } from '@/services/flaskApi';
import styles from './page.module.css';

// Fallback mock data (Supabase 연결 전)
const CATEGORIES = ['전체', '규제', '시장', 'DeFi', '정책', 'Layer2', 'NFT'];

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
    const [activeCategory, setActiveCategory] = useState('전체');
    const [selectedItem, setSelectedItem] = useState<any>(null); // Store full object

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

    const filteredNews = activeCategory === '전체'
        ? news
        : news.filter(item => item.category === activeCategory);

    return (
        <div className={styles.appLayout}>
            <Sidebar />

            <div className={styles.mainArea}>
                <main className={styles.content}>
                    <div className={styles.header}>
                        <h1 className={styles.pageTitle}>뉴스</h1>
                        <p className={styles.subtitle}>크립토 시장의 최신 소식을 빠르게 전달합니다</p>
                    </div>

                    <div className={styles.categories}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`${styles.categoryBtn} ${activeCategory === cat ? styles.active : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className={styles.loading}>뉴스 로딩 중...</div>
                    ) : (
                        <>
                            {/* Timeline Feed */}
                            <h2 className={styles.sectionHeading}>실시간 타임라인 (Timeline)</h2>
                            <div className={styles.timelineFeed}>
                                {filteredNews.map((item) => {
                                    return (
                                        <article
                                            key={item.id}
                                            className={styles.newsItem}
                                            onClick={() => setSelectedItem(item)}
                                        >
                                            <div className={styles.itemHeader}>
                                                <span className={styles.time}>{item.published_at ? new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : getTimeAgo(item.created_at || new Date().toISOString())}</span>
                                                <span className={styles.sourceBadge}>{item.source || 'TokenPost'}</span>
                                            </div>

                                            <h3 className={styles.title}>{item.title}</h3>
                                            <p className={styles.summary}>{item.summary || item.content?.substring(0, 100) + '...'}</p>

                                            <div className={styles.tags}>
                                                {item.category && <span className={styles.tag}>{item.category}</span>}
                                                {item.sentiment_score > 0 && <span className={styles.tag} style={{ color: 'var(--accent-green)' }}>Positive</span>}
                                                {item.sentiment_score < 0 && <span className={styles.tag} style={{ color: 'var(--accent-red)' }}>Negative</span>}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </main>
            </div>

            <ContentModal
                contentData={selectedItem ? {
                    ...selectedItem,
                    time: selectedItem.published_at || selectedItem.created_at, // Map for Modal
                    thumbnail: selectedItem.image_url // Map for Modal
                } : null}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </div>
    );
}
