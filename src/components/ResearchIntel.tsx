'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import ContentModal from './ContentModal';
import { supabase } from '@/lib/supabase';
import styles from './ResearchIntel.module.css';
import XRayTooltip from './XRayTooltip';

const PAGE_SIZE = 10;

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
    // Added fields for detail view
    summary?: string;
    content?: string;
    tags?: string[];
    readTime?: string;
    date?: string;
    link?: string; // External link for RSS items
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
    console.log('[DEBUG-RESEARCH] ResearchIntel Component Function Called');
    const [activeTab, setActiveTab] = useState<TabType>('ALL');
    const [data, setData] = useState<IntelItem[]>([]);
    const [rssNews, setRssNews] = useState<IntelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        console.log('[DEBUG-RESEARCH] ResearchIntel Mounted');
        fetchResearch();
        fetchRssNews();

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

    async function fetchRssNews() {
        try {
            const res = await fetch('/api/rss/tokenpost');
            if (res.ok) {
                const items = await res.json();
                setRssNews(items);
            }
        } catch (err) {
            console.error('RSS fetch error:', err);
        }
    }

    async function fetchResearch(offset = 0) {
        if (!supabase) {
            console.error('Supabase client not initialized');
            setLoading(false);
            return;
        }

        try {
            const { data: rows, error } = await supabase
                .from('research')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + PAGE_SIZE - 1);

            if (error) {
                console.error('Error fetching research:', error);
                setLoading(false);
                return;
            }

            if (rows) {
                if (offset === 0) {
                    setData(rows.map(mapRowToIntel));
                } else {
                    setData(prev => [...prev, ...rows.map(mapRowToIntel)]);
                }
                setHasMore(rows.length === PAGE_SIZE);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    async function loadMore() {
        if (loading || !hasMore) return;
        setLoading(true);
        await fetchResearch(data.length);
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
            time: new Intl.DateTimeFormat('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Seoul'
            }).format(new Date(row.created_at)),
            isPro,
            isBreaking: type === 'BREAKING',
            thumbnail: row.thumbnail_url || row.image_url || undefined,
            // Map detail fields
            summary: row.summary || row.title,
            content: row.content || '내용이 없습니다.',
            tags: row.tags || [],
            readTime: '3분', // Estimate or stored
            date: new Date(row.created_at).toLocaleDateString()
        };
    }

    const filteredData = activeTab === 'ALL'
        ? [...data, ...rssNews.slice(0, 5)]
        : activeTab === 'PRO'
            ? data.filter(item => item.isPro)
            : rssNews; // NEWS tab uses RSS feed

    const breakingCount = data.filter(item => item.isBreaking).length;
    const viewItem = data.find(item => item.id === selectedId) || rssNews.find(item => item.id === selectedId);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'BREAKING': return 'var(--accent-red)';
            case 'KPI': return 'var(--accent-blue)';
            case 'PRO': return 'var(--accent-yellow)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className="card-title">
                        <XRayTooltip dataKey="ai_analysis">
                            인사이트
                        </XRayTooltip>
                    </span>
                    <span className="badge badge-live">실시간</span>
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
                        전체
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
                        뉴스
                    </button>
                </div>
            </div>
            <div className={styles.list}>
                {filteredData.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        데이터를 불러오는 중이거나 게시물이 없습니다.
                    </div>
                ) : (
                    <>
                        {filteredData.map((item) => (
                            <div
                                key={item.id}
                                className={`${styles.intelItem} ${item.isBreaking ? styles.breaking : ''}`}
                                onClick={() => {
                                    if (item.link) {
                                        window.open(item.link, '_blank');
                                    } else {
                                        setSelectedId(item.id);
                                    }
                                }}
                            >
                                {item.thumbnail && (
                                    <div className={styles.thumbnail}>
                                        <img src={item.thumbnail} alt="" />
                                    </div>
                                )}
                                <div className={styles.contentWrapper}>
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                        <span
                                            className={styles.typeBadge}
                                            style={{
                                                color: getTypeColor(item.type),
                                                background: `${getTypeColor(item.type)}20`,
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {item.typeKo}
                                        </span>
                                    </div>

                                    <div className={styles.content}>
                                        <div className={styles.titleRow}>
                                            <span className={styles.title}>{item.title}</span>

                                            {item.isBreaking && <span className={styles.liveTag}>LIVE</span>}
                                        </div>
                                        <div className={styles.meta}>
                                            {item.source} · {item.time}
                                            {item.tags && item.tags.length > 0 && (
                                                <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                                                    #{item.tags[0]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Load More Button */}
                        {hasMore && activeTab === 'ALL' && (
                            <button
                                className={styles.loadMoreBtn}
                                onClick={loadMore}
                                disabled={loading}
                            >
                                {loading ? (
                                    '로딩 중...'
                                ) : (
                                    <>
                                        <ChevronDown size={16} />
                                        더보기
                                    </>
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>

            <ContentModal
                contentData={viewItem || null}
                isOpen={!!selectedId}
                onClose={() => setSelectedId(null)}
            />
        </div >
    );
}
