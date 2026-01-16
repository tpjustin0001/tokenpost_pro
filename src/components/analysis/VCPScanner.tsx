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
}

// Local coin icon paths (stored in public/icons/coins/)
function getCoinIconUrl(symbol: string): string {
    const supported = [
        // Top 10
        'BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'DOGE', 'ADA', 'TRX', 'AVAX', 'LINK',
        // 11-20
        'TON', 'SHIB', 'DOT', 'XLM', 'BCH', 'SUI', 'HBAR', 'LTC', 'PEPE', 'UNI',
        // 21-30
        'NEAR', 'APT', 'ICP', 'ETC', 'MATIC', 'TAO', 'AAVE', 'FIL', 'STX', 'VET',
        // 31-40
        'ATOM', 'INJ', 'RNDR', 'IMX', 'ARB', 'OP', 'MKR', 'GRT', 'THETA', 'FTM',
        // 41-50
        'ALGO', 'SEI', 'TIA', 'SAND', 'MANA', 'XTZ', 'AXS', 'LDO', 'WOO', 'ZEC',
        // 51-60
        'JUP', 'BONK', 'STRK', 'PYTH', 'BLUR', 'WEMIX', 'GALA', 'YFI', 'FRAX', 'ONT',
        // 61-70
        'ZRX', 'RAY', 'EOS', 'MASK', 'APE', 'CRO', 'CFX', 'FLOW', 'ONE', 'AR',
        // 71-80
        'LUNA', 'EGLD', 'ENS', 'DYDX', 'ICX', 'COMP', 'SUSHI', 'SNX', 'PENDLE', 'HT',
        // 81-90
        'AGIX', 'OCEAN', 'NEO', 'KAVA', 'ANKR', 'IOTA', 'CRV', 'IO', 'POL', 'WLFI',
        // 91-100
        'KCS', 'W', 'DAI', 'WBTC', 'STETH', 'USDT', 'USDC', 'BUSD', '1INCH', 'CC'
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
            refreshInterval: 300000, // 5분
            revalidateOnFocus: false,
        }
    );
    const [filter, setFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');

    // Use API data
    const rawSignals = data?.signals || [];

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
        currency: s.currency || 'USD',
    }));

    const filteredSignals = (filter === 'ALL' ? signals : signals.filter(s => s.grade === filter))
        .filter(s => s.currentPrice > 0 && s.currency === 'KRW') // Upbit Only (KRW)
        .sort((a, b) => {
            // 1. Score Descending
            if (b.score !== a.score) return b.score - a.score;
            // 2. Grade Ascending (A < B < C)
            if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
            // 3. Vol Ratio Descending
            return (b.volRatio || 0) - (a.volRatio || 0);
        });

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

    // Signal counts for HUD
    const countA = signals.filter(s => s.grade === 'A').length;
    const countB = signals.filter(s => s.grade === 'B').length;
    const countC = signals.filter(s => s.grade === 'C').length;
    const totalSignals = signals.length;

    return (
        <div className="card">
            {/* Enhanced Header */}
            <div className={styles.header}>
                <div className={styles.headerMain}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '20px' }}>📊</span>
                        <h2 className={styles.title}>
                            <span style={{ color: '#093687', fontWeight: 900 }}>AI</span> 차트 패턴 분석
                        </h2>
                    </div>
                    <span className="badge badge-live">실시간</span>
                </div>
                <div className={styles.tabs}>
                    {['ALL', 'A', 'B', 'C'].map((tab) => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${filter === tab ? styles.active : ''}`}
                            onClick={() => setFilter(tab as typeof filter)}
                        >
                            {tab === 'ALL' ? '전체' : `${tab}등급`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scanner HUD */}
            <div className={styles.hud}>
                <div className={styles.hudItem}>
                    <span className={styles.hudLabel}>스캔 결과</span>
                    <span className={styles.hudValue}>{totalSignals}개</span>
                </div>
                <div className={styles.hudBadges}>
                    <span className={styles.hudBadge} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                        A등급: {countA}
                    </span>
                    <span className={styles.hudBadge} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                        B등급: {countB}
                    </span>
                    <span className={styles.hudBadge} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                        C등급: {countC}
                    </span>
                </div>
            </div>

            {/* VCP Logic Guide */}
            <div className={styles.guide}>
                <div className={styles.guideIcon}>📉</div>
                <div className={styles.guideText}>
                    <strong>VCP (Volatility Contraction Pattern)</strong>
                    <span>가격 파동이 점차 줄어들며(C1→C2→C3) 힘을 응축하다가, 저항선을 뚫고 폭발적으로 상승하기 직전의 차트 패턴입니다. (마크 미너비니 전략)</span>
                </div>
            </div>

            {/* Column Legend */}
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <strong>시그널</strong>
                    <span>돌파=신고가 돌파, 접근중=돌파 임박, 리테스트=재확인</span>
                </div>
                <div className={styles.legendItem}>
                    <strong>점수</strong>
                    <span>0~100점. 이평선 정배열, 거래량, 패턴 완성도 반영</span>
                </div>
                <div className={styles.legendItem}>
                    <strong>돌파율</strong>
                    <span>52주 고점 대비 현재가 (+ = 돌파, - = 미달)</span>
                </div>
                <div className={styles.legendItem}>
                    <strong>축소율</strong>
                    <span>30일→20일→10일 변동폭. 숫자가 줄어들면 VCP 성립</span>
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
                            <span>현재가</span>
                            <span>등급</span>
                            <span>시그널</span>
                            <span>점수</span>
                            <span>돌파율</span>
                            <span>축소율</span>
                        </div>
                        {filteredSignals.map((signal) => (
                            <div key={signal.symbol} className={styles.tableRow}>
                                <div className={styles.symbolCell}>
                                    <img
                                        src={getCoinIconUrl(signal.symbol)}
                                        alt={signal.symbol}
                                        className={styles.coinIcon}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = `https://ui-avatars.com/api/?name=${signal.symbol}&background=6366f1&color=fff&size=64&bold=true`;
                                        }}
                                    />
                                    <span className={styles.symbolText}>{signal.symbol}</span>
                                </div>
                                <span className={styles.priceCell}>
                                    {signal.currency === 'KRW' ? '₩' : '$'}{signal.currentPrice.toLocaleString()}
                                </span>
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
                                    <span style={{ display: 'block', fontSize: '10px', marginTop: '2px', fontWeight: 500, color: 'rgba(0,0,0,0.5)' }}>
                                        Vol {signal.volRatio?.toFixed(1)}x
                                    </span>
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
                            </div>
                        ))}
                    </div>
                )
                }
            </div >
        </div >
    );
}
