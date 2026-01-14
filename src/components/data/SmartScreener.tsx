'use client';

import { useState } from 'react';
import useSWR from 'swr';
import styles from './SmartScreener.module.css';

// --- Simplified Interfaces matching Real API (api/index.py) ---
interface TickerData {
    symbol: string;
    price: number;
    change_24h?: number;
    change_1h?: number;
    volume?: number;
    is_breakout?: boolean;
    volatility?: number;
    risk_score?: number;
    rating?: 'Low' | 'Medium' | 'Extreme';
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Helper for icons
// Helper for icons
function getCoinIconUrl(symbol: string): string {
    // Normalize symbol: remove -USDT, -KRW, etc.
    let clean = symbol.toUpperCase();
    clean = clean.replace('KRW-', '').replace('-KRW', '');
    clean = clean.replace('USDT-', '').replace('-USDT', '');
    clean = clean.replace('BTC-', '').replace('-BTC', '');

    // Use CoinCap assets (High coverage)
    return `https://assets.coincap.io/assets/icons/${clean.toLowerCase()}@2x.png`;
}

export default function SmartScreener() {
    const [tab, setTab] = useState<'breakout' | 'performance' | 'risk'>('breakout');

    const apiUrl =
        tab === 'breakout' ? '/api/python/screener/breakout' :
            tab === 'performance' ? '/api/python/screener/price-performance' :
                '/api/python/screener/risk';

    const { data, isLoading, error } = useSWR(apiUrl, fetcher, {
        refreshInterval: 60000,
        shouldRetryOnError: true,
        loadingTimeout: 10000
    });

    const renderSkeleton = () => (
        <div className={styles.skeletonContainer}>
            {[1, 2, 3].map(i => (
                <div key={i} className={styles.skeletonRow} />
            ))}
            <div className={styles.skeletonText}>AI가 데이터를 분석 중입니다... (약 5초 소요)</div>
        </div>
    );

    const summaryCards = () => {
        if (!data?.data) return null;
        const list = data.data as TickerData[];

        if (tab === 'breakout') {
            const breakouts = list.filter(i => i.is_breakout).length;
            const topGainer = [...list].sort((a, b) => (b.change_24h || 0) - (a.change_24h || 0))[0];

            return (
                <>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>🚀 상승 추세</span>
                        <span className={styles.cardValue}>{list.filter(i => (i.change_24h || 0) > 0).length}</span>
                        <span className={styles.cardDesc}>24시간 가격 상승</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>🔥 돌파 신호</span>
                        <span className={styles.cardValue}>{breakouts}</span>
                        <span className={styles.cardDesc}>고점 근접 (상위 2%)</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>🏆 최고 상승</span>
                        <span className={styles.cardValue}>{topGainer?.symbol || '-'}</span>
                        <span className={styles.cardDesc}>+{topGainer?.change_24h?.toFixed(1) || '0.0'}% (24시간)</span>
                    </div>
                </>
            );
        }

        if (tab === 'performance') {
            const upCount = list.filter(i => (i.change_24h || 0) > 5).length;
            const downCount = list.filter(i => (i.change_24h || 0) < -5).length;
            const topVol = [...list].sort((a, b) => (b.volume || 0) - (a.volume || 0))[0];

            return (
                <>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>💪 강세 코인 (+5%↑)</span>
                        <span className={styles.cardValue}>{upCount}</span>
                        <span className={styles.cardDesc}>모멘텀 강세</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>📉 약세 코인 (-5%↓)</span>
                        <span className={styles.cardValue}>{downCount}</span>
                        <span className={styles.cardDesc}>단기 조정 중</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>💰 거래 대장</span>
                        <span className={styles.cardValue}>{topVol?.symbol || '-'}</span>
                        <span className={styles.cardDesc}>최고 거래량 (USDT)</span>
                    </div>
                </>
            );
        }

        if (tab === 'risk') {
            const lowRisk = list.filter(i => i.rating === 'Low').length;
            const extremeRisk = list.filter(i => i.rating === 'Extreme').length;
            const mostVolatile = list[0];

            return (
                <>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>🛡 안정형 자산</span>
                        <span className={styles.cardValue}>{lowRisk}</span>
                        <span className={styles.cardDesc}>변동성 3% 미만</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>☢️ 고위험 주의</span>
                        <span className={styles.cardValue}>{extremeRisk}</span>
                        <span className={styles.cardDesc}>변동성 7% 초과</span>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardTitle}>🌪 최고 변동성</span>
                        <span className={styles.cardValue}>{mostVolatile?.symbol || '-'}</span>
                        <span className={styles.cardDesc}>변동폭 {mostVolatile?.volatility?.toFixed(1) || '0.0'}%</span>
                    </div>
                </>
            );
        }
    };

