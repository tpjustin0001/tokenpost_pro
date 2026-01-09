'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ContentModal from '@/components/ContentModal';
import styles from './page.module.css';

interface NewsItem {
    id: string;
    category: string;
    title: string;
    summary: string;
    source: string;
    time: string;
    thumbnail: string;
    isPro?: boolean;
}

const NEWS_DATA: NewsItem[] = [
    {
        id: '1',
        category: '규제',
        title: 'SEC, 비트코인 현물 ETF 옵션 거래 최종 승인',
        summary: 'SEC가 BlacRock, Fidelity 등 주요 자산운용사의 비트코인 현물 ETF에 대한 옵션 거래를 승인했습니다.',
        source: 'Reuters',
        time: '30분 전',
        thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop',
    },
    {
        id: '2',
        category: '시장',
        title: '비트코인 $95,000 돌파, 사상 최고치 경신',
        summary: 'ETF 승인 기대감과 기관 수요 증가로 비트코인이 $95,000를 돌파하며 사상 최고치를 경신했습니다.',
        source: 'CoinDesk',
        time: '1시간 전',
        thumbnail: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=250&fit=crop',
    },
    {
        id: '3',
        category: 'DeFi',
        title: 'Uniswap V4, 메인넷 출시 임박',
        summary: '후크(Hooks) 기능을 도입한 Uniswap V4가 테스트넷 완료 후 메인넷 출시를 앞두고 있습니다.',
        source: 'The Block',
        time: '2시간 전',
        thumbnail: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&h=250&fit=crop',
        isPro: true,
    },
    {
        id: '4',
        category: '정책',
        title: '트럼프 행정부, 암호화폐 규제 완화 신호',
        summary: '트럼프 대통령 당선인이 암호화폐 친화적 정책을 시사하며 시장에 긍정적 영향을 미치고 있습니다.',
        source: 'Bloomberg',
        time: '3시간 전',
        thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&h=250&fit=crop',
    },
    {
        id: '5',
        category: 'Layer2',
        title: 'Base, 일일 트랜잭션 500만 건 돌파',
        summary: 'Coinbase의 Layer2 Base가 일일 트랜잭션 500만 건을 기록하며 성장세를 이어가고 있습니다.',
        source: 'Decrypt',
        time: '4시간 전',
        thumbnail: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=250&fit=crop',
    },
    {
        id: '6',
        category: 'NFT',
        title: 'Pudgy Penguins, 아마존 장난감 매출 1위',
        summary: 'NFT 프로젝트 Pudgy Penguins의 실물 장난감이 아마존에서 베스트셀러에 등극했습니다.',
        source: 'NFT Now',
        time: '5시간 전',
        thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=250&fit=crop',
    },
];

const CATEGORIES = ['전체', '규제', '시장', 'DeFi', '정책', 'Layer2', 'NFT'];

export default function NewsPage() {
    const [activeCategory, setActiveCategory] = useState('전체');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const filteredNews = activeCategory === '전체'
        ? NEWS_DATA
        : NEWS_DATA.filter(item => item.category === activeCategory);

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

                    <div className={styles.newsGrid}>
                        {filteredNews.map(item => (
                            <article
                                key={item.id}
                                className={styles.newsCard}
                                onClick={() => setSelectedId(item.id)}
                            >
                                <div className={styles.thumbnailWrapper}>
                                    <img src={item.thumbnail} alt="" className={styles.thumbnail} />
                                    {item.isPro && <span className={styles.proBadge}>PRO</span>}
                                </div>
                                <div className={styles.cardContent}>
                                    <span className={styles.category}>{item.category}</span>
                                    <h3 className={styles.title}>{item.title}</h3>
                                    <p className={styles.summary}>{item.summary}</p>
                                    <div className={styles.meta}>
                                        <span>{item.source}</span>
                                        <span>·</span>
                                        <span>{item.time}</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
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
