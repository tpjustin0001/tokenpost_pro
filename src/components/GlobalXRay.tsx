import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './GlobalXRay.module.css';
import { flaskApi } from '../services/flaskApi';
import { supabase } from '../lib/supabase';
import GlobalXRayView from './GlobalXRayView';

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
    timestamp?: string;
}

interface GlobalXRayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GlobalXRayButton({ onClick }: { onClick: () => void }) {
    return (
        <button className={styles.xrayButton} onClick={onClick}>
            <span className={styles.xrayIcon}>🔮</span>
            <span className={styles.xrayLabel}>AI 시장 분석</span>
        </button>
    );
}

export default function GlobalXRay({ isOpen, onClose }: GlobalXRayProps) {
    const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
    const [longShortData, setLongShortData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchAnalysis = async (forceRefresh = false) => {
        if (!isOpen) return;
        setLoading(true);

        try {
            // 1. Fetch Deep Analysis (Prefer DB unless force refresh)
            let analysisData = null;

            if (forceRefresh) {
                // Trigger backend update
                await flaskApi.triggerDeepAnalysis();
                // Wait a bit for DB update (simple poll or delay)
                await new Promise(r => setTimeout(r, 2000));
                // Then fetch direct from Supabase
            }

            if (supabase) {
                const { data } = await supabase
                    .from('global_deep_analysis')
                    .select('data, created_at') // Get created_at too
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (data && data.data) {
                    analysisData = { ...data.data, timestamp: data.created_at };
                    // Normalize
                    if (!analysisData.overallScore && analysisData.atmosphere_score) {
                        analysisData.overallScore = analysisData.atmosphere_score;
                    }
                }
            }

            // Fallback to Flask API if no DB data
            if (!analysisData) {
                const data = await flaskApi.getXRayDeep();
                if (data) analysisData = data;
            }

            if (analysisData) {
                setAnalysis(analysisData);
            }

            // 2. Fetch Long/Short Ratio (Independent)
            const lsData = await flaskApi.getgetLongShortRatio('BTCUSDT', '5m');
            if (lsData) setLongShortData(lsData);

        } catch (e) {
            console.error("GlobalXRay Load Error:", e);
        }
        setLoading(false);
    };

    const handleRefresh = () => {
        fetchAnalysis(true);
    };

    useEffect(() => {
        if (isOpen) {
            fetchAnalysis();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header} style={{ position: 'relative' }}>
                    <div className={styles.headerLeft}>
                        <div className={styles.symbolBadge}>
                            <span style={{ fontSize: '20px' }}>🌍</span>
                        </div>
                        <div className={styles.titleInfo}>
                            <h2 className={styles.title}>글로벌 마켓 심층 분석</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={styles.subtitle}>AI 기반 거시 경제 국면 분석 v3.0</span>
                                {loading && <span style={{ fontSize: '11px', color: '#60a5fa' }}>업데이트 중...</span>}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {analysis?.timestamp && (
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                Updated: {new Date(analysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s',
                                fontSize: '12px'
                            }}
                            onMouseOver={(e) => !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                            onMouseOut={(e) => !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        >
                            <span style={{ animation: loading ? 'spin 1s linear infinite' : 'none', display: 'inline-block' }}>🔄</span>
                            {loading ? '분석 중' : '새로고침'}
                        </button>
                        <button className={styles.closeBtn} onClick={onClose}>×</button>
                    </div>
                </div>

                <GlobalXRayView analysis={analysis} loading={loading} longShortData={longShortData} />
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
}

