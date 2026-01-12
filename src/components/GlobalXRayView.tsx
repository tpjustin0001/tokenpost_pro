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
}

interface GlobalXRayViewProps {
    analysis: MarketAnalysis | null;
    loading: boolean;
}

export default function GlobalXRayView({ analysis, loading }: GlobalXRayViewProps) {
    if (loading || !analysis) {
        return (
            <div className={styles.body} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px', color: 'rgba(255,255,255,0.7)', background: 'transparent' }}>
                {loading ? 'AI analyzing market macro data...' : 'Failed to load analysis.'}
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
                        <span className={styles.scoreLabel}>Market Score</span>
                    </div>
                </div>

                {/* Market Phase */}
                <div className={styles.signalBox} style={{ borderColor: mainColor }}>
                    <div className={styles.signalLabel}>Current Cycle Phase</div>
                    <div className={styles.signalValue} style={{ color: mainColor, fontSize: '14px' }}>
                        {analysis.marketPhase}
                    </div>
                </div>

                {/* Recommendation Short */}
                <div className={styles.recommendationBox} style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                    <div className={styles.signalLabel}>Investment Strategy</div>
                    <p style={{ fontSize: '12px', lineHeight: '1.4', color: 'rgba(255,255,255,0.8)' }}>
                        {analysis.recommendation.split('.')[0]}.
                    </p>
                </div>
            </div>

            <div className={styles.rightCol}>
                {/* Summary */}
                <div className={styles.section} style={{ marginBottom: '20px' }}>
                    <h3 className={styles.sectionTitle}>Macro Summary</h3>
                    <p className={styles.summaryText}>{analysis.summary}</p>
                </div>

                {/* Sector Analysis */}
                <div className={styles.section} style={{ marginBottom: '20px' }}>
                    <h3 className={styles.sectionTitle}>Sector Rotation</h3>
                    <div className={styles.sectorGrid}>
                        {analysis.sectorAnalysis.map((sector) => (
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
                    <h3 className={styles.sectionTitle}>Key Indicators</h3>
                    <div className={styles.metricsGrid}>
                        {analysis.keyMetrics.map((m, i) => (
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
                        <h4 className={styles.colTitle} style={{ color: '#ef4444' }}>Major Risks</h4>
                        <ul className={styles.list}>
                            {analysis.risks.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                    <div className={styles.col}>
                        <h4 className={styles.colTitle} style={{ color: '#10b981' }}>Strategic Opps</h4>
                        <ul className={styles.list}>
                            {analysis.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
