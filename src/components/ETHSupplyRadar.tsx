'use client';

import { useState, useEffect } from 'react';
import styles from './ETHSupplyRadar.module.css';

interface ETHStakingData {
    success: boolean;
    entry_queue: number;
    exit_queue: number;
    entry_queue_eth: number;
    exit_queue_eth: number;
    entry_wait_days: number;
    entry_wait_hours: number;
    exit_wait_minutes: number;
    active_validators: number;
    staking_apr: number;
    total_staked_eth: number;
    staked_percentage: number;
    churn_limit: number;
    churn_limits?: { entry: number; exit: number };
    signal: string;
    signal_color: string;
    signal_text: string;
    signal_emoji: string;
    ai_report: string;
    timestamp: string;
}

interface HistoryPoint {
    entry_queue: number;
    exit_queue: number;
    created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function ETHSupplyRadar() {
    const [data, setData] = useState<ETHStakingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);



    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch current data
                const response = await fetch('/api/eth/staking');
                if (!response.ok) throw new Error('API Error');
                const result = await response.json();
                setData(result);
                setError(null);

                // Note: History chart now on separate Data page component
            } catch (err) {
                console.error('ETH Staking fetch error:', err);
                setError('데이터를 불러올 수 없습니다');
                // Use fallback data
                setData({
                    success: false,
                    entry_queue: 81761,
                    exit_queue: 2,
                    entry_queue_eth: 2616352,
                    exit_queue_eth: 64,
                    entry_wait_days: 45.4,
                    entry_wait_hours: 1090.1,
                    exit_wait_minutes: 0.9,
                    active_validators: 978625,
                    staking_apr: 3.5,
                    total_staked_eth: 31316000,
                    staked_percentage: 26.1,
                    churn_limit: 8,
                    churn_limits: { entry: 8, exit: 14 },
                    signal: 'STRONG_HOLD',
                    signal_color: 'green',
                    signal_text: '강력 홀딩',
                    signal_emoji: '🟢',
                    ai_report: '데이터 조회 중 오류가 발생했습니다.',
                    timestamp: new Date().toISOString()
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Refresh every 2 minutes
        const interval = setInterval(fetchData, 120000);
        return () => clearInterval(interval);
    }, []);

    const formatWaitTime = (days: number, hours: number): string => {
        if (days >= 1) {
            const remainingHours = Math.round((days % 1) * 24);
            return `${Math.floor(days)}일 ${remainingHours}시간`;
        }
        return `${Math.round(hours)}시간`;
    };

    const formatMinutes = (minutes: number): string => {
        if (minutes < 60) {
            return `${Math.round(minutes)}분`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return `${hours}시간 ${remainingMinutes}분`;
    };

    const getSignalClass = (color: string): string => {
        switch (color) {
            case 'green': return styles.signalGreen;
            case 'red': return styles.signalRed;
            case 'yellow': return styles.signalYellow;
            default: return styles.signalYellow;
        }
    };

    if (loading) {
        return (
            <div className={styles.widget}>
                <div className={styles.header}>
                    <h3 className={styles.title}>ETH Supply Radar</h3>
                    <span className={styles.loading}>로딩 중...</span>
                </div>
                <div className={styles.body}>
                    <div className={styles.skeleton} />
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className={`${styles.widget} ${getSignalClass(data.signal_color)}`}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h3 className={styles.title}>ETH 스테이킹 레이더</h3>
                    <span className={styles.subtitle}>대기열 기반 매도압력 예측</span>
                </div>
                <div className={styles.badges}>
                    {error && <span className={styles.badgeDemo}>DEMO</span>}
                    <span className={styles.badgeLive}>
                        <span className={styles.liveDot} />
                        LIVE
                    </span>
                </div>
            </div>

            <div className={styles.body}>
                {/* Signal Status */}
                <div className={styles.signalRow}>
                    <div className={styles.signalSection}>
                        <span className={styles.signalEmoji}>{data.signal_emoji}</span>
                        <span className={styles.signalText}>{data.signal_text}</span>
                    </div>
                    <span className={styles.signalDesc}>
                        {data.signal_color === 'green'
                            ? '이탈 적음 → 매도 압력 낮음'
                            : data.signal_color === 'red'
                                ? '이탈 급증 → 매도 압력 높음'
                                : '진입/이탈 균형 상태'}
                    </span>
                </div>

                {/* Queue Metrics */}
                <div className={styles.metricsGrid}>
                    <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>진입 대기</span>
                        <span className={styles.metricValue}>
                            {formatWaitTime(data.entry_wait_days, data.entry_wait_hours)}
                        </span>
                        <span className={styles.metricTrend}>
                            ▲ {(data.entry_queue_eth / 1000000).toFixed(2)}M ETH
                        </span>
                    </div>

                    <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>이탈 대기</span>
                        <span className={styles.metricValue}>
                            {formatMinutes(data.exit_wait_minutes)}
                        </span>
                        <span className={styles.metricTrendDown}>
                            ▼ {(data.exit_queue_eth / 1000).toFixed(1)}K ETH
                        </span>
                    </div>

                    <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>잠금 비율</span>
                        <span className={styles.metricValue}>
                            {data.staked_percentage.toFixed(1)}%
                        </span>
                        <span className={styles.metricSub}>
                            {(data.total_staked_eth / 1000000).toFixed(1)}M ETH
                        </span>
                    </div>

                    <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>APR</span>
                        <span className={styles.metricValue}>
                            {data.staking_apr.toFixed(1)}%
                        </span>
                        <span className={styles.metricSub}>연간 수익률</span>
                    </div>
                </div>

                {/* Validator Queue Chart - Now displayed separately on Data page */}

                {/* AI Report */}
                <div className={styles.aiReport}>
                    <div className={styles.aiHeader}>
                        <span className={styles.aiIcon}>💡</span>
                        <span className={styles.aiLabel}>AI 분석</span>
                    </div>
                    <p className={styles.aiText}>{data.ai_report}</p>
                </div>
            </div>

            <div className={styles.footer}>
                <span className={styles.timestamp}>
                    업데이트: {new Date(data.timestamp).toLocaleTimeString('ko-KR')}
                </span>
                <span className={styles.source}>Beaconcha.in</span>
            </div>
        </div>
    );
}
