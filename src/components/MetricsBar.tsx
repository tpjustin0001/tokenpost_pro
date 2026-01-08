'use client';

import styles from './MetricsBar.module.css';

interface Metric {
    label: string;
    value: string;
    change: number;
    sparkline?: number[];
}

const METRICS: Metric[] = [
    {
        label: '24시간 현물 거래량',
        value: '$37.34B',
        change: 41.28,
        sparkline: [20, 35, 28, 45, 38, 52, 48, 60, 55, 70]
    },
    {
        label: '24시간 선물 거래량',
        value: '$214.35B',
        change: 65.83,
        sparkline: [30, 25, 40, 35, 50, 45, 60, 55, 75, 80]
    },
    {
        label: '오픈 인터레스트',
        value: '$102.61B',
        change: 11.96,
        sparkline: [40, 42, 38, 45, 43, 48, 50, 52, 55, 58]
    },
    {
        label: '총 시가총액',
        value: '$3.17T',
        change: 4.04,
        sparkline: [50, 48, 52, 55, 53, 58, 60, 62, 65, 68]
    },
    {
        label: '24시간 청산',
        value: '$264.29M',
        change: 45.02,
        sparkline: [10, 25, 15, 40, 20, 55, 30, 45, 35, 60]
    },
];

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
    return (
        <div className={styles.metricsBar}>
            {METRICS.map((metric, index) => (
                <div key={index} className={styles.metricCard}>
                    <div className={styles.labelRow}>
                        <span className={styles.label}>{metric.label}</span>
                        <span className={styles.info}>ⓘ</span>
                    </div>
                    <div className={styles.valueRow}>
                        <span className={styles.value}>{metric.value}</span>
                        <span className={`${styles.change} ${metric.change >= 0 ? styles.positive : styles.negative}`}>
                            {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(2)}%
                        </span>
                        {metric.sparkline && (
                            <Sparkline
                                data={metric.sparkline}
                                color={metric.change >= 0 ? '#22c55e' : '#ef4444'}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
