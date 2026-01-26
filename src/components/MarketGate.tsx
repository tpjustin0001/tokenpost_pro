'use client';

import { useEffect, useState } from 'react';
import styles from './MarketGate.module.css';
import { flaskApi, MarketGateData } from '@/services/flaskApi';

export default function MarketGate() {
    const [data, setData] = useState<MarketGateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const result = await flaskApi.getMarketGate();
                if (result) {
                    setData(result);
                } else {
                    setError('Failed to load Market Gate data');
                }
            } catch (err) {
                setError('Error loading data');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="card"><div className={styles.loading}>Analyzing Market...</div></div>;
    if (error) return <div className="card"><div className={styles.error}>{error}</div></div>;
    if (!data) return null;

    const getColor = (color: string) => {
        switch (color) {
            case 'GREEN': return '#10b981';
            case 'YELLOW': return '#f59e0b';
            case 'RED': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getSignalColor = (signal: string) => {
        switch (signal) {
            case 'Bullish': return '#10b981';
            case 'Bearish': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const mainColor = getColor(data.gate_color);

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <span style={{ color: mainColor, fontWeight: 'bold' }}>MARKET GATE</span>
                    <span className="card-title"> SYSTEM</span>
                </div>
                <div style={{ fontSize: '11px', color: '#888' }} suppressHydrationWarning>
                    {new Date(data.timestamp).toLocaleTimeString()}
                </div>
            </div>

            <div className={styles.gateContainer}>
                <div className={styles.scoreSection}>
                    <div className={styles.scoreDisplay}>
                        <div
                            className={styles.scoreValue}
                            style={{ color: mainColor }}
                        >
                            {data.score}
                        </div>
                        <div className={styles.scoreLabel}>
                            <span
                                className={styles.gateColor}
                                style={{ background: `${mainColor}20`, color: mainColor }}
                            >
                                {data.gate_color}
                            </span>
                            <span className={styles.summary}>{data.summary.split('(')[0]}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.metricsGrid}>
                    {data.indicators.slice(0, 6).map((ind, i) => ( // Show top 6 indicators
                        <div key={i} className={styles.metricItem}>
                            <span className={styles.metricName}>
                                {ind.name.replace('btc_', '').replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <div>
                                <span
                                    className={styles.signalDot}
                                    style={{ background: getSignalColor(ind.signal) }}
                                />
                                <span
                                    className={styles.metricValue}
                                    style={{ color: getSignalColor(ind.signal) }}
                                >
                                    {typeof ind.value === 'number' ? ind.value.toFixed(2) : ind.value}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
