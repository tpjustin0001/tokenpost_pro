'use client';

import { useState } from 'react';
import AIXRay from './AIXRay';
import styles from './PricePerformance.module.css';

interface CoinData {
    rank: number;
    symbol: string;
    name: string;
    change: number;
    price: string;
    icon: string;
}

const GAINERS: CoinData[] = [
    { rank: 1, symbol: 'ZEC', name: 'Zcash', change: 4.59, price: '$424.56', icon: '◉' },
    { rank: 2, symbol: 'DASH', name: 'Dash', change: 2.86, price: '$38.93', icon: '◉' },
    { rank: 3, symbol: 'TAO', name: 'Bittensor', change: 2.19, price: '$273.35', icon: 'τ' },
    { rank: 4, symbol: 'PUMP', name: 'Pump.fun', change: 1.90, price: '$0.00220354', icon: '◉' },
    { rank: 5, symbol: 'PEPE', name: 'Pepe', change: 1.63, price: '$0.0633', icon: '🐸' },
    { rank: 6, symbol: 'LUNC', name: 'Terra Classic', change: 1.60, price: '$0.04289', icon: '◉' },
    { rank: 7, symbol: 'GRT', name: 'The Graph', change: 1.43, price: '$0.0401', icon: '◉' },
];

const LOSERS: CoinData[] = [
    { rank: 1, symbol: 'FTM', name: 'Fantom', change: -5.23, price: '$0.892', icon: '◉' },
    { rank: 2, symbol: 'OP', name: 'Optimism', change: -4.12, price: '$2.85', icon: '◉' },
    { rank: 3, symbol: 'ARB', name: 'Arbitrum', change: -3.87, price: '$1.24', icon: '◉' },
    { rank: 4, symbol: 'INJ', name: 'Injective', change: -3.45, price: '$28.45', icon: '◉' },
    { rank: 5, symbol: 'NEAR', name: 'NEAR', change: -2.98, price: '$5.67', icon: '◉' },
    { rank: 6, symbol: 'ATOM', name: 'Cosmos', change: -2.54, price: '$9.12', icon: '◉' },
    { rank: 7, symbol: 'DOT', name: 'Polkadot', change: -2.31, price: '$7.45', icon: '◉' },
];

export default function PricePerformance() {
    const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('losers');
    const [xrayOpen, setXrayOpen] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState('BTC');

    const data = activeTab === 'gainers' ? GAINERS : LOSERS;

    const handleXRayClick = (symbol: string) => {
        setSelectedSymbol(symbol);
        setXrayOpen(true);
    };

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <h3 className={styles.title}>Price Performance 1h</h3>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'gainers' ? styles.active : ''}`}
                        onClick={() => setActiveTab('gainers')}
                    >
                        Gainers
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'losers' ? styles.active : ''}`}
                        onClick={() => setActiveTab('losers')}
                    >
                        Losers
                    </button>
                </div>
            </div>
            <div className={styles.list}>
                {data.map((coin) => (
                    <div key={coin.symbol} className={styles.row}>
                        <div className={styles.coinInfo}>
                            <span className={styles.icon}>{coin.icon}</span>
                            <span className={styles.name}>{coin.name}</span>
                            <span className={styles.symbol}>{coin.symbol}</span>
                        </div>
                        <span className={`${styles.change} ${coin.change >= 0 ? styles.positive : styles.negative}`}>
                            {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%
                        </span>
                        <span className={styles.price}>{coin.price}</span>
                        <button
                            className={styles.xrayBtn}
                            onClick={() => handleXRayClick(coin.symbol)}
                            title="AI X-Ray 분석"
                        >
                            🔍
                        </button>
                    </div>
                ))}
            </div>

            {/* AI X-Ray Modal */}
            <AIXRay
                symbol={selectedSymbol}
                isOpen={xrayOpen}
                onClose={() => setXrayOpen(false)}
            />
        </div>
    );
}
