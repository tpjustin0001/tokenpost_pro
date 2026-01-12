'use client';

import { useState } from 'react';
import styles from './XRayTooltip.module.css';

export interface XRayData {
    term: string;
    termEn: string;
    shortDesc: string;
    fullDesc: string;
    formula?: string;
    importance: string;
    academyLink: string;
}

export const XRAY_DATABASE: Record<string, XRayData> = {
    'spot_volume': {
        term: '현물 거래량',
        termEn: 'Spot Volume',
        shortDesc: '실제 암호화폐를 사고파는 거래의 총량',
        fullDesc: '현물 거래량은 특정 기간 동안 거래소에서 실제로 암호화폐를 주고받은 모든 거래의 총 금액을 의미합니다. 선물이나 옵션과 달리 실물 자산이 이동합니다.',
        importance: '시장 유동성과 투자자 관심도를 측정하는 핵심 지표입니다. 거래량 증가는 보통 가격 변동 전조 신호입니다.',
        academyLink: '/academy/spot-volume'
    },
    'perps_volume': {
        term: '선물 거래량',
        termEn: 'Perpetual Futures Volume',
        shortDesc: '무기한 선물 계약의 총 거래량',
        fullDesc: '선물 거래량은 만기가 없는 "무기한 선물" 계약의 총 거래 금액입니다. 레버리지를 사용해 실제 보유 없이 가격 방향에 베팅할 수 있습니다.',
        importance: '투기적 관심도와 레버리지 수준을 보여줍니다. 현물 대비 선물 비율이 높으면 과열 신호일 수 있습니다.',
        academyLink: '/academy/perpetual-futures'
    },
    'open_interest': {
        term: '오픈 인터레스트',
        termEn: 'Open Interest (OI)',
        shortDesc: '아직 청산되지 않은 미결제 선물 계약의 총 가치',
        fullDesc: '오픈 인터레스트는 현재 활성화된 모든 선물 포지션의 합계입니다. 새 포지션이 열리면 OI가 증가하고, 청산되면 감소합니다.',
        formula: 'OI = 롱 포지션 합계 = 숏 포지션 합계',
        importance: 'OI 증가 + 가격 상승 = 강세 확인, OI 감소 + 가격 하락 = 포지션 청산. 시장 레버리지 수준을 파악할 수 있습니다.',
        academyLink: '/academy/open-interest'
    },
    'market_cap': {
        term: '시가총액',
        termEn: 'Market Capitalization',
        shortDesc: '모든 발행된 코인의 현재 시장 가치 총합',
        fullDesc: '시가총액은 현재 유통되는 코인 수에 현재 가격을 곱한 값입니다. 암호화폐의 규모와 시장 지배력을 측정하는 기본 지표입니다.',
        formula: '시가총액 = 현재 가격 × 유통 공급량',
        importance: '자산의 상대적 크기를 비교하는 기준입니다. 대형주/중형주/소형주 분류에 사용됩니다.',
        academyLink: 'http://academy.tokenpost.kr/academy/market-cap'
    },
    'liquidations': {
        term: '청산',
        termEn: 'Liquidations',
        shortDesc: '마진이 부족해 강제로 종료된 레버리지 포지션',
        fullDesc: '청산은 레버리지 포지션의 손실이 증거금을 초과할 때 거래소가 강제로 포지션을 닫는 것입니다. 급격한 가격 변동 시 대규모 청산이 연쇄적으로 발생할 수 있습니다.',
        importance: '대규모 청산은 시장 변동성을 증폭시킵니다. "롱 청산 폭탄"은 추가 하락을, "숏 스퀴즈"는 급등을 유발할 수 있습니다.',
        academyLink: 'http://academy.tokenpost.kr/academy/liquidations'
    },
    'btc_dominance': {
        term: 'BTC 도미넌스',
        termEn: 'Bitcoin Dominance',
        shortDesc: '전체 암호화폐 시장에서 비트코인이 차지하는 비율',
        fullDesc: 'BTC 도미넌스는 비트코인 시가총액을 전체 암호화폐 시가총액으로 나눈 백분율입니다. 비트코인 대비 알트코인의 상대적 성과를 측정합니다.',
        formula: 'BTC 도미넌스 = (BTC 시가총액 / 전체 시가총액) × 100',
        importance: '도미넌스 하락 = 알트코인 시즌 (알트코인이 BTC보다 강세). 도미넌스 상승 = BTC 집중 장세.',
        academyLink: 'http://academy.tokenpost.kr/academy/btc-dominance'
    },
    'fear_greed': {
        term: '공포·탐욕 지수',
        termEn: 'Fear & Greed Index',
        shortDesc: '시장 심리를 0(극도의 공포)~100(극도의 탐욕)으로 측정',
        fullDesc: '공포·탐욕 지수는 변동성, 거래량, 소셜 미디어, 설문조사 등 여러 요소를 종합해 시장 심리를 숫자로 나타냅니다.',
        importance: '"남들이 공포에 빠질 때 매수하고, 탐욕에 휩싸일 때 매도하라" - 역투자 신호로 활용됩니다.',
        academyLink: 'http://academy.tokenpost.kr/academy/fear-greed'
    },
    'stablecoin_mcap': {
        term: '스테이블코인 시총',
        termEn: 'Stablecoin Market Cap',
        shortDesc: 'USDT, USDC 등 스테이블코인의 총 시가총액',
        fullDesc: '스테이블코인은 달러 등 법정화폐에 가치가 고정된 암호화폐입니다. 스테이블코인 시총은 시장에 대기 중인 유동성을 나타냅니다.',
        importance: '스테이블코인 시총 증가 = 매수 대기 자금 증가. "드라이 파우더"로 불리며, 상승장 연료가 될 수 있습니다.',
        academyLink: 'http://academy.tokenpost.kr/academy/stablecoins'
    },
    'etf_flows': {
        term: 'ETF 자금 흐름',
        termEn: 'ETF Flows',
        shortDesc: '비트코인/이더리움 ETF로의 자금 유입/유출',
        fullDesc: 'ETF(상장지수펀드)는 일반 주식처럼 거래할 수 있는 펀드입니다. 현물 ETF는 실제 암호화폐를 보유하므로, 자금 유입 시 실제 매수가 발생합니다.',
        importance: 'ETF 순유입 = 기관 투자자의 수요 증가. 전통 금융 자본이 암호화폐로 유입되는 핵심 통로입니다.',
        academyLink: 'http://academy.tokenpost.kr/academy/crypto-etf'
    },
    'etf_inflow': {
        term: 'ETF 순유입',
        termEn: 'ETF Net Inflow',
        shortDesc: '비트코인 현물 ETF로 들어온 순자금 규모',
        fullDesc: '미국에 상장된 비트코인 현물 ETF들의 일일 자금 유출입 합계입니다. 기관 자금의 흐름을 가장 직접적으로 보여주는 지표입니다.',
        importance: 'ETF 순유입 = 기관 투자자의 수요 증가. 전통 금융 자본이 암호화폐로 유입되는 핵심 통로입니다.',
        academyLink: 'http://academy.tokenpost.kr/'
    },
    'token_unlocks': {
        term: '토큰 언락',
        termEn: 'Token Unlocks',
        shortDesc: '주요 보유자의 락업 해제로 인한 유동성 공급',
        fullDesc: '토큰 언락은 초기 투자자나 팀에게 배정된 물량이 락업 기간 종료 후 시장에 풀리는 이벤트를 말합니다. 대규모 물량이 매도될 가능성이 있어 가격 변동성을 초래할 수 있습니다.',
        importance: '공급량 증가는 가격 희석 요인이므로, 언락 일정과 규모를 미리 파악하는 것이 중요합니다.',
        academyLink: 'http://academy.tokenpost.kr/academy/token-unlocks'
    },
    'unlock_cliff': {
        term: '클리프 언락',
        termEn: 'Cliff Unlock',
        shortDesc: '특정 시점에 대규모 물량이 한꺼번에 풀리는 방식',
        fullDesc: '클리프(Cliff)는 벼랑처럼 그래프가 수직 상승한다고 하여 붙여진 이름입니다. 특정 날짜에 많은 물량이 일시에 언락되므로 시장 충격이 클 수 있습니다.',
        importance: '단기적인 매도 압력이 강하게 발생할 수 있는 시점입니다.',
        academyLink: 'http://academy.tokenpost.kr/'
    },
    'unlock_linear': {
        term: '선형 언락',
        termEn: 'Linear Unlock',
        shortDesc: '매일/매월 일정량씩 꾸준히 풀리는 방식',
        fullDesc: '선형(Linear) 언락은 특정 기간 동안 조금씩 나누어 물량이 풀리는 방식입니다. 클리프 방식에 비해 단기 충격은 적지만, 지속적인 매도 압력으로 작용할 수 있습니다.',
        importance: '장기적인 가격 추세에 영향을 미치는 지속적인 공급 요인입니다.',
        academyLink: 'http://academy.tokenpost.kr/'
    },
    'ai_analysis': {
        term: 'AI 인텔리전스',
        termEn: 'AI Intelligence',
        shortDesc: '뉴스와 시장 데이터를 AI가 실시간 분석',
        fullDesc: 'TokenPost AI는 수천 개의 뉴스 기사와 온체인 데이터를 실시간으로 수집하고 자연어 처리(NLP)를 통해 감성(호재/악재)과 중요도를 판별합니다. 단순 정보 나열이 아닌 투자 인사이트를 제공합니다.',
        importance: '정보의 홍수 속에서 핵심 신호를 빠르게 포착할 수 있습니다.',
        academyLink: 'http://academy.tokenpost.kr/'
    },
    'live_feed': {
        term: '실시간 시세 (WebSocket)',
        termEn: 'Live Price Feed',
        shortDesc: '거래소와 직접 연결된 실시간 데이터 스트림',
        fullDesc: '바이낸스(Binance) 등 주요 거래소의 웹소켓(WebSocket) API를 통해 초 단위의 가격 변동을 지연 없이 수신합니다. 차트와 가격 정보가 실시간으로 업데이트됩니다.',
        importance: '초단기 트레이딩과 시장 모니터링에 필수적인 데이터 최신성을 보장합니다.',
        academyLink: 'http://academy.tokenpost.kr/'
    },
    'funding_rate': {
        term: '펀딩 레이트',
        termEn: 'Funding Rate',
        shortDesc: '롱/숏 포지션 간 주기적으로 지불되는 수수료',
        fullDesc: '펀딩 레이트는 무기한 선물 가격을 현물 가격에 연동시키는 메커니즘입니다. 양수면 롱이 숏에게, 음수면 숏이 롱에게 지불합니다.',
        importance: '높은 양수 펀딩 = 과도한 롱 포지션, 조정 가능성. 음수 펀딩 = 숏 과열, 반등 가능성.',
        academyLink: '/academy/funding-rate'
    },
};

