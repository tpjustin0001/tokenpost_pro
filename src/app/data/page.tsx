'use client';

import { useState } from 'react';

import Sidebar from '@/components/Sidebar';
import { useMarketMetrics } from '@/hooks/useMarketMetrics';
import SmartScreener from '@/components/data/SmartScreener';
import ValidatorQueueChart from '@/components/data/ValidatorQueueChart';
import TokenUnlocks from '@/components/TokenUnlocks';
import WhaleTracker from '@/components/WhaleTracker';
import { StablecoinInterestChart, BlockchainRevChart, ETFFlowsChart } from '@/components/DataWidgets';
import styles from './page.module.css';

function formatNumber(num: number): string {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
}

export default function DataPage() {
    const { metrics, isLoading: metricsLoading } = useMarketMetrics();

    return (
        <div className={styles.appLayout}>
            <Sidebar />

            <div className={styles.mainArea}>
                <main className={styles.content}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.pageTitle}>마켓 데이터 센터</h1>
                            <p className={styles.subtitle}>심층 온체인 분석 & 거시 경제 지표</p>
                        </div>
                    </div>

                    {/* 1. Market Overview */}
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

                    {/* 2. Smart Crypto Screener (Full Width) */}
                    <section className={styles.section}>
                        <SmartScreener />
                    </section>

                    {/* 3. Validator Queue Chart (검증자 대기열) */}
                    <section className={styles.section}>
                        <ValidatorQueueChart />
                    </section>

                    {/* 3. Supply & Whales (Grid) */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>토큰 언락 & 고래 추적 (Supply & Whales)</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <TokenUnlocks />
                            <WhaleTracker />
                        </div>
                    </section>

                    {/* 4. Liquidity & Macro */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>유동성 & 거시 경제 (Liquidity & Macro)</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <StablecoinInterestChart />
                            <BlockchainRevChart />
                            <ETFFlowsChart />
                        </div>
                    </section>

                </main>
            </div>

        </div>
    );
}
