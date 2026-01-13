'use client';

import { useState, useEffect } from 'react';
import { useMarketMetrics } from '@/hooks/useMarketMetrics';
import { useOpenInterest } from '@/hooks/useOpenInterest';
import { XRayIcon } from './XRayTooltip';
import styles from './MetricsBar.module.css';

function formatNumber(num: number): string {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
}

function Sparkline({ data, color }: { data: number[], color: string }) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * 60;
        const y = 20 - ((v - min) / range) * 18;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 60 22" className={styles.sparkline}>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function MetricsBar() {
    const { metrics, isLoading } = useMarketMetrics();
    const { totalOpenInterest } = useOpenInterest();

    // Default Fallback
    const defaultSparkline = [20, 20, 20, 20, 20, 20, 20]; // Flat line if no data

    const METRICS = [
        {
            label: '24시간 현물 거래량',
            value: metrics ? formatNumber(metrics.spotVolume) : '---',
            xrayKey: 'spot_volume',
        },
        {
            label: '오픈 인터레스트',
            value: totalOpenInterest ? formatNumber(totalOpenInterest) : '---',
            xrayKey: 'open_interest',
        },
        {
            label: '총 시가총액',
            value: metrics ? formatNumber(metrics.marketCap) : '---',
            xrayKey: 'market_cap',
        },
        {
            label: 'BTC 도미넌스',
            value: metrics ? `${metrics.btcDominance.toFixed(1)}%` : '---',
            xrayKey: 'btc_dominance',
        },
        {
            label: 'ETH 도미넌스',
            value: metrics ? `${metrics.ethDominance.toFixed(1)}%` : '---',
            xrayKey: 'market_cap',
        },
    ];

    const [mounted, setMounted] = useState(false);
    const [timeStr, setTimeStr] = useState('');

    useEffect(() => {
        setMounted(true);
        setTimeStr(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

        const timer = setInterval(() => {
            setTimeStr(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
        }, 60000); // Optional: Update every minute

        return () => clearInterval(timer);
    }, []);

    return (
        <div className={styles.metricsBar}>
            {METRICS.map((metric, index) => (
                <div key={index} className={styles.metricCard}>
                    <div className={styles.labelRow}>
                        <span className={styles.label}>{metric.label}</span>
                        <span className={styles.liveDot} />
                        <XRayIcon dataKey={metric.xrayKey} />
                    </div>
                    <div className={styles.valueRow}>
                        <span className={`${styles.value} ${isLoading ? styles.loading : ''}`}>
                            {metric.value}
                        </span>
                    </div>
                </div>
            ))}
            <div className={styles.timestamp}>
                Updated: {mounted ? timeStr : '--:--'}
            </div>
        </div>
    );
}
