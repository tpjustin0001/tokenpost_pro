'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, LineSeries, AreaSeries, LineData, Time } from 'lightweight-charts';
import styles from './MacroChart.module.css';

function generateBtcData(days: number = 365): LineData<Time>[] {
    const data: LineData<Time>[] = [];
    const now = Date.now();
    let price = 40000;

    for (let i = days; i >= 0; i--) {
        const time = Math.floor((now - i * 24 * 60 * 60 * 1000) / 1000) as Time;
        price = price * (1 + (Math.random() - 0.48) * 0.03);
        price = Math.max(20000, Math.min(100000, price));
        data.push({ time, value: price });
    }

    return data;
}

function generateM2Data(days: number = 365): LineData<Time>[] {
    const data: LineData<Time>[] = [];
    const now = Date.now();
    let liquidity = 21;

    for (let i = days; i >= 0; i--) {
        const time = Math.floor((now - i * 24 * 60 * 60 * 1000) / 1000) as Time;
        liquidity = liquidity * (1 + (Math.random() - 0.48) * 0.002);
        liquidity = Math.max(19, Math.min(25, liquidity));
        data.push({ time, value: liquidity });
    }

    return data;
}

export default function MacroChart() {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

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
            crosshair: {
                mode: 1,
                vertLine: { color: 'rgba(96, 165, 250, 0.3)' },
                horzLine: { color: 'rgba(96, 165, 250, 0.3)' },
            },
            rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.06)' },
            leftPriceScale: {
                visible: true,
                borderColor: 'rgba(255, 255, 255, 0.06)',
            },
            timeScale: { borderColor: 'rgba(255, 255, 255, 0.06)' },
        });

        const btcSeries = chart.addSeries(LineSeries, {
            color: '#e1e4e8',
            lineWidth: 2,
            priceScaleId: 'right',
        });
        btcSeries.setData(generateBtcData());

        const m2Series = chart.addSeries(AreaSeries, {
            topColor: 'rgba(96, 165, 250, 0.3)',
            bottomColor: 'rgba(96, 165, 250, 0.05)',
            lineColor: '#60a5fa',
            lineWidth: 1,
            priceScaleId: 'left',
        });
        m2Series.setData(generateM2Data());

        chartRef.current = chart;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: 220,
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        chart.timeScale().fitContent();

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">매크로 & 유동성 사이클</span>
                <div className={styles.legend}>
                    <span className={styles.legendItem}>
                        <span className={styles.legendLine} style={{ background: '#e1e4e8' }}></span>
                        비트코인 가격
                    </span>
                    <span className={styles.legendItem}>
                        <span className={styles.legendLine} style={{ background: '#60a5fa' }}></span>
                        글로벌 M2
                    </span>
                </div>
            </div>
            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}
