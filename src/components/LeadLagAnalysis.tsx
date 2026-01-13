'use client';

import { useEffect, useState } from 'react';
import { flaskApi, LeadLagData } from '@/services/flaskApi';
import styles from './LeadLagAnalysis.module.css';

const VAR_MAP: Record<string, string> = {
    'TNX': '10년물 국채 금리',
    'TNX_MoM': '국채 금리 변화율',
    'SPY': 'S&P 500',
    'SPY_MoM': 'S&P 500 변화율',
    'VIX': '공포지수 (VIX)',
    'VIX_MoM': '공포지수 변화율',
    'DXY': '달러 인덱스',
    'DXY_MoM': '달러 인덱스 변화율',
    'GOLD': '금',
    'GOLD_MoM': '금 변화율',
    'M2': 'M2 통화량',
    'M2_MoM': 'M2 통화량 변화율',
};

export default function LeadLagAnalysis() {
    const [data, setData] = useState<LeadLagData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const result = await flaskApi.getLeadLag();
                setData(result);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="card"><div className={styles.loading}>Analyzing Macro Economic Data...</div></div>;
    if (!data) return <div className="card"><div className={styles.loading}>No data available</div></div>;

    return (
        <div className={styles.leadLagContainer}>
            <div className={styles.grid}>
                {data.leading_indicators.slice(0, 6).map((item, i) => {
                    const isPositive = item.correlation > 0;
                    const strength = Math.abs(item.correlation) * 100;
                    const color = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';

                    return (
                        <div key={i} className={styles.card}>
                            <div className={styles.header}>
                                <div className={styles.lagCircle}>
                                    {item.lag}M
                                </div>
                                <div className={styles.titleSection}>
                                    <div className={styles.variable}>
                                        {VAR_MAP[item.variable] || item.variable}
                                    </div>
                                    <div className={styles.subtitle}>{item.variable}</div>
                                </div>
                            </div>

                            <div className={styles.stats}>
                                <div className={styles.statRow}>
                                    <span style={{ color: 'var(--text-muted)' }}>Correlation</span>
                                    <span style={{ color: color, fontWeight: 'bold' }}>
                                        {item.correlation.toFixed(2)}
                                    </span>
                                </div>
                                <div className={styles.correlationBar}>
                                    <div
                                        className={styles.barFill}
                                        style={{
                                            width: `${strength}%`,
                                            backgroundColor: color
                                        }}
                                    />
                                </div>
                            </div>

                            <div className={styles.interpretation}>
                                {isPositive
                                    ? `${VAR_MAP[item.variable] || item.variable} 상승 시,\n비트코인도 ${item.lag}개월 뒤 상승 경향`
                                    : `${VAR_MAP[item.variable] || item.variable} 상승 시,\n비트코인은 ${item.lag}개월 뒤 하락 경향`
                                }
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
