'use client';

import useSWR from 'swr';
import { useState } from 'react';
import styles from './VCPScanner.module.css';

interface VCPSignal {
    symbol: string;
    grade: 'A' | 'B' | 'C' | 'D';
    score: number;
    signalType: 'BREAKOUT' | 'APPROACHING' | 'RETEST_OK';
    pivotHigh: number;
    currentPrice: number;
    breakoutPct: number;
    c1: number;
    c2: number;
    c3: number;
    atrPct: number;
    volRatio: number;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Fallback data when API is unavailable
const FALLBACK_SIGNALS = [
    { symbol: 'SOL', grade: 'A', score: 85, signal_type: 'BREAKOUT', pivot_high: 195, current_price: 198.5, breakout_pct: 1.8, c1: 28, c2: 18, c3: 12, atr_pct: 3.2, vol_ratio: 2.1 },
    { symbol: 'AVAX', grade: 'A', score: 78, signal_type: 'APPROACHING', pivot_high: 42, current_price: 41.2, breakout_pct: -1.9, c1: 32, c2: 22, c3: 15, atr_pct: 4.1, vol_ratio: 1.5 },
    { symbol: 'LINK', grade: 'B', score: 72, signal_type: 'RETEST_OK', pivot_high: 28, current_price: 28.8, breakout_pct: 2.9, c1: 25, c2: 20, c3: 16, atr_pct: 3.8, vol_ratio: 1.8 },
    { symbol: 'SUI', grade: 'B', score: 68, signal_type: 'BREAKOUT', pivot_high: 4.2, current_price: 4.35, breakout_pct: 3.6, c1: 30, c2: 24, c3: 18, atr_pct: 5.2, vol_ratio: 2.4 },
    { symbol: 'XRP', grade: 'C', score: 55, signal_type: 'APPROACHING', pivot_high: 2.5, current_price: 2.48, breakout_pct: -0.8, c1: 22, c2: 20, c3: 18, atr_pct: 3.5, vol_ratio: 1.2 },
];

export default function VCPScanner() {
    const { data, isLoading } = useSWR(
        '/api/python/crypto/vcp-signals',
        fetcher,
        {
            refreshInterval: 300000, // 5분
            revalidateOnFocus: false,
        }
    );
    const [filter, setFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');

    // Use API data if available, otherwise use fallback
    const rawSignals = data?.signals || FALLBACK_SIGNALS;

    const signals: VCPSignal[] = rawSignals.map((s: any) => ({
        symbol: s.symbol,
        grade: s.grade,
        score: s.score,
        signalType: s.signal_type,
        pivotHigh: s.pivot_high || 0,
        currentPrice: s.current_price || 0,
        breakoutPct: s.breakout_pct || 0,
        c1: s.c1 || 30,
        c2: s.c2 || 20,
        c3: s.c3 || 15,
        atrPct: s.atr_pct || 3.5,
        volRatio: s.vol_ratio || 1.5,
    }));

    const filteredSignals = filter === 'ALL'
        ? signals
        : signals.filter(s => s.grade === filter);

    const gradeColors: Record<string, string> = {
        A: '#10b981',
        B: '#3b82f6',
        C: '#f59e0b',
        D: '#6b7280',
    };

    const signalLabels: Record<string, string> = {
        BREAKOUT: '돌파',
        APPROACHING: '접근 중',
        RETEST_OK: '리테스트 확인',
    };

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <span className="card-title">VCP 스캐너</span>
                    <p className={styles.subtitle}>VCP 패턴 탐지 (A/B/C/D 등급)</p>
                </div>
                <div className={styles.tabs}>
                    {['ALL', 'A', 'B', 'C'].map((tab) => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${filter === tab ? styles.active : ''}`}
                            onClick={() => setFilter(tab as typeof filter)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.content}>
                {isLoading ? (
                    <div className={styles.loading}>VCP 패턴 스캔 중...</div>
                ) : filteredSignals.length === 0 ? (
                    <div className={styles.empty}>해당 등급의 시그널이 없습니다</div>
                ) : (
                    <div className={styles.table}>
                        <div className={styles.tableHeader}>
                            <span>심볼</span>
                            <span>등급</span>
                            <span>시그널</span>
                            <span>점수</span>
                            <span>돌파율</span>
                            <span>Contraction</span>
                            <span>Vol Ratio</span>
                        </div>
                        {filteredSignals.map((signal) => (
                            <div key={signal.symbol} className={styles.tableRow}>
                                <span className={styles.symbol}>{signal.symbol}</span>
                                <span
                                    className={styles.grade}
                                    style={{
                                        background: `${gradeColors[signal.grade]}20`,
                                        color: gradeColors[signal.grade]
                                    }}
                                >
                                    {signal.grade}
                                </span>
                                <span className={`${styles.signalType} ${styles[signal.signalType.toLowerCase()]}`}>
                                    {signalLabels[signal.signalType]}
                                </span>
                                <span className={styles.score}>
                                    <div className={styles.scoreBar}>
                                        <div
                                            className={styles.scoreFill}
                                            style={{
                                                width: `${signal.score}%`,
                                                background: signal.score >= 70 ? '#10b981' : signal.score >= 50 ? '#f59e0b' : '#ef4444'
                                            }}
                                        />
                                    </div>
                                    <span>{signal.score}</span>
                                </span>
                                <span className={signal.breakoutPct >= 0 ? styles.positive : styles.negative}>
                                    {signal.breakoutPct >= 0 ? '+' : ''}{signal.breakoutPct.toFixed(1)}%
                                </span>
                                <span className={styles.contraction}>
                                    {signal.c1.toFixed(0)}→{signal.c2.toFixed(0)}→{signal.c3.toFixed(0)}
                                </span>
                                <span className={signal.volRatio >= 1.5 ? styles.positive : styles.neutral}>
                                    {signal.volRatio.toFixed(1)}x
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
