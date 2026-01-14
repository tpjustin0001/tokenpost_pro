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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (isOpen && supabase) {
                setLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('global_market_snapshots')
                        .select('data')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (data && data.data && ('overallScore' in data.data || 'atmosphere_score' in data.data || 'radar_data' in data.data)) {
                        // Handle new format by mapping atmosphere_score to overallScore if needed
                        const analysisData = { ...data.data };
                        if (!analysisData.overallScore && analysisData.atmosphere_score) {
                            analysisData.overallScore = analysisData.atmosphere_score;
                        }
                        setAnalysis(analysisData);
                    } else {
                        console.warn("No valid analysis snapshot found in Supabase. Using defaults.");
                    }
                } catch (e) {
                    console.error("Failed to fetch from Supabase:", e);
                }
                setLoading(false);
            } else if (isOpen) {
                setLoading(true);
                const data = await flaskApi.getXRayGlobal();

                if (data && typeof data === 'object' && ('overallScore' in data || 'atmosphere_score' in data || 'radar_data' in data)) {
                    const analysisData = { ...data };
                    if (!analysisData.overallScore && analysisData.atmosphere_score) {
                        analysisData.overallScore = analysisData.atmosphere_score;
                    }
                    setAnalysis(analysisData);
                } else {
                    console.warn("GlobalXRay: Using cached data or defaults. API returned:", data);
                }
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, [isOpen]);

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.symbolBadge}>
                            <span style={{ fontSize: '20px' }}>🌍</span>
                        </div>
                        <div className={styles.titleInfo}>
                            <h2 className={styles.title}>글로벌 마켓 심층 분석</h2>
                            <span className={styles.subtitle}>AI 기반 거시 경제 국면 분석 v3.0</span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <GlobalXRayView analysis={analysis} loading={loading} />
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
}

