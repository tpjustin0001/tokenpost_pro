'use client';

import { useXRay } from '@/context/XRayContext';
import styles from './XRayOverlay.module.css';

// X-Ray explanations database
const EXPLANATIONS: Record<string, { title: string; titleEn: string; content: string; link: string }> = {
    'metric_spot_volume': {
        title: '현물 거래량',
        titleEn: 'Spot Volume',
        content: '실제 암호화폐를 사고파는 거래의 총량입니다. 시장 유동성과 투자자 관심도를 측정하는 핵심 지표이며, 거래량 증가는 보통 가격 변동 전조 신호입니다.',
        link: '/academy/spot-volume'
    },
    'metric_perps_volume': {
        title: '선물 거래량',
        titleEn: 'Perpetual Futures Volume',
        content: '무기한 선물 계약의 총 거래 금액입니다. 레버리지를 사용해 가격 방향에 베팅할 수 있습니다. 현물 대비 선물 비율이 높으면 과열 신호일 수 있습니다.',
        link: '/academy/perpetual-futures'
    },
    'metric_open_interest': {
        title: '오픈 인터레스트',
        titleEn: 'Open Interest',
        content: '아직 청산되지 않은 미결제 선물 계약의 총 가치입니다. OI 증가 + 가격 상승은 강세 확인, OI 감소 + 가격 하락은 포지션 청산을 의미합니다.',
        link: '/academy/open-interest'
    },
    'metric_market_cap': {
        title: '총 시가총액',
        titleEn: 'Total Market Cap',
        content: '모든 암호화폐의 시장 가치 총합입니다. 현재 가격 × 유통 공급량으로 계산됩니다. 시장의 전체 규모를 파악하는 기본 지표입니다.',
        link: '/academy/market-cap'
    },
    'metric_liquidations': {
        title: '청산',
        titleEn: 'Liquidations',
        content: '마진이 부족해 강제로 종료된 레버리지 포지션입니다. 대규모 청산은 시장 변동성을 증폭시키며, 연쇄 청산을 유발할 수 있습니다.',
        link: '/academy/liquidations'
    },
    'widget_price_performance': {
        title: 'Price Performance',
        titleEn: '가격 변동률',
        content: '지난 1시간 동안 가장 많이 상승(Gainers)하거나 하락(Losers)한 암호화폐 목록입니다. 시장의 단기 모멘텀을 파악할 수 있습니다.',
        link: '/academy/price-performance'
    },
    'widget_stablecoin_interest': {
        title: 'Stablecoin Interest Rates',
        titleEn: '스테이블코인 이자율',
        content: 'DeFi 대출 프로토콜에서의 스테이블코인 예치(Supply) 및 대출(Borrow) 이자율입니다. 시장 레버리지 수요와 유동성 상태를 보여줍니다.',
        link: '/academy/defi-lending'
    },
    'widget_blockchain_rev': {
        title: 'Blockchain Revenue',
        titleEn: '블록체인 수수료 수익',
        content: '블록체인 네트워크가 수수료로 얻는 수익입니다. 네트워크 사용량과 수요를 직접적으로 보여주는 중요한 펀더멘털 지표입니다.',
        link: '/academy/blockchain-revenue'
    },
    'widget_etf_flows': {
        title: 'Crypto ETF Flows',
        titleEn: '암호화폐 ETF 자금 흐름',
        content: '비트코인, 이더리움 등 암호화폐 ETF로의 자금 유입/유출입니다. 기관 투자자의 수요를 파악하는 핵심 지표입니다.',
        link: '/academy/crypto-etf'
    },
    'widget_ai_insights': {
        title: 'AI Insights',
        titleEn: 'AI 인사이트',
        content: 'AI가 실시간으로 분석하는 시장 동향과 투자 인사이트입니다. 강세/약세 신호와 신뢰도 점수를 함께 제공합니다.',
        link: '/academy/ai-analysis'
    },
    'widget_research': {
        title: 'Research & Intelligence',
        titleEn: '리서치 & 인텔리전스',
        content: 'TokenPost의 독점 리서치, 속보, PRO 전용 분석 콘텐츠입니다. 투자 결정에 필요한 심층 정보를 제공합니다.',
        link: '/academy/research'
    },
    'widget_token_unlocks': {
        title: 'Token Unlocks',
        titleEn: '토큰 언락',
        content: '향후 출시 예정인 토큰 언락 일정입니다. 대규모 언락은 매도 압력을 유발할 수 있어 투자 시 반드시 확인해야 합니다.',
        link: '/academy/token-unlocks'
    },
    'widget_whale_tracker': {
        title: 'Whale Tracker',
        titleEn: '고래 추적',
        content: '$50M 이상의 대규모 거래를 실시간으로 추적합니다. 고래의 움직임은 시장 방향성에 큰 영향을 줄 수 있습니다.',
        link: '/academy/whale-tracking'
    },
    'widget_fundraising': {
        title: 'Fundraising Tracker',
        titleEn: '펀드레이징 트래커',
        content: '최신 암호화폐 프로젝트 투자 라운드 정보입니다. VC의 투자 트렌드와 유망 프로젝트를 파악할 수 있습니다.',
        link: '/academy/fundraising'
    },
};

export default function XRayOverlay() {
    const { isXRayMode, currentExplanation, hideExplanation, toggleXRayMode } = useXRay();
    const explanation = currentExplanation ? EXPLANATIONS[currentExplanation] : null;

    if (!isXRayMode) return null;

    return (
        <>
            {/* Dark overlay */}
            <div className={styles.overlay} onClick={hideExplanation}>
                <div className={styles.modeIndicator}>
                    <span className={styles.xrayBadge}>X-RAY</span>
                    <span className={styles.modeText}>학습 모드 활성화 - 요소를 클릭하세요</span>
                    <button className={styles.exitBtn} onClick={toggleXRayMode}>종료</button>
                </div>
            </div>

            {/* Explanation popup */}
            {explanation && (
                <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.popupHeader}>
                        <span className={styles.learnBadge}>📚 학습하기</span>
                        <button className={styles.closeBtn} onClick={hideExplanation}>×</button>
                    </div>
                    <h3 className={styles.popupTitle}>{explanation.title}</h3>
                    <span className={styles.popupTitleEn}>{explanation.titleEn}</span>
                    <p className={styles.popupContent}>{explanation.content}</p>
                    <a href={explanation.link} className={styles.academyLink}>
                        TokenPost 아카데미에서 더 배우기 →
                    </a>
                </div>
            )}
        </>
    );
}
