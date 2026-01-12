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
        tab === 'breakout' ? '/api/screener/breakout' :
            tab === 'performance' ? '/api/screener/price-performance' :
                '/api/screener/risk';

    const { data, isLoading } = useSWR(apiUrl, fetcher, { refreshInterval: 60000 });

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
                        <span className={styles.cardTitle}>📈 Bull Market Coins</span>
                        <span className={styles.cardValue}>{bullMarketCount}</span>
                        <span className={styles.cardDesc}>Above 200 SMA</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>🚀 Today's Breakouts</span>
                        <span className={styles.cardValue}>{freshBreakouts}</span>
                        <span className={styles.cardDesc}>Golden Cross / SMA 200 Cross</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>🔥 Strongest Trend</span>
                        <span className={styles.cardValue}>{topGainer?.symbol || '-'}</span>
                        <span className={styles.cardDesc}>+{topGainer?.pct_from_sma200.toFixed(1)}% vs SMA200</span>
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
                        <span className={styles.cardTitle}>📉 Oversold Gems</span>
                        <span className={styles.cardValue}>{oversold}</span>
                        <span className={styles.cardDesc}>Down &gt; 80% from ATH</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>💎 Deepest Dip</span>
                        <span className={styles.cardValue}>{deepDip?.symbol || '-'}</span>
                        <span className={styles.cardDesc}>{deepDip?.drawdown.toFixed(1)}% Drawdown</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>💰 Bottom Fishing</span>
                        <span className={styles.cardValue}>{list.length}</span>
                        <span className={styles.cardDesc}>Assets Analyzed</span>
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
                        <span className={styles.cardTitle}>🛡 Low Risk Assets</span>
                        <span className={styles.cardValue}>{lowRisk}</span>
                        <span className={styles.cardDesc}>Stable relative to BTC</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>☢️ Extreme Risk</span>
                        <span className={styles.cardValue}>{extremeRisk}</span>
                        <span className={styles.cardDesc}>High Volatility Warning</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>🌪 Highest Volatility</span>
                        <span className={styles.cardValue}>{mostVolatile?.symbol || '-'}</span>
                        <span className={styles.cardDesc}>{mostVolatile?.volatility.toFixed(1)}% Annualized</span>
                    </div>
                </>
            );
        }
    };

    const renderTable = () => {
        if (isLoading) return <div className={styles.loading}>Analyzing Market Data...</div>;
        if (!data?.data) return <div className={styles.loading}>No data available</div>;

        if (tab === 'breakout') {
            const list = data.data as BreakoutData[];
            return (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Asset</th>
                            <th>Price</th>
                            <th>20 SMA</th>
                            <th>50 SMA</th>
                            <th>200 SMA (Key)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map(item => (
                            <tr key={item.symbol}>
                                <td>
                                    <div className={styles.assetCell}>
                                        <img src={getCoinIconUrl(item.symbol)} alt="" className={styles.coinIcon} />
                                        <span className={styles.symbol}>{item.symbol}</span>
                                        {item.is_fresh_breakout && <span className={styles.badge} style={{ backgroundColor: '#f59e0b', color: '#fff' }}>🔥 New</span>}
                                    </div>
                                </td>
                                <td>${item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                <td>
                                    <span className={`${styles.badge} ${item.status_20 === 'Bullish' ? styles.bullish : styles.bearish}`}>
                                        {item.status_20}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${item.status_50 === 'Bullish' ? styles.bullish : styles.bearish}`}>
                                        {item.status_50}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${item.status_200 === 'Bull Market' ? styles.bullMarket : styles.bearMarket}`}>
                                        {item.status_200}
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
                            <th>Asset</th>
                            <th>ATH (Top)</th>
                            <th>Drawdown (MDD)</th>
                            <th>From ATL (Bottom)</th>
                            <th>Cycle Position</th>
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
                            <th>Asset</th>
                            <th>Price</th>
                            <th>Volatility (Annual)</th>
                            <th>Risk Score (vs BTC)</th>
                            <th>Rating</th>
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
                                        {item.rating === 'Low' && '🛡 '}
                                        {item.rating === 'Medium' && '⚠️ '}
                                        {item.rating === 'Extreme' && '☢️ '}
                                        {item.rating}
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
                        🔭 Smart Crypto Screener
                    </h2>
                    <p className={styles.subtitle}>AI-Powered Opportunity & Risk Scanner</p>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === 'breakout' ? styles.active : ''}`}
                        onClick={() => setTab('breakout')}
                    >
                        🚀 Breakout Hunter
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'performance' ? styles.active : ''}`}
                        onClick={() => setTab('performance')}
                    >
                        💎 Bottom Fisher
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'risk' ? styles.active : ''}`}
                        onClick={() => setTab('risk')}
                    >
                        ⚡️ Risk Scanner
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
