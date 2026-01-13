'use client';

import { useState } from 'react';
import GlobalXRay, { GlobalXRayButton } from '@/components/GlobalXRay';

import Sidebar from '@/components/Sidebar';
import LeadLagAnalysis from '@/components/LeadLagAnalysis';
import { useMarketMetrics } from '@/hooks/useMarketMetrics';
import SmartScreener from '@/components/data/SmartScreener';
import styles from './page.module.css';

function formatNumber(num: number): string {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
}

export default function DataPage() {
    const { metrics, isLoading: metricsLoading } = useMarketMetrics();
    const [globalXRayOpen, setGlobalXRayOpen] = useState(false);

    return (
        <div className={styles.appLayout}>
            <Sidebar />

            <div className={styles.mainArea}>
                <main className={styles.content}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.pageTitle}>데이터 센터</h1>
                            <p className={styles.subtitle}>거시 경제 선행 지표 & 실시간 온체인 데이터</p>
                        </div>
                        <div className={styles.headerRight}>
                            <GlobalXRayButton onClick={() => setGlobalXRayOpen(true)} />
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

                    {/* 2. Smart Crypto Screener */}
                    <section className={styles.section}>
                        <SmartScreener />
                    </section>

                    {/* 3. Macro Economic Analysis (Lead-Lag) */}
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>🌎 거시 경제 선행 지표 (Macro Lead-Lag)</h2>
                            <span className="badge badge-primary">AI Powered Granger Causality</span>
                        </div>
                        <p className={styles.sectionDesc}>
                            과거 데이터를 기반으로 특정 거시 경제 지표가 비트코인 가격 변동을 얼마나 선행하는지 분석합니다. (최대 6개월 시차)
                        </p>
                        <LeadLagAnalysis />
                    </section>
                </main>
            </div>

            <GlobalXRay
                isOpen={globalXRayOpen}
                onClose={() => setGlobalXRayOpen(false)}
            />
        </div>
    );
}
