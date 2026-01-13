'use client';

import { useState } from 'react';
import { usePricePerformance } from '@/hooks/usePricePerformance';
import AIXRay from './AIXRay';
import styles from './PricePerformance.module.css';

export default function PricePerformance() {
    const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('losers');
    const [xrayOpen, setXrayOpen] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState('BTC');

    const { gainers, losers, isLoading } = usePricePerformance();
    const data = activeTab === 'gainers' ? gainers : losers;

    const handleXRayClick = (symbol: string) => {
        setSelectedSymbol(symbol);
        setXrayOpen(true);
    };

    const formatPrice = (price: number) => {
        if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        return `$${price.toFixed(6)}`;
    };

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <h3 className={styles.title}>실시간 가격 등락 (Live Performance)</h3>
                    <span className={styles.liveBadge}>실시간</span>
                </div>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'gainers' ? styles.active : ''}`}
                        onClick={() => setActiveTab('gainers')}
                    >
                        상승
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'losers' ? styles.active : ''}`}
                        onClick={() => setActiveTab('losers')}
                    >
                        하락
                    </button>
                </div>
            </div>
            <div className={styles.list}>
                {isLoading ? (
                    <div className={styles.loading}>로딩 중...</div>
                ) : data.length === 0 ? (
                    <div className={styles.loading}>데이터 없음</div>
                ) : (
                    data.map((coin) => (
                        <div key={coin.symbol} className={styles.row}>
                            <div className={styles.coinInfo}>
                                {coin.icon && (
                                    <img
                                        src={coin.icon}
                                        alt={coin.symbol}
                                        className={styles.coinIcon}
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/32/icon/generic.png';
                                        }}
                                    />
                                )}
                                <span className={styles.name}>{coin.name}</span>
                                <span className={styles.symbol}>{coin.symbol}</span>
                            </div>
                            <span className={`${styles.change} ${coin.change >= 0 ? styles.positive : styles.negative}`}>
                                {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%
                            </span>
                            <span className={styles.price}>{formatPrice(coin.price)}</span>
                            <button
                                className={styles.xrayBtn}
                                onClick={() => handleXRayClick(coin.symbol)}
                                title="AI X-Ray 분석"
                            >
                                🔍
                            </button>
                        </div>
                    ))
                )}
            </div>

            <AIXRay
                symbol={selectedSymbol}
                isOpen={xrayOpen}
                onClose={() => setXrayOpen(false)}
            />
        </div>
    );
}
