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
    // AI 분석 데이터 초기화 (실제 모델 연동 대기)
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
                {AI_INSIGHTS.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        현재 분석 리포트를 생성 중입니다...
                    </div>
                ) : (
                    AI_INSIGHTS.map((insight) => (
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
                    ))
                )}
            </div>
        </div>
    );
}