interface XRayTooltipProps {
    dataKey: string;
    children: React.ReactNode;
}

import { useXRay } from '@/context/XRayContext';
import { BookOpen, HelpCircle } from 'lucide-react';

export default function XRayTooltip({ dataKey, children }: XRayTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { isXRayActive } = useXRay();
    const data = XRAY_DATABASE[dataKey];

    if (!data) return <>{children}</>;

    const activeStyle = isXRayActive ? {
        zIndex: 51,
        position: 'relative' as const,
        boxShadow: '0 0 0 2px var(--accent-blue), 0 0 12px rgba(59, 130, 246, 0.5)',
        borderRadius: '4px',
        background: 'rgba(16, 185, 129, 0.1)',
        cursor: 'help'
    } : {};

    return (
        <div
            className={styles.wrapper}
            style={activeStyle}
            onClick={(e) => {
                if (isXRayActive) {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsOpen(true);
                }
            }}
        >
            <div className={styles.trigger} onClick={() => !isXRayActive && setIsOpen(true)}>
                {children}
                {!isXRayActive && (
                    <span
                        className={styles.xrayIcon}
                        title="X-Ray: 이 데이터가 뭔가요?"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(true);
                        }}
                    >
                        <HelpCircle size={10} />
                    </span>
                )}
            </div>

            {isOpen && (
                <div className={styles.overlay} onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.header}>
                            <div className={styles.headerLeft}>
                                <span className={styles.xrayBadge}>X-RAY</span>
                                <span className={styles.learnBadge}>학습하기</span>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
                        </div>

                        <div className={styles.content}>
                            <h2 className={styles.term}>{data.term}</h2>
                            <span className={styles.termEn}>{data.termEn}</span>

                            <p className={styles.shortDesc}>{data.shortDesc}</p>

                            <div className={styles.section}>
                                <h4 className={styles.sectionTitle}>상세 설명</h4>
                                <p>{data.fullDesc}</p>
                            </div>

                            {data.formula && (
                                <div className={styles.formulaBox}>
                                    <span className={styles.formulaLabel}>공식</span>
                                    <code className={styles.formula}>{data.formula}</code>
                                </div>
                            )}

                            <div className={styles.section}>
                                <h4 className={styles.sectionTitle}>왜 중요한가요?</h4>
                                <p>{data.importance}</p>
                            </div>

                            <a href={data.academyLink} className={styles.academyLink} target="_blank" rel="noopener noreferrer">
                                <BookOpen size={16} className={styles.academyIcon} />
                                <span>TokenPost 아카데미에서 더 배우기 →</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Compact inline version for metrics
export function XRayIcon({ dataKey }: { dataKey: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const { isXRayActive } = useXRay();
    const data = XRAY_DATABASE[dataKey];

    if (!data) return null;

    // If X-Ray Mode is active, XRayIcon might hide itself to reduce clutter IF the parent XRayTooltip handles it. 
    // BUT XRayIcon is often used standalone (e.g. Metric Label + Icon).
    // In InstitutionalMetrics: Label + Icon.
    // If Mode is Active, we want the ICON to be big/highlighted OR the Label to be clickable.
    // Let's make the Icon Pulse.

    const activeStyle = isXRayActive ? {
        zIndex: 51,
        position: 'relative' as const,
        fontSize: '18px',
        color: '#fff',
        background: 'var(--accent-blue)',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 10px var(--accent-blue)'
    } : {};

    return (
        <>
            <span
                className={styles.inlineIcon}
                style={activeStyle}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                title="X-Ray: 이 데이터가 뭔가요?"
            >
                {isXRayActive ? <HelpCircle size={16} color="#fff" /> : <HelpCircle size={14} />}
            </span>

            {isOpen && (
                <div className={styles.overlay} onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.header}>
                            <div className={styles.headerLeft}>
                                <span className={styles.xrayBadge}>X-RAY</span>
                                <span className={styles.learnBadge}>학습하기</span>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
                        </div>

                        <div className={styles.content}>
                            <h2 className={styles.term}>{data.term}</h2>
                            <span className={styles.termEn}>{data.termEn}</span>

                            <p className={styles.shortDesc}>{data.shortDesc}</p>

                            <div className={styles.section}>
                                <h4 className={styles.sectionTitle}>상세 설명</h4>
                                <p>{data.fullDesc}</p>
                            </div>

                            {data.formula && (
                                <div className={styles.formulaBox}>
                                    <span className={styles.formulaLabel}>공식</span>
                                    <code className={styles.formula}>{data.formula}</code>
                                </div>
                            )}

                            <div className={styles.section}>
                                <h4 className={styles.sectionTitle}>왜 중요한가요?</h4>
                                <p>{data.importance}</p>
                            </div>

                            <a href={data.academyLink} className={styles.academyLink}>
                                <span className={styles.academyIcon}>📚</span>
                                <span>TokenPost 아카데미에서 더 배우기 →</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
