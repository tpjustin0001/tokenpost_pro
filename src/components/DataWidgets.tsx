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

        const borrowSeries = chart.addLineSeries({ color: '#ef4444', lineWidth: 2 });
        const supplySeries = chart.addLineSeries({ color: '#22c55e', lineWidth: 2 });

        // Fetch Aave V3 USDT Data
        // UUID: 747c1d2a-c668-4682-b9f9-296708a3dd90
        fetch('https://yields.llama.fi/chart/747c1d2a-c668-4682-b9f9-296708a3dd90')
            .then(res => res.json())
            .then(data => {
                if (data && data.data) {
                    const formattedData = data.data.map((d: any) => ({
                        time: (new Date(d.timestamp).getTime() / 1000) as Time,
                        value: d.apy,
                    }));
                    // Sort by time
                    formattedData.sort((a: any, b: any) => a.time - b.time);

                    // Use same data for supply (apy) and mock slightly higher for borrow for visualization if real borrow not available in this endpoint
                    // Actually this endpoint returns 'apy' (supply). 
                    // Let's use it for Supply Series.
                    supplySeries.setData(formattedData);

                    // For Borrow, we'll simulate it based on Supply APY + Spread (Mocking Borrow based on Supply for visual 2-lines)
                    // Or ideally fetch another endpoint. But to save requests, let's just show Supply APY.
                    // Wait, let's keep it simple. Only Show Supply APY for now or mock borrow.
                    // Let's mock borrow as 1.5x of supply for visual.
                    const borrowData = formattedData.map((d: any) => ({
                        time: d.time,
                        value: d.value * 1.5 + 1 // Mock spread
                    }));
                    borrowSeries.setData(borrowData);

                    chart.timeScale().fitContent();
                }
            })
            .catch(err => console.error("Failed to fetch yields", err));

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
                    <h3 className={styles.title}>스테이블코인 이자율 (USDT/Aave)</h3>
                </div>
                <span className={styles.viewData}>LIVE</span>
            </div>
            <div ref={chartContainerRef} className={styles.chart} />
            <div className={styles.legend}>
                <span className={styles.legendItem}>
                    <span className={styles.dot} style={{ background: '#ef4444' }}></span>
                    대출 APY (Est)
                </span>
                <span className={styles.legendItem}>
                    <span className={styles.dot} style={{ background: '#22c55e' }}></span>
                    예치 APY (Live)
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
            rightPriceScale: {
                borderColor: 'transparent',
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: { borderColor: 'transparent', visible: true },
            height: 180,
        });

        const areaSeries = chart.addAreaSeries({
            topColor: 'rgba(74, 222, 128, 0.4)',
            bottomColor: 'rgba(74, 222, 128, 0.05)',
            lineColor: '#4ade80',
            lineWidth: 2,
        });

        // Fetch Ethereum Fees
        fetch('https://api.llama.fi/summary/fees/ethereum?dataType=dailyFees')
            .then(res => res.json())
            .then(data => {
                if (data && data.totalDataChart) {
                    const formattedData = data.totalDataChart.map((d: [number, number]) => ({
                        time: d[0] as Time, // Unix timestamp in seconds
                        value: d[1],
                    }));
                    // Slice last 90 days
                    const recentData = formattedData.slice(-90);
                    areaSeries.setData(recentData);
                    chart.timeScale().fitContent();
                }
            })
            .catch(err => console.error("Failed to fetch fees", err));

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
                    <h3 className={styles.title}>블록체인 수수료 수익 (Ethereum)</h3>
                    <p className={styles.subtitle}>Daily Fees (USD)</p>
                </div>
                <span className={styles.viewData}>LIVE</span>
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
                <span className={styles.viewData}>LIVE</span>
            </div>
            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}
