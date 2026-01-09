'use client';

import { useState, useEffect } from 'react';
import ContentModal from './ContentModal';
import { supabase } from '@/lib/supabase';
import styles from './ResearchIntel.module.css';

interface IntelItem {
    id: string;
    type: 'BREAKING' | 'KPI' | 'NEWS' | 'REPORT' | 'PRO';
    typeKo: string;
    title: string;
    source: string;
    time: string;
    isPro?: boolean;
    isBreaking?: boolean;
    thumbnail?: string;
}

// Fallback mock data
const MOCK_DATA: IntelItem[] = [
    {
        id: '1',
        type: 'BREAKING',
        typeKo: '속보',
        title: 'SEC, 비트코인 현물 ETF 옵션 거래 승인',
        source: 'Reuters',
        time: '방금',
        isBreaking: true,
        thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=120&h=80&fit=crop'
    },
    {
        id: '2',
        type: 'PRO',
        typeKo: 'PRO',
        title: 'AI 분석: 비트코인 단기 지지선 $92,000',
        source: 'TokenPost AI',
        time: '1시간',
        isPro: true,
        thumbnail: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=120&h=80&fit=crop'
    },
    {
        id: '3',
        type: 'NEWS',
        typeKo: '뉴스',
        title: '트럼프 암호화폐 특별자문단 임명발표',
        source: 'Bloomberg',
        time: '3시간',
        thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=120&h=80&fit=crop'
    },
    {
        id: '4',
        type: 'KPI',
        typeKo: '지표',
        title: '트랜잭션 수 전월 대비 +20%',
        source: '온체인',
        time: '2시간',
        isPro: true,
        thumbnail: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=120&h=80&fit=crop'
    },
];

type TabType = 'ALL' | 'PRO' | 'NEWS';

function getTimeAgo(dateString: string): string {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return '방금';
    if (hours < 24) return `${hours}시간`;
    const days = Math.floor(hours / 24);
    return `${days}일`;
}

export default function ResearchIntel() {
    const [data, setData] = useState<IntelItem[]>(MOCK_DATA);
    const [activeTab, setActiveTab] = useState<TabType>('ALL');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchResearch() {
            try {
                if (!supabase) {
                    return; // Keep mock data
                }

                const { data: researchData, error } = await supabase
                    .from('research')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error || !researchData || researchData.length === 0) {
                    return; // Keep mock data
                }

                // Transform to IntelItem format
                const transformed: IntelItem[] = researchData.map((r: any) => ({
                    id: String(r.id),
                    type: r.is_premium ? 'PRO' : 'REPORT',
                    typeKo: r.is_premium ? 'PRO' : '리서치',
                    title: r.title,
                    source: r.author || 'TokenPost',
                    time: getTimeAgo(r.created_at),
                    isPro: r.is_premium,
                    thumbnail: r.thumbnail_url,
                }));

                setData(transformed);
            } catch {
                // Keep mock data on error
            }
        }
        fetchResearch();
    }, []);

    const filteredData = activeTab === 'ALL'
        ? data
        : activeTab === 'PRO'
            ? data.filter(item => item.isPro)
            : data.filter(item => item.type === 'NEWS' || item.type === 'BREAKING');

    const breakingCount = data.filter(item => item.isBreaking).length;

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'BREAKING': return 'var(--accent-red)';
            case 'KPI': return 'var(--accent-blue)';
            case 'PRO': return 'var(--accent-yellow)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className={styles.headerLeft}>
                    <span className="card-title">리서치 & 인텔리전스</span>
                    <span className={styles.badge}>핵심 강점</span>
                    {breakingCount > 0 && (
                        <span className={styles.breakingBadge}>
                            {breakingCount} 속보
                        </span>
                    )}
                </div>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'ALL' ? styles.active : ''}`}
                        onClick={() => setActiveTab('ALL')}
                    >
                        ALL
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'PRO' ? styles.active : ''}`}
                        onClick={() => setActiveTab('PRO')}
                    >
                        <span className={styles.proBadge}>PRO</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'NEWS' ? styles.active : ''}`}
                        onClick={() => setActiveTab('NEWS')}
                    >
                        NEWS
                    </button>
                </div>
            </div>
            <div className={styles.list}>
                {filteredData.map((item) => (
                    <div
                        key={item.id}
                        className={`${styles.intelItem} ${item.isBreaking ? styles.breaking : ''}`}
                        onClick={() => setSelectedId(item.id)}
                    >
                        {item.thumbnail && (
                            <div className={styles.thumbnail}>
                                <img src={item.thumbnail} alt="" />
                            </div>
                        )}
                        <div className={styles.contentWrapper}>
                            <span
                                className={styles.typeBadge}
                                style={{ color: getTypeColor(item.type), borderLeft: `2px solid ${getTypeColor(item.type)}` }}
                            >
                                {item.typeKo}
                            </span>
                            <div className={styles.content}>
                                <div className={styles.titleRow}>
                                    <span className={styles.title}>{item.title}</span>
                                    {item.isPro && <span className={styles.proTag}>PRO</span>}
                                    {item.isBreaking && <span className={styles.liveTag}>LIVE</span>}
                                </div>
                                <div className={styles.meta}>{item.source} · {item.time}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.footer}>
                <a href="/research" className={styles.viewAll}>전체 리서치 보기 →</a>
            </div>

            <ContentModal
                contentId={selectedId}
                isOpen={!!selectedId}
                onClose={() => setSelectedId(null)}
            />
        </div>
    );
}
