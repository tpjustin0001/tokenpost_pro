'use client';

import Link from 'next/link';
import { PriceData, SUPPORTED_TICKERS } from '@/types';
import { formatPrice, formatChange } from '@/lib/prices';
import styles from './TopAssets.module.css';

interface TopAssetsProps {
    prices: PriceData[];
    isLoading: boolean;
}

export default function TopAssets({ prices, isLoading }: TopAssetsProps) {
    if (isLoading) {
        return (
            <div className="card">
                <div className="card-header">
                    <span className="card-title">거래량 상위 자산</span>
                </div>
                <div className={styles.loading}>로딩 중...</div>
            </div>
        );
    }

    const sortedPrices = [...prices].sort((a, b) => {
        const aVol = a.upbit?.volume24h ?? 0;
        const bVol = b.upbit?.volume24h ?? 0;
        return bVol - aVol;
    });

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">거래량 상위 자산</span>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>자산</th>
                        <th style={{ textAlign: 'right' }}>가격</th>
                        <th style={{ textAlign: 'right' }}>24시간</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPrices.slice(0, 8).map((price, index) => {
                        const ticker = SUPPORTED_TICKERS.find(t => t.symbol === price.symbol);
                        const change = price.upbit?.change24h ?? 0;

                        return (
                            <tr key={price.symbol}>
                                <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                                <td>
                                    <Link href={`/asset/${price.symbol}`} className={styles.asset}>
                                        <span className={styles.symbol}>{price.symbol}</span>
                                        <span className={styles.name}>{ticker?.name_ko}</span>
                                    </Link>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    {price.upbit ? formatPrice(price.upbit.price) : '-'}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <span className={change >= 0 ? 'text-green' : 'text-red'}>
                                        {formatChange(change)}
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
