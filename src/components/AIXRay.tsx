'use client';

import { useState } from 'react';
import styles from './AIXRay.module.css';

// Asset categories for contextual analysis
type AssetCategory = 'L1' | 'L2' | 'DeFi' | 'AI' | 'Meme' | 'Gaming' | 'DePIN' | 'RWA' | 'Unknown';

interface MetricAnalysis {
    label: string;
    value: string;
    signal: 'bullish' | 'bearish' | 'neutral';
    comment: string;
}

interface AIAnalysis {
    assetName: string;
    category: AssetCategory;
    overallScore: number;
    summary: string;
    metrics: MetricAnalysis[];
    risks: string[];
    opportunities: string[];
    recommendation: string;
}

// Asset category mapping
const ASSET_CATEGORIES: Record<string, AssetCategory> = {
    BTC: 'L1', ETH: 'L1', SOL: 'L1', ADA: 'L1', AVAX: 'L1',
    XRP: 'L1', DOT: 'L1', ATOM: 'L1', NEAR: 'L1', APT: 'L1',
    MATIC: 'L2', ARB: 'L2', OP: 'L2', BASE: 'L2',
    UNI: 'DeFi', AAVE: 'DeFi', MKR: 'DeFi', LDO: 'DeFi', CRV: 'DeFi',
    FET: 'AI', RNDR: 'AI', TAO: 'AI', OCEAN: 'AI',
    DOGE: 'Meme', SHIB: 'Meme', PEPE: 'Meme', WIF: 'Meme',
    AXS: 'Gaming', SAND: 'Gaming', MANA: 'Gaming', IMX: 'Gaming',
    FIL: 'DePIN', AR: 'DePIN', HNT: 'DePIN', IOTX: 'DePIN',
    ONDO: 'RWA', PAXG: 'RWA',
};

// Category-specific metrics
function getCategoryMetrics(category: AssetCategory, symbol: string): MetricAnalysis[] {
    const baseMetrics: Record<AssetCategory, MetricAnalysis[]> = {
        L1: [
            { label: 'MVRV 비율', value: '1.45', signal: 'neutral', comment: '역사적 평균 범위 내, 과열 아님' },
            { label: 'NUPL', value: '0.52', signal: 'bullish', comment: '수익권 투자자 다수로 시장 건전' },
            { label: '활성 주소', value: '+12%', signal: 'bullish', comment: '네트워크 사용량 증가 중' },
            { label: '개발 활동', value: '상위 20%', signal: 'bullish', comment: '활발한 개발이 장기 가치 지지' },
        ],
        L2: [
            { label: 'TVL 성장률', value: '+28%', signal: 'bullish', comment: '자금 유입 가속화' },
            { label: '트랜잭션/일', value: '2.4M', signal: 'bullish', comment: '메인넷 대비 높은 활용도' },
            { label: 'Gas 절감율', value: '95%', signal: 'bullish', comment: 'L1 대비 비용 효율적' },
            { label: '순차 발행량', value: '주의', signal: 'bearish', comment: '향후 18개월 토큰 언락 예정' },
        ],
        DeFi: [
            { label: 'MC/TVL', value: '0.85', signal: 'bullish', comment: '1.0 미만으로 저평가 가능성' },
            { label: 'P/F 비율', value: '12.4', signal: 'neutral', comment: '섹터 평균 수준' },
            { label: '실질 수익률', value: '4.2%', signal: 'bullish', comment: '스테이블한 현금 흐름' },
            { label: '프로토콜 수익', value: '+35%', signal: 'bullish', comment: '지속 가능한 비즈니스 모델' },
        ],
        AI: [
            { label: 'GPU 수요 지수', value: '높음', signal: 'bullish', comment: 'AI 수요 증가와 연동' },
            { label: '파트너십', value: '5개', signal: 'bullish', comment: '주요 테크 기업과 협력' },
            { label: 'FDV/시총', value: '3.2x', signal: 'bearish', comment: '높은 희석 리스크' },
            { label: '토큰 유틸리티', value: '확인됨', signal: 'neutral', comment: '실제 사용 사례 존재' },
        ],
        Meme: [
            { label: '소셜 멘션', value: '+120%', signal: 'bullish', comment: '바이럴 모멘텀 강함' },
            { label: '홀더 집중도', value: '상위 1%: 45%', signal: 'bearish', comment: '고래 의존도 높음' },
            { label: '거래량/시총', value: '28%', signal: 'neutral', comment: '높은 회전율' },
            { label: '커뮤니티 활성도', value: '매우 높음', signal: 'bullish', comment: '강력한 커뮤니티 지지' },
        ],
        Gaming: [
            { label: 'DAU', value: '45K', signal: 'neutral', comment: '일간 활성 사용자 유지' },
            { label: 'MAU 성장률', value: '+8%', signal: 'bullish', comment: '사용자 저변 확대 중' },
            { label: 'NFT 거래량', value: '-15%', signal: 'bearish', comment: '최근 거래량 감소' },
            { label: '게임 출시 일정', value: 'Q2 2025', signal: 'bullish', comment: '신규 콘텐츠 예정' },
        ],
        DePIN: [
            { label: '네트워크 노드', value: '125K', signal: 'bullish', comment: '분산 인프라 성장 중' },
            { label: '프로토콜 수익', value: '$2.1M/월', signal: 'bullish', comment: '실제 수익 창출' },
            { label: '하드웨어 성장', value: '+45%', signal: 'bullish', comment: '물리 인프라 확장' },
            { label: '토큰 인플레이션', value: '8%', signal: 'bearish', comment: '높은 보상 발행률' },
        ],
        RWA: [
            { label: '담보 자산', value: '$1.2B', signal: 'bullish', comment: '실물 자산 기반' },
            { label: '규제 준수', value: '확인됨', signal: 'bullish', comment: '법적 프레임워크 구축' },
            { label: '기관 참여', value: '4개사', signal: 'bullish', comment: '전통 금융 기관 협력' },
            { label: '유동성', value: '제한적', signal: 'bearish', comment: '시장 깊이 부족' },
        ],
        Unknown: [
            { label: '데이터 수집 중', value: '-', signal: 'neutral', comment: '분석 데이터 부족' },
        ],
    };

    return baseMetrics[category] || baseMetrics.Unknown;
}

