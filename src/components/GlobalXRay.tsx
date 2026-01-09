'use client';

import { useState } from 'react';
import styles from './GlobalXRay.module.css';

interface MarketAnalysis {
    overallScore: number;
    marketPhase: string;
    summary: string;
    sectorAnalysis: {
        name: string;
        signal: 'bullish' | 'bearish' | 'neutral';
        score: number;
        insight: string;
    }[];
    keyMetrics: {
        label: string;
        value: string;
        signal: 'bullish' | 'bearish' | 'neutral';
        comment: string;
    }[];
    risks: string[];
    opportunities: string[];
    recommendation: string;
}

const MARKET_ANALYSIS: MarketAnalysis = {
    overallScore: 7.2,
    marketPhase: '초기 강세장',
    summary: '현재 암호화폐 시장은 기관 자금 유입과 ETF 승인 효과로 강세 국면에 진입하고 있습니다. BTC가 시장을 주도하고 있으며, 알트코인 로테이션이 시작되는 단계입니다. 온체인 지표들은 건전한 축적 패턴을 보여주고 있습니다.',
    sectorAnalysis: [
        { name: '레이어 1', signal: 'bullish', score: 8.1, insight: 'BTC, ETH 주도로 강세. 기관 채택 가속화.' },
        { name: '레이어 2', signal: 'neutral', score: 6.5, insight: '토큰 언락 압력 주의. TVL 성장은 긍정적.' },
        { name: 'DeFi', signal: 'bullish', score: 7.8, insight: 'Real Yield 프로토콜 강세. TVL 회복 중.' },
        { name: 'AI', signal: 'neutral', score: 6.2, insight: 'FDV 대비 고평가 우려. 파트너십 확대 중.' },
        { name: 'Meme', signal: 'bearish', score: 4.5, insight: '과열 조정 기대. 선별적 접근 필요.' },
        { name: 'Gaming', signal: 'neutral', score: 5.8, insight: 'NFT 시장 침체 영향. 신규 게임 출시 대기.' },
    ],
    keyMetrics: [
        { label: 'BTC 도미넌스', value: '54.2%', signal: 'neutral', comment: '알트코인 로테이션 시작 신호' },
        { label: '총 스테이블코인 시총', value: '$200B', signal: 'bullish', comment: '유동성 풍부, 매수 대기 자금' },
        { label: '거래소 BTC 잔고', value: '-2.8% (30일)', signal: 'bullish', comment: '장기 보유 성향 강화' },
        { label: 'ETF 순유입', value: '+$1.2B (5일)', signal: 'bullish', comment: '기관 자금 지속 유입' },
        { label: '펀딩 레이트', value: '0.012%', signal: 'neutral', comment: '적정 수준, 과열 아님' },
        { label: '공포·탐욕 지수', value: '72 (탐욕)', signal: 'neutral', comment: '주의 필요하나 극단적이지 않음' },
    ],
    risks: [
        '단기 과열 조정 가능성 (공포·탐욕 72)',
        '규제 불확실성 (글로벌 정책 변화)',
        '거시경제 변수 (금리, 인플레이션)',
        'L2 토큰 대규모 언락 일정',
        '밈코인 섹터 거품 붕괴 위험',
    ],
    opportunities: [
        'BTC ETF 옵션 거래 승인 호재',
        'DeFi Real Yield 섹터 저평가',
        '기관 채택 가속화 (은행, 기업)',
        'L1 생태계 확장 (솔라나, 앱토스)',
        'RWA 토큰화 성장 초기 단계',
    ],
    recommendation: '현재 시장은 강세 초입 국면입니다. 포트폴리오의 핵심은 BTC/ETH 중심으로 유지하되, DeFi Real Yield 프로토콜과 검증된 L1에 선별적 비중을 배분하세요. 밈코인과 고FDV AI 토큰은 비중을 줄이고, L2 언락 일정에 따른 리밸런싱을 권장합니다.',
};

interface GlobalXRayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GlobalXRayButton({ onClick }: { onClick: () => void }) {
    return (
        <button className={styles.xrayButton} onClick={onClick}>
            <span className={styles.xrayIcon}>🔮</span>
            <span className={styles.xrayLabel}>AI 시장 분석</span>
        </button>
    );
}

