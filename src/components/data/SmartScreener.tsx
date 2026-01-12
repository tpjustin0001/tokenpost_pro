'use client';

import { useState } from 'react';
import useSWR from 'swr';
import styles from './SmartScreener.module.css';

// --- Types ---
interface BreakoutData {
    symbol: string;
    price: number;
    sma20: number;
    sma50: number;
    sma200: number;
    status_20: 'Bullish' | 'Bearish';
    status_50: 'Bullish' | 'Bearish';
    status_200: 'Bull Market' | 'Bear Market';
    is_fresh_breakout: boolean;
    pct_from_sma200: number;
}

interface PerformanceData {
    symbol: string;
    price: number;
    ath: number;
    ath_date: string;
    atl: number;
    atl_date: string;
    drawdown: number;
    from_atl: number;
    cycle_position: number;
}

interface RiskData {
    symbol: string;
    price: number;
    volatility: number;
    risk_score: number;
    rating: 'Low' | 'Medium' | 'Extreme';
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Helper for icons (duplicated from VCPScanner for now to be self-contained)
function getCoinIconUrl(symbol: string): string {
    const urls: Record<string, string> = {
        'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
        'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
        'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
        'XRP': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
        'ADA': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
        'DOGE': 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
        'AVAX': 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
        'SHIB': 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
        'DOT': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
        'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
        'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
        'ATOM': 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
        'LTC': 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
        'UNI': 'https://assets.coingecko.com/coins/images/12504/small/uniswap.png',
        'SUI': 'https://assets.coingecko.com/coins/images/28464/small/sui-ocean-square.png',
        'NEAR': 'https://assets.coingecko.com/coins/images/10365/small/near_icon.png',
        'APT': 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
        'ARB': 'https://assets.coingecko.com/coins/images/16547/small/arbitrum.png',
        'OP': 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
    };
    return urls[symbol.toUpperCase()] || `https://ui-avatars.com/api/?name=${symbol}&background=6366f1&color=fff&size=64&bold=true`;
}

export default function SmartScreener() {
    const [tab, setTab] = useState<'breakout' | 'performance' | 'risk'>('breakout');

    const apiUrl =
        tab === 'breakout' ? '/api/python/screener/breakout' :
            tab === 'performance' ? '/api/python/screener/price-performance' :
                '/api/python/screener/risk';

    const { data, isLoading, error } = useSWR(apiUrl, fetcher, {
        refreshInterval: 60000,
        shouldRetryOnError: true,
        loadingTimeout: 10000
    });

    const renderSkeleton = () => (
        <div className={styles.skeletonContainer}>
            {[1, 2, 3].map(i => (
                <div key={i} className={styles.skeletonRow} />
            ))}
            <div className={styles.skeletonText}>AI가 시장 데이터를 분석하고 있습니다... (약 5~10초 소요)</div>
        </div>
    );

    const summaryCards = () => {
        if (!data?.data) return null;

        if (tab === 'breakout') {
            const list = data.data as BreakoutData[];
            const bullMarketCount = list.filter(i => i.status_200 === 'Bull Market').length;
            const freshBreakouts = list.filter(i => i.is_fresh_breakout).length;
            const topGainer = list.sort((a, b) => b.pct_from_sma200 - a.pct_from_sma200)[0];

            return (
                <>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>📈 상승장 코인 (Bull Market)</span>
                        <span className={styles.cardValue}>{bullMarketCount}</span>
                        <span className={styles.cardDesc}>200일 이평선 상회</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>🚀 급등 포착 (Breakout)</span>
                        <span className={styles.cardValue}>{freshBreakouts}</span>
                        <span className={styles.cardDesc}>골든크로스 / 돌파 발생</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>🔥 최강 모멘텀</span>
                        <span className={styles.cardValue}>{topGainer?.symbol || '-'}</span>
                        <span className={styles.cardDesc}>SMA200 대비 +{topGainer?.pct_from_sma200.toFixed(1)}%</span>
                    </div>
                </>
            );
        }

        if (tab === 'performance') {
            const list = data.data as PerformanceData[];
            const oversold = list.filter(i => i.drawdown <= -80).length;
            const deepDip = list.sort((a, b) => a.drawdown - b.drawdown)[0]; // Lowest drawdown

            return (
                <>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>📉 과매도 구간 (Oversold)</span>
                        <span className={styles.cardValue}>{oversold}</span>
                        <span className={styles.cardDesc}>고점 대비 -80% 이상</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>💎 저점 매수 기회</span>
                        <span className={styles.cardValue}>{deepDip?.symbol || '-'}</span>
                        <span className={styles.cardDesc}>{deepDip?.drawdown.toFixed(1)}% 하락 (최대)</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>💰 분석 대상</span>
                        <span className={styles.cardValue}>{list.length}</span>
                        <span className={styles.cardDesc}>주요 자산 스캔 완료</span>
                    </div>
                </>
            );
        }

        if (tab === 'risk') {
            const list = data.data as RiskData[];
            const lowRisk = list.filter(i => i.rating === 'Low').length;
            const extremeRisk = list.filter(i => i.rating === 'Extreme').length;
            const mostVolatile = list[0]; // Already sorted by risk desc

            return (
                <>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>🛡 저위험 자산</span>
                        <span className={styles.cardValue}>{lowRisk}</span>
                        <span className={styles.cardDesc}>BTC 대비 안정적 움직임</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>☢️ 고위험 주의</span>
                        <span className={styles.cardValue}>{extremeRisk}</span>
                        <span className={styles.cardDesc}>높은 변동성 경고</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>🌪 최고 변동성</span>
                        <span className={styles.cardValue}>{mostVolatile?.symbol || '-'}</span>
                        <span className={styles.cardDesc}>연간 변동성 {mostVolatile?.volatility.toFixed(1)}%</span>
                    </div>
                </>
            );
        }
    };

    const renderTable = () => {
        if (isLoading) return renderSkeleton();

        if (error || !data?.data) {
            return (
                <div className={styles.loading}>
                    <p>데이터를 불러올 수 없습니다.</p>
                    <button onClick={() => window.location.reload()} className={styles.retryBtn}>
                        다시 시도
                    </button>
                </div>
            );
        }

        if (tab === 'breakout') {
            const list = data.data as BreakoutData[];
            return (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>자산 (Asset)</th>
                            <th>현재가</th>
                            <th>단기 추세 (20 SMA)</th>
                            <th>중기 추세 (50 SMA)</th>
                            <th>장기 추세 (200 SMA)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map(item => (
                            <tr key={item.symbol}>
                                <td>
                                    <div className={styles.assetCell}>
                                        <img src={getCoinIconUrl(item.symbol)} alt="" className={styles.coinIcon} />
                                        <span className={styles.symbol}>{item.symbol}</span>
                                        {item.is_fresh_breakout && <span className={styles.badge} style={{ backgroundColor: '#f59e0b', color: '#fff' }}>🔥 돌파</span>}
                                    </div>
                                </td>
                                <td>${item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                <td>
                                    <span className={`${styles.badge} ${item.status_20 === 'Bullish' ? styles.bullish : styles.bearish}`}>
                                        {item.status_20 === 'Bullish' ? '상승' : '하락'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${item.status_50 === 'Bullish' ? styles.bullish : styles.bearish}`}>
                                        {item.status_50 === 'Bullish' ? '상승' : '하락'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${item.status_200 === 'Bull Market' ? styles.bullMarket : styles.bearMarket}`}>
                                        {item.status_200 === 'Bull Market' ? '강세장' : '약세장'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (tab === 'performance') {
            const list = data.data as PerformanceData[];
            return (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>자산 (Asset)</th>
                            <th>전고점 (ATH)</th>
                            <th>하락률 (MDD)</th>
                            <th>저점 대비 상승 (From ATL)</th>
                            <th>사이클 위치</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map(item => (
                            <tr key={item.symbol}>
                                <td>
                                    <div className={styles.assetCell}>
                                        <img src={getCoinIconUrl(item.symbol)} alt="" className={styles.coinIcon} />
                                        <span className={styles.symbol}>{item.symbol}</span>
                                    </div>
                                </td>
                                <td>
                                    <div>${item.ath.toLocaleString()}</div>
                                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{item.ath_date}</div>
                                </td>
                                <td style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                    {item.drawdown.toFixed(2)}%
                                </td>
                                <td style={{ color: '#10b981' }}>
                                    +{item.from_atl.toFixed(1)}%
                                </td>
                                <td>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${item.cycle_position * 100}%` }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'right', marginTop: '2px' }}>
                                        {Math.round(item.cycle_position * 100)}%
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (tab === 'risk') {
            const list = data.data as RiskData[];
            return (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>자산 (Asset)</th>
                            <th>현재가</th>
                            <th>변동성 (연간)</th>
                            <th>리스크 점수 (vs BTC)</th>
                            <th>등급 (Rating)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map(item => (
                            <tr key={item.symbol} style={item.rating === 'Extreme' ? { background: 'rgba(239, 68, 68, 0.05)' } : {}}>
                                <td>
                                    <div className={styles.assetCell}>
                                        <img src={getCoinIconUrl(item.symbol)} alt="" className={styles.coinIcon} />
                                        <span className={styles.symbol}>{item.symbol}</span>
                                    </div>
                                </td>
                                <td>${item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                <td>{item.volatility.toFixed(2)}%</td>
                                <td>{item.risk_score.toFixed(2)}x</td>
                                <td>
                                    <span className={styles[`risk${item.rating}`]}>
                                        {item.rating === 'Low' && '🛡 안정'}
                                        {item.rating === 'Medium' && '⚠️ 보통'}
                                        {item.rating === 'Extreme' && '☢️ 위험'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.title}>
                        🔭 스마트 가상자산 스크리너
                    </h2>
                    <p className={styles.subtitle}>AI 기반 기회 포착 & 리스크 분석 시스템</p>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === 'breakout' ? styles.active : ''}`}
                        onClick={() => setTab('breakout')}
                    >
                        🚀 급등 신호 포착
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'performance' ? styles.active : ''}`}
                        onClick={() => setTab('performance')}
                    >
                        💎 저점 매수 기회
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'risk' ? styles.active : ''}`}
                        onClick={() => setTab('risk')}
                    >
                        ⚡️ 리스크 분석
                    </button>
                </div>
            </div>

            <div className={styles.summaryGrid}>
                {summaryCards()}
            </div>

            <div className={styles.tableWrapper}>
                {renderTable()}
            </div>
        </div>
    );
}
