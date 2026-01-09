'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MetricsBar from '@/components/MetricsBar';
import KimchiPremium from '@/components/KimchiPremium';
import PricePerformance from '@/components/PricePerformance';
import { StablecoinInterestChart, BlockchainRevChart, ETFFlowsChart } from '@/components/DataWidgets';
import AIInsights from '@/components/AIInsights';
import ResearchIntel from '@/components/ResearchIntel';
import TokenUnlocks from '@/components/TokenUnlocks';
import WhaleTracker from '@/components/WhaleTracker';
import BubbleChart from '@/components/BubbleChart';
import GlobalXRay, { GlobalXRayButton } from '@/components/GlobalXRay';
import styles from './page.module.css';

export default function HomePage() {
  const [globalXRayOpen, setGlobalXRayOpen] = useState(false);

  return (
    <div className={styles.appLayout}>
      <Sidebar />

      <div className={styles.mainArea}>
        <MetricsBar />

        <main className={styles.content}>
          <div className={styles.xrayHeader}>
            <h2 className={styles.pageTitle}>대시보드</h2>
            <div className={styles.headerRight}>
              <KimchiPremium />
              <GlobalXRayButton onClick={() => setGlobalXRayOpen(true)} />
            </div>
          </div>

          {/* Row 1: 4 Widgets Grid */}
          <div className={styles.widgetGrid}>
            <PricePerformance />
            <StablecoinInterestChart />
            <BlockchainRevChart />
            <ETFFlowsChart />
          </div>

          {/* Row 2: AI Insights + Research Intel */}
          <div className={styles.twoColumnGrid}>
            <AIInsights />
            <ResearchIntel />
          </div>

          {/* Row 3: Bubble Chart + Token Unlocks + Whale Tracker */}
          <BubbleChart />

          <div className={styles.twoColumnGrid}>
            <TokenUnlocks />
            <WhaleTracker />
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
