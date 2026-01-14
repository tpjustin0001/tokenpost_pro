'use client';

import { useState, useEffect } from 'react';
import { flaskApi } from '@/services/flaskApi';
import Sidebar from '@/components/Sidebar';
import MetricsBar from '@/components/MetricsBar';
import GlobalXRayView from '@/components/GlobalXRayView';
import styles from './page.module.css';

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

export default function XRayPage() {
    const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAnalysis = async () => {
            setLoading(true);
            const data = await flaskApi.getXRayGlobal();
            if (data) {
                setAnalysis(data);
            }
            setLoading(false);
        };
        fetchAnalysis();
    }, []);

    return (
        <div className={styles.appLayout}>
            <Sidebar />
            <div className={styles.mainArea}>
                <MetricsBar />
                <main className={styles.content}>
                    <div className={styles.xrayHeader}>
                        <h2 className={styles.pageTitle}>X-Ray Analysis</h2>
                    </div>

                    <div className={styles.cardContainer}>
                        <div className={styles.cardHeader}>
                            <div className={styles.headerContent}>
                                <div className={styles.iconBox}>
                                    🔮
                                </div>
                                <div>
                                    <h1 className={styles.headerTitle}>글로벌 마켓 X-Ray</h1>
                                    <p className={styles.headerSubtitle}>AI 기반 거시 경제 국면 분석 (v3.0)</p>
                                </div>
                            </div>
                        </div>
                        <GlobalXRayView analysis={analysis} loading={loading} />
                    </div>
                </main>
            </div>
        </div>
    );
}
