'use client';

import styles from './Mindshare.module.css';

interface MindshareItem {
    symbol: string;
    mindshare: string;
    change1M: string;
    isPositive: boolean;
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
                            <div className={styles.assetIcon}>{item.symbol.substring(0, 1)}</div>
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
