'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, LineSeries, AreaSeries, Time, LineData } from 'lightweight-charts';
import styles from './DataWidgets.module.css';

// Generate mock data
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

interface ChartWidgetProps {
    title: string;
    subtitle?: string;
    chartType: 'line' | 'area' | 'dual';
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

        const borrowSeries = chart.addSeries(LineSeries, {
            color: '#ef4444',
            lineWidth: 2,
        });
        borrowSeries.setData(generateChartData(90, 8, 0.1));

        const supplySeries = chart.addSeries(LineSeries, {
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
                    <h3 className={styles.title}>Lending: Stablecoin Interest Rates</h3>
                </div>
                <a href="#" className={styles.viewData}>View data →</a>
            </div>
            <div ref={chartContainerRef} className={styles.chart} />
            <div className={styles.legend}>
                <span className={styles.legendItem}>
                    <span className={styles.dot} style={{ background: '#374151' }}></span>
                    All
                </span>
                <span className={styles.legendItem}>
                    <span className={styles.dot} style={{ background: '#ef4444' }}></span>
                    Borrow APY
                </span>
                <span className={styles.legendItem}>
                    <span className={styles.dot} style={{ background: '#22c55e' }}></span>
                    Supply APY
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

        const areaSeries = chart.addSeries(AreaSeries, {
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
                    <h3 className={styles.title}>Total Blockchain REV</h3>
                    <p className={styles.subtitle}>All fees paid for general purpose blockspace</p>
                </div>
                <a href="#" className={styles.viewData}>View data →</a>
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

        const areaSeries = chart.addSeries(AreaSeries, {
            topColor: 'rgba(74, 222, 128, 0.4)',
            bottomColor: 'rgba(74, 222, 128, 0.05)',
            lineColor: '#4ade80',
            lineWidth: 2,
        });

        // Generate ETF flow data with some negative values
        const data: LineData<Time>[] = [];
        const now = Date.now();
        for (let i = 90; i >= 0; i--) {
            const time = Math.floor((now - i * 24 * 60 * 60 * 1000) / 1000) as Time;
            const value = (Math.random() - 0.3) * 500000000; // Some negative flows
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
                    <h3 className={styles.title}>Crypto ETF Flows</h3>
                    <p className={styles.subtitle}>Rolling 5d flows into BTC, ETH, and SOL ETFs</p>
                </div>
                <a href="#" className={styles.viewData}>View data →</a>
            </div>
            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}