    const renderTable = () => {
        if (isLoading) return renderSkeleton();

        if (error || !data || data.status === 'error' || !Array.isArray(data.data)) {
            return (
                <div className={styles.loading}>
                    <p>데이터를 불러올 수 없습니다. (서버 연결 확인 필요)</p>
                    <button onClick={() => window.location.reload()} className={styles.retryBtn}>
                        다시 시도
                    </button>
                </div>
            );
        }

        const list = data.data as TickerData[];

        if (tab === 'breakout' || tab === 'performance') {
            return (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>자산</th>
                            <th>현재가</th>
                            <th>변동률 (1시간)</th>
                            <th>거래량 (24시간)</th>
                            <th>상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map(item => (
                            <tr key={item.symbol}>
                                <td>
                                    <div className={styles.assetCell}>
                                        <img src={getCoinIconUrl(item.symbol)} alt="" className={styles.coinIcon} />
                                        <span className={styles.symbol}>{item.symbol}</span>
                                        {item.is_breakout && <span className={styles.badge} style={{ backgroundColor: '#f59e0b', color: '#fff' }}>🔥 고점 근접</span>}
                                    </div>
                                </td>
                                <td>${item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                <td style={{ color: (item.change_1h || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                                    {(item.change_1h || 0) >= 0 ? '+' : ''}{(item.change_1h || 0).toFixed(2)}%
                                </td>
                                <td>{(item.volume || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td>
                                    <span className={`${styles.badge} ${(item.change_1h || 0) >= 0 ? styles.bullish : styles.bearish}`}>
                                        {(item.change_1h || 0) >= 0 ? '상승' : '하락'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (tab === 'risk') {
            return (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>자산</th>
                            <th>현재가</th>
                            <th>변동성 (등락폭)</th>
                            <th>위험도 점수</th>
                            <th>위험 등급</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map(item => (
                            <tr key={item.symbol} style={item.rating === 'Extreme' ? { background: 'rgba(239, 68, 68, 0.05)' } : {}}>
                                <td>
                                    <div className={styles.assetCell}>
                                        <img src={getCoinIconUrl(item.symbol)} alt="" className={styles.coinIcon} />
                                        <span className={styles.symbol}>{item.symbol}</span>
                                    </div>
                                </td>
                                <td>${item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                <td>{item.volatility?.toFixed(2) || '-'}%</td>
                                <td>{item.risk_score?.toFixed(1) || '-'}</td>
                                <td>
                                    <span className={styles[`risk${item.rating}`]}>
                                        {item.rating === 'Low' && '🛡 안정'}
                                        {item.rating === 'Medium' && '⚠️ 보통'}
                                        {item.rating === 'Extreme' && '☢️ 위험'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.title}>
                        스마트 가상자산 스크리너
                    </h2>
                    <p className={styles.subtitle}>실시간 분석 · 1분 갱신</p>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === 'breakout' ? styles.active : ''}`}
                        onClick={() => setTab('breakout')}
                        title="주요 이동평균선(20/50/200일)을 상향 돌파하는 자산 포착"
                    >
                        🚀 돌파 (Breakout)
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'performance' ? styles.active : ''}`}
                        onClick={() => setTab('performance')}
                        title="고점 대비 하락폭이 큰 자산을 찾아 저점 매수 기회 탐색"
                    >
                        💎 저점 (Bottom)
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'risk' ? styles.active : ''}`}
                        onClick={() => setTab('risk')}
                        title="연환산 변동성을 기준으로 리스크 분석 (High Volatility = High Risk)"
                    >
                        ⚠️ 리스크 (Risk)
                    </button>
                </div>
            </div>

            {/* Guide Section */}
            <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
                <span style={{ marginRight: '8px', fontSize: '16px' }}>💡</span>
                {tab === 'breakout' && <span><strong>돌파 전략:</strong> 현재 가격이 20일/50일/200일 이동평균선을 강하게 뚫고 올라가는 '골든 크로스' 직전 혹은 직후의 자산을 찾습니다.</span>}
                {tab === 'performance' && <span><strong>저점 공략:</strong> 역사적 고점(ATH) 대비 하락폭(Drawdown)이 큰 자산을 필터링하여, 펀더멘탈 대비 과매도된 저평가 구간을 탐색합니다.</span>}
                {tab === 'risk' && <span><strong>리스크 분석:</strong> 자산의 가격 변동폭(Standard Deviation)을 연율화하여 계산합니다. 'Extreme' 등급은 하루에도 10% 이상 급등락할 수 있는 고위험 자산입니다.</span>}
                <span style={{ marginTop: '8px', display: 'block', fontSize: '12px', color: '#3b82f6', fontWeight: 500 }}>
                    ※ 분석 대상: 시가총액 상위 30개 주요 암호화폐 (실시간)
                </span>
            </div>


            <div className={styles.summaryGrid}>
                {summaryCards()}
            </div>

            <div className={styles.tableWrapper}>
                {renderTable()}
            </div>
        </div >
    );
}
