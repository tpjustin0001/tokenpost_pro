'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MarketPulse from '@/components/MarketPulse';
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

const INSIGHTS: InsightItem[] = [
    {
        id: '1',
        type: 'REPORT',
        title: '2025년 1분기 DeFi 생태계 심층 분석 리포트',
        summary: 'TVL 회복세와 함께 Real Yield 프로토콜들이 주목받고 있습니다. Aave, Lido, MakerDAO의 수익 구조와 향후 전망을 분석합니다.',
        author: '토큰포스트 리서치팀',
        source: 'TokenPost Research',
        date: '2025.01.08',
        readTime: '15분',
        isPro: true,
        tags: ['DeFi', 'TVL', 'Yield'],
    },
    {
        id: '2',
        type: 'ANALYSIS',
        title: 'AI 분석: 비트코인 온체인 지표로 보는 시장 사이클',
        summary: 'MVRV, NUPL, 실현 가격 등 핵심 온체인 지표를 통해 현재 시장 위치를 진단합니다. 역사적 패턴과의 비교 분석.',
        author: 'TokenPost AI',
        source: 'AI Analysis',
        date: '2025.01.08',
        readTime: '8분',
        isPro: true,
        tags: ['Bitcoin', 'On-chain', 'AI'],
    },
    {
        id: '3',
        type: 'NEWS',
        title: 'SEC, 비트코인 현물 ETF 옵션 거래 최종 승인',
        summary: '미국 증권거래위원회가 비트코인 현물 ETF에 대한 옵션 거래를 공식 승인했습니다. 기관 투자자들의 헤지 수단이 확대됩니다.',
        author: '김민수 기자',
        source: 'TokenPost',
        date: '2025.01.08',
        readTime: '3분',
        isPro: false,
        tags: ['ETF', 'SEC', 'Regulation'],
    },
    {
        id: '4',
        type: 'KPI',
        title: '이더리움 스테이킹 비율 28% 돌파, 역대 최고치',
        summary: '이더리움 검증자 수가 100만 명을 넘어섰으며, 스테이킹된 ETH가 전체 공급량의 28%를 차지합니다.',
        author: '토큰포스트 데이터팀',
        source: 'On-chain Data',
        date: '2025.01.07',
        readTime: '5분',
        isPro: true,
        tags: ['Ethereum', 'Staking', 'KPI'],
    },
    {
        id: '5',
        type: 'REPORT',
        title: 'Layer 2 경쟁 분석: Arbitrum vs Optimism vs Base',
        summary: '주요 이더리움 L2 솔루션들의 TVL, 트랜잭션, 개발자 활동을 비교 분석합니다. 각 생태계의 강점과 성장 전략.',
        author: '토큰포스트 리서치팀',
        source: 'TokenPost Research',
        date: '2025.01.07',
        readTime: '20분',
        isPro: true,
        tags: ['L2', 'Arbitrum', 'Optimism'],
    },
    {
        id: '6',
        type: 'NEWS',
        title: '일본 3대 은행, 공동 스테이블코인 발행 추진',
        summary: '미쓰비시UFJ, 미즈호, SMBC가 엔화 기반 스테이블코인 발행을 위한 컨소시엄을 구성했습니다.',
        author: '박지영 기자',
        source: 'TokenPost',
        date: '2025.01.06',
        readTime: '4분',
        isPro: false,
        tags: ['Stablecoin', 'Japan', 'Bank'],
    },
];

type FilterType = 'ALL' | 'REPORT' | 'ANALYSIS' | 'KPI' | 'NEWS';

export default function ResearchPage() {
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [showProOnly, setShowProOnly] = useState(false);

    const filteredInsights = INSIGHTS.filter(item => {
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
                                        ? INSIGHTS.length
                                        : INSIGHTS.filter(i => i.type === filter).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Featured Section */}
                    {activeFilter === 'ALL' && !showProOnly && (
                        <section className={styles.featured}>
                            <div className={styles.featuredCard}>
                                <span className={styles.featuredBadge}>오늘의 추천</span>
                                <h2 className={styles.featuredTitle}>{INSIGHTS[0].title}</h2>
                                <p className={styles.featuredSummary}>{INSIGHTS[0].summary}</p>
                                <div className={styles.featuredMeta}>
                                    <span>{INSIGHTS[0].author}</span>
                                    <span>·</span>
                                    <span>{INSIGHTS[0].date}</span>
                                    <span>·</span>
                                    <span>{INSIGHTS[0].readTime} 읽기</span>
                                </div>
                                <div className={styles.featuredTags}>
                                    {INSIGHTS[0].tags.map(tag => (
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
