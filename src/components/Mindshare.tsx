'use client';

import styles from './Mindshare.module.css';

interface MindshareItem {
    symbol: string;
    mindshare: string;
    change1M: string;
    isPositive: boolean;
}

// Direct CoinGecko image URLs for major coins
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
    };
    return urls[symbol.toUpperCase()] || `https://ui-avatars.com/api/?name=${symbol}&background=6366f1&color=fff&size=64&bold=true`;
}

const MOCK_DATA: MindshareItem[] = [
    { symbol: 'BTC', mindshare: 'High', change1M: 'Bullish', isPositive: true },
    { symbol: 'ETH', mindshare: 'Med', change1M: 'Neutral', isPositive: true },
    { symbol: 'SOL', mindshare: 'High', change1M: 'Bullish', isPositive: true },
    { symbol: 'DOGE', mindshare: 'High', change1M: 'Bullish', isPositive: true },
    { symbol: 'SHIB', mindshare: 'Med', change1M: 'Neutral', isPositive: false },
];

export default function Mindshare() {
    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <h3 className={styles.title}>소셜 센티멘트 (Social Sentiment)</h3>
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${styles.active}`}>전체</button>
                    <button className={styles.tab}>트위터</button>
                    <button className={styles.tab}>레딧</button>
                </div>
            </div>

            <div className={styles.tableHeader}>
                <span className={styles.th}>ASSET</span>
                <span className={`${styles.th} ${styles.thCenter}`}>INTEREST</span>
                <span className={`${styles.th} ${styles.thCenter}`}>SENTIMENT</span>
                <span className={styles.th}></span>
            </div>

            <div className={styles.list}>
                {MOCK_DATA.map((item) => (
                    <div key={item.symbol} className={styles.row}>
                        <div className={styles.colAsset}>
                            <img
                                src={getCoinIconUrl(item.symbol)}
                                alt={item.symbol}
                                className={styles.assetIcon}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${item.symbol}&background=6366f1&color=fff&size=64&bold=true`;
                                }}
                            />
                            <span className={styles.assetName}>{item.symbol}</span>
                        </div>
                        <div className={styles.colCenter}>
                            <span className={`${styles.badge} ${item.mindshare === 'High' ? styles.badgeHigh : styles.badgeMed}`}>
                                {item.mindshare}
                            </span>
                        </div>
                        <div className={styles.colCenter}>
                            <span className={item.isPositive ? styles.textGreen : styles.textRed}>
                                {item.change1M}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className={styles.whyBtn}>?</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
