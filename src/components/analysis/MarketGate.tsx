'use client';

import useSWR from 'swr';
import styles from './MarketGate.module.css';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface CoinData {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    trend: 'Bullish' | 'Neutral' | 'Bearish';
    volatility: 'Low' | 'Normal' | 'High';
    volume: 'High' | 'Normal' | 'Low';
    ma20: number;
    ma50: number;
    currency: string;
}

// Signal colors
const signalColors = {
    Bullish: '#10b981',
    Neutral: '#f59e0b',
    Bearish: '#ef4444',
    Low: '#10b981',
    Normal: '#f59e0b',
    High: '#ef4444',
};

const signalEmojis = {
    Bullish: '🟢',
    Neutral: '🟡',
    Bearish: '🔴',
    Low: '🟢',
    Normal: '🟡',
    High: '🔴',
};

// Volume signal is reversed (High is good)
const volumeSignalColors = {
    High: '#10b981',
    Normal: '#f59e0b',
    Low: '#ef4444',
};

const volumeSignalEmojis = {
    High: '🟢',
    Normal: '🟡',
    Low: '🔴',
};

function getCoinIcon(symbol: string): string {
    const icons: Record<string, string> = {
        BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
        ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    };
    return icons[symbol] || '';
}

export default function MarketGate() {
    const { data: btcData } = useSWR('/api/python/crypto/asset/BTC', fetcher, { refreshInterval: 10000 });
    const { data: ethData } = useSWR('/api/python/crypto/asset/ETH', fetcher, { refreshInterval: 10000 });
    const { data: xrpData } = useSWR('/api/python/crypto/asset/XRP', fetcher, { refreshInterval: 10000 });

    const coins: CoinData[] = [
        btcData && {
            symbol: 'BTC',
            name: '비트코인',
            price: btcData.current_price || 0,
            change24h: btcData.price_change_24h || 0,
            trend: btcData.trend || 'Neutral',
            volatility: btcData.volatility || 'Normal',
            volume: btcData.volume_signal || 'Normal',
            ma20: btcData.ma_20 || 0,
            ma50: btcData.ma_50 || 0,
            currency: btcData.source?.includes('KRW') ? 'KRW' : 'USD',
        },
        ethData && {
            symbol: 'ETH',
            name: '이더리움',
            price: ethData.current_price || 0,
            change24h: ethData.price_change_24h || 0,
            trend: ethData.trend || 'Neutral',
            volatility: ethData.volatility || 'Normal',
            volume: ethData.volume_signal || 'Normal',
            ma20: ethData.ma_20 || 0,
            ma50: ethData.ma_50 || 0,
            currency: ethData.source?.includes('KRW') ? 'KRW' : 'USD',
        },
        xrpData && {
            symbol: 'XRP',
            name: '리플',
            price: xrpData.current_price || 0,
            change24h: xrpData.price_change_24h || 0,
            trend: xrpData.trend || 'Neutral',
            volatility: xrpData.volatility || 'Normal',
            volume: xrpData.volume_signal || 'Normal',
            ma20: xrpData.ma_20 || 0,
            ma50: xrpData.ma_50 || 0,
            currency: xrpData.source?.includes('KRW') ? 'KRW' : 'USD',
        },
    ].filter(Boolean) as CoinData[];

    const isLoading = !btcData && !ethData && !xrpData;

    return (
        <div className="card">
            <div className={styles.header}>
                <div className={styles.headerMain}>
                    <span className={styles.headerIcon}>🚦</span>
                    <h2 className={styles.title}>시장 신호등</h2>
                    <span className="badge badge-live">실시간</span>
                </div>
                <span className={styles.subtitle}>BTC · ETH · XRP 시장 상태</span>
            </div>

            <div className={styles.cardGrid}>
                {isLoading ? (
                    <div className={styles.loading}>시장 분석 중...</div>
                ) : coins.length === 0 ? (
                    <div className={styles.loading}>데이터 로딩 실패</div>
                ) : (
                    coins.map((coin) => (
                        <div key={coin.symbol} className={styles.coinCard}>
                            {/* Card Header */}
                            <div className={styles.coinHeader}>
                                <div className={styles.coinInfo}>
                                    <img src={getCoinIcon(coin.symbol)} alt={coin.symbol} className={styles.coinIcon} />
                                    <div>
                                        <span className={styles.coinSymbol}>{coin.symbol}</span>
                                        <span className={styles.coinName}>{coin.name}</span>
                                    </div>
                                </div>
                                <div className={styles.priceSection}>
                                    <span className={styles.price}>
                                        ₩{coin.price.toLocaleString()}
                                    </span>
                                    <span className={coin.change24h >= 0 ? styles.positive : styles.negative}>
                                        {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                                    </span>
                                </div>
                            </div>

                            {/* Signal Indicators with Reasoning */}
                            <div className={styles.signals}>
                                <div className={styles.signal}>
                                    <div className={styles.signalTop}>
                                        <span className={styles.signalLabel}>트렌드</span>
                                        <span
                                            className={styles.signalValue}
                                            style={{ color: signalColors[coin.trend] }}
                                        >
                                            {signalEmojis[coin.trend]} {coin.trend === 'Bullish' ? '상승' : coin.trend === 'Bearish' ? '하락' : '횡보'}
                                        </span>
                                    </div>
                                    <span className={styles.reason}>
                                        {coin.trend === 'Bullish'
                                            ? `현재가 > MA20 (₩${coin.ma20.toLocaleString()})`
                                            : coin.trend === 'Bearish'
                                                ? `현재가 < MA20 (₩${coin.ma20.toLocaleString()})`
                                                : 'MA20 근처에서 횡보 중'}
                                    </span>
                                </div>
                                <div className={styles.signal}>
                                    <div className={styles.signalTop}>
                                        <span className={styles.signalLabel}>변동성</span>
                                        <span
                                            className={styles.signalValue}
                                            style={{ color: signalColors[coin.volatility] }}
                                        >
                                            {signalEmojis[coin.volatility]} {coin.volatility === 'Low' ? '낮음' : coin.volatility === 'High' ? '높음' : '보통'}
                                        </span>
                                    </div>
                                    <span className={styles.reason}>
                                        {coin.volatility === 'Low'
                                            ? 'ATR 14일 < 2.5% (안정)'
                                            : coin.volatility === 'High'
                                                ? 'ATR 14일 > 5% (주의)'
                                                : 'ATR 14일 2.5~5% (적정)'}
                                    </span>
                                </div>
                                <div className={styles.signal}>
                                    <div className={styles.signalTop}>
                                        <span className={styles.signalLabel}>거래량</span>
                                        <span
                                            className={styles.signalValue}
                                            style={{ color: volumeSignalColors[coin.volume] }}
                                        >
                                            {volumeSignalEmojis[coin.volume]} {coin.volume === 'High' ? '활발' : coin.volume === 'Low' ? '부족' : '보통'}
                                        </span>
                                    </div>
                                    <span className={styles.reason}>
                                        {coin.volume === 'High'
                                            ? '20일 평균 대비 130%↑'
                                            : coin.volume === 'Low'
                                                ? '20일 평균 대비 70%↓'
                                                : '20일 평균 수준'}
                                    </span>
                                </div>
                            </div>

                            {/* MA Info */}
                            <div className={styles.maInfo}>
                                <span>MA20: ₩{coin.ma20.toLocaleString()}</span>
                                <span>MA50: ₩{coin.ma50?.toLocaleString() || '-'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
