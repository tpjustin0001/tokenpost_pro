'use client';

import { useState, useEffect } from 'react';
import styles from './MarketGate.module.css';

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
}

// Mock data for demo
const MOCK_GATE: GateData = {
    score: 72,
    gate_color: 'GREEN',
    summary: 'BTC 시장 상태: GREEN (점수: 72/100)',
    components: {
        trend: 28,
        volatility: 14,
        participation: 12,
        breadth: 12,
        leverage: 6,
    },
    indicators: [
        { name: 'BTC 가격', value: 94500, signal: 'Bullish' },
        { name: 'EMA50', value: 89200, signal: 'Bullish' },
        { name: 'EMA200', value: 72500, signal: 'Bullish' },
        { name: 'EMA200 기울기', value: '+2.1%', signal: 'Bullish' },
        { name: 'ATR%', value: '2.8%', signal: 'Neutral' },
        { name: '거래량 Z-Score', value: 0.8, signal: 'Neutral' },
        { name: '공포탐욕지수', value: 68, signal: 'Bullish' },
        { name: '알트 Breadth', value: '58%', signal: 'Neutral' },
        { name: '펀딩비', value: '0.012%', signal: 'Neutral' },
    ],
};

export default function MarketGate() {
    const [data, setData] = useState<GateData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setData(MOCK_GATE);
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return (
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Market Gate</span>
                </div>
                <div className={styles.loading}>데이터 로딩 중...</div>
            </div>
        );
    }

    if (!data) return null;

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
