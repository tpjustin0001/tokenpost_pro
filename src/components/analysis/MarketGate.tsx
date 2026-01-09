'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import styles from './MarketGate.module.css';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface GateData {
    score: number;
    gate_color: 'GREEN' | 'YELLOW' | 'RED';
    summary: string;
    components: {
        trend: number;
        volatility: number;
        participation: number;
        breadth: number;
        leverage: number;
    };
    indicators: Array<{
        name: string;
        value: number | string;
        signal: 'Bullish' | 'Bearish' | 'Neutral';
    }>;
    error?: string;
}

export default function MarketGate() {
    const { data, error, isLoading } = useSWR<GateData>(
        '/api/analysis/market-gate',
        fetcher,
        {
            refreshInterval: 300000, // 5분
            revalidateOnFocus: false,
        }
    );

    if (isLoading) {
        return (
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Market Gate</span>
                </div>
                <div className={styles.loading}>시장 분석 중...</div>
            </div>
        );
    }

    if (error || !data || data.error) {
        return (
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Market Gate</span>
                </div>
                <div className={styles.loading}>데이터 로딩 실패</div>
            </div>
        );
    }

    const gateColors = {
        GREEN: '#10b981',
        YELLOW: '#f59e0b',
        RED: '#ef4444',
    };

    const gateColor = gateColors[data.gate_color];
    const circumference = 2 * Math.PI * 45;
    const progress = (data.score / 100) * circumference;

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Market Gate</span>
                <span className={styles.liveBadge}>LIVE</span>
            </div>

            <div className={styles.content}>
                {/* Gauge */}
                <div className={styles.gaugeSection}>
                    <div className={styles.gauge}>
                        <svg viewBox="0 0 100 100" className={styles.gaugeSvg}>
                            <circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="var(--border-color)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke={gateColor}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference - progress}
                                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                            />
                        </svg>
                        <div className={styles.gaugeCenter}>
                            <span className={styles.score}>{data.score}</span>
                            <span
                                className={styles.gateLabel}
                                style={{ background: `${gateColor}20`, color: gateColor }}
                            >
                                {data.gate_color}
                            </span>
                        </div>
                    </div>
                    <p className={styles.summary}>{data.summary}</p>
                </div>

                {/* Components */}
                <div className={styles.components}>
                    {Object.entries(data.components).map(([key, value]) => {
                        const maxPoints: Record<string, number> = {
                            trend: 35,
                            volatility: 18,
                            participation: 18,
                            breadth: 18,
                            leverage: 11,
                        };
                        const labels: Record<string, string> = {
                            trend: '트렌드',
                            volatility: '변동성',
                            participation: '참여도',
                            breadth: 'Breadth',
                            leverage: '레버리지',
                        };
                        const pct = (value / maxPoints[key]) * 100;

                        return (
                            <div key={key} className={styles.component}>
                                <div className={styles.componentHeader}>
                                    <span className={styles.componentName}>{labels[key]}</span>
                                    <span className={styles.componentScore}>{value}/{maxPoints[key]}</span>
                                </div>
                                <div className={styles.bar}>
                                    <div
                                        className={styles.barFill}
                                        style={{
                                            width: `${pct}%`,
                                            background: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Indicators */}
                <div className={styles.indicators}>
                    {data.indicators.map((ind, i) => (
                        <div key={i} className={styles.indicator}>
                            <span className={styles.indName}>{ind.name}</span>
                            <span className={`${styles.indValue} ${styles[ind.signal.toLowerCase()]}`}>
                                {typeof ind.value === 'number'
                                    ? ind.value.toLocaleString()
                                    : ind.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
