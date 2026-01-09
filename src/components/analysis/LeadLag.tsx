'use client';

import { useState, useEffect } from 'react';
import styles from './LeadLag.module.css';

interface LeadingIndicator {
    variable: string;
    varLabel: string;
    lag: number;
    correlation: number;
    pValue: number;
}

const VAR_LABELS: Record<string, string> = {
    'TNX': '🇺🇸 10년물 국채',
    'SPY': '🇺🇸 S&P 500',
    'VIX': '😱 공포지수',
    'DXY': '💵 달러 인덱스',
    'GOLD': '🥇 금',
    'M2_MoM': '💰 M2 통화량',
};

const MOCK_LEAD_LAG: LeadingIndicator[] = [
    { variable: 'TNX', varLabel: '10년물 국채', lag: 21, correlation: -0.42, pValue: 0.003 },
    { variable: 'SPY', varLabel: 'S&P 500', lag: 3, correlation: 0.68, pValue: 0.001 },
    { variable: 'VIX', varLabel: '공포지수', lag: 5, correlation: -0.55, pValue: 0.008 },
    { variable: 'DXY', varLabel: '달러 인덱스', lag: 14, correlation: -0.38, pValue: 0.012 },
    { variable: 'GOLD', varLabel: '금', lag: 7, correlation: 0.45, pValue: 0.005 },
    { variable: 'M2_MoM', varLabel: 'M2 통화량', lag: 30, correlation: 0.52, pValue: 0.002 },
];

export default function LeadLag() {
    const [data, setData] = useState<LeadingIndicator[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setData(MOCK_LEAD_LAG);
            setLoading(false);
        }, 1200);
    }, []);

    if (loading) {
        return (
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Lead-Lag 분석</span>
                </div>
                <div className={styles.loading}>Granger Causality 분석 중...</div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <span className="card-title">Lead-Lag 분석</span>
                    <p className={styles.subtitle}>비트코인 선행 지표 (Granger Causality)</p>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.grid}>
                    {data.map((item) => {
                        const isInverse = item.correlation < 0;
                        const strength = Math.abs(item.correlation) * 100;
                        const niceName = VAR_LABELS[item.variable] || item.variable;

                        return (
                            <div key={item.variable} className={styles.item}>
                                <div className={styles.itemHeader}>
                                    <div className={styles.lagBadge}>{item.lag}일</div>
                                    <div className={styles.itemInfo}>
                                        <span className={styles.itemName}>{niceName}</span>
                                        <span className={styles.itemVar}>{item.variable}</span>
                                    </div>
                                </div>

                                <div className={styles.correlationSection}>
                                    <div className={styles.correlationHeader}>
                                        <span className={styles.correlationLabel}>상관관계</span>
                                        <span className={`${styles.correlationValue} ${isInverse ? styles.negative : styles.positive}`}>
                                            {strength.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className={styles.bar}>
                                        <div
                                            className={`${styles.barFill} ${isInverse ? styles.negative : styles.positive}`}
                                            style={{ width: `${strength}%` }}
                                        />
                                    </div>
                                </div>

                                <div className={styles.interpretation}>
                                    {isInverse
                                        ? '📉 지표 ↑ → 비트코인 ↓'
                                        : '📈 지표 ↑ → 비트코인 ↑'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
