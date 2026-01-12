'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MarketPulse from '@/components/MarketPulse';
import { flaskApi } from '@/services/flaskApi';
import styles from './page.module.css';

interface InsightItem {
    id: string;
    type: 'KPI' | 'NEWS' | 'REPORT' | 'ANALYSIS';
    title: string;
    summary: string;
    author: string;
    source: string;
    date: string;
    readTime: string;
    isPro: boolean;
    tags: string[];
    image?: string;
}

type FilterType = 'ALL' | 'REPORT' | 'ANALYSIS' | 'KPI' | 'NEWS';

export default function ResearchPage() {
    const [insights, setInsights] = useState<InsightItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [showProOnly, setShowProOnly] = useState(false);

    useEffect(() => {
        async function fetchInsights() {
            try {
                const data = await flaskApi.getContent('research');
                setInsights(data);
            } catch (error) {
                console.error('Failed to fetch research', error);
            } finally {
                setLoading(false);
            }
        }
        fetchInsights();
    }, []);

    const filteredInsights = insights.filter(item => {
        if (showProOnly && !item.isPro) return false;
        if (activeFilter === 'ALL') return true;
        return item.type === activeFilter;
    });

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'REPORT': return 'var(--accent-purple)';
            case 'ANALYSIS': return 'var(--accent-blue)';
            case 'KPI': return 'var(--accent-green)';
            case 'NEWS': return 'var(--accent-yellow)';
            default: return 'var(--text-muted)';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'REPORT': return '리포트';
            case 'ANALYSIS': return 'AI 분석';
            case 'KPI': return 'KPI';
            case 'NEWS': return '뉴스';
            default: return type;
        }
    };

    return (
        <div className={styles.appLayout}>
            <Sidebar />

            <div className={styles.mainArea}>
                <MarketPulse />

                <main className={styles.content}>
                    {/* Header */}
                    <div className={styles.pageHeader}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.pageTitle}>리서치 & 인사이트</h1>
                            <p className={styles.pageDesc}>TokenPost PRO의 독점 리서치, AI 분석, 시장 인사이트</p>
                        </div>
                        <div className={styles.headerActions}>
                            <label className={styles.proToggle}>
                                <input
                                    type="checkbox"
                                    checked={showProOnly}
                                    onChange={(e) => setShowProOnly(e.target.checked)}
                                />
                                <span className={styles.proLabel}>PRO 전용</span>
                            </label>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className={styles.filterBar}>
                        {(['ALL', 'REPORT', 'ANALYSIS', 'KPI', 'NEWS'] as FilterType[]).map((filter) => (
                            <button
                                key={filter}
                                className={`${styles.filterBtn} ${activeFilter === filter ? styles.active : ''}`}
                                onClick={() => setActiveFilter(filter)}
                            >
                                {filter === 'ALL' ? '전체' : getTypeLabel(filter)}
                                <span className={styles.filterCount}>
                                    {filter === 'ALL'
                                        ? insights.length
                                        : insights.filter(i => i.type === filter).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Featured Section */}
                    {activeFilter === 'ALL' && !showProOnly && insights.length > 0 && (
                        <section className={styles.featured}>
                            <div className={styles.featuredCard}>
                                <span className={styles.featuredBadge}>오늘의 추천</span>
                                <h2 className={styles.featuredTitle}>{insights[0].title}</h2>
                                <p className={styles.featuredSummary}>{insights[0].summary}</p>
                                <div className={styles.featuredMeta}>
                                    <span>{insights[0].author}</span>
                                    <span>·</span>
                                    <span>{insights[0].date}</span>
                                    <span>·</span>
                                    <span>{insights[0].readTime} 읽기</span>
                                </div>
                                <div className={styles.featuredTags}>
                                    {insights[0].tags && insights[0].tags.map(tag => (
                                        <span key={tag} className={styles.tag}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Insights Grid */}
                    <div className={styles.insightsGrid}>
                        {filteredInsights.map((insight) => (
                            <article key={insight.id} className={styles.insightCard}>
                                <div className={styles.cardHeader}>
                                    <span
                                        className={styles.typeBadge}
                                        style={{
                                            background: `${getTypeColor(insight.type)}20`,
                                            color: getTypeColor(insight.type)
                                        }}
                                    >
                                        {getTypeLabel(insight.type)}
                                    </span>
                                    {insight.isPro && <span className={styles.proBadge}>PRO</span>}
                                </div>
                                <h3 className={styles.cardTitle}>{insight.title}</h3>
                                <p className={styles.cardSummary}>{insight.summary}</p>
                                <div className={styles.cardTags}>
                                    {insight.tags.map(tag => (
                                        <span key={tag} className={styles.tag}>{tag}</span>
                                    ))}
                                </div>
                                <div className={styles.cardFooter}>
                                    <span className={styles.author}>{insight.author}</span>
                                    <span className={styles.meta}>{insight.date} · {insight.readTime}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
