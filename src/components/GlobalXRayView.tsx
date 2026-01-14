'use client';

import RadarChart from './RadarChart';
import styles from './GlobalXRay.module.css';

interface MarketAnalysis {
    overallScore: number;
    marketPhase: string;
    summary: string;
    radar_data: { label: string; value: number }[];
    macro_factors: { name: string; impact: string; detail: string }[];
    sectorAnalysis: {
        name: string;
        signal: 'bullish' | 'bearish' | 'neutral';
        score: number;
        insight: string;
    }[];
    onchain_signals: {
        metric: string;
        signal: string;
        value: string;
        comment: string;
    }[];
    risks: string[];
    opportunities: string[];
    recommendation: string;
    actionable_insight_summary: string;
    recent_news?: { title: string; link: string; pubDate: string; source: string }[];
}

interface GlobalXRayViewProps {
    analysis: MarketAnalysis | null;
    loading: boolean;
}

export default function GlobalXRayView({ analysis, loading }: GlobalXRayViewProps) {
    if (loading) {
        return (
            <div className={styles.body} style={{ position: 'relative' }}>
                {/* Loading Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    background: 'rgba(13, 17, 23, 0.7)',
                    backdropFilter: 'blur(2px)',
                    color: '#fff'
                }}>
                    <div className={styles.spinner} style={{ marginBottom: '16px', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%' }} />
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#e2e8f0' }}>AI가 최신 시장 데이터를 분석 중입니다...</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>실시간 뉴스 및 온체인 데이터 수집 중</div>
                </div>

                <div className={styles.leftCol}>
                    <div className={`${styles.skeleton} ${styles.skeletonCircle}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonBox}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonBox}`} />
                </div>
                <div className={styles.rightCol}>
                    <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonText}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonText}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '80%' }} />

                    <div style={{ height: '32px' }} />
                    <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonBox}`} style={{ height: '100px' }} />

                    <div style={{ height: '32px' }} />
                    <div className={styles.metricsGrid}>
                        <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
                    </div>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className={styles.body} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px', color: 'rgba(255,255,255,0.7)' }}>
                분석 데이터를 불러오지 못했습니다.
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
                    <RadarChart data={analysis.radar_data} color={mainColor} size={280} />
                    <div className={styles.scoreOverlay}>
                        <span className={styles.scoreVal} style={{ color: mainColor }}>{analysis.overallScore}</span>
                        <span className={styles.scoreLabel}>마켓 스코어</span>
                    </div>
                </div>

                {/* Market Phase */}
                <div className={styles.signalBox} style={{ borderColor: mainColor }}>
                    <div className={styles.signalLabel}>현재 시장 국면</div>
                    <div className={styles.signalValue} style={{ color: mainColor, fontSize: '14px' }}>
                        {analysis.marketPhase}
                    </div>
                </div>

                {/* Recommendation Short */}
                <div className={styles.recommendationBox} style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                    <div className={styles.signalLabel}>투자 대응 전략</div>
                    <p style={{ fontSize: '13px', lineHeight: '1.4', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
                        {analysis.actionable_insight_summary || analysis.recommendation}
                    </p>
                </div>
            </div>

            <div className={styles.rightCol}>
                {/* Summary */}
                <div className={styles.section} style={{ marginBottom: '20px' }}>
                    <h3 className={styles.sectionTitle}>📉 거시 경제 요약 (Macro Summary)</h3>
                    <p className={styles.summaryText}>{analysis.summary}</p>
                </div>

                {/* Recent Global News */}
                {analysis.recent_news && analysis.recent_news.length > 0 && (
                    <div className={styles.section} style={{ marginBottom: '20px' }}>
                        <h3 className={styles.sectionTitle} style={{ color: '#3b82f6' }}>
                            📰 주요 글로벌 뉴스 (Global Headlines)
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
                    <h3 className={styles.sectionTitle}>🔄 섹터 로테이션 (Sector Rotation)</h3>
                    <div className={styles.sectorGrid}>
                        {analysis.sectorAnalysis && Array.isArray(analysis.sectorAnalysis) ? (
                            analysis.sectorAnalysis.map((sector) => (
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
                            ))
                        ) : (
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>섹터 분석 데이터 없음</div>
                        )}
                    </div>
                </div>

                {/* Macro Factors (New) */}
                {analysis.macro_factors && (
                    <div className={styles.section} style={{ marginBottom: '20px' }}>
                        <h3 className={styles.sectionTitle}>⛓️ 매크로 및 온체인 (Macro & On-Chain)</h3>
                        <div className={styles.metricsGrid}>
                            {analysis.macro_factors.map((m, i) => (
                                <div key={i} className={styles.metricCard} style={{ borderLeft: m.impact === 'Positive' ? '3px solid #10b981' : m.impact === 'Negative' ? '3px solid #ef4444' : '3px solid #64748b' }}>
                                    <div className={styles.mLabel}>{m.name}</div>
                                    <div className={styles.mValue} style={{ fontSize: '14px', color: '#fff' }}>{m.impact}</div>
                                    <div className={styles.metricComment}>{m.detail}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* On-Chain Signals (New) */}
                <div className={styles.section} style={{ marginBottom: '20px' }}>
                    <h3 className={styles.sectionTitle}>📊 온체인 시그널 (On-Chain Context)</h3>
                    <div className={styles.metricsGrid}>
                        {analysis.onchain_signals && Array.isArray(analysis.onchain_signals) ? (
                            analysis.onchain_signals.map((m, i) => (
                                <div key={i} className={styles.metricCard}>
                                    <div className={styles.mLabel}>{m.metric}</div>
                                    <div className={styles.mValue} style={{
                                        color: m.signal === 'bullish' || m.signal === 'Positive' ? '#10b981' : m.signal === 'bearish' || m.signal === 'Negative' ? '#ef4444' : '#fbbf24'
                                    }}>
                                        {m.value}
                                    </div>
                                    <div className={styles.metricComment}>{m.comment}</div>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>온체인 데이터 없음</div>
                        )}
                    </div>
                </div>

                {/* Risks & Opps */}
                <div className={styles.columns}>
                    <div className={styles.col}>
                        <h4 className={styles.colTitle} style={{ color: '#ef4444' }}>⚠️ 주요 리스크 (Risks)</h4>
                        <ul className={styles.list}>
                            {analysis.risks?.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                    <div className={styles.col}>
                        <h4 className={styles.colTitle} style={{ color: '#10b981' }}>🚀 투자 기회 (Opportunities)</h4>
                        <ul className={styles.list}>
                            {analysis.opportunities?.map((o, i) => <li key={i}>{o}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
