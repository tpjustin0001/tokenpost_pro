'use client';

import styles from './Mindshare.module.css';

interface MindshareItem {
    symbol: string;
    mindshare: string;
    change1M: string;
    isPositive: boolean;
}

// CoinGecko image IDs for major coins
function getCoinId(symbol: string): number {
    const ids: Record<string, number> = {
        'BTC': 1, 'ETH': 279, 'SOL': 4128, 'BNB': 825, 'XRP': 44,
        'ADA': 975, 'DOGE': 5, 'AVAX': 12559, 'SHIB': 11939, 'DOT': 12171,
        'LINK': 877, 'MATIC': 4713, 'ATOM': 1481, 'LTC': 2, 'UNI': 12504,
    };
    return ids[symbol.toUpperCase()] || 1;
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
                                src={`https://assets.coingecko.com/coins/images/${getCoinId(item.symbol)}/small/${item.symbol.toLowerCase()}.png`}
                                alt={item.symbol}
                                className={styles.assetIcon}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://www.cryptocompare.com/media/37746251/${item.symbol.toLowerCase()}.png`;
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
