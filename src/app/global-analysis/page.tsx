'use client';

import { useState, useEffect } from 'react';
import { flaskApi } from '@/services/flaskApi';
import Sidebar from '@/components/Sidebar';
import MetricsBar from '@/components/MetricsBar';
import GlobalXRayView from '@/components/GlobalXRayView';
import styles from '../page.module.css';

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
                    {/* Reuse the GlobalXRayView, but we need to ensure its container is styled to fit the page */}
                    {/* We might need a wrapper div to give it a background if the View assumes a modal context 
                        which it does not, it just returns contents.
                        However, the text colors in View are white (optimized for dark modal).
                        The main page is also dark, so it should be fine.
                        We just need a card-like container.
                    */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        minHeight: '600px'
                    }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.05) 0%, transparent 100%)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '48px', height: '48px',
                                    background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                                    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
                                }}>
                                    🔮
                                </div>
                                <div>
                                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Global Market Analysis</h1>
                                    <p style={{ margin: 0, opacity: 0.6, fontSize: '14px' }}>AI-Driven Macro Analysis v3.0</p>
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
