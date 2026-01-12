'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import RadarChart from './RadarChart';
import styles from './AIXRay.module.css';
import { flaskApi } from '../services/flaskApi';

// Asset categories for contextual analysis
type AssetCategory = 'L1' | 'L2' | 'DeFi' | 'AI' | 'Meme' | 'Gaming' | 'DePIN' | 'RWA' | 'Unknown';


interface MetricAnalysis {
    label: string;
    value: string;
    signal: 'bullish' | 'bearish' | 'neutral';
    comment: string;
}

interface AIAnalysis {
    assetName: string;
    category: AssetCategory;
    overallScore: number;
    summary: string;
    detailed_analysis?: {
        market_context: string;
        technical_outlook: string;
        on_chain_verdict: string;
    };
    metrics: MetricAnalysis[];
    radarData: { label: string; value: number }[];
    risks: string[];
    opportunities: string[];
    recommendation: string;
}

const TypewriterText = ({ text, delay = 10 }: { text: string; delay?: number }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let index = 0;
        const timer = setInterval(() => {
            setDisplayedText((prev) => prev + text.charAt(index));
            index++;
            if (index === text.length) clearInterval(timer);
        }, delay);
        return () => clearInterval(timer);
    }, [text, delay]);

    return <p className={styles.generatedText}>{displayedText}</p>;
};

interface AIXRayProps {
    symbol: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function AIXRay({ symbol, isOpen, onClose }: AIXRayProps) {
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (isOpen && symbol) {
                setLoading(true);
                try {
                    const data = await flaskApi.getXRayAsset(symbol);
                    if (data) {
                        setAnalysis(data);
                    } else {
                        setAnalysis(null); // Clear analysis if fetch fails or returns null
                    }
                } catch (error) {
                    console.error("Failed to fetch AI analysis:", error);
                    setAnalysis(null);
                } finally {
                    setLoading(false);
                }
            } else if (!isOpen) {
                setAnalysis(null); // Clear analysis when modal is closed
            }
        };
        fetchAnalysis();
    }, [isOpen, symbol]);

    if (!isOpen) return null;
    if (loading || !analysis) {
        // Optionally render a loading spinner or placeholder here
        return (
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.header}>
                        <div className={styles.headerContent}>
                            <div className={styles.symbolBadge}>{symbol}</div>
                            <div className={styles.titleInfo}>
                                <h2 className={styles.title}>AI X-Ray 정밀 분석</h2>
                                <span className={styles.subtitle}>Loading...</span>
                            </div>
                        </div>
                        <button className={styles.closeBtn} onClick={onClose}>×</button>
                    </div>
                    <div className={styles.body} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                        {loading ? 'Loading AI Analysis...' : 'No analysis available.'}
                    </div>
                </div>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 8) return '#10b981'; // Green
        if (score >= 6) return '#3b82f6'; // Blue
        if (score >= 4) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    };

    const mainColor = getScoreColor(analysis.overallScore);

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.symbolBadge}>{symbol}</div>
                        <div className={styles.titleInfo}>
                            <h2 className={styles.title}>AI X-Ray 정밀 분석</h2>
                            <span className={styles.subtitle}>{analysis?.summary?.slice(0, 40) || 'Loading...'}...</span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.body}>
                    <div className={styles.leftCol}>
                        <div className={styles.radarContainer}>
                            <RadarChart data={analysis?.radarData || []} color={mainColor} size={260} />
                            <div className={styles.scoreOverlay}>
                                <span className={styles.scoreVal} style={{ color: mainColor }}>{analysis?.overallScore}</span>
                                <span className={styles.scoreLabel}>AI Score</span>
                            </div>
                        </div>

                        {/* Recommendation Box */}
                        <div className={styles.recommendationBox} style={{ borderColor: mainColor }}>
                            <div className={styles.signalLabel}>AI Recommendation</div>
                            <div className={styles.signalValue} style={{ color: mainColor }}>
                                {analysis?.recommendation.split('(')[0]}
                            </div>
                        </div>
                    </div>

                    <div className={styles.rightCol}>
                        <div className={styles.section} style={{ marginBottom: '20px' }}>
                            <h3 className={styles.sectionTitle}>Analysis Summary</h3>
                            <p className={styles.summaryText}>{analysis?.summary}</p>
                        </div>

                        <div className={styles.metricsGrid}>
                            {analysis?.metrics.map((m, i) => (
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

                        {/* Generative Insight Section */}
                        {analysis?.detailed_analysis && (
                            <div className={styles.section} style={{ marginBottom: '20px' }}>
                                <h3 className={styles.sectionTitle} style={{ color: 'var(--accent-purple)' }}>
                                    ✨ PRO Generative Insight
                                </h3>
                                <div className={styles.generativeBox}>
                                    <h4 className={styles.genTitle}>Market Context</h4>
                                    <TypewriterText text={analysis.detailed_analysis.market_context} />
                                    <div style={{ height: '12px' }} />
                                    <h4 className={styles.genTitle}>Technical Outlook</h4>
                                    <TypewriterText text={analysis.detailed_analysis.technical_outlook} delay={5} />
                                    <div style={{ height: '12px' }} />
                                    <h4 className={styles.genTitle}>On-Chain Verdict</h4>
                                    <TypewriterText text={analysis.detailed_analysis.on_chain_verdict} delay={5} />
                                </div>
                            </div>
                        )}

                        <div className={styles.columns}>
                            <div className={styles.col}>
                                <h4 className={styles.colTitle} style={{ color: '#ef4444' }}>Risk Factors</h4>
                                <ul className={styles.list}>
                                    {analysis?.risks.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                            <div className={styles.col}>
                                <h4 className={styles.colTitle} style={{ color: '#10b981' }}>Opportunities</h4>
                                <ul className={styles.list}>
                                    {analysis?.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
}
