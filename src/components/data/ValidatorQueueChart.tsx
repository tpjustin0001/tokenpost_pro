'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart3, AlertTriangle } from 'lucide-react';
import styles from './ValidatorQueueChart.module.css';

// GitHub historical_data.json format
interface HistoryDataPoint {
    date: string;          // "2023-05-21"
    entry_queue: number;   // Already in ETH
    exit_queue: number;    // Already in ETH
}

interface ApiResponse {
    success: boolean;
    count: number;
    data: HistoryDataPoint[];
    error?: string;
}

type PeriodKey = '7' | '30' | '90' | '365' | 'all';

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
    { key: '7', label: '7일' },
    { key: '30', label: '30일' },
    { key: '90', label: '90일' },
    { key: '365', label: '1년' },
    { key: 'all', label: '전체' },
];

const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
}

export default function ValidatorQueueChart() {
    const [period, setPeriod] = useState<PeriodKey>('90');

    // Use the new GitHub historical data endpoint
    const { data, isLoading, error, mutate } = useSWR<ApiResponse>(
        `/api/python/validator-queue/history?period=${period}`,
        fetcher,
        {
            refreshInterval: 3600000, // 1시간마다 갱신
            revalidateOnFocus: false,
        }
    );

    // 차트 데이터 변환 - 데이터가 이미 ETH 단위이므로 변환 불필요
    const chartData = useMemo(() => {
        if (!data?.data || data.data.length === 0) return [];

        // 데이터 필터링 (기간별)
        let filtered = [...data.data];
        if (period !== 'all') {
            const days = parseInt(period);
            filtered = filtered.slice(-days);
        }

        // 날짜 포맷 변환
        return filtered.map(d => ({
            date: formatDate(d.date),
            fullDate: d.date,
            entry: d.entry_queue,
            exit: d.exit_queue,
        }));
    }, [data, period]);


    // 통계 계산
    const stats = useMemo(() => {
        if (!chartData.length) return null;

        const latest = chartData[chartData.length - 1];
        const first = chartData[0];

        const entryChange = latest.entry - first.entry;
        const exitChange = latest.exit - first.exit;

        const maxEntry = Math.max(...chartData.map(d => d.entry));
        const maxExit = Math.max(...chartData.map(d => d.exit));

        return {
            currentEntry: latest.entry,
            currentExit: latest.exit,
            entryChange,
            exitChange,
            maxEntry,
            maxExit,
        };
    }, [chartData]);

    // 커스텀 툴팁
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;

        return (
            <div style={{
                background: 'rgba(15, 15, 20, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
            }}>
                <div style={{ color: '#9ca3af', marginBottom: '8px' }}>{label}</div>
                {payload.map((p: any, i: number) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: p.color,
                        marginBottom: '4px'
                    }}>
                        <span>{p.name === 'entry' ? '진입 대기 ETH' : '이탈 대기 ETH'}:</span>
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {formatNumber(p.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    // 로딩 상태
    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h2 className={styles.title}>
                            <BarChart3 size={22} style={{ color: '#60a5fa' }} />
                            이더리움 검증자 대기열 (Validator Queue)
                        </h2>
                        <p className={styles.subtitle}>이더리움 스테이킹 진입/이탈 대기열 히스토리</p>
                    </div>
                </div>
                <div className={styles.chartCard}>
                    <div className={styles.skeleton}>
                        <span className={styles.skeletonText}>데이터를 불러오는 중...</span>
                    </div>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error || !data?.success) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h2 className={styles.title}>
                            <BarChart3 size={22} style={{ color: '#60a5fa' }} />
                            이더리움 검증자 대기열 (Validator Queue)
                        </h2>
                    </div>
                </div>
                <div className={styles.chartCard}>
                    <div className={styles.error}>
                        <AlertTriangle size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
                        <p>데이터를 불러올 수 없습니다</p>
                        <button className={styles.retryBtn} onClick={() => mutate()}>
                            다시 시도
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.title}>
                        <BarChart3 size={22} style={{ color: '#60a5fa' }} />
                        이더리움 검증자 대기열 (Validator Queue)
                    </h2>
                    <p className={styles.subtitle}>이더리움 스테이킹 진입/이탈 대기열 히스토리</p>
                </div>

                {/* Period Filter */}
                <div className={styles.periodFilters}>
                    {PERIOD_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            className={`${styles.periodBtn} ${period === opt.key ? styles.active : ''}`}
                            onClick={() => setPeriod(opt.key)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Card */}
            <div className={styles.chartCard}>
                <div className={styles.watermark}>TOKENPOST PRO</div>

                {/* Legend */}
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendDot} ${styles.legendDotEntry}`} />
                        <span>진입 대기 ETH (Entry)</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendDot} ${styles.legendDotExit}`} />
                        <span>이탈 대기 ETH (Exit)</span>
                    </div>
                </div>

                {/* Chart */}
                <div className={styles.chartWrapper}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="entryGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="exitGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                tickFormatter={formatNumber}
                                width={50}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="entry"
                                stroke="#60a5fa"
                                strokeWidth={2}
                                fill="url(#entryGradient)"
                                name="entry"
                            />
                            <Area
                                type="monotone"
                                dataKey="exit"
                                stroke="#f472b6"
                                strokeWidth={2}
                                fill="url(#exitGradient)"
                                name="exit"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Summary Stats */}
                {stats && (
                    <div className={styles.summaryGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>현재 진입 ETH</span>
                            <span className={`${styles.statValue} ${styles.statValueEntry}`}>
                                {formatNumber(stats.currentEntry)}
                            </span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>현재 이탈 ETH</span>
                            <span className={`${styles.statValue} ${styles.statValueExit}`}>
                                {formatNumber(stats.currentExit)}
                            </span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>기간 최대 진입 ETH</span>
                            <span className={styles.statValue}>
                                {formatNumber(stats.maxEntry)}
                            </span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>기간 최대 이탈 ETH</span>
                            <span className={styles.statValue}>
                                {formatNumber(stats.maxExit)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
