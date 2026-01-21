'use client';

import { useState, Fragment } from 'react';
import useSWR from 'swr';
import {
    TrendingUp, AlertTriangle, ArrowDown, ArrowUp, Activity,
    Info, BarChart2, Shield, Target, Zap, Clock, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import styles from './SmartScreener.module.css';

interface ActionGuide {
    action: string;
    entry_zone: string;
    stop_loss: string;
    target: string;
    guide: string;
}

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
    signal_type?: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
    signal_strength?: number;
    signal_reason?: string;
    macd_signal?: string;
    bb_position?: number;
    support?: number;
    resistance?: number;
    rr_ratio?: number;
    grade_data?: {
        grade: string;
        score: number;
        label: string;
        reasons: string[];
    };
    action_guide?: ActionGuide | string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

function getCoinIconUrl(symbol: string): string {
    let clean = symbol.toUpperCase();
    clean = clean.replace('KRW-', '').replace('-KRW', '');
    clean = clean.replace('USDT-', '').replace('-USDT', '');
    clean = clean.replace('BTC-', '').replace('-BTC', '');
    return `https://assets.coincap.io/assets/icons/${clean.toLowerCase()}@2x.png`;
}

const formatPrice = (price: number) => {
    if (!price) return '0';
    if (price < 1) return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    if (price < 100) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const SIGNAL_LABELS: Record<string, string> = {
    'BUY': '매수',
    'SELL': '매도',
    'WATCH': '관망',
    'HOLD': '보류'
};

const SIGNAL_STYLES: Record<string, { className: string; Icon: any }> = {
    'BUY': { className: 'signalBuy', Icon: TrendingUp },
    'SELL': { className: 'signalSell', Icon: ArrowDown },
    'WATCH': { className: 'signalWatch', Icon: Eye },
    'HOLD': { className: 'signalHold', Icon: Clock }
};

export default function SmartScreener() {
    const [tab, setTab] = useState<'breakout' | 'performance' | 'risk'>('breakout');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'signal_strength', direction: 'desc' });
    const [showGainersOnly, setShowGainersOnly] = useState(false);
    const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

    const apiUrl =
        tab === 'breakout' ? '/api/python/screener/breakout' :
            tab === 'performance' ? '/api/python/screener/price-performance' :
                '/api/python/screener/risk';

    const { data, isLoading, error } = useSWR(apiUrl, fetcher, {
        refreshInterval: 60000,
        shouldRetryOnError: true,
        loadingTimeout: 10000
    });

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const toggleExpand = (symbol: string) => {
        setExpandedSymbol(current => current === symbol ? null : symbol);
    };

    // --- Components ---

    const StrengthDots = ({ strength, color }: { strength: number; color: string }) => {
        const filled = Math.min(5, Math.max(1, strength));
        return (
            <span className={styles.strengthDots}>
                {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className={`${styles.strengthDot} ${i <= filled ? styles.filled : ''}`} style={i <= filled ? { background: color } : undefined} />
                ))}
            </span>
        );
    };

    const SignalBadge = ({ item }: { item: TickerData }) => {
        const signalType = item.signal_type || 'HOLD';
        const strength = item.signal_strength || 1;
        const { className, Icon } = SIGNAL_STYLES[signalType] || SIGNAL_STYLES['HOLD'];
        const signalClass = styles[className as keyof typeof styles];

        const colorMap: Record<string, string> = { 'BUY': '#34d399', 'SELL': '#f87171', 'WATCH': '#fbbf24', 'HOLD': '#9ca3af' };

        return (
            <div className={`${styles.signalBadge} ${signalClass}`}>
                <Icon size={12} />
                <span>{SIGNAL_LABELS[signalType]}</span>
                <StrengthDots strength={strength} color={colorMap[signalType]} />
            </div>
        );
    };

    const RSIBadge = ({ rsi }: { rsi: number | undefined }) => {
        if (!rsi) return <span>-</span>;
        let className = styles.rsiNeutral;
        if (rsi < 30) className = styles.rsiOversold;
        else if (rsi > 70) className = styles.rsiOverbought;
        return <span className={`${styles.rsiBadge} ${className}`}>{rsi.toFixed(0)}</span>;
    };

    const RiskRewardGauge = ({ rr }: { rr: number }) => {
        const percentage = Math.min(100, Math.max(0, (rr / 5) * 100));
        const color = rr >= 3 ? '#10b981' : rr >= 1.5 ? '#3b82f6' : '#9ca3af';
        return (
            <div className={styles.rrContainer}>
                <div className={styles.rrHeader}>
                    <span className={styles.rrLabel}>R/R</span>
                    <span style={{ color, fontWeight: 700 }}>1:{rr.toFixed(1)}</span>
                </div>
                <div className={styles.rrTrack}>
                    <div className={styles.rrBar} style={{ width: `${percentage}%`, backgroundColor: color }} />
                </div>
            </div>
        );
    };

    const ActionGuidePanel = ({ item }: { item: TickerData }) => {
        if (!item.action_guide || typeof item.action_guide === 'string') {
            return <div className={styles.expandedContent}>{item.signal_reason || '분석 정보가 없습니다.'}</div>;
        }
        const guide = item.action_guide as ActionGuide;
        const isBuy = item.signal_type === 'BUY';

        return (
            <div className={`${styles.expandedContent} ${isBuy ? styles.expandedBuy : styles.expandedBlue}`}>
                <div className={styles.guideText}>
                    <Info size={16} style={{ marginTop: 2 }} />
                    <p>"{guide.guide}"</p>
                </div>
                <div className={styles.strategyRow}>
                    <div className={styles.strategyBlock}>
                        <span className={styles.stLabel}>진입</span>
                        <span className={styles.stValue}>{guide.entry_zone ? `$${guide.entry_zone}` : '-'}</span>
                    </div>
                    <div className={styles.strategyBlock}>
                        <span className={styles.stLabel}>목표</span>
                        <span className={styles.stValueTarget}>{guide.target ? `$${guide.target}` : '-'}</span>
                    </div>
                    <div className={styles.strategyBlock}>
                        <span className={styles.stLabel}>손절</span>
                        <span className={styles.stValueLoss}>{guide.stop_loss ? `$${guide.stop_loss}` : '-'}</span>
                    </div>
                    <div className={styles.strategyBlock} style={{ minWidth: 100 }}>
                        {item.rr_ratio && <RiskRewardGauge rr={item.rr_ratio} />}
                    </div>
                </div>
            </div>
        );
    };

    // --- Renderers ---

    const renderSkeleton = () => (
        <div className={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className={styles.skeletonRow} />)}
            <div className={styles.skeletonText}>시장 데이터를 분석하고 있습니다...</div>
        </div>
    );

    const summaryCards = () => {
        if (!data?.data) return null;
        const list = data.data as TickerData[];

        if (tab === 'breakout') {
            const strongBuy = list.filter(i => i.is_fresh_breakout || (i.signal_type === 'BUY' && (i.signal_strength || 0) >= 4)).length;
            const watchList = list.filter(i => i.signal_type === 'WATCH').length;
            return (
                <div className={styles.summaryGrid}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><Zap size={16} color="#fbbf24" /><span className={styles.cardTitle}>돌파/강세</span></div>
                        <span className={styles.cardValue}>{strongBuy}</span>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><Target size={16} color="#3b82f6" /><span className={styles.cardTitle}>관심 종목</span></div>
                        <span className={styles.cardValue}>{watchList}</span>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><Activity size={16} color="#10b981" /><span className={styles.cardTitle}>분석 완료</span></div>
                        <span className={styles.cardValue}>{list.length}</span>
                    </div>
                </div>
            );
        }
        // ... (다른 탭 요약은 간소화 or 기존 유지)
        return null;
    };

    const renderTable = () => {
        if (isLoading) return renderSkeleton();

        if (error || !data || data.status === 'error' || !Array.isArray(data.data)) {
            return (
                <div className={styles.loading}>
                    <AlertTriangle size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
                    <p>데이터 로드 실패</p>
                    <button onClick={() => window.location.reload()} className={styles.retryBtn}>Retry</button>
                </div>
            );
        }

        let list = [...(data.data as TickerData[])];
        list = list.filter(item => item.price > 0);
        if (showGainersOnly) list = list.filter(item => (item.change_1h || 0) > 0);

        // Sorting
        list.sort((a: any, b: any) => {
            const aVal = a[sortConfig.key] || 0;
            const bVal = b[sortConfig.key] || 0;
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return (
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>자산</th>
                        <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>가격</th>
                        <th onClick={() => handleSort('change_24h')} style={{ cursor: 'pointer' }}>변동(24h)</th>
                        <th onClick={() => handleSort('signal_strength')} style={{ cursor: 'pointer' }}>신호</th>
                        <th onClick={() => handleSort('rsi')} style={{ cursor: 'pointer' }}>RSI</th>
                        {tab === 'breakout' && <th>거래량</th>}
                        {tab === 'risk' && <th>변동성</th>}
                        {tab === 'performance' && <th>낙폭</th>}
                    </tr>
                </thead>
                <tbody>
                    {list.map(item => {
                        const isExpanded = expandedSymbol === item.symbol;
                        const rowClass = item.signal_type === 'BUY' && (item.signal_strength || 0) >= 4 ? styles.rowHighConfidence : '';

                        return (
                            <Fragment key={item.symbol}>
                                <tr
                                    onClick={() => toggleExpand(item.symbol)}
                                    className={`${rowClass} ${isExpanded ? styles.rowExpanded : ''} ${styles.clickableRow}`}
                                >
                                    <td style={{ textAlign: 'center' }}>
                                        {isExpanded ? <ChevronUp size={14} color="#60a5fa" /> : <ChevronDown size={14} color="#6b7280" />}
                                    </td>
                                    <td>
                                        <div className={styles.assetCell}>
                                            <img src={getCoinIconUrl(item.symbol)} alt="" className={styles.coinIcon} />
                                            <div>
                                                <div className={styles.symbol}>{item.symbol}</div>
                                                {item.is_fresh_breakout && <span className={styles.breakoutBadge}>돌파</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>${formatPrice(item.price)}</td>
                                    <td>
                                        <span className={(item.change_24h || 0) >= 0 ? styles.textUp : styles.textDown}>
                                            {(item.change_24h || 0) > 0 ? '+' : ''}{(item.change_24h || 0).toFixed(2)}%
                                        </span>
                                    </td>
                                    <td><SignalBadge item={item} /></td>
                                    <td><RSIBadge rsi={item.rsi} /></td>

                                    {tab === 'breakout' && (
                                        <td>
                                            <span className={(item.rvol || 0) > 1.5 ? styles.textUp : ''}>{(item.rvol || 0).toFixed(1)}x</span>
                                        </td>
                                    )}
                                    {tab === 'risk' && <td>{(item.volatility || 0).toFixed(1)}%</td>}
                                    {tab === 'performance' && <td style={{ color: '#ef4444' }}>{(item.drawdown || 0).toFixed(1)}%</td>}
                                </tr>
                                {isExpanded && (
                                    <tr className={styles.detailsRow}>
                                        <td colSpan={8} style={{ padding: 0 }}>
                                            <ActionGuidePanel item={item} />
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.title}>
                        <BarChart2 size={22} style={{ color: '#60a5fa' }} />
                        스마트 스크리너
                    </h2>
                    <p className={styles.subtitle}>AI 기반 실시간 매매 전략 가이드</p>
                </div>
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${tab === 'breakout' ? styles.active : ''}`} onClick={() => setTab('breakout')}>📈 타점 분석</button>
                    <button className={`${styles.tab} ${tab === 'performance' ? styles.active : ''}`} onClick={() => setTab('performance')}>💎 저점 발굴</button>
                    <button className={`${styles.tab} ${tab === 'risk' ? styles.active : ''}`} onClick={() => setTab('risk')}>🛡️ 리스크</button>
                </div>
            </div>

            {summaryCards()}

            <div className={styles.tableWrapper}>
                <div style={{ padding: '10px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#9ca3af' }}>
                        <input type="checkbox" checked={showGainersOnly} onChange={e => setShowGainersOnly(e.target.checked)} style={{ marginRight: 6 }} />
                        상승 코인만 보기
                    </label>
                </div>
                {renderTable()}
            </div>
        </div>
    );
}
