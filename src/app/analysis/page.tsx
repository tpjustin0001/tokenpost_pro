'use client';

import Sidebar from '@/components/Sidebar';
import MarketGate from '@/components/analysis/MarketGate';
import LeadLag from '@/components/analysis/LeadLag';
import VCPScanner from '@/components/analysis/VCPScanner';
import styles from './page.module.css';

export default function AnalysisPage() {
    return (
        <div className={styles.appLayout}>
            <Sidebar />

            <div className={styles.mainArea}>
                <main className={styles.content}>
                    <div className={styles.header}>
                        <h1 className={styles.pageTitle}>AI 분석</h1>
                        <p className={styles.subtitle}>시장 건전성, 선행 지표, 패턴 탐지</p>
                    </div>

                    <div className={styles.grid}>
                        <MarketGate />
                        <LeadLag />
                    </div>

                    <VCPScanner />
                </main>
            </div>
        </div>
    );
}
