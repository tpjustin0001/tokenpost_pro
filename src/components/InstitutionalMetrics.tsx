'use client';

import { useState } from 'react';
import { XRayIcon } from './XRayTooltip';
import AIXRay from './AIXRay';
import styles from './InstitutionalMetrics.module.css';

interface MetricData {
    label: string;
    value: string;
    subtext?: string;
    change?: number;
    xrayKey: string;
}

const METRICS: MetricData[] = [
    {
        label: '시총/TVL',
        value: '1.24',
        subtext: '저평가 기준 < 1.0',
        xrayKey: 'market_cap'
    },
    {
        label: '완전희석시총(FDV)',
        value: '$89.2B',
        subtext: '희석 리스크',
        change: -2.1,
        xrayKey: 'market_cap'
    },
    {
        label: '수익 (30일)',
        value: '$45.2M',
        subtext: '실질 수익률',
        change: 12.4,
        xrayKey: 'market_cap'
    },
    {
        label: 'P/E 비율',
        value: '18.5',
        subtext: 'vs ETH: 24.2',
        xrayKey: 'market_cap'
    },
    {
        label: '변동성 (HV)',
        value: '68%',
        subtext: '높은 리스크',
        xrayKey: 'market_cap'
    },
    {
        label: '인플레이션율',
        value: '4.5%',
        subtext: 'vs BTC: 1.7%',
        xrayKey: 'market_cap'
    },
];

interface InstitutionalMetricsProps {
    symbol?: string;
}

export default function InstitutionalMetrics({ symbol = 'BTC' }: InstitutionalMetricsProps) {
    const [isAIXRayOpen, setIsAIXRayOpen] = useState(false);

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <span className="card-title">기관급 밸류에이션</span>
                    <span className="badge badge-demo">데모 데이터</span>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.aiButton}
                            onClick={() => setIsAIXRayOpen(true)}
                        >
                            <span className={styles.aiIcon}>AI</span>
                            X-Ray 분석
                        </button>
                    </div>
                </div>
                <div className="metrics-grid" style={{ padding: 'var(--spacing-md)' }}>
                    {METRICS.map((metric) => (
                        <div key={metric.label} className="metric-item">
                            <div className="metric-label">
                                {metric.label}
                                <XRayIcon dataKey={metric.xrayKey} />
                            </div>
                            <div className="metric-value">
                                {metric.value}
                                {metric.change !== undefined && (
                                    <span className={`${styles.change} ${metric.change >= 0 ? 'text-green' : 'text-red'}`}>
                                        {metric.change >= 0 ? '+' : ''}{metric.change}%
                                    </span>
                                )}
                            </div>
                            {metric.subtext && (
                                <div className="metric-subtext">{metric.subtext}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <AIXRay
                symbol={symbol}
                isOpen={isAIXRayOpen}
                onClose={() => setIsAIXRayOpen(false)}
            />
        </>
    );
}
