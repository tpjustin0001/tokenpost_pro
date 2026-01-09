'use client';

import Sidebar from '@/components/Sidebar';
import { usePricePerformance } from '@/hooks/usePricePerformance';
import { useMarketMetrics } from '@/hooks/useMarketMetrics';
import styles from './page.module.css';

function formatNumber(num: number): string {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
}

export default function DataPage() {
    const { gainers, losers, isLoading: priceLoading } = usePricePerformance();
    const { metrics, isLoading: metricsLoading } = useMarketMetrics();

    const allCoins = [...gainers, ...losers].slice(0, 20);

    return (
        <div className={styles.appLayout}>
            <Sidebar />

            <div className={styles.mainArea}>
                <main className={styles.content}>
                    <div className={styles.header}>
                        <h1 className={styles.pageTitle}>데이터</h1>
                        <p className={styles.subtitle}>실시간 시장 데이터와 온체인 지표</p>
                    </div>

                    {/* Market Overview */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>시장 개요</h2>
                        <div className={styles.metricsGrid}>
                            <div className={styles.metricCard}>
                                <span className={styles.metricLabel}>총 시가총액</span>
                                <span className={styles.metricValue}>
                                    {metrics ? formatNumber(metrics.marketCap) : '---'}
                                </span>
                            </div>
                            <div className={styles.metricCard}>
                                <span className={styles.metricLabel}>24시간 거래량</span>
                                <span className={styles.metricValue}>
                                    {metrics ? formatNumber(metrics.spotVolume) : '---'}
                                </span>
                            </div>
                            <div className={styles.metricCard}>
                                <span className={styles.metricLabel}>BTC 도미넌스</span>
                                <span className={styles.metricValue}>
                                    {metrics ? `${metrics.btcDominance.toFixed(1)}%` : '---'}
                                </span>
                            </div>
                            <div className={styles.metricCard}>
                                <span className={styles.metricLabel}>ETH 도미넌스</span>
                                <span className={styles.metricValue}>
                                    {metrics ? `${metrics.ethDominance.toFixed(1)}%` : '---'}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Price Table */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>가격 데이터</h2>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>이름</th>
                                        <th>가격</th>
                                        <th>1시간</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {priceLoading ? (
                                        <tr><td colSpan={4} className={styles.loading}>로딩 중...</td></tr>
                                    ) : (
                                        allCoins.map((coin, index) => (
                                            <tr key={coin.symbol}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className={styles.coinCell}>
                                                        {coin.icon && <img src={coin.icon} alt="" className={styles.coinIcon} />}
                                                        <span className={styles.coinName}>{coin.name}</span>
                                                        <span className={styles.coinSymbol}>{coin.symbol}</span>
                                                    </div>
                                                </td>
                                                <td className={styles.price}>
                                                    ${coin.price >= 1 ? coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : coin.price.toFixed(6)}
                                                </td>
                                                <td className={coin.change >= 0 ? styles.positive : styles.negative}>
                                                    {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
