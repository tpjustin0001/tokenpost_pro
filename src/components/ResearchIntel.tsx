'use client';

import { useState, useEffect } from 'react';
import ContentModal from './ContentModal';
import { supabase } from '@/lib/supabase';
import styles from './ResearchIntel.module.css';
import XRayTooltip from './XRayTooltip';

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
    const [data, setData] = useState<IntelItem[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('ALL');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        fetchResearch();

        // Real-time subscription
        const channel = supabase
            ? supabase.channel('public:research')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'research' }, (payload) => {
                    const newRow = payload.new;
                    setData(prev => [mapRowToIntel(newRow), ...prev].slice(0, 10));
                })
                .subscribe()
            : null;

        return () => {
            if (channel) supabase?.removeChannel(channel);
        }
    }, []);

    async function fetchResearch() {
        if (!supabase) return;

        try {
            const { data: rows, error } = await supabase
                .from('research')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error fetching research:', error);
                return;
            }

            if (rows) {
                setData(rows.map(mapRowToIntel));
            }
        } catch (err) {
            console.error(err);
        }
    }

    function mapRowToIntel(row: any): IntelItem {
        const isPro = row.is_premium || false;
        // Basic mapping logic
        let type: IntelItem['type'] = 'REPORT';
        let typeKo = '리서치';

        if (isPro) {
            type = 'PRO';
            typeKo = 'PRO';
        } else if (row.category === 'KPI') {
            type = 'KPI';
            typeKo = '지표';
        } else if (row.category === 'BREAKING') {
            type = 'BREAKING';
            typeKo = '속보';
        }

        return {
            id: String(row.id),
            type,
            typeKo,
            title: row.title,
            source: row.author || 'TokenPost',
            time: getTimeAgo(row.created_at),
            isPro,
            isBreaking: type === 'BREAKING',
            thumbnail: row.image_url || undefined
        };
    }

    const filteredData = activeTab === 'ALL'
        ? data
        : activeTab === 'PRO'
            ? data.filter(item => item.isPro)
            : data.filter(item => item.type === 'NEWS' || item.type === 'BREAKING'); // Assuming NEWS category exists or logic needs tweak

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
                    <span className="card-title">
                        <XRayTooltip dataKey="ai_analysis">
                            리서치 & 인텔리전스
                        </XRayTooltip>
                    </span>
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
                {filteredData.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        데이터를 불러오는 중이거나 게시물이 없습니다.
                    </div>
                ) : (
                    filteredData.map((item) => (
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
                    ))
                )}
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
