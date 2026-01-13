'use client';

import { useState } from 'react';

import Sidebar from '@/components/Sidebar';
import MarketGate from '@/components/analysis/MarketGate';
import VCPScanner from '@/components/analysis/VCPScanner';
import { ETFFlowsChart, BlockchainRevChart } from '@/components/DataWidgets';
import styles from './page.module.css';

export default function AnalysisPage() {
    return (
        <div className={styles.appLayout}>
            <Sidebar />

            <div className={styles.mainArea}>
                <main className={styles.content}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.pageTitle}>AI 트레이딩 전략 (AI Trading Strategy)</h1>
                            <p className={styles.subtitle}>시장 국면 진단 및 기관 수급 분석</p>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>시장 신호등 (Market Regime)</h2>
                        <MarketGate />
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>기관 수급 & 프로토콜 매출 (Institutional Flows)</h2>
                        <div className={styles.grid}>
                            <ETFFlowsChart />
                            <BlockchainRevChart />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>패턴 및 시그널 탐지 (Pattern Recognition)</h2>
                        <VCPScanner />
                    </div>
                </main>
            </div>
        </div>
    );
}
