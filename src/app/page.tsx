'use client';

import Sidebar from '@/components/Sidebar';
import MarketPulse from '@/components/MarketPulse';
import SectorHeatmap from '@/components/SectorHeatmap';
import MacroChart from '@/components/MacroChart';
import InstitutionalMetrics from '@/components/InstitutionalMetrics';
import ResearchIntel from '@/components/ResearchIntel';
import TopAssets from '@/components/TopAssets';
import TokenUnlocks from '@/components/TokenUnlocks';
import WhaleTracker from '@/components/WhaleTracker';
import FundraisingTracker from '@/components/FundraisingTracker';
import AIInsights from '@/components/AIInsights';
import { usePrices } from '@/lib/prices';
import styles from './page.module.css';

export default function HomePage() {
  const { prices, isLoading } = usePrices();

  return (
    <div className={styles.appLayout}>
      <Sidebar />

      <div className={styles.mainArea}>
        <MarketPulse />

        <main className="main-content">
          {/* Hero: Sector Heatmap */}
          <section className={styles.heroSection}>
            <SectorHeatmap />
          </section>

          {/* Main 2-Column Grid */}
          <div className="dashboard-grid">
            <div className="dashboard-main">
              {/* 1. AI Insights - Real-time AI Analysis (Most Important) */}
              <AIInsights />

              {/* 2. Research & Intel + Breaking News (Core Value) */}
              <ResearchIntel />

              {/* 3. Advanced Features Grid */}
              <div className={styles.advancedGrid}>
                <TokenUnlocks />
                <WhaleTracker />
              </div>

              {/* 4. Institutional Metrics with AI X-Ray */}
              <InstitutionalMetrics symbol="BTC" />

              {/* 5. Macro Chart (Less Priority - Smaller) */}
              <div className={styles.chartSection}>
                <MacroChart />
              </div>
            </div>

            <div className="dashboard-side">
              {/* 1. Top Assets */}
              <TopAssets prices={prices} isLoading={isLoading} />

              {/* 2. Fundraising */}
              <FundraisingTracker />

              {/* 3. Quick Links */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">빠른 접근</span>
                </div>
                <div className={styles.quickLinks}>
                  <a href="/screener" className={styles.quickLink}>
                    <span className={styles.linkIcon}>SC</span>
                    <span>스크리너</span>
                  </a>
                  <a href="/watchlist" className={styles.quickLink}>
                    <span className={styles.linkIcon}>WL</span>
                    <span>관심목록</span>
                  </a>
                  <a href="/research" className={styles.quickLink}>
                    <span className={styles.linkIcon}>RE</span>
                    <span>리포트</span>
                  </a>
                  <a href="/admin" className={styles.quickLink}>
                    <span className={styles.linkIcon}>AD</span>
                    <span>관리자</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