export default function GlobalXRay({ isOpen, onClose }: GlobalXRayProps) {
    if (!isOpen) return null;

    const getSignalColor = (signal: string) => {
        switch (signal) {
            case 'bullish': return 'var(--accent-green)';
            case 'bearish': return 'var(--accent-red)';
            default: return 'var(--accent-yellow)';
        }
    };

    const getSignalText = (signal: string) => {
        switch (signal) {
            case 'bullish': return '강세';
            case 'bearish': return '약세';
            default: return '중립';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 7) return 'var(--accent-green)';
        if (score >= 5) return 'var(--accent-yellow)';
        return 'var(--accent-red)';
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={styles.aiBadge}>AI</span>
                        <span className={styles.title}>글로벌 시장 X-Ray 분석</span>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.content}>
                    {/* Overall Score & Phase */}
                    <div className={styles.overviewSection}>
                        <div className={styles.scoreBox}>
                            <div className={styles.scoreCircle} style={{ borderColor: getScoreColor(MARKET_ANALYSIS.overallScore) }}>
                                <span className={styles.scoreValue} style={{ color: getScoreColor(MARKET_ANALYSIS.overallScore) }}>
                                    {MARKET_ANALYSIS.overallScore}
                                </span>
                                <span className={styles.scoreMax}>/10</span>
                            </div>
                            <span className={styles.scoreLabel}>종합 점수</span>
                        </div>
                        <div className={styles.phaseBox}>
                            <span className={styles.phaseLabel}>현재 사이클</span>
                            <span className={styles.phaseValue}>{MARKET_ANALYSIS.marketPhase}</span>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className={styles.summary}>
                        <p>{MARKET_ANALYSIS.summary}</p>
                    </div>

                    {/* Sector Analysis */}
                    <div className={styles.sectionTitle}>섹터별 분석</div>
                    <div className={styles.sectorGrid}>
                        {MARKET_ANALYSIS.sectorAnalysis.map((sector) => (
                            <div key={sector.name} className={styles.sectorCard}>
                                <div className={styles.sectorHeader}>
                                    <span className={styles.sectorName}>{sector.name}</span>
                                    <span
                                        className={styles.sectorSignal}
                                        style={{ color: getSignalColor(sector.signal) }}
                                    >
                                        {getSignalText(sector.signal)}
                                    </span>
                                </div>
                                <div className={styles.sectorScore}>
                                    <div className={styles.scoreBar}>
                                        <div
                                            className={styles.scoreFill}
                                            style={{
                                                width: `${sector.score * 10}%`,
                                                background: getScoreColor(sector.score)
                                            }}
                                        />
                                    </div>
                                    <span style={{ color: getScoreColor(sector.score) }}>{sector.score}</span>
                                </div>
                                <p className={styles.sectorInsight}>{sector.insight}</p>
                            </div>
                        ))}
                    </div>

                    {/* Key Metrics */}
                    <div className={styles.sectionTitle}>핵심 지표</div>
                    <div className={styles.metricsGrid}>
                        {MARKET_ANALYSIS.keyMetrics.map((metric) => (
                            <div key={metric.label} className={styles.metricItem}>
                                <div className={styles.metricHeader}>
                                    <span className={styles.metricLabel}>{metric.label}</span>
                                    <span
                                        className={styles.metricSignal}
                                        style={{
                                            background: `${getSignalColor(metric.signal)}20`,
                                            color: getSignalColor(metric.signal)
                                        }}
                                    >
                                        {getSignalText(metric.signal)}
                                    </span>
                                </div>
                                <div className={styles.metricValue}>{metric.value}</div>
                                <div className={styles.metricComment}>{metric.comment}</div>
                            </div>
                        ))}
                    </div>

                    {/* Risks & Opportunities */}
                    <div className={styles.riskOppSection}>
                        <div className={styles.riskColumn}>
                            <div className={styles.sectionTitle} style={{ color: 'var(--accent-red)' }}>주요 리스크</div>
                            <ul>
                                {MARKET_ANALYSIS.risks.map((risk, i) => (
                                    <li key={i}>{risk}</li>
                                ))}
                            </ul>
                        </div>
                        <div className={styles.oppColumn}>
                            <div className={styles.sectionTitle} style={{ color: 'var(--accent-green)' }}>투자 기회</div>
                            <ul>
                                {MARKET_ANALYSIS.opportunities.map((opp, i) => (
                                    <li key={i}>{opp}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Recommendation */}
                    <div className={styles.recommendation}>
                        <div className={styles.sectionTitle}>AI 투자 전략</div>
                        <p>{MARKET_ANALYSIS.recommendation}</p>
                    </div>

                    {/* Disclaimer */}
                    <div className={styles.disclaimer}>
                        본 분석은 AI가 생성한 참고용 정보이며, 투자 조언이 아닙니다. 모든 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
                    </div>
                </div>
            </div>
        </div>
    );
}
