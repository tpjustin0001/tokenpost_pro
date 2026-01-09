'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ContentModal from '@/components/ContentModal';
import { supabase, News } from '@/lib/supabase';
import styles from './page.module.css';

// Fallback mock data (Supabase 연결 전)
const MOCK_NEWS = [
    {
        id: 1,
        category: '규제',
        title: 'SEC, 비트코인 현물 ETF 옵션 거래 최종 승인',
        summary: 'SEC가 BlackRock, Fidelity 등 주요 자산운용사의 비트코인 현물 ETF에 대한 옵션 거래를 승인했습니다.',
        source: 'Reuters',
        published_at: new Date().toISOString(),
        image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop',
    },
    {
        id: 2,
        category: '시장',
        title: '비트코인 $95,000 돌파, 사상 최고치 경신',
        summary: 'ETF 승인 기대감과 기관 수요 증가로 비트코인이 $95,000를 돌파하며 사상 최고치를 경신했습니다.',
        source: 'CoinDesk',
        published_at: new Date(Date.now() - 3600000).toISOString(),
        image_url: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=250&fit=crop',
    },
    {
        id: 3,
        category: 'DeFi',
        title: 'Uniswap V4, 메인넷 출시 임박',
        summary: '후크(Hooks) 기능을 도입한 Uniswap V4가 테스트넷 완료 후 메인넷 출시를 앞두고 있습니다.',
        source: 'The Block',
        published_at: new Date(Date.now() - 7200000).toISOString(),
        image_url: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&h=250&fit=crop',
    },
];

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
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchNews() {
            try {
                if (!supabase) {
                    setNews(MOCK_NEWS);
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from('news')
                    .select('*')
                    .order('published_at', { ascending: false })
                    .limit(20);

                if (error || !data || data.length === 0) {
                    setNews(MOCK_NEWS);
                } else {
                    setNews(data);
                }
            } catch {
                setNews(MOCK_NEWS);
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
                        <div className={styles.newsGrid}>
                            {filteredNews.map(item => (
                                <article
                                    key={item.id}
                                    className={styles.newsCard}
                                    onClick={() => setSelectedId(String(item.id))}
                                >
                                    <div className={styles.thumbnailWrapper}>
                                        <img src={item.image_url || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop'} alt="" className={styles.thumbnail} />
                                    </div>
                                    <div className={styles.cardContent}>
                                        <span className={styles.category}>{item.category || '뉴스'}</span>
                                        <h3 className={styles.title}>{item.title}</h3>
                                        <p className={styles.summary}>{item.summary}</p>
                                        <div className={styles.meta}>
                                            <span>{item.source || 'TokenPost'}</span>
                                            <span>·</span>
                                            <span>{item.published_at ? getTimeAgo(item.published_at) : '최근'}</span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            <ContentModal
                contentId={selectedId}
                isOpen={!!selectedId}
                onClose={() => setSelectedId(null)}
            />
        </div>
    );
}
