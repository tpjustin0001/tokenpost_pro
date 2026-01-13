'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, Variants } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MetricsBar from '@/components/MetricsBar';
import EventTicker from '@/components/EventTicker';
import Mindshare from '@/components/Mindshare';
import KimchiPremium from '@/components/KimchiPremium';
import PricePerformance from '@/components/PricePerformance';

import { StablecoinInterestChart, BlockchainRevChart, ETFFlowsChart } from '@/components/DataWidgets';
import NewsFeed from '@/components/NewsFeed';
import ResearchIntel from '@/components/ResearchIntel';
import TokenUnlocks from '@/components/TokenUnlocks';
import WhaleTracker from '@/components/WhaleTracker';
import GlobalXRay, { GlobalXRayButton } from '@/components/GlobalXRay';
import styles from './page.module.css';

const TradingChart = dynamic(() => import('@/components/TradingChart'), {
  ssr: false,
  loading: () => <div style={{ height: 350, background: 'rgba(13,17,23,0.5)', borderRadius: '8px' }} />
});

const CHART_SYMBOLS = [
  { id: 'BTC', name: '비트코인' },
  { id: 'ETH', name: '이더리움' },
  { id: 'XRP', name: '리플' },
  { id: 'SOL', name: '솔라나' },
  { id: 'DOGE', name: '도지코인' },
];

const CHART_INTERVALS = [
  { id: '1m', label: '1분' },
  { id: '5m', label: '5분' },
  { id: '15m', label: '15분' },
  { id: '30m', label: '30분' },
  { id: '1h', label: '1시간' },
  { id: '4h', label: '4시간' },
  { id: '12h', label: '12시간' },
  { id: '1d', label: '일봉' },
  { id: '1w', label: '주봉' },
  { id: '1M', label: '월봉' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 50,
      damping: 20
    }
  }
};

export default function HomePage() {
  const [globalXRayOpen, setGlobalXRayOpen] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState('BTC');
  const [activeInterval, setActiveInterval] = useState('15m');

  // Import motion dynamically to avoid SSR mismatch if needed, but 'use client' handles it usually.
  // We need to use valid motion components.
  const MotionMain = motion.main;
  const MotionSection = motion.section;
  const MotionDiv = motion.div;

  return (
    <div className={styles.appLayout}>
      <Sidebar />

      <div className={styles.mainArea}>
        <MetricsBar />
        <EventTicker />

        <MotionMain
          className={styles.content}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <MotionDiv className={styles.xrayHeader} variants={itemVariants}>
            <h2 className={styles.pageTitle}>대시보드</h2>
            <div className={styles.headerRight}>
              <KimchiPremium />
              <GlobalXRayButton onClick={() => setGlobalXRayOpen(true)} />
            </div>
          </MotionDiv>

          {/* Main Chart Section */}
          <MotionDiv className={styles.chartSection} variants={itemVariants}>
            <div className={styles.chartHeader}>
              <div className={styles.chartControlsLeft}>
                <div className={styles.chartTabs}>
                  {CHART_SYMBOLS.map(sym => (
                    <button
                      key={sym.id}
                      className={`${styles.chartTab} ${activeSymbol === sym.id ? styles.active : ''}`}
                      onClick={() => setActiveSymbol(sym.id)}
                    >
                      {sym.name}
                    </button>
                  ))}
                </div>
                <div className={styles.dividerVertical} />
                <div className={styles.chartTabs}>
                  {CHART_INTERVALS.map(int => (
                    <button
                      key={int.id}
                      className={`${styles.chartTab} ${activeInterval === int.id ? styles.active : ''}`}
                      onClick={() => setActiveInterval(int.id)}
                    >
                      {int.label}
                    </button>
                  ))}
                </div>
              </div>
              <span className={styles.chartLabel}>
                {activeSymbol}/USDT · {CHART_INTERVALS.find(i => i.id === activeInterval)?.label}
              </span>
            </div>
            <TradingChart symbol={activeSymbol} interval={activeInterval} />
          </MotionDiv>

          {/* Section: Market Intelligence (Sentiment & News) */}
          <MotionSection className={styles.dashboardSection} variants={itemVariants}>
            <h2 className={styles.sectionHeading}>🔊 시장 심리 & 트렌드 (Sentiment & Trends)</h2>
            <div className={styles.twoColumnGrid}>
              <Mindshare />
              <NewsFeed />
            </div>
          </MotionSection>

          {/* Section: Macro & On-Chain */}
          <MotionSection className={styles.dashboardSection} variants={itemVariants}>
            <h2 className={styles.sectionHeading}>📊 시장 펀더멘탈 (Market Fundamentals)</h2>
            <div className={styles.threeColumnGrid}>
              <StablecoinInterestChart />
              <BlockchainRevChart />
              <ETFFlowsChart />
            </div>
          </MotionSection>

          {/* Section: Market Movers */}
          <MotionSection className={styles.dashboardSection} variants={itemVariants}>
            <h2 className={styles.sectionHeading}>⚡️ 변동성 & 수급 (Volatility & Supply)</h2>
            <div className={styles.threeColumnGrid}>
              <PricePerformance />
              <TokenUnlocks />
              <WhaleTracker />
            </div>
          </MotionSection>
        </MotionMain>
      </div>

      <GlobalXRay
        isOpen={globalXRayOpen}
        onClose={() => setGlobalXRayOpen(false)}
      />
    </div>
  );
}
