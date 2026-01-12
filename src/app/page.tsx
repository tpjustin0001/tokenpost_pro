'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
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
import BubbleChart from '@/components/BubbleChart';
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

export default function HomePage() {
  const [globalXRayOpen, setGlobalXRayOpen] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState('BTC');
  const [activeInterval, setActiveInterval] = useState('15m');

  return (
    <div className={styles.appLayout}>
      <Sidebar />

      <div className={styles.mainArea}>
        <MetricsBar />
        <EventTicker />

        <main className={styles.content}>
          <div className={styles.xrayHeader}>
            <h2 className={styles.pageTitle}>대시보드</h2>
            <div className={styles.headerRight}>
              <KimchiPremium />
              <GlobalXRayButton onClick={() => setGlobalXRayOpen(true)} />
            </div>
          </div>

          {/* Main Chart Section */}
          <div className={styles.chartSection}>
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
          </div>

          {/* Row 1: 4 Widgets Grid */}
          <div className={styles.widgetGrid}>
            <PricePerformance />
            <StablecoinInterestChart />
            <BlockchainRevChart />
            <ETFFlowsChart />
          </div>

          {/* Row 2: Social Sentiment + News Feed */}
          <div className={styles.twoColumnGrid}>
            <Mindshare />
            <NewsFeed />
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
