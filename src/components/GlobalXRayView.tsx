'use client';

import RadarChart from './RadarChart';
import styles from './GlobalXRay.module.css';

interface MarketAnalysis {
    overallScore: number;
    marketPhase: string;
    summary: string;
    marketHealth: { label: string; value: number }[];
    sectorAnalysis: {
        name: string;
        signal: 'bullish' | 'bearish' | 'neutral';
        score: number;
        insight: string;
    }[];
    keyMetrics: {
        label: string;
        value: string;
        signal: 'bullish' | 'bearish' | 'neutral';
        comment: string;
    }[];
    risks: string[];
    opportunities: string[];
    recommendation: string;
    recent_news?: { title: string; link: string; pubDate: string; source: string }[];
}

interface GlobalXRayViewProps {
    analysis: MarketAnalysis | null;
    loading: boolean;
}

export default function GlobalXRayView({ analysis, loading }: GlobalXRayViewProps) {
    if (loading) {
        return (
            <div className={styles.body}>
                <div className={styles.leftCol}>
                    <div className={`${styles.skeleton} ${styles.skeletonCircle}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonBox}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonBox}`} />
                </div>
                <div className={styles.rightCol}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div className={styles.spinner} style={{
                            width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)',
                            borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite'
                        }} />
                        <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
                            AI가 시장 데이터를 정밀 분석중입니다...
                        </span>
                    </div>
                    <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonText}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonText}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '80%' }} />

                    <div style={{ height: '32px' }} />
                    <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonBox}`} style={{ height: '100px' }} />
                    <style jsx>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
                    `}</style>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className={styles.body} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px', color: 'rgba(255,255,255,0.7)' }}>
                Failed to load analysis.
            </div>
        );
    }


    const getScoreColor = (score: number) => {
        if (score >= 7) return '#10b981';
        if (score >= 5) return '#f59e0b';
        return '#ef4444';
    };

    const mainColor = getScoreColor(analysis.overallScore);

    return (
        <div className={styles.body}>
            <div className={styles.leftCol}>
                {/* Radar Chart for Market Health */}
                <div className={styles.radarContainer}>
                    <RadarChart data={analysis.marketHealth} color={mainColor} size={280} />
                    <div className={styles.scoreOverlay}>
                        <span className={styles.scoreVal} style={{ color: mainColor }}>{analysis.overallScore}</span>
                        <span className={styles.scoreLabel}>시장 점수</span>
                    </div>
                </div>

                {/* Market Phase */}
                <div className={styles.signalBox} style={{ borderColor: mainColor }}>
                    <div className={styles.signalLabel}>현재 시장 주기</div>
                    <div className={styles.signalValue} style={{ color: mainColor, fontSize: '14px' }}>
                        {analysis.marketPhase}
                    </div>
                </div>

                {/* Recommendation Short */}
                <div className={styles.recommendationBox} style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                    <div className={styles.signalLabel}>투자 전략</div>
                    <p style={{ fontSize: '12px', lineHeight: '1.4', color: 'rgba(255,255,255,0.8)' }}>
                        {analysis.recommendation?.split('.')[0] || '관망'}.
                    </p>
                </div>
            </div>

            <div className={styles.rightCol}>
                {/* Summary */}
                <div className={styles.section} style={{ marginBottom: '20px' }}>
                    <h3 className={styles.sectionTitle}>거시 경제 요약 (Macro Summary)</h3>
                    <p className={styles.summaryText}>{analysis.summary}</p>
                </div>

                {/* Recent Global News */}
                {analysis.recent_news && analysis.recent_news.length > 0 && (
                    <div className={styles.section} style={{ marginBottom: '20px' }}>
                        <h3 className={styles.sectionTitle} style={{ color: '#3b82f6' }}>
                            📰 주요 글로벌 뉴스
                        </h3>
                        <div className={styles.newsList} style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                            {analysis.recent_news.map((news, idx) => (
                                <a
                                    key={idx}
                                    href={news.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'block',
                                        padding: '6px 8px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        textDecoration: 'none',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                >
                                    <div style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: '500', marginBottom: '2px', lineHeight: '1.3' }}>
                                        {news.title}
                                    </div>
                                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ opacity: 0.7 }}>{news.source}</span>
                                        <span style={{ opacity: 0.7 }}>{new Date(news.pubDate).toLocaleDateString()}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sector Analysis */}
                <div className={styles.section} style={{ marginBottom: '20px' }}>
                    <h3 className={styles.sectionTitle}>섹터 순환 분석</h3>
                    <div className={styles.sectorGrid}>
                        {analysis.sectorAnalysis?.map((sector) => (
                            <div key={sector.name} className={styles.sectorCard}>
                                <div className={styles.metricHeader}>
                                    <span className={styles.metricLabel} style={{ fontWeight: 'bold', color: 'white' }}>{sector.name}</span>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        color: sector.signal === 'bullish' ? '#10b981' : sector.signal === 'bearish' ? '#ef4444' : '#f59e0b'
                                    }}>
                                        {sector.score}
                                    </span>
                                </div>
                                <div className={styles.metricComment}>{sector.insight}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className={styles.section} style={{ marginBottom: '20px' }}>
                    <h3 className={styles.sectionTitle}>핵심 지표</h3>
                    <div className={styles.metricsGrid}>
                        {analysis.keyMetrics?.map((m, i) => (
                            <div key={i} className={styles.metricCard}>
                                <div className={styles.mLabel}>{m.label}</div>
                                <div className={styles.mValue} style={{
                                    color: m.signal === 'bullish' ? '#10b981' : m.signal === 'bearish' ? '#ef4444' : '#fbbf24'
                                }}>
                                    {m.value}
                                </div>
                                <div className={styles.metricComment}>{m.comment}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Risks & Opps */}
                <div className={styles.columns}>
                    <div className={styles.col}>
                        <h4 className={styles.colTitle} style={{ color: '#ef4444' }}>주요 리스크</h4>
                        <ul className={styles.list}>
                            {analysis.risks?.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                    <div className={styles.col}>
                        <h4 className={styles.colTitle} style={{ color: '#10b981' }}>전략적 기회</h4>
                        <ul className={styles.list}>
                            {analysis.opportunities?.map((o, i) => <li key={i}>{o}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