// Generate contextual AI analysis
function generateAnalysis(symbol: string): AIAnalysis {
    const category = ASSET_CATEGORIES[symbol] || 'Unknown';
    const metrics = getCategoryMetrics(category, symbol);

    const categoryData: Record<AssetCategory, Omit<AIAnalysis, 'metrics'>> = {
        L1: {
            assetName: symbol === 'BTC' ? '비트코인' : symbol === 'ETH' ? '이더리움' : symbol,
            category: 'L1',
            overallScore: 7.8,
            summary: '이 레이어 1 블록체인은 강한 네트워크 효과와 보안성을 보여주고 있습니다. 기관 채택이 증가하고 있으며, 개발자 활동이 활발합니다.',
            risks: ['규제 불확실성', '경쟁 체인 등장', '확장성 한계'],
            opportunities: ['기관 채택 가속화', 'ETF 유입', 'DeFi 생태계 성장'],
            recommendation: '핵심 포트폴리오 자산으로 장기 보유 권장. DCA 전략으로 분할 매수하며, 하락 시 비중 확대 고려.',
        },
        L2: {
            assetName: symbol,
            category: 'L2',
            overallScore: 7.2,
            summary: '레이어 2 솔루션으로 메인넷의 확장성 문제를 해결하고 있습니다. TVL 성장과 에코시스템 확장이 긍정적입니다.',
            risks: ['토큰 언락 일정', 'L1 업그레이드 영향', '경쟁 L2 등장'],
            opportunities: ['기업 채택 증가', '크로스체인 브릿지', '수수료 수익 성장'],
            recommendation: 'L1 대비 더 높은 변동성을 감안한 비중 조절 필요. 언락 일정 전 리스크 관리 권장.',
        },
        DeFi: {
            assetName: symbol,
            category: 'DeFi',
            overallScore: 7.5,
            summary: 'DeFi 프로토콜로 실제 수익을 창출하고 있습니다. MC/TVL 비율이 낮아 저평가 가능성이 있습니다.',
            risks: ['스마트 컨트랙트 위험', '유동성 분산', '규제 리스크'],
            opportunities: ['Real Yield 트렌드', '기관 DeFi 진입', 'RWA 토큰화'],
            recommendation: 'MC/TVL 1.0 미만 시 매수 기회. 프로토콜 수익 추이 모니터링 필수.',
        },
        AI: {
            assetName: symbol,
            category: 'AI',
            overallScore: 6.5,
            summary: 'AI 섹터는 높은 성장 잠재력이 있지만, 토큰 유틸리티와 실제 채택이 핵심입니다.',
            risks: ['높은 FDV', '과대 평가 가능성', '기술 실현 불확실'],
            opportunities: ['AI 산업 성장', '주류 채택', '파트너십 확대'],
            recommendation: '고위험 고수익 섹터. 포트폴리오의 5-10% 이내로 제한하고 분할 매수.',
        },
        Meme: {
            assetName: symbol,
            category: 'Meme',
            overallScore: 4.5,
            summary: '밈코인은 커뮤니티와 소셜 모멘텀에 크게 의존합니다. 펀더멘털보다 심리적 요인이 가격을 결정합니다.',
            risks: ['극심한 변동성', '고래 매도 위험', '지속성 의문'],
            opportunities: ['바이럴 모멘텀', '커뮤니티 성장', '문화적 영향력'],
            recommendation: '투기적 자산. 잃어도 되는 금액만 투자. 이익 실현 구간 미리 설정 필수.',
        },
        Gaming: {
            assetName: symbol,
            category: 'Gaming',
            overallScore: 5.8,
            summary: '게이밍 섹터는 사용자 성장과 게임 품질이 핵심입니다. NFT 시장 침체가 영향을 주고 있습니다.',
            risks: ['사용자 유지율', 'NFT 시장 의존', '게임 품질 리스크'],
            opportunities: ['신규 게임 출시', 'AAA 게임사 진입', '메타버스 통합'],
            recommendation: '게임 출시 일정과 사용자 지표 추이 확인 후 진입. 단기 투기보다 중기 관점.',
        },
        DePIN: {
            assetName: symbol,
            category: 'DePIN',
            overallScore: 6.8,
            summary: 'DePIN은 실물 인프라와 연결된 유틸리티를 제공합니다. 실제 수익 창출 능력이 핵심 가치입니다.',
            risks: ['하드웨어 의존성', '높은 인플레이션', '채택 속도'],
            opportunities: ['클라우드 대안', '엣지 컴퓨팅', 'IoT 통합'],
            recommendation: '장기 성장 잠재력 높음. 토큰 인플레이션 구조 확인 후 투자.',
        },
        RWA: {
            assetName: symbol,
            category: 'RWA',
            overallScore: 7.0,
            summary: 'RWA 토큰은 실물 자산을 기반으로 합니다. 규제 준수와 기관 참여가 신뢰도를 높입니다.',
            risks: ['규제 변화', '유동성 제한', '담보 리스크'],
            opportunities: ['기관 자금 유입', '전통 금융 연결', 'DeFi 통합'],
            recommendation: '안정적 수익 추구 시 적합. 규제 동향 모니터링 필수.',
        },
        Unknown: {
            assetName: symbol,
            category: 'Unknown',
            overallScore: 5.0,
            summary: '이 자산에 대한 충분한 데이터가 없습니다. 추가 분석이 필요합니다.',
            risks: ['데이터 부족', '불확실성'],
            opportunities: ['추가 조사 필요'],
            recommendation: '더 많은 정보를 수집한 후 투자 결정을 내리세요.',
        },
    };

    return {
        ...categoryData[category],
        metrics,
    };
}

