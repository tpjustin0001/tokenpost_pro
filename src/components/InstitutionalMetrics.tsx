'use client';

import { useState } from 'react';
import XRayTooltip from './XRayTooltip';
import AIXRay from './AIXRay';
import styles from './InstitutionalMetrics.module.css';

interface MetricData {
    label: string;
    value: string;
    subtext?: string;
    change?: number;
    xray: string;
}

const METRICS: MetricData[] = [
    {
        label: '시총/TVL',
        value: '1.24',
        subtext: '저평가 기준 < 1.0',
        xray: '시가총액을 예치된 총 가치(TVL)로 나눈 비율입니다. 1.0 미만이면 해당 프로토콜이 저평가되었을 가능성이 있습니다.'
    },
    {
        label: '완전희석시총(FDV)',
        value: '$89.2B',
        subtext: '희석 리스크',
        change: -2.1,
        xray: '모든 토큰이 유통될 경우의 시가총액입니다. 현재 시총과 차이가 클수록 향후 매도 압력이 커질 수 있습니다.'
    },
    {
        label: '수익 (30일)',
        value: '$45.2M',
        subtext: '실질 수익률',
        change: 12.4,
        xray: '프로토콜이 수수료로 벌어들인 실제 수익입니다. 지속 가능한 프로젝트인지 판단하는 핵심 지표입니다.'
    },
    {
        label: 'P/E 비율',
        value: '18.5',
        subtext: 'vs ETH: 24.2',
        xray: '시가총액을 연간 수익으로 나눈 값입니다. 주식의 PER과 유사하게, 낮을수록 저평가 가능성이 있습니다.'
    },
    {
        label: '변동성 (HV)',
        value: '68%',
        subtext: '높은 리스크',
        xray: '역사적 변동성으로, 과거 가격 변동 정도를 나타냅니다. 높을수록 리스크와 수익 가능성이 모두 큽니다.'
    },
    {
        label: '인플레이션율',
        value: '4.5%',
        subtext: 'vs BTC: 1.7%',
        xray: '연간 신규 토큰 발행률입니다. 높은 인플레이션은 토큰 가치 희석을 의미하므로 주의가 필요합니다.'
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
                            <XRayTooltip content={metric.xray}>
                                <div className="metric-label">{metric.label}</div>
                            </XRayTooltip>
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
