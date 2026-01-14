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
    recent_news?: { title: string; link: string; pubDate: string; source: string }[];
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
    if (!isOpen) return null;
    if (loading || !analysis) {
        return (
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.header}>
                        <div className={styles.headerContent}>
                            <div className={styles.symbolBadge}>{symbol}</div>
                            <div className={styles.titleInfo}>
                                <h2 className={styles.title}>AI X-Ray 정밀 분석</h2>
                                <span className={styles.subtitle}>AI가 실시간 데이터를 분석 중입니다...</span>
                            </div>
                        </div>
                        <button className={styles.closeBtn} onClick={onClose}>×</button>
                    </div>
                    {/* Skeleton Body with Overlay */}
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
                            <div className={styles.spinner} style={{ marginBottom: '16px', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#e2e8f0' }}>AI가 {symbol} 데이터를 분석 중입니다...</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>실시간 뉴스 및 펀더멘탈 지표 수집 중</div>
                        </div>

                        <div className={styles.leftCol}>
                            {/* Radar Skeleton */}
                            <div className={`${styles.skeleton} ${styles.skeletonCircle}`} />
                            {/* Rec Box Skeleton */}
                            <div className={`${styles.skeleton} ${styles.skeletonBox}`} style={{ height: '60px' }} />
                        </div>
                        <div className={styles.rightCol}>
                            {/* Summary Skeleton */}
                            <div className={`${styles.skeleton} ${styles.skeletonTitle}`} style={{ width: '30%' }} />
                            <div className={`${styles.skeleton} ${styles.skeletonBox}`} style={{ height: '80px' }} />

                            {/* Metrics Skeleton */}
                            <div className={styles.metricsGrid}>
                                <div className={`${styles.skeleton} ${styles.skeletonBox}`} style={{ height: '100px' }} />
                                <div className={`${styles.skeleton} ${styles.skeletonBox}`} style={{ height: '100px' }} />
                                <div className={`${styles.skeleton} ${styles.skeletonBox}`} style={{ height: '100px' }} />
                                <div className={`${styles.skeleton} ${styles.skeletonBox}`} style={{ height: '100px' }} />
                            </div>

                            {/* Generative Skeleton */}
                            <div className={`${styles.skeleton} ${styles.skeletonBox}`} style={{ height: '150px' }} />
                        </div>
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
                                <span className={styles.scoreLabel}>AI 스코어</span>
                            </div>
                        </div>

                        {/* Recommendation Box */}
                        <div className={styles.recommendationBox} style={{ borderColor: mainColor }}>
                            <div className={styles.signalLabel}>AI 매매 전략</div>
                            <div className={styles.signalValue} style={{ color: mainColor }}>
                                {analysis?.recommendation.split('(')[0]}
                            </div>
                        </div>
                    </div>

                    <div className={styles.rightCol}>
                        <div className={styles.section} style={{ marginBottom: '20px' }}>
                            <h3 className={styles.sectionTitle}>핵심 요약 (Summary)</h3>
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

                        {/* Recent News Section */}
                        {analysis?.recent_news && analysis.recent_news.length > 0 && (
                            <div className={styles.section} style={{ marginBottom: '20px' }}>
                                <h3 className={styles.sectionTitle} style={{ color: '#3b82f6' }}>
                                    📰 관련 최신 뉴스 (News)
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

                        {/* Generative Insight Section */}
                        {analysis?.detailed_analysis && (
                            <div className={styles.section} style={{ marginBottom: '20px' }}>
                                <h3 className={styles.sectionTitle} style={{ color: 'var(--accent-purple)' }}>
                                    ✨ PRO 심층 인사이트 (Deep Dive)
                                </h3>
                                <div className={styles.generativeBox}>
                                    <h4 className={styles.genTitle}>시장 상황 (Market Context)</h4>
                                    <TypewriterText text={analysis.detailed_analysis.market_context} />
                                    <div style={{ height: '12px' }} />
                                    <h4 className={styles.genTitle}>기술적 전망 (Technical Outlook)</h4>
                                    <TypewriterText text={analysis.detailed_analysis.technical_outlook} delay={5} />
                                    <div style={{ height: '12px' }} />
                                    <h4 className={styles.genTitle}>온체인 분석 (On-CHain Verdict)</h4>
                                    <TypewriterText text={analysis.detailed_analysis.on_chain_verdict} delay={5} />
                                </div>
                            </div>
                        )}

                        <div className={styles.columns}>
                            <div className={styles.col}>
                                <h4 className={styles.colTitle} style={{ color: '#ef4444' }}>리스크 요인 (Risks)</h4>
                                <ul className={styles.list}>
                                    {analysis?.risks.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                            <div className={styles.col}>
                                <h4 className={styles.colTitle} style={{ color: '#10b981' }}>상승 기회 (Opportunities)</h4>
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