interface AIXRayProps {
    symbol: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function AIXRay({ symbol, isOpen, onClose }: AIXRayProps) {
    if (!isOpen) return null;

    const analysis = generateAnalysis(symbol);

    const getSignalColor = (signal: string) => {
        switch (signal) {
            case 'bullish': return 'var(--accent-green)';
            case 'bearish': return 'var(--accent-red)';
            default: return 'var(--accent-yellow)';
        }
    };

    const getSignalText = (signal: string) => {
        switch (signal) {
            case 'bullish': return '긍정';
            case 'bearish': return '부정';
            default: return '중립';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 7) return 'var(--accent-green)';
        if (score >= 5) return 'var(--accent-yellow)';
        return 'var(--accent-red)';
    };

    const getCategoryLabel = (cat: AssetCategory) => {
        const labels: Record<AssetCategory, string> = {
            L1: '레이어 1', L2: '레이어 2', DeFi: '디파이', AI: 'AI',
            Meme: '밈코인', Gaming: '게이밍', DePIN: 'DePIN', RWA: '실물자산', Unknown: '기타',
        };
        return labels[cat];
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={styles.aiBadge}>AI</span>
                        <span className={styles.title}>{analysis.assetName} X-Ray 분석</span>
                        <span className={styles.categoryBadge}>{getCategoryLabel(analysis.category)}</span>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.content}>
                    {/* Score */}
                    <div className={styles.scoreSection}>
                        <div className={styles.scoreCircle} style={{ borderColor: getScoreColor(analysis.overallScore) }}>
                            <span className={styles.scoreValue} style={{ color: getScoreColor(analysis.overallScore) }}>
                                {analysis.overallScore}
                            </span>
                            <span className={styles.scoreMax}>/10</span>
                        </div>
                        <div className={styles.scoreLabel}>종합 점수</div>
                    </div>

                    {/* Summary */}
                    <div className={styles.summary}>
                        <p>{analysis.summary}</p>
                    </div>

                    {/* Metrics */}
                    <div className={styles.metricsSection}>
                        <h4 className={styles.sectionTitle}>{getCategoryLabel(analysis.category)} 핵심 지표</h4>
                        <div className={styles.metricsList}>
                            {analysis.metrics.map((metric, index) => (
                                <div key={index} className={styles.metricItem}>
                                    <div className={styles.metricHeader}>
                                        <span className={styles.metricLabel}>{metric.label}</span>
                                        <span
                                            className={styles.signalBadge}
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
                    </div>

                    {/* Risks & Opportunities */}
                    <div className={styles.riskOppSection}>
                        <div className={styles.riskOppColumn}>
                            <h4 className={styles.sectionTitle} style={{ color: 'var(--accent-red)' }}>리스크</h4>
                            <ul className={styles.riskList}>
                                {analysis.risks.map((risk, i) => (
                                    <li key={i}>{risk}</li>
                                ))}
                            </ul>
                        </div>
                        <div className={styles.riskOppColumn}>
                            <h4 className={styles.sectionTitle} style={{ color: 'var(--accent-green)' }}>기회</h4>
                            <ul className={styles.oppList}>
                                {analysis.opportunities.map((opp, i) => (
                                    <li key={i}>{opp}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Recommendation */}
                    <div className={styles.recommendation}>
                        <h4 className={styles.sectionTitle}>AI 투자 의견</h4>
                        <p>{analysis.recommendation}</p>
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
