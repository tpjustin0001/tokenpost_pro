'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MetricsBar from '@/components/MetricsBar';
import PricePerformance from '@/components/PricePerformance';
import { StablecoinInterestChart, BlockchainRevChart, ETFFlowsChart } from '@/components/DataWidgets';
import AIInsights from '@/components/AIInsights';
import ResearchIntel from '@/components/ResearchIntel';
import TokenUnlocks from '@/components/TokenUnlocks';
import WhaleTracker from '@/components/WhaleTracker';
import FundraisingTracker from '@/components/FundraisingTracker';
import GlobalXRay, { GlobalXRayButton } from '@/components/GlobalXRay';
import styles from './page.module.css';

export default function HomePage() {
  const [globalXRayOpen, setGlobalXRayOpen] = useState(false);

  return (
    <div className={styles.appLayout}>
      <Sidebar />

      <div className={styles.mainArea}>
        {/* Top Metrics Bar - Blockworks Style */}
        <MetricsBar />

        <main className={styles.content}>
          {/* Global X-Ray Button */}
          <div className={styles.xrayHeader}>
            <h2 className={styles.pageTitle}>대시보드</h2>
            <GlobalXRayButton onClick={() => setGlobalXRayOpen(true)} />
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

          {/* Row 3: Token Unlocks + Whale Tracker + Fundraising */}
          <div className={styles.threeColumnGrid}>
            <TokenUnlocks />
            <WhaleTracker />
            <FundraisingTracker />
          </div>
        </main>
      </div>

      {/* Global X-Ray Modal */}
      <GlobalXRay
        isOpen={globalXRayOpen}
        onClose={() => setGlobalXRayOpen(false)}
      />
    </div>
  );
}
