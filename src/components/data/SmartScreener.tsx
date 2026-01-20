'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { TrendingUp, AlertTriangle, ArrowDown, ArrowUp, Activity, Info, BarChart2, Shield } from 'lucide-react';
import styles from './SmartScreener.module.css';

interface TickerData {
    symbol: string;
    price: number;
    change_24h?: number;
    change_1h?: number;
    volume?: number;
    is_breakout?: boolean;
    is_fresh_breakout?: boolean;
    volatility?: number;
    risk_score?: number;
    rating?: 'Low' | 'Medium' | 'Extreme';
    rsi?: number;
    rvol?: number;
    ai_insight?: string;
    drawdown?: number;
    // Enhanced signal fields
    signal_type?: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
    signal_strength?: number; // 1-5
    signal_reason?: string;
    macd_signal?: string;
    bb_position?: number;
    support?: number;
    resistance?: number;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Helper for icons
function getCoinIconUrl(symbol: string): string {
    let clean = symbol.toUpperCase();
    clean = clean.replace('KRW-', '').replace('-KRW', '');
    clean = clean.replace('USDT-', '').replace('-USDT', '');
    clean = clean.replace('BTC-', '').replace('-BTC', '');
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

    // Price formatting helper - Enhanced for precision
    const formatPrice = (price: number) => {
        if (!price) return '0';
        if (price < 1) return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
        if (price < 100) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    // Sorting & Filtering State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'change_1h', direction: 'desc' });
    const [showGainersOnly, setShowGainersOnly] = useState(false);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    // Signal Strength Dots Helper
    const renderStrengthDots = (strength: number) => {
        const filled = Math.min(5, Math.max(1, strength));
        return (
            <span style={{ fontSize: '10px', letterSpacing: '1px', marginLeft: '4px' }}>
                {'●'.repeat(filled)}{'○'.repeat(5 - filled)}
            </span>
        );
    };

    // Enhanced Signal Badge Helper
    const renderSignalBadge = (item: any) => {
        const signalType = item.signal_type || 'HOLD';
        const strength = item.signal_strength || 1;
        const reason = item.signal_reason || '';

        // Color coding by action type
        const styleMap: Record<string, { bg: string; color: string; icon: any }> = {
            'BUY': { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669', icon: TrendingUp },
            'SELL': { bg: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', icon: ArrowDown },
            'WATCH': { bg: 'rgba(245, 158, 11, 0.15)', color: '#d97706', icon: Activity },
            'HOLD': { bg: '#f3f4f6', color: '#6b7280', icon: Shield }
        };

        const badgeStyle = styleMap[signalType] || styleMap['HOLD'];
        const Icon = badgeStyle.icon;

        const typeLabels: Record<string, string> = {
            'BUY': '매수',
            'SELL': '매도',
            'WATCH': '관망',
            'HOLD': '보류'
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '12px',
                        fontSize: '12px', fontWeight: 700,
                        backgroundColor: badgeStyle.bg, color: badgeStyle.color,
                        whiteSpace: 'nowrap'
                    }}>
                        {Icon && <Icon size={12} />}
                        {typeLabels[signalType]}
                    </span>
                    <span style={{ color: badgeStyle.color, fontSize: '11px' }}>
                        {renderStrengthDots(strength)}
                    </span>
                </div>
                {reason && (
                    <span style={{
                        fontSize: '11px', color: '#6b7280', fontWeight: 500,
                        whiteSpace: 'nowrap', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                        {reason}
                    </span>
                )}
            </div>
        );
    };

    // Legacy Trend Badge Helper (for backward compatibility)
    const renderTrendBadge = (item: any) => {
        // Use new signal-based rendering if available
        if (item.signal_type) {
            return renderSignalBadge(item);
        }

        // Fallback to old text-based logic
        const text = item.ai_insight || '-';
        const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '');

        let badgeStyle = { bg: '#f3f4f6', color: '#4b5563', icon: null as any };
        let reason = '';

        if (cleanText.includes('상승') || cleanText.includes('Strong') || cleanText.includes('Bull')) {
            badgeStyle = { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669', icon: TrendingUp };
            if (item.rsi) reason += `RSI ${item.rsi}`;
            if (item.rvol) reason += `${reason ? ' · ' : ''}Vol ${item.rvol.toFixed(1)}x`;
        } else if (cleanText.includes('조정') || cleanText.includes('Correction') || cleanText.includes('Down')) {
            badgeStyle = { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', icon: ArrowDown };
            if (item.drawdown) reason += `MDD ${item.drawdown.toFixed(1)}%`;
        } else if (cleanText.includes('돌파') || cleanText.includes('Breakout')) {
            badgeStyle = { bg: 'rgba(245, 158, 11, 0.15)', color: '#d97706', icon: Activity };
            if (item.price) reason += `₩${formatPrice(item.price)}`;
        } else if (cleanText.includes('과매도') || cleanText.includes('Value') || cleanText.includes('저평가')) {
            badgeStyle = { bg: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', icon: Shield };
            if (item.rsi) reason += `RSI ${item.rsi}`;
        }

        const Icon = badgeStyle.icon;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 8px', borderRadius: '12px',
                    fontSize: '11px', fontWeight: 600,
                    backgroundColor: badgeStyle.bg, color: badgeStyle.color,
                    whiteSpace: 'nowrap'
                }}>
                    {Icon && <Icon size={10} />}
                    {cleanText}
                </span>
                {reason && <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500, whiteSpace: 'nowrap' }}>{reason}</span>}
            </div>
        );
    };

    const renderSkeleton = () => (
        <div className={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={styles.skeletonRow} />
            ))}
            <div className={styles.skeletonText}>데이터 분석 중...</div>
        </div>
    );

    const summaryCards = () => {
        if (!data?.data) return null;
        const list = data.data as TickerData[];

        if (tab === 'breakout') {
            // Enhanced counts based on signal_type and signal_strength
            const strongBuySignals = list.filter(i => i.signal_type === 'BUY' && (i.signal_strength || 0) >= 4).length;
            const warningSignals = list.filter(i => i.signal_type === 'SELL' || (i.signal_type === 'WATCH' && (i.signal_strength || 0) >= 3)).length;
            const bestOpportunity = [...list].filter(i => i.signal_type === 'BUY').sort((a, b) => (b.signal_strength || 0) - (a.signal_strength || 0))[0];

            return (
                <>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <TrendingUp size={14} className={styles.cardIcon} color="#10b981" />
                            <span className={styles.cardTitle}>강력 매수 신호</span>
                        </div>
                        <span className={styles.cardValue}>{strongBuySignals}</span>
                        <span className={styles.cardDesc}>신호 강도 4-5점</span>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <AlertTriangle size={14} className={styles.cardIcon} color="#ef4444" />
                            <span className={styles.cardTitle}>주의 신호</span>
                        </div>
                        <span className={styles.cardValue}>{warningSignals}</span>
                        <span className={styles.cardDesc}>매도/관망 권고</span>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <BarChart2 size={14} className={styles.cardIcon} color="#3b82f6" />
                            <span className={styles.cardTitle}>최고 기회</span>
                        </div>
                        <span className={styles.cardValue}>{bestOpportunity?.symbol || '-'}</span>
                        <span className={styles.cardDesc}>{bestOpportunity?.signal_reason?.slice(0, 20) || '분석 중...'}</span>
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
                        <div className={styles.cardHeader}>
                            <ArrowUp size={14} className={styles.cardIcon} color="#10b981" />
                            <span className={styles.cardTitle}>강세 코인 (+5%↑)</span>
                        </div>
                        <span className={styles.cardValue}>{upCount}</span>
                        <span className={styles.cardDesc}>모멘텀 강세</span>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <ArrowDown size={14} className={styles.cardIcon} color="#ef4444" />
                            <span className={styles.cardTitle}>약세 코인 (-5%↓)</span>
                        </div>
                        <span className={styles.cardValue}>{downCount}</span>
                        <span className={styles.cardDesc}>단기 조정 중</span>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <Activity size={14} className={styles.cardIcon} color="#3b82f6" />
                            <span className={styles.cardTitle}>거래 대장</span>
                        </div>
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
                        <div className={styles.cardHeader}>
                            <Shield size={14} className={styles.cardIcon} color="#10b981" />
                            <span className={styles.cardTitle}>안정형 자산</span>
                        </div>
                        <span className={styles.cardValue}>{lowRisk}</span>
                        <span className={styles.cardDesc}>변동성 3% 미만</span>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <AlertTriangle size={14} className={styles.cardIcon} color="#ef4444" />
                            <span className={styles.cardTitle}>고위험 주의</span>
                        </div>
                        <span className={styles.cardValue}>{extremeRisk}</span>
                        <span className={styles.cardDesc}>변동성 7% 초과</span>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <Activity size={14} className={styles.cardIcon} color="#f59e0b" />
                            <span className={styles.cardTitle}>최고 변동성</span>
                        </div>
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

        let list = [...(data.data as TickerData[])];

        // Filter: Price > 0
        list = list.filter(item => item.price > 0);

        if (showGainersOnly) {
            list = list.filter(item => (item.change_1h || 0) > 0);
        }

        // Sort
        list.sort((a: any, b: any) => {
            const aValue = a[sortConfig.key] || 0;
            const bValue = b[sortConfig.key] || 0;
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        const SortIcon = ({ column }: { column: string }) => {
            if (sortConfig.key !== column) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>⇅</span>;
            return sortConfig.direction === 'asc'
                ? <ArrowUp size={12} style={{ marginLeft: '4px', color: '#3b82f6', display: 'inline' }} />
                : <ArrowDown size={12} style={{ marginLeft: '4px', color: '#3b82f6', display: 'inline' }} />;
        };

        const FilterControls = () => (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <input
                        type="checkbox"
                        checked={showGainersOnly}
                        onChange={(e) => setShowGainersOnly(e.target.checked)}
                        style={{ marginRight: '6px' }}
                    />
                    상승 코인만 보기 (+Return Only)
                </label>
            </div>
        );

        if (tab === 'breakout') {
            return (
                <>
                    <FilterControls />
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>자산</th>
                                <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>현재가 <SortIcon column="price" /></th>
                                <th onClick={() => handleSort('signal_strength')} style={{ cursor: 'pointer' }}>신호 <SortIcon column="signal_strength" /></th>
                                <th onClick={() => handleSort('rsi')} style={{ cursor: 'pointer' }}>RSI <SortIcon column="rsi" /></th>
                                <th onClick={() => handleSort('rvol')} style={{ cursor: 'pointer' }}>거래량 <SortIcon column="rvol" /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(item => {
                                const isHighConfidence = item.signal_type === 'BUY' && (item.signal_strength || 0) >= 4;
                                const isWarning = item.signal_type === 'SELL';
                                return (
                                    <tr
                                        key={item.symbol}
                                        style={{
                                            background: isHighConfidence
                                                ? 'rgba(16, 185, 129, 0.05)'
                                                : isWarning
                                                    ? 'rgba(239, 68, 68, 0.03)'
                                                    : undefined,
                                            borderLeft: isHighConfidence ? '3px solid #10b981' : isWarning ? '3px solid #ef4444' : undefined
                                        }}
                                    >
                                        <td>
                                            <div className={styles.assetCell}>
                                                <img src={getCoinIconUrl(item.symbol)} alt="" className={styles.coinIcon} />
                                                <span className={styles.symbol}>{item.symbol}</span>
                                                {item.is_fresh_breakout && (
                                                    <span className={styles.badge} style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <TrendingUp size={10} /> 돌파
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>${formatPrice(item.price)}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            {renderTrendBadge(item)}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                                background: (item.rsi || 50) > 70 ? '#fee2e2' : (item.rsi || 50) < 30 ? '#d1fae5' : '#f3f4f6',
                                                color: (item.rsi || 50) > 70 ? '#ef4444' : (item.rsi || 50) < 30 ? '#059669' : '#6b7280'
                                            }}>
                                                {item.rsi || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                color: (item.rvol || 1) > 1.5 ? '#059669' : '#6b7280',
                                                fontWeight: (item.rvol || 1) > 1.5 ? 600 : 400
                                            }}>
                                                {item.rvol ? `x${item.rvol.toFixed(1)}` : '-'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </>
            );
        }

        if (tab === 'performance') {
            return (
                <>
                    <FilterControls />
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>자산</th>
                                <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>현재가 <SortIcon column="price" /></th>
                                <th onClick={() => handleSort('drawdown')} style={{ cursor: 'pointer' }}>고점 대비 할인 (MDD) <SortIcon column="drawdown" /></th>
                                <th onClick={() => handleSort('rsi')} style={{ cursor: 'pointer' }}>RSI (14) <SortIcon column="rsi" /></th>
                                <th onClick={() => handleSort('ai_insight')} style={{ cursor: 'pointer' }}>저평가 분석 <SortIcon column="ai_insight" /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(item => (
                                <tr key={item.symbol}>
                                    <td>
                                        <div className={styles.assetCell}>
                                            <img src={getCoinIconUrl(item.symbol)} alt="" className={styles.coinIcon} />
                                            <span className={styles.symbol}>{item.symbol}</span>
                                        </div>
                                    </td>
                                    <td>${formatPrice(item.price)}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ flex: 1, height: '6px', background: '#e5e7eb', borderRadius: '3px', maxWidth: '60px' }}>
                                                <div style={{
                                                    width: `${Math.min(Math.abs(item.drawdown || 0), 100)}%`,
                                                    height: '100%', background: '#10b981', borderRadius: '3px'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                                                {item.drawdown?.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                            background: (item.rsi || 50) > 70 ? '#fee2e2' : (item.rsi || 50) < 30 ? '#d1fae5' : '#f3f4f6',
                                            color: (item.rsi || 50) > 70 ? '#ef4444' : (item.rsi || 50) < 30 ? '#059669' : '#6b7280'
                                        }}>
                                            {item.rsi || '-'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        {renderTrendBadge(item)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            );
        }

        if (tab === 'risk') {
            return (
                <>
                    <FilterControls />
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>자산</th>
                                <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>현재가 <SortIcon column="price" /></th>
                                <th onClick={() => handleSort('volatility')} style={{ cursor: 'pointer' }}>변동성 (연율, %) <SortIcon column="volatility" /></th>
                                <th onClick={() => handleSort('rating')} style={{ cursor: 'pointer' }}>위험 등급 <SortIcon column="rating" /></th>
                                <th>상태</th>
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
                                    <td>${formatPrice(item.price)}</td>
                                    <td>{item.volatility?.toFixed(2) || '-'}%</td>
                                    <td>{item.risk_score?.toFixed(1) || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} className={styles[`risk${item.rating}`]}>
                                            {item.rating === 'Low' && <><Shield size={12} /> 안정</>}
                                            {item.rating === 'Medium' && <><AlertTriangle size={12} /> 보통</>}
                                            {item.rating === 'Extreme' && <><Activity size={12} /> 위험</>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            );
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.title}>
                        <TrendingUp size={20} style={{ color: '#3b82f6' }} />
                        가상자산 실전 전략 분석
                    </h2>
                    <p className={styles.subtitle}>Top 30 코인 돌파·저점·리스크 진단</p>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === 'breakout' ? styles.active : ''}`}
                        onClick={() => setTab('breakout')}
                    >
                        돌파 (Breakout)
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'performance' ? styles.active : ''}`}
                        onClick={() => setTab('performance')}
                    >
                        저점 (Bottom)
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'risk' ? styles.active : ''}`}
                        onClick={() => setTab('risk')}
                    >
                        리스크 (Risk)
                    </button>
                </div>
            </div>

            {/* Compact Legend Bar */}
            <div className={styles.legendBar}>
                <Info size={14} style={{ color: '#6b7280' }} />
                {tab === 'breakout' && (
                    <>
                        <div className={styles.legendItem}>
                            <strong>RSI:</strong> 50~70 (상승여력)
                        </div>
                        <div className={styles.legendItem}>
                            <strong>RVol:</strong> 1.5x↑ (거래급증)
                        </div>
                        <div className={styles.legendItem}>
                            <strong>Breakout:</strong> 주요 저항 돌파
                        </div>
                    </>
                )}
                {tab === 'performance' && (
                    <>
                        <div className={styles.legendItem}>
                            <strong>MDD:</strong> 고점대비낙폭
                        </div>
                        <div className={styles.legendItem}>
                            <strong>RSI:</strong> 30↓ (과매도)
                        </div>
                        <div className={styles.legendItem}>
                            <strong>Insight:</strong> 저평가 분석
                        </div>
                    </>
                )}
                {tab === 'risk' && (
                    <>
                        <div className={styles.legendItem}>
                            <strong>Volatility:</strong> 연환산 변동성
                        </div>
                        <div className={styles.legendItem}>
                            <strong>Risk Sco:</strong> 0-10 (10=위험)
                        </div>
                    </>
                )}
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
