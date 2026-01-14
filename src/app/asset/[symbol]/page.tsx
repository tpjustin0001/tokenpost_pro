'use client';

import { use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
const TradingChart = dynamic(() => import('@/components/TradingChart'), {
    ssr: false,
    loading: () => <div style={{ height: 400, background: 'var(--bg-card)', borderRadius: 8 }} />
});
import { usePrices, formatPrice, formatChange, formatKimchiPremium, formatVolume } from '@/lib/prices';
import { SUPPORTED_TICKERS } from '@/types';
import styles from './page.module.css';

interface AssetPageProps {
    params: Promise<{ symbol: string }>;
}

export default function AssetPage({ params }: AssetPageProps) {
    const { symbol } = use(params);
    const { prices, isLoading } = usePrices();

    const priceData = prices.find(p => p.symbol === symbol.toUpperCase());
    const ticker = SUPPORTED_TICKERS.find(t => t.symbol === symbol.toUpperCase());

    const upbitPrice = priceData?.upbit?.price ?? null;
    const binancePrice = priceData?.binance?.price ?? null;
    const change24h = priceData?.upbit?.change24h ?? 0;
    const kimchiPremium = priceData?.kimchiPremium ?? null;
    const isPositive = change24h >= 0;
    const usdKrwRate = priceData?.usdKrwRate ?? 1450;

    return (
        <>
            <Header />
            <main className={`container ${styles.main}`}>
                {/* Breadcrumb */}
                <nav className={styles.breadcrumb}>
                    <Link href="/">대시보드</Link>
                    <span>/</span>
                    <span>{symbol.toUpperCase()}</span>
                </nav>

                {/* Hero Section */}
                <section className={styles.hero}>
                    <div className={styles.heroLeft}>
                        <div className={styles.assetIcon}>
                            {symbol.slice(0, 2).toUpperCase()}
                        </div>
                        <div className={styles.assetInfo}>
                            <div className={styles.assetHeader}>
                                <h1 className={styles.assetName}>
                                    {ticker?.name_ko ?? ticker?.name ?? symbol}
                                </h1>
                                <span className={styles.assetSymbol}>{symbol.toUpperCase()}</span>
                            </div>
                            <div className={styles.badges}>
                                <span className="badge badge-blue">#L1</span>
                                {kimchiPremium !== null && kimchiPremium > 3 && (
                                    <span className="badge badge-kimchi">🔥 김프 주의</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.heroRight}>
                        <div className={styles.priceMain}>
                            <span className={`font-mono ${styles.priceValue}`}>
                                {isLoading ? '...' : upbitPrice ? formatPrice(upbitPrice) : '-'}
                            </span>
                            <span className={`badge ${isPositive ? 'badge-green' : 'badge-red'} ${styles.changeBadge}`}>
                                {isLoading ? '...' : formatChange(change24h)}
                            </span>
                        </div>
                        <div className={styles.priceSecondary}>
                            <span className="text-muted">
                                ≈ {binancePrice ? formatPrice(binancePrice, 'USD') : '-'} USD
                            </span>
                            {kimchiPremium !== null && (
                                <span className={`badge badge-kimchi ${styles.kimchiBadge}`}>
                                    🇰🇷 김프: {formatKimchiPremium(kimchiPremium)}
                                </span>
                            )}
                        </div>
                    </div>
                </section>

                {/* Tab Navigation */}
                <nav className={styles.tabNav}>
                    {['Overview', 'Market & Data', 'Unlock & Supply', 'Governance', 'Research'].map((tab, i) => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${i === 0 ? styles.active : ''}`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>

                {/* Content Grid */}
                <div className={styles.contentGrid}>
                    {/* Main Column */}
                    <div className={styles.mainColumn}>
                        {/* Chart */}
                        <TradingChart symbol={symbol.toUpperCase()} />

                        {/* Key Metrics */}
                        <section className="card">
                            <div className="card-header">
                                <h2 className="card-title">📊 Key Metrics</h2>
                            </div>
                            <div className={styles.metricsGrid}>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>시가총액</span>
                                    <span className={`font-mono ${styles.metricValue}`}>₩1,821조</span>
                                </div>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>완전 희석 시총 (FDV)</span>
                                    <span className={`font-mono ${styles.metricValue}`}>₩1,912조</span>
                                </div>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>24H 거래량</span>
                                    <span className={`font-mono ${styles.metricValue}`}>
                                        {priceData?.upbit ? formatVolume(priceData.upbit.volume24h) : '-'}
                                    </span>
                                </div>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>유통량 / 총 공급량</span>
                                    <div className={styles.supplyProgress}>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFill} style={{ width: '93%' }} />
                                        </div>
                                        <span className="font-mono text-muted">93%</span>
                                    </div>
                                </div>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>🇰🇷 Korea Crunch</span>
                                    <span className={`font-mono ${styles.metricValue}`}>12.5%</span>
                                    <span className="text-muted text-xs">전세계 거래량 중 원화 비중</span>
                                </div>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>USD/KRW 환율</span>
                                    <span className={`font-mono ${styles.metricValue}`}>₩{usdKrwRate.toLocaleString()}</span>
                                </div>
                            </div>
                        </section>

                        {/* About Project */}
                        <section className="card">
                            <div className="card-header">
                                <h2 className="card-title">📖 프로젝트 소개</h2>
                                <span className="badge badge-blue">AI 작성</span>
                            </div>
                            <div className="card-body">
                                <p className={styles.aboutText}>
                                    {symbol.toUpperCase() === 'BTC'
                                        ? '비트코인은 2009년 사토시 나카모토가 만든 최초의 탈중앙화 디지털 화폐입니다. 블록체인 기술을 기반으로 하며, P2P 네트워크를 통해 중앙 기관 없이 거래가 이루어집니다. 총 발행량은 2,100만 개로 제한되어 있어 디지털 금(Digital Gold)으로 불립니다.'
                                        : symbol.toUpperCase() === 'ETH'
                                            ? '이더리움은 스마트 컨트랙트 기능을 갖춘 분산 컴퓨팅 플랫폼입니다. 비탈릭 부테린이 2015년 출시했으며, DeFi, NFT, DAO 등 다양한 탈중앙화 애플리케이션(dApps)의 기반이 됩니다. 2022년 PoS 전환 후 에너지 효율성이 크게 개선되었습니다.'
                                            : `${ticker?.name_ko ?? ticker?.name ?? symbol}에 대한 상세 설명이 아직 작성되지 않았습니다. 리서치팀에서 곧 업데이트할 예정입니다.`
                                    }
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Side Column */}
                    <aside className={styles.sideColumn}>
                        {/* Investors */}
                        <section className="card">
                            <div className="card-header">
                                <h2 className="card-title">💼 Investors</h2>
                            </div>
                            <div className={styles.investorGrid}>
                                {['a16z', 'Paradigm', 'Sequoia', 'Polychain'].map((vc) => (
                                    <div key={vc} className={styles.investorItem}>
                                        <div className={styles.investorLogo}>{vc.slice(0, 2)}</div>
                                        <span className={styles.investorName}>{vc}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Official Links */}
                        <section className="card">
                            <div className="card-header">
                                <h2 className="card-title">🔗 Links</h2>
                            </div>
                            <div className={styles.linksList}>
                                <a href="#" className={styles.linkItem}>
                                    <span>🌐</span> Website
                                </a>
                                <a href="#" className={styles.linkItem}>
                                    <span>📄</span> Whitepaper
                                </a>
                                <a href="#" className={styles.linkItem}>
                                    <span>💻</span> GitHub
                                </a>
                                <a href="#" className={styles.linkItem}>
                                    <span>🐦</span> Twitter
                                </a>
                            </div>
                        </section>

                        {/* Community Pulse */}
                        <section className="card">
                            <div className="card-header">
                                <h2 className="card-title">📢 Community Pulse</h2>
                            </div>
                            <div className="card-body">
                                <div className={styles.sentimentMeter}>
                                    <div className={styles.sentimentBar}>
                                        <div className={styles.sentimentFill} style={{ width: '65%' }} />
                                    </div>
                                    <div className={styles.sentimentLabels}>
                                        <span>공포</span>
                                        <span className="font-mono text-green">65 탐욕</span>
                                        <span>극도의 탐욕</span>
                                    </div>
                                </div>
                                <div className={styles.keywords}>
                                    <span className={styles.keyword}>상승</span>
                                    <span className={styles.keyword}>매수</span>
                                    <span className={styles.keyword}>ETF</span>
                                    <span className={styles.keyword}>반감기</span>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </main>
        </>
    );
}
