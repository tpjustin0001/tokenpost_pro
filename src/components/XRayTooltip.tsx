'use client';

import { useState } from 'react';
import styles from './XRayTooltip.module.css';

interface XRayData {
    term: string;
    termEn: string;
    shortDesc: string;
    fullDesc: string;
    formula?: string;
    importance: string;
    academyLink: string;
}

const XRAY_DATABASE: Record<string, XRayData> = {
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
        academyLink: '/academy/market-cap'
    },
    'liquidations': {
        term: '청산',
        termEn: 'Liquidations',
        shortDesc: '마진이 부족해 강제로 종료된 레버리지 포지션',
        fullDesc: '청산은 레버리지 포지션의 손실이 증거금을 초과할 때 거래소가 강제로 포지션을 닫는 것입니다. 급격한 가격 변동 시 대규모 청산이 연쇄적으로 발생할 수 있습니다.',
        importance: '대규모 청산은 시장 변동성을 증폭시킵니다. "롱 청산 폭탄"은 추가 하락을, "숏 스퀴즈"는 급등을 유발할 수 있습니다.',
        academyLink: '/academy/liquidations'
    },
    'btc_dominance': {
        term: 'BTC 도미넌스',
        termEn: 'Bitcoin Dominance',
        shortDesc: '전체 암호화폐 시장에서 비트코인이 차지하는 비율',
        fullDesc: 'BTC 도미넌스는 비트코인 시가총액을 전체 암호화폐 시가총액으로 나눈 백분율입니다. 비트코인 대비 알트코인의 상대적 성과를 측정합니다.',
        formula: 'BTC 도미넌스 = (BTC 시가총액 / 전체 시가총액) × 100',
        importance: '도미넌스 하락 = 알트코인 시즌 (알트코인이 BTC보다 강세). 도미넌스 상승 = BTC 집중 장세.',
        academyLink: '/academy/btc-dominance'
    },
    'fear_greed': {
        term: '공포·탐욕 지수',
        termEn: 'Fear & Greed Index',
        shortDesc: '시장 심리를 0(극도의 공포)~100(극도의 탐욕)으로 측정',
        fullDesc: '공포·탐욕 지수는 변동성, 거래량, 소셜 미디어, 설문조사 등 여러 요소를 종합해 시장 심리를 숫자로 나타냅니다.',
        importance: '"남들이 공포에 빠질 때 매수하고, 탐욕에 휩싸일 때 매도하라" - 역투자 신호로 활용됩니다.',
        academyLink: '/academy/fear-greed'
    },
    'stablecoin_mcap': {
        term: '스테이블코인 시총',
        termEn: 'Stablecoin Market Cap',
        shortDesc: 'USDT, USDC 등 스테이블코인의 총 시가총액',
        fullDesc: '스테이블코인은 달러 등 법정화폐에 가치가 고정된 암호화폐입니다. 스테이블코인 시총은 시장에 대기 중인 유동성을 나타냅니다.',
        importance: '스테이블코인 시총 증가 = 매수 대기 자금 증가. "드라이 파우더"로 불리며, 상승장 연료가 될 수 있습니다.',
        academyLink: '/academy/stablecoins'
    },
    'etf_flows': {
        term: 'ETF 자금 흐름',
        termEn: 'ETF Flows',
        shortDesc: '비트코인/이더리움 ETF로의 자금 유입/유출',
        fullDesc: 'ETF(상장지수펀드)는 일반 주식처럼 거래할 수 있는 펀드입니다. 현물 ETF는 실제 암호화폐를 보유하므로, 자금 유입 시 실제 매수가 발생합니다.',
        importance: 'ETF 순유입 = 기관 투자자의 수요 증가. 전통 금융 자본이 암호화폐로 유입되는 핵심 통로입니다.',
        academyLink: '/academy/crypto-etf'
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

export default function XRayTooltip({ dataKey, children }: XRayTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const data = XRAY_DATABASE[dataKey];

    if (!data) return <>{children}</>;

    return (
        <div className={styles.wrapper}>
            <div className={styles.trigger} onClick={() => setIsOpen(true)}>
                {children}
                <span className={styles.xrayIcon} title="X-Ray: 이 데이터가 뭔가요?">?</span>
            </div>

            {isOpen && (
                <div className={styles.overlay} onClick={() => setIsOpen(false)}>
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
        </div>
    );
}

// Compact inline version for metrics
export function XRayIcon({ dataKey }: { dataKey: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const data = XRAY_DATABASE[dataKey];

    if (!data) return null;

    return (
        <>
            <span
                className={styles.inlineIcon}
                onClick={() => setIsOpen(true)}
                title="X-Ray: 이 데이터가 뭔가요?"
            >
                ⓘ
            </span>

            {isOpen && (
                <div className={styles.overlay} onClick={() => setIsOpen(false)}>
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
