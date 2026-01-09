'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, Time, LineData } from 'lightweight-charts';
import styles from './DataWidgets.module.css';

function generateChartData(days: number, baseValue: number, volatility: number): LineData<Time>[] {
    const data: LineData<Time>[] = [];
    const now = Date.now();
    let value = baseValue;

    for (let i = days; i >= 0; i--) {
        const time = Math.floor((now - i * 24 * 60 * 60 * 1000) / 1000) as Time;
        value = value * (1 + (Math.random() - 0.5) * volatility);
        data.push({ time, value });
    }

    return data;
}

export function StablecoinInterestChart() {
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#6b7280',
                fontFamily: 'Roboto Mono, monospace',
                fontSize: 10,
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
            },
            rightPriceScale: { borderColor: 'transparent' },
            timeScale: { borderColor: 'transparent', visible: true },
            height: 180,
        });

        // V4: addLineSeries
        const borrowSeries = chart.addLineSeries({
            color: '#ef4444',
            lineWidth: 2,
        });
        borrowSeries.setData(generateChartData(90, 8, 0.1));

        const supplySeries = chart.addLineSeries({
            color: '#22c55e',
            lineWidth: 2,
        });
        supplySeries.setData(generateChartData(90, 5, 0.08));

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>스테이블코인 이자율</h3>
                </div>
                <a href="#" className={styles.viewData}>상세 보기 →</a>
            </div>
            <div ref={chartContainerRef} className={styles.chart} />
            <div className={styles.legend}>
                <span className={styles.legendItem}>
                    <span className={styles.dot} style={{ background: '#ef4444' }}></span>
                    대출 APY
                </span>
                <span className={styles.legendItem}>
                    <span className={styles.dot} style={{ background: '#22c55e' }}></span>
                    예치 APY
                </span>
            </div>
        </div>
    );
}

export function BlockchainRevChart() {
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#6b7280',
                fontFamily: 'Roboto Mono, monospace',
                fontSize: 10,
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
            },
            rightPriceScale: { borderColor: 'transparent' },
            timeScale: { borderColor: 'transparent', visible: true },
            height: 180,
        });

        // V4: addAreaSeries
        const areaSeries = chart.addAreaSeries({
            topColor: 'rgba(74, 222, 128, 0.4)',
            bottomColor: 'rgba(74, 222, 128, 0.05)',
            lineColor: '#4ade80',
            lineWidth: 2,
        });
        areaSeries.setData(generateChartData(60, 25000000, 0.15));

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>블록체인 수수료 수익</h3>
                    <p className={styles.subtitle}>네트워크 수수료 총합 (Daily)</p>
                </div>
                <a href="#" className={styles.viewData}>상세 보기 →</a>
            </div>
            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}

export function ETFFlowsChart() {
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#6b7280',
                fontFamily: 'Roboto Mono, monospace',
                fontSize: 10,
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
            },
            rightPriceScale: { borderColor: 'transparent' },
            timeScale: { borderColor: 'transparent', visible: true },
            height: 180,
        });

        // V4: addAreaSeries
        const areaSeries = chart.addAreaSeries({
            topColor: 'rgba(74, 222, 128, 0.4)',
            bottomColor: 'rgba(74, 222, 128, 0.05)',
            lineColor: '#4ade80',
            lineWidth: 2,
        });

        const data: LineData<Time>[] = [];
        const now = Date.now();
        for (let i = 90; i >= 0; i--) {
            const time = Math.floor((now - i * 24 * 60 * 60 * 1000) / 1000) as Time;
            const value = (Math.random() - 0.3) * 500000000;
            data.push({ time, value });
        }
        areaSeries.setData(data);

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>암호화폐 ETF 자금 흐름</h3>
                    <p className={styles.subtitle}>BTC, ETH, SOL ETF 5일 롤링 유입량</p>
                </div>
                <a href="#" className={styles.viewData}>상세 보기 →</a>
            </div>
            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}
