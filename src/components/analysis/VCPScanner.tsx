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
    currency: string;
    // New Fields
    pivotPrice?: number;
    dryUpRatio?: number;
    reasons?: string[];
    volContracting?: boolean;
}

// Local coin icon paths
function getCoinIconUrl(symbol: string): string {
    const supported = [
        'BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'DOGE', 'ADA', 'TRX', 'AVAX', 'LINK',
        'TON', 'SHIB', 'DOT', 'XLM', 'BCH', 'SUI', 'HBAR', 'LTC', 'PEPE', 'UNI',
        'NEAR', 'APT', 'ICP', 'ETC', 'MATIC', 'TAO', 'AAVE', 'FIL', 'STX', 'VET',
        'ATOM', 'INJ', 'RNDR', 'IMX', 'ARB', 'OP', 'MKR', 'GRT', 'THETA', 'FTM',
        'ALGO', 'SEI', 'TIA', 'SAND', 'MANA', 'XTZ', 'AXS', 'LDO', 'WOO', 'ZEC',
        'JUP', 'BONK', 'STRK', 'PYTH', 'BLUR', 'WEMIX', 'GALA', 'YFI', 'FRAX', 'ONT',
        'ZRX', 'RAY', 'EOS', 'MASK', 'APE', 'CRO', 'CFX', 'FLOW', 'ONE', 'AR'
    ];
    const sym = symbol.toUpperCase();
    if (supported.includes(sym)) {
        return `/icons/coins/${sym.toLowerCase()}.png`;
    }
    return `https://ui-avatars.com/api/?name=${symbol}&background=6366f1&color=fff&size=64&bold=true`;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function VCPScanner() {
    const { data, isLoading } = useSWR(
        '/api/python/crypto/vcp-signals',
        fetcher,
        {
            refreshInterval: 180000, // 3 mins
            revalidateOnFocus: false,
        }
    );

    const [gradeFilter, setGradeFilter] = useState<'ALL' | 'A' | 'B'>('ALL');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'BREAKOUT' | 'APPROACHING'>('ALL');

    const rawSignals = data?.signals || [];

    const signals: VCPSignal[] = rawSignals.map((s: any) => ({
        symbol: s.symbol,
        grade: s.grade,
        score: s.score,
        signalType: s.signal_type,
        pivotHigh: s.pivot_high || 0,
        currentPrice: s.current_price || 0,
        breakoutPct: s.breakout_pct || 0,
        c1: s.c1 || 0,
        c2: s.c2 || 0,
        c3: s.c3 || 0,
        atrPct: s.atr_pct || 0,
        volRatio: s.vol_ratio || 0,
        currency: s.currency || 'USD',
        // New Mappings
        pivotPrice: s.pivot_price || s.pivot_high,
        dryUpRatio: s.dry_up_ratio || 1.0,
        reasons: s.reasons || [],
        volContracting: s.vol_contracting
    }));

    const filteredSignals = signals
        .filter(s => gradeFilter === 'ALL' || s.grade === gradeFilter)
        .filter(s => typeFilter === 'ALL' || s.signalType === typeFilter)
        .filter(s => s.currentPrice > 0)
        .sort((a, b) => b.score - a.score);

    const countA = signals.filter(s => s.grade === 'A').length;
    const countBreakout = signals.filter(s => s.signalType === 'BREAKOUT').length;

    const signalLabels: Record<string, string> = {
        BREAKOUT: '돌파 발생',
        APPROACHING: '돌파 임박',
        RETEST_OK: '눌림목 지지',
    };

    const gradeColors: Record<string, string> = {
        A: '#10b981',
        B: '#3b82f6',
        C: '#f59e0b',
        D: '#6b7280',
    };

    return (
        <div className={styles.card}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerMain}>
                    <span style={{ fontSize: '24px' }}>💎</span>
                    <h2 className={styles.title}>
                        Minervini VCP Scanner
                    </h2>
                </div>
                <div className={styles.hudBadges}>
                    <span className={styles.hudBadge} style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>
                        A등급 {countA}개
                    </span>
                    <span className={styles.hudBadge} style={{ color: '#ec4899', background: 'rgba(236,72,153,0.1)' }}>
                        돌파 {countBreakout}개
                    </span>
                </div>
            </div>

            {/* Guide */}
            <div className={styles.guide}>
                <div className={styles.guideIcon}>📘</div>
                <div className={styles.guideText}>
                    <strong>프로 트레이더를 위한 VCP 분석</strong>
                    변동성이 줄어들며(Contraction) 거래량이 마르는(Dry-up) 순간을 포착하여, 폭발적인 상승 직전의 종목을 발굴합니다.
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filterBar}>
                <button
                    className={`${styles.filterBtn} ${gradeFilter === 'ALL' ? styles.active : ''}`}
                    onClick={() => setGradeFilter('ALL')}
                >
                    전체 등급
                </button>
                <button
                    className={`${styles.filterBtn} ${gradeFilter === 'A' ? styles.active : ''}`}
                    onClick={() => setGradeFilter('A')}
                >
                    A등급 (강력)
                </button>
                <button
                    className={`${styles.filterBtn} ${gradeFilter === 'B' ? styles.active : ''}`}
                    onClick={() => setGradeFilter('B')}
                >
                    B등급 (우수)
                </button>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
                <button
                    className={`${styles.filterBtn} ${typeFilter === 'ALL' ? styles.active : ''}`}
                    onClick={() => setTypeFilter('ALL')}
                >
                    모든 상태
                </button>
                <button
                    className={`${styles.filterBtn} ${typeFilter === 'BREAKOUT' ? styles.active : ''}`}
                    onClick={() => setTypeFilter('BREAKOUT')}
                >
                    🚀 돌파 발생
                </button>
                <button
                    className={`${styles.filterBtn} ${typeFilter === 'APPROACHING' ? styles.active : ''}`}
                    onClick={() => setTypeFilter('APPROACHING')}
                >
                    👀 돌파 임박
                </button>
            </div>

            {/* Table Header */}
            <div className={styles.tableHeader}>
                <span>종목 (Symbol)</span>
                <span>가격 / Pivot</span>
                <span>등급</span>
                <span>상태 (Signal)</span>
                <span>점수 (Score)</span>
                <span>변동성 (VCP)</span>
                <span>거래량 (Vol)</span>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                        AI 엔진이 차트 패턴을 정밀 분석 중입니다...
                    </div>
                ) : filteredSignals.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                        현재 조건에 부합하는 종목이 없습니다.
                    </div>
                ) : (
                    filteredSignals.map((signal) => (
                        <div key={signal.symbol} className={styles.tableRow}>
                            {/* 1. Symbol */}
                            <div className={styles.symbolCell}>
                                <img
                                    src={getCoinIconUrl(signal.symbol)}
                                    alt={signal.symbol}
                                    className={styles.coinIcon}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = `https://ui-avatars.com/api/?name=${signal.symbol}&background=1f2937&color=fff`;
                                    }}
                                />
                                <span className={styles.symbolText}>{signal.symbol}</span>
                            </div>

                            {/* 2. Price / Pivot */}
                            <div className={styles.priceDisplay}>
                                <span className={styles.priceCell}>
                                    {signal.currency === 'KRW' ? '₩' : '$'}{signal.currentPrice.toLocaleString()}
                                </span>
                                {signal.pivotPrice && (
                                    <span className={styles.pivotContext}>
                                        Pivot {signal.currency === 'KRW' ? '₩' : '$'}{signal.pivotPrice.toLocaleString()} ({signal.breakoutPct > 0 ? '+' : ''}{signal.breakoutPct.toFixed(1)}%)
                                    </span>
                                )}
                            </div>

                            {/* 3. Grade */}
                            <div
                                className={styles.gradeTag}
                                style={{
                                    background: `${gradeColors[signal.grade]}20`,
                                    color: gradeColors[signal.grade]
                                }}
                            >
                                {signal.grade}
                            </div>

                            {/* 4. Signal Type */}
                            <div className={styles.signalTag}>
                                <span
                                    className={styles.signalMain}
                                    style={{
                                        color: signal.signalType === 'BREAKOUT' ? '#34d399' :
                                            signal.signalType === 'APPROACHING' ? '#fbbf24' : '#60a5fa',
                                        background: signal.signalType === 'BREAKOUT' ? 'rgba(52, 211, 153, 0.15)' :
                                            signal.signalType === 'APPROACHING' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(96, 165, 250, 0.15)'
                                    }}
                                >
                                    {signalLabels[signal.signalType]}
                                </span>
                                {(signal.reasons && signal.reasons.length > 0) && (
                                    <span className={styles.signalSub}>
                                        {signal.reasons[0]}
                                    </span>
                                )}
                            </div>

                            {/* 5. Score */}
                            <div className={styles.scoreWrapper}>
                                <div className={styles.scoreTrack}>
                                    <div
                                        className={styles.scoreFill}
                                        style={{
                                            width: `${signal.score}%`,
                                            background: signal.score >= 80 ? '#10b981' :
                                                signal.score >= 50 ? '#f59e0b' : '#ef4444'
                                        }}
                                    />
                                </div>
                                <span>{signal.score}</span>
                            </div>

                            {/* 6. VCP Contractions */}
                            <div className={styles.dataCell}>
                                <span style={{ color: '#d1d5db' }}>{signal.c1.toFixed(0)}%</span>
                                <span style={{ margin: '0 2px', color: '#6b7280' }}>→</span>
                                <span style={{ color: '#9ca3af' }}>{signal.c2.toFixed(0)}%</span>
                                <span style={{ margin: '0 2px', color: '#6b7280' }}>→</span>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>{signal.c3.toFixed(0)}%</span>
                            </div>

                            {/* 7. Volume Dry Up */}
                            <div className={styles.dataCell}>
                                {signal.dryUpRatio ? (
                                    <span style={{
                                        color: signal.dryUpRatio < 0.7 ? '#34d399' : '#9ca3af',
                                        fontWeight: signal.dryUpRatio < 0.7 ? 700 : 400
                                    }}>
                                        {Math.round(signal.dryUpRatio * 100)}%
                                    </span>
                                ) : '-'}
                                <span style={{ fontSize: '10px', color: '#6b7280', marginLeft: '4px' }}>of Avg</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
