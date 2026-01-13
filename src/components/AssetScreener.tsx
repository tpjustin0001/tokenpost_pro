'use client';

import React, { useState, useEffect } from 'react';
import styles from './AssetScreener.module.css';
import { flaskApi } from '@/services/flaskApi';

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

// Direct CoinGecko image URLs for major coins
function getCoinIconUrl(symbol: string): string {
    // 1. Try CoinCap CDN (High quality, high coverage)
    return `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;
}

function formatCurrency(value: number, compact = false) {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: 2
    }).format(value);
}

function formatPercent(value: number) {
    if (value === undefined || value === null) return '-';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export default function AssetScreener() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAssets() {
            setLoading(true);
            const data = await flaskApi.getListings(30); // Increased limit for fuller screen
            if (data && data.length > 0) {
                setAssets(data);
            }
            setLoading(false);
        }
        fetchAssets();
    }, []);

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
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading Market Data...
                    </div>
                ) : (
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
                                            <img
                                                src={getCoinIconUrl(asset.symbol)}
                                                alt={asset.symbol}
                                                className={styles.assetIcon}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    // Fallback Chain: CoinCap -> GitHub -> UI Avatars
                                                    if (target.src.includes('coincap')) {
                                                        target.src = `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${asset.symbol.toLowerCase()}.png`;
                                                    } else if (target.src.includes('github')) {
                                                        target.src = `https://ui-avatars.com/api/?name=${asset.symbol}&background=6366f1&color=fff&size=64&bold=true`;
                                                    }
                                                }}
                                            />
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
                )}
            </div>
        </div>
    );
}
