'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
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

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function LeadLag() {
    const { data, error, isLoading } = useSWR(
        '/api/analysis/lead-lag',
        fetcher,
        {
            refreshInterval: 600000, // 10분
            revalidateOnFocus: false,
        }
    );

    const indicators: LeadingIndicator[] = data?.leading_indicators?.map((item: any) => ({
        variable: item.variable,
        varLabel: VAR_LABELS[item.variable] || item.variable,
        lag: item.lag,
        correlation: item.correlation,
        pValue: item.p_value,
    })) || [];

    if (isLoading) {
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
                    {indicators.map((item) => {
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
