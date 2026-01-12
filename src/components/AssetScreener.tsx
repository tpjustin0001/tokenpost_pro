'use client';

import React, { useState } from 'react';
import styles from './AssetScreener.module.css';

interface Asset {
    id: string;
    rank: number;
    name: string;
    symbol: string;
    price: number;
    change24h: number;
    change7d: number;
    marketCap: number;
    volume24h: number;
    fdv: number;
    tvl?: number;
}

const MOCK_DATA: Asset[] = [
    { id: 'btc', rank: 1, name: 'Bitcoin', symbol: 'BTC', price: 98500, change24h: 2.1, change7d: 5.4, marketCap: 1950000000000, volume24h: 45000000000, fdv: 2100000000000 },
    { id: 'eth', rank: 2, name: 'Ethereum', symbol: 'ETH', price: 3450, change24h: -1.2, change7d: 8.2, marketCap: 415000000000, volume24h: 18000000000, fdv: 415000000000, tvl: 65000000000 },
    { id: 'sol', rank: 3, name: 'Solana', symbol: 'SOL', price: 145, change24h: 5.8, change7d: 12.5, marketCap: 65000000000, volume24h: 4500000000, fdv: 85000000000, tvl: 4500000000 },
    { id: 'bnb', rank: 4, name: 'BNB', symbol: 'BNB', price: 620, change24h: 0.5, change7d: 1.2, marketCap: 95000000000, volume24h: 1200000000, fdv: 95000000000, tvl: 5200000000 },
    { id: 'xrp', rank: 5, name: 'XRP', symbol: 'XRP', price: 0.62, change24h: -0.8, change7d: -2.1, marketCap: 34000000000, volume24h: 1500000000, fdv: 62000000000 },
    { id: 'ada', rank: 6, name: 'Cardano', symbol: 'ADA', price: 0.45, change24h: 1.1, change7d: 3.5, marketCap: 16000000000, volume24h: 450000000, fdv: 20000000000, tvl: 350000000 },
    { id: 'doge', rank: 7, name: 'Dogecoin', symbol: 'DOGE', price: 0.16, change24h: 8.5, change7d: 15.2, marketCap: 23000000000, volume24h: 2100000000, fdv: 23000000000 },
    { id: 'avax', rank: 8, name: 'Avalanche', symbol: 'AVAX', price: 35.5, change24h: 2.3, change7d: 6.8, marketCap: 13000000000, volume24h: 650000000, fdv: 25000000000, tvl: 1200000000 },
];

function formatCurrency(value: number, compact = false) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: 2
    }).format(value);
}

function formatPercent(value: number) {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export default function AssetScreener() {
    const [assets] = useState<Asset[]>(MOCK_DATA);

    return (
        <div className={styles.screenerContainer}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <span className={styles.titleIcon}>⚡</span>
                    Market Screener
                </div>
                <div className={styles.controls}>
                    <button className={styles.filterBtn}>Filters</button>
                    <button className={styles.filterBtn}>Customize</button>
                    <button className={styles.filterBtn}>Export</button>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>24h %</th>
                            <th>7d %</th>
                            <th>Market Cap</th>
                            <th>Volume (24h)</th>
                            <th>FDV</th>
                            <th>TVL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map((asset) => (
                            <tr key={asset.id} className={styles.row}>
                                <td>{asset.rank}</td>
                                <td>
                                    <div className={styles.assetName}>
                                        <div className={styles.assetIcon} /> {/* Placeholder for icon */}
                                        {asset.name}
                                        <span className={styles.symbol}>{asset.symbol}</span>
                                    </div>
                                </td>
                                <td>{formatCurrency(asset.price)}</td>
                                <td className={asset.change24h >= 0 ? styles.positive : styles.negative}>
                                    {formatPercent(asset.change24h)}
                                </td>
                                <td className={asset.change7d >= 0 ? styles.positive : styles.negative}>
                                    {formatPercent(asset.change7d)}
                                </td>
                                <td>{formatCurrency(asset.marketCap, true)}</td>
                                <td>{formatCurrency(asset.volume24h, true)}</td>
                                <td>{formatCurrency(asset.fdv, true)}</td>
                                <td>{asset.tvl ? formatCurrency(asset.tvl, true) : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
