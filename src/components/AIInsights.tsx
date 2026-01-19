'use client';

import { useState, useEffect } from 'react';
import styles from './AIInsights.module.css';

interface AIInsight {
    id: string;
    type: 'bullish' | 'bearish' | 'neutral' | 'alert';
    title: string;
    content: string;
    confidence: number;
    time: string;
}

export default function AIInsights() {
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                // Fetch from Next.js API (which calls Supabase)
                // Assuming we will create or use an existing endpoint.
                // For now, let's use the same pattern as other components: custom endpoint or direct Supabase.
                // Given the privacy, better to use an API route that reads from global_market_snapshots.
                const response = await fetch('/api/analysis/market/latest');

                if (!response.ok) {
                    throw new Error('Failed to fetch insights');
                }

                const data = await response.json();

                if (data && data.data) {
                    // Transform backend data to frontend model
                    // Backend saves: { overview: "...", sentiment: "bullish", ... }
                    // We need to map it.
                    // For now, let's map the 'overview' as one main insight.
                    const mappedInsights: AIInsight[] = [{
                        id: `market-${new Date(data.created_at).getTime()}`,
                        type: data.data.sentiment || 'neutral',
                        title: '글로벌 시장 브리핑',
                        content: data.data.overview || '시장 데이터 분석 중입니다.',
                        confidence: data.data.confidence || 85,
                        time: new Date(data.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                    }];
                    setInsights(mappedInsights);
                } else {
                    // If no data, keep empty to show loading/empty state
                }
            } catch (err) {
                console.error('AI Insight fetch error:', err);
                // Fallback to error or empty
                setError('AI 연결이 지연되고 있습니다. 잠시 후 다시 확인해주세요.');
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
        const interval = setInterval(fetchInsights, 60000); // 1 minute refresh
        return () => clearInterval(interval);
    }, []);

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
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        데이터 분석 중...
                    </div>
                ) : error ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--accent-red)', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                ) : insights.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        현재 분석 리포트를 생성 중입니다...
                    </div>
                ) : (
                    insights.map((insight) => (
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
