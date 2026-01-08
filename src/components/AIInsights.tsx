'use client';

import styles from './AIInsights.module.css';

interface AIInsight {
    id: string;
    type: 'bullish' | 'bearish' | 'neutral' | 'alert';
    title: string;
    content: string;
    confidence: number;
    time: string;
}

const AI_INSIGHTS: AIInsight[] = [
    {
        id: '1',
        type: 'bullish',
        title: '비트코인 축적 패턴 감지',
        content: '장기 보유자들의 축적이 24시간 동안 +2.3% 증가했습니다. 역사적으로 이 패턴 후 30일 내 상승 확률은 78%입니다.',
        confidence: 82,
        time: '방금',
    },
    {
        id: '2',
        type: 'alert',
        title: 'ARB 대규모 언락 임박',
        content: 'D-8 이내에 $148.5M 규모의 ARB 토큰이 언락됩니다. 공급량 2.13% 증가 예상. 단기 매도 압력에 주의하세요.',
        confidence: 95,
        time: '12분 전',
    },
    {
        id: '3',
        type: 'bullish',
        title: 'DeFi 섹터 자금 유입',
        content: '지난 24시간 AI 섹터에서 DeFi로 $1.2B 규모의 자금 로테이션이 감지되었습니다. AAVE, UNI 주목.',
        confidence: 75,
        time: '28분 전',
    },
    {
        id: '4',
        type: 'bearish',
        title: '이더리움 고래 거래소 입금',
        content: 'Whale #847이 32,000 ETH($108M)를 Coinbase로 이동했습니다. 잠재적 매도 신호일 수 있습니다.',
        confidence: 68,
        time: '45분 전',
    },
    {
        id: '5',
        type: 'neutral',
        title: '글로벌 유동성 모니터',
        content: 'M2 통화량이 전월 대비 0.8% 증가했습니다. 역사적으로 BTC와 높은 상관관계(0.87)를 보입니다.',
        confidence: 88,
        time: '1시간 전',
    },
];

export default function AIInsights() {
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'bullish': return 'var(--accent-green)';
            case 'bearish': return 'var(--accent-red)';
            case 'alert': return 'var(--accent-yellow)';
            default: return 'var(--accent-blue)';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'bullish': return '긍정';
            case 'bearish': return '부정';
            case 'alert': return '주의';
            default: return '정보';
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className={styles.headerLeft}>
                    <span className={styles.aiBadge}>AI</span>
                    <span className="card-title">실시간 AI 인사이트</span>
                </div>
                <span className={styles.live}>LIVE</span>
            </div>
            <div className={styles.insightsList}>
                {AI_INSIGHTS.map((insight) => (
                    <div key={insight.id} className={styles.insightItem}>
                        <div className={styles.insightHeader}>
                            <span
                                className={styles.typeBadge}
                                style={{
                                    background: `${getTypeColor(insight.type)}20`,
                                    color: getTypeColor(insight.type),
                                    borderLeft: `2px solid ${getTypeColor(insight.type)}`
                                }}
                            >
                                {getTypeLabel(insight.type)}
                            </span>
                            <span className={styles.time}>{insight.time}</span>
                        </div>
                        <h4 className={styles.title}>{insight.title}</h4>
                        <p className={styles.content}>{insight.content}</p>
                        <div className={styles.confidence}>
                            <span className={styles.confidenceLabel}>신뢰도</span>
                            <div className={styles.confidenceBar}>
                                <div
                                    className={styles.confidenceFill}
                                    style={{
                                        width: `${insight.confidence}%`,
                                        background: getTypeColor(insight.type)
                                    }}
                                />
                            </div>
                            <span className={styles.confidenceValue}>{insight.confidence}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
