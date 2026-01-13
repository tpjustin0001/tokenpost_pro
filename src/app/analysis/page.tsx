'use client';

import { useState } from 'react';
import GlobalXRay, { GlobalXRayButton } from '@/components/GlobalXRay';

import Sidebar from '@/components/Sidebar';
import MarketGate from '@/components/analysis/MarketGate';
import LeadLag from '@/components/analysis/LeadLag';
import VCPScanner from '@/components/analysis/VCPScanner';
import styles from './page.module.css';

export default function AnalysisPage() {
    const [globalXRayOpen, setGlobalXRayOpen] = useState(false);

    return (
        <div className={styles.appLayout}>
            <Sidebar />

            <div className={styles.mainArea}>
                <main className={styles.content}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.pageTitle}>AI 시장 분석 (Market Intelligence)</h1>
                            <p className={styles.subtitle}>AI 기반 시장 국면 진단 및 패턴 분석 솔루션</p>
                        </div>
                        <div className={styles.headerRight}>
                            <GlobalXRayButton onClick={() => setGlobalXRayOpen(true)} />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>시장 구조 분석 (Macro & Market Structure)</h2>
                        <div className={styles.grid}>
                            <MarketGate />
                            <LeadLag />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>패턴 및 시그널 탐지 (Pattern Recognition)</h2>
                        <VCPScanner />
                    </div>
                </main>
            </div>
            <GlobalXRay
                isOpen={globalXRayOpen}
                onClose={() => setGlobalXRayOpen(false)}
            />
        </div>
    );
}
