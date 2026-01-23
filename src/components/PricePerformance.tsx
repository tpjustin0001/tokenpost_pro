'use client';

import { useState } from 'react';
import { TrendingDown } from 'lucide-react';
import { usePricePerformance } from '@/hooks/usePricePerformance';
import EmptyState from './EmptyState';
import { TableSkeleton } from './LoadingSkeleton';
import styles from './PricePerformance.module.css';

const EXCHANGES = [
    { id: 'upbit', label: '업비트' },
    { id: 'bithumb', label: '빗썸' },
    { id: 'binance', label: '바이낸스' },
];

export default function PricePerformance() {
    const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');
    const [activeExchange, setActiveExchange] = useState<string>('upbit');

    const { gainers, losers, isLoading } = usePricePerformance(activeExchange);
    const data = activeTab === 'gainers' ? gainers : losers;

    const formatPrice = (price: number) => {
        if (!price) return '0.00';
        // Korean Won formatting for KRW exchanges
        if (activeExchange === 'upbit' || activeExchange === 'bithumb') {
            if (price < 1) return `₩${price.toFixed(4)}`;
            return `₩${price.toLocaleString()}`;
        }
        // USD formatting for Binance
        if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        return `$${price.toFixed(6)}`;
    };

    return (
        <div className={styles.widget} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className={styles.header} style={{ minHeight: 'auto', flex: '0 0 auto', paddingBottom: '12px' }}>
                <div className={styles.titleRow}>
                    <h3 className={styles.title}>가격 등락 (24H 기준)</h3>
                    <div className={styles.exchangeTabs}>
                        {EXCHANGES.map(ex => (
                            <button
                                key={ex.id}
                                className={`${styles.exchangeTab} ${activeExchange === ex.id ? styles.activeExchange : ''}`}
                                onClick={() => setActiveExchange(ex.id)}
                            >
                                {ex.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.subHeader}>
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
                <span className={styles.badgeLive}>1분 갱신</span>
            </div>

            <div className={styles.list} style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {isLoading ? (
                    <TableSkeleton rows={6} />
                ) : data.length === 0 ? (
                    <EmptyState
                        icon={<TrendingDown size={48} />}
                        title="데이터 로딩 중"
                        description="거래소 데이터를 불러오고 있습니다."
                    />
                ) : (
                    data.map((coin, index) => (
                        <div key={`${coin.symbol}-${index}`} className={styles.row}>
                            <div className={styles.coinInfo}>
                                {coin.icon && (
                                    <img
                                        src={coin.icon}
                                        alt={coin.symbol}
                                        className={styles.coinIcon}
                                        onError={(e) => {
                                            // Fallback Strategy: CoinCap -> CryptoIcons -> SpotHQ -> Generic
                                            const target = e.currentTarget;
                                            const symbol = coin.symbol.toLowerCase();
                                            // Prevent infinite loops
                                            const currentSrc = target.src;

                                            // 1. If CoinCap failed (current), try CryptoIcons
                                            if (currentSrc.includes('assets.coincap.io')) {
                                                target.src = `https://cryptoicons.org/api/icon/${symbol}/200`;
                                            }
                                            // 2. If CryptoIcons failed, try SpotHQ
                                            else if (currentSrc.includes('cryptoicons.org')) {
                                                target.src = `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol}.png`;
                                            }
                                            // 3. If SpotHQ failed, use Generic
                                            else if (currentSrc.includes('githubusercontent')) {
                                                target.src = 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/32/icon/generic.png';
                                            }
                                            // 4. Safety net
                                            else {
                                                target.style.display = 'none'; // Hide if all fail
                                            }
                                        }}
                                    />
                                )}
                                <div className={styles.nameCtx}>
                                    <span className={styles.coinName}>{coin.name}</span>
                                    <span className={styles.symbol}>{coin.symbol}</span>
                                </div>
                            </div>

                            <div className={styles.priceCol}>
                                <span className={styles.price}>{formatPrice(coin.price)}</span>
                            </div>

                            <div className={styles.changeCol}>
                                <span className={styles.changeLabel}>1H</span>
                                <span className={`${styles.change} ${coin.change >= 0 ? styles.positive : styles.negative}`}>
                                    {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%
                                </span>
                            </div>

                            <div className={styles.changeCol}>
                                <span className={styles.changeLabel}>24H</span>
                                <span className={`${styles.change} ${coin.change_24h >= 0 ? styles.positive : styles.negative}`}>
                                    {coin.change_24h >= 0 ? '+' : ''}{coin.change_24h.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
