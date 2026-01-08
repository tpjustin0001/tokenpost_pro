'use client';

import Link from 'next/link';
import { PriceData, SUPPORTED_TICKERS } from '@/types';
import { formatPrice, formatChange, formatKimchiPremium } from '@/lib/prices';
import styles from './PriceTable.module.css';

interface PriceTableProps {
    prices: PriceData[];
    isLoading: boolean;
}

export default function PriceTable({ prices, isLoading }: PriceTableProps) {
    if (isLoading) {
        return (
            <div className={styles.wrapper}>
                <table className="price-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Asset</th>
                            <th style={{ textAlign: 'right' }}>Price</th>
                            <th style={{ textAlign: 'right' }}>1D</th>
                            <th style={{ textAlign: 'right' }}>Mcap</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(10)].map((_, i) => (
                            <tr key={i}>
                                <td><div className={styles.skeleton} style={{ width: 20 }}></div></td>
                                <td><div className={styles.skeleton} style={{ width: 80 }}></div></td>
                                <td><div className={styles.skeleton} style={{ width: 70, marginLeft: 'auto' }}></div></td>
                                <td><div className={styles.skeleton} style={{ width: 50, marginLeft: 'auto' }}></div></td>
                                <td><div className={styles.skeleton} style={{ width: 60, marginLeft: 'auto' }}></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <table className="price-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Asset</th>
                        <th style={{ textAlign: 'right' }}>Price</th>
                        <th style={{ textAlign: 'right' }}>1D</th>
                        <th style={{ textAlign: 'right' }}>Kim-P</th>
                    </tr>
                </thead>
                <tbody>
                    {prices.map((price, index) => {
                        const ticker = SUPPORTED_TICKERS.find(t => t.symbol === price.symbol);
                        const change = price.upbit?.change24h ?? 0;
                        const isPositive = change >= 0;
                        const kimchi = price.kimchiPremium;

                        return (
                            <tr key={price.symbol}>
                                <td>
                                    <span className="asset-rank">{index + 1}</span>
                                </td>
                                <td>
                                    <Link href={`/asset/${price.symbol}`} className="asset-cell">
                                        <div className="asset-icon">{price.symbol.slice(0, 2)}</div>
                                        <span className="asset-symbol">{price.symbol}</span>
                                    </Link>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    {price.upbit ? formatPrice(price.upbit.price).replace('₩', '$') : '-'}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <span className={isPositive ? 'text-green' : 'text-red'}>
                                        {price.upbit ? formatChange(price.upbit.change24h) : '-'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <span className={kimchi && kimchi > 0 ? 'text-red' : 'text-green'}>
                                        {formatKimchiPremium(price.kimchiPremium)}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
