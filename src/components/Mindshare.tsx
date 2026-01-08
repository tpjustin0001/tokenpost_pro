'use client';

import styles from './Mindshare.module.css';

interface MindshareItem {
    symbol: string;
    mindshare: string;
    change1M: string;
    isPositive: boolean;
}

const MOCK_DATA: MindshareItem[] = [
    { symbol: 'LIT', mindshare: '0.27%', change1M: '+1,171%', isPositive: true },
    { symbol: 'NIGHT', mindshare: '0.28%', change1M: '+236.49%', isPositive: true },
    { symbol: 'INJ', mindshare: '0.97%', change1M: '+212.57%', isPositive: true },
    { symbol: 'SEI', mindshare: '0.61%', change1M: '+192.33%', isPositive: true },
    { symbol: 'PEPE', mindshare: '0.45%', change1M: '+165.05%', isPositive: true },
    { symbol: 'M', mindshare: '0.1%', change1M: '+163.79%', isPositive: true },
    { symbol: 'MELANIA', mindshare: '0.1%', change1M: '+161.40%', isPositive: true },
    { symbol: 'SUI', mindshare: '0.86%', change1M: '+159.55%', isPositive: true },
    { symbol: 'WLFI', mindshare: '0.13%', change1M: '+113.45%', isPositive: true },
    { symbol: 'XLR', mindshare: '0.12%', change1M: '+94.03%', isPositive: true },
];

export default function Mindshare() {
    return (
        <div className={styles.wrapper}>
            <div className="tabs">
                <button className="tab active">Assets</button>
                <button className="tab">Sectors</button>
                <button className="tab">KOLs</button>
            </div>
            <table className="mindshare-table">
                <thead>
                    <tr>
                        <th>Asset</th>
                        <th style={{ textAlign: 'right' }}>Mindshare %</th>
                        <th style={{ textAlign: 'right' }}>1M</th>
                        <th>Why</th>
                    </tr>
                </thead>
                <tbody>
                    {MOCK_DATA.map((item) => (
                        <tr key={item.symbol}>
                            <td>
                                <div className={styles.assetCell}>
                                    <div className={styles.assetIcon}>{item.symbol.slice(0, 2)}</div>
                                    <span>{item.symbol}</span>
                                </div>
                            </td>
                            <td style={{ textAlign: 'right' }} className="font-mono">
                                {item.mindshare}
                            </td>
                            <td style={{ textAlign: 'right' }} className={`font-mono ${item.isPositive ? 'text-green' : 'text-red'}`}>
                                {item.change1M}
                            </td>
                            <td>
                                <button className={styles.whyBtn}>?</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
