'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './ETHSupplyRadar.module.css';

// Dynamic import to avoid SSR issues with Chart.js
const ValidatorQueueChart = dynamic(() => import('./ValidatorQueueChart'), { ssr: false });

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
    const [history, setHistory] = useState<HistoryPoint[]>([]);
    const [allHistory, setAllHistory] = useState<HistoryPoint[]>([]);
    const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('90d');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter history based on selected period
    useEffect(() => {
        if (allHistory.length === 0) return;

        let filtered: HistoryPoint[];
        switch (period) {
            case '7d':
                filtered = allHistory.slice(-7);
                break;
            case '30d':
                filtered = allHistory.slice(-30);
                break;
            case '90d':
                filtered = allHistory.slice(-90);
                break;
            case '1y':
                filtered = allHistory.slice(-365);
                break;
            case 'all':
            default:
                filtered = allHistory;
        }
        setHistory(filtered);
    }, [period, allHistory]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch current data
                const response = await fetch('/api/eth/staking');
                if (!response.ok) throw new Error('API Error');
                const result = await response.json();
                setData(result);
                setError(null);

                // Fetch history data for chart
                try {
                    const historyRes = await fetch('/api/eth/staking/history');
                    if (historyRes.ok) {
                        const historyData = await historyRes.json();
                        if (historyData.data && historyData.data.length > 0) {
                            // Store all history (daily data)
                            setAllHistory(historyData.data);
                        }
                    }
                } catch (histErr) {
                    console.log('History not available yet');
                }
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

    const formatDuration = (days: number, hours: number) => {
        const d = Math.floor(days);
        const h = Math.round((days % 1) * 24);
        return `${d} days, ${h} hours`;
    };

    if (loading) {
        return (
            <div className={styles.widget}>
                <div className={styles.header}>
                    <h3 className={styles.title}>ETH Supply Radar</h3>
                    <span className={styles.loading}>로딩 중...</span>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>ETH Supply Radar</h3>
                    <span className={styles.subtitle}>Validator Queue & Staking Metrics</span>
                </div>
                <div className={styles.badges}>
                    <span style={{ color: data.signal_color === 'green' ? '#4dabf7' : '#ff6b6b', fontWeight: 'bold' }}>
                        {data.signal_emoji} {data.signal_text}
                    </span>
                </div>
            </div>

            {/* Entry / Exit Cards */}
            <div className={styles.summaryGrid}>
                {/* Entry Card */}
                <div className={styles.summaryCard}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Entry Queue</span>
                        <span className={styles.cardIcon} style={{ color: '#36a2eb' }}>📥</span>
                    </div>
                    <div className={styles.cardMainValue}>
                        {(data.entry_queue_eth || 0).toLocaleString()} ETH
                    </div>
                    <div className={styles.cardSubRow}>
                        <div className={styles.cardDetail}>
                            <span className={styles.cardDetailLabel}>Wait:</span>
                            <span className={styles.cardDetailValue}>{formatDuration(data.entry_wait_days, data.entry_wait_hours)}</span>
                        </div>
                        <div className={styles.cardDetail}>
                            <span className={styles.cardDetailLabel}>Churn:</span>
                            <span className={styles.cardDetailValue}>{data.churn_limits?.entry || 8}/epoch</span>
                        </div>
                        <div className={styles.cardDetail}>
                            <span className={styles.cardDetailLabel}>Validators:</span>
                            <span className={styles.cardDetailValue}>{data.entry_queue.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Exit Card */}
                <div className={`${styles.summaryCard} ${styles.exit}`}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Exit Queue</span>
                        <span className={styles.cardIcon} style={{ color: '#ff6384' }}>📤</span>
                    </div>
                    <div className={styles.cardMainValue}>
                        {(data.exit_queue_eth || 0).toLocaleString()} ETH
                    </div>
                    <div className={styles.cardSubRow}>
                        {data.exit_queue_eth > 0 ? (
                            <div className={styles.cardDetail}>
                                <span className={styles.cardDetailLabel}>Wait:</span>
                                <span className={styles.cardDetailValue}>{data.exit_wait_minutes < 60 ? `${Math.round(data.exit_wait_minutes)} mins` : formatDuration(data.exit_wait_minutes / 1440, 0)}</span>
                            </div>
                        ) : (
                            <div className={styles.cardDetail}>
                                <span className={styles.cardDetailLabel}>Wait:</span>
                                <span className={styles.cardDetailValue}>0 mins</span>
                            </div>
                        )}
                        <div className={styles.cardDetail}>
                            <span className={styles.cardDetailLabel}>Churn:</span>
                            <span className={styles.cardDetailValue}>{data.churn_limits?.exit || 14}/epoch</span>
                        </div>
                        <div className={styles.cardDetail}>
                            <span className={styles.cardDetailLabel}>Validators:</span>
                            <span className={styles.cardDetailValue}>{data.exit_queue.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Active Validators</span>
                    <span className={styles.statValue}>{data.active_validators.toLocaleString()}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Staking APR</span>
                    <span className={styles.statValue}>{data.staking_apr}%</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Staked Supply</span>
                    <span className={styles.statValue}>{data.staked_percentage.toFixed(2)}%</span>
                </div>
            </div>

            {/* Validator Queue Chart */}
            <div className={styles.chartSection}>
                <div className={styles.chartHeader}>
                    <span className={styles.chartTitle}>
                        Queue History ({period === '7d' ? '7D' : period === '30d' ? '30D' : period === '90d' ? '90D' : period === '1y' ? '1Y' : 'All'})
                    </span>
                    <div className={styles.periodTabs}>
                        <button className={`${styles.periodTab} ${period === '7d' ? styles.periodTabActive : ''}`} onClick={() => setPeriod('7d')}>7D</button>
                        <button className={`${styles.periodTab} ${period === '30d' ? styles.periodTabActive : ''}`} onClick={() => setPeriod('30d')}>30D</button>
                        <button className={`${styles.periodTab} ${period === '90d' ? styles.periodTabActive : ''}`} onClick={() => setPeriod('90d')}>90D</button>
                        <button className={`${styles.periodTab} ${period === '1y' ? styles.periodTabActive : ''}`} onClick={() => setPeriod('1y')}>1Y</button>
                        <button className={`${styles.periodTab} ${period === 'all' ? styles.periodTabActive : ''}`} onClick={() => setPeriod('all')}>All</button>
                    </div>
                </div>
                {history.length > 0 ? (
                    <ValidatorQueueChart data={history} period={period} />
                ) : (
                    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                        데이터 수집 중...
                    </div>
                )}
            </div>

            {/* AI Report */}
            <div className={styles.aiReport}>
                <div className={styles.aiHeader}>
                    <span className={styles.aiIcon}>💡</span>
                    <span className={styles.aiLabel}>AI Market Insight</span>
                </div>
                <p className={styles.aiText}>{data.ai_report}</p>
            </div>

            <div className={styles.footer}>
                <span className={styles.timestamp}>
                    Updated: {new Date(data.timestamp).toLocaleTimeString('ko-KR')}
                </span>
                <span className={styles.source}>Source: Beaconcha.in</span>
            </div>
        </div>
    );
}
