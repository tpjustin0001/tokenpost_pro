'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, CandlestickData, Time, ISeriesApi, SeriesType } from 'lightweight-charts';
import { supabase } from '@/lib/supabase';
import styles from './TradingChart.module.css';

interface TradingChartProps {
    symbol: string;
    data?: CandlestickData<Time>[];
}

interface NewsMarker {
    time: Time;
    position: 'aboveBar' | 'belowBar';
    color: string;
    shape: 'arrowDown' | 'arrowUp' | 'circle' | 'square';
    text: string;
}

// Generate mock OHLC data
function generateMockData(days: number = 90): CandlestickData<Time>[] {
    const data: CandlestickData<Time>[] = [];
    const now = Date.now();
    let basePrice = 50000 + Math.random() * 50000;

    for (let i = days; i >= 0; i--) {
        const time = Math.floor((now - i * 24 * 60 * 60 * 1000) / 1000) as Time;
        const volatility = basePrice * 0.03;
        const open = basePrice;
        const close = basePrice + (Math.random() - 0.5) * volatility * 2;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;

        data.push({ time, open, high, low, close });
        basePrice = close;
    }

    return data;
}

export default function TradingChart({ symbol, data }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
    const [newsMarkers, setNewsMarkers] = useState<NewsMarker[]>([]);

    // Fetch news markers from Supabase
    useEffect(() => {
        async function fetchNewsMarkers() {
            if (!supabase) return;

            // Convert symbol (e.g., "BTCUSDT") to coin code (e.g., "BTC")
            const coinCode = symbol.replace('USDT', '').replace('USD', '');

            const { data: newsItems } = await supabase
                .from('news')
                .select('published_at, title, sentiment_score')
                .eq('related_coin', coinCode)
                .eq('show_on_chart', true)
                .order('published_at', { ascending: true });

            if (newsItems && newsItems.length > 0) {
                const markers: NewsMarker[] = newsItems.map(item => ({
                    time: Math.floor(new Date(item.published_at).getTime() / 1000) as Time,
                    position: 'aboveBar',
                    color: (item.sentiment_score || 0) < 0 ? '#ef5350' : '#26a69a',
                    shape: 'arrowDown',
                    text: item.title,
                }));
                setNewsMarkers(markers);
            }
        }
        fetchNewsMarkers();
    }, [symbol]);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#8b949e',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
            },
            grid: {
                vertLines: { color: 'rgba(48, 54, 61, 0.5)' },
                horzLines: { color: 'rgba(48, 54, 61, 0.5)' },
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: 'rgba(88, 166, 255, 0.4)',
                    labelBackgroundColor: '#58a6ff',
                },
                horzLine: {
                    color: 'rgba(88, 166, 255, 0.4)',
                    labelBackgroundColor: '#58a6ff',
                },
            },
            rightPriceScale: {
                borderColor: '#30363d',
            },
            timeScale: {
                borderColor: '#30363d',
                timeVisible: true,
            },
            handleScroll: true,
            handleScale: true,
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#3fb950',
            downColor: '#f85149',
            borderUpColor: '#3fb950',
            borderDownColor: '#f85149',
            wickUpColor: '#3fb950',
            wickDownColor: '#f85149',
        });

        const chartData = data || generateMockData();
        candlestickSeries.setData(chartData);

        // Set news markers
        if (newsMarkers.length > 0) {
            // @ts-ignore - setMarkers is available but types may not include it
            candlestickSeries.setMarkers(newsMarkers);
        }

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: 350,
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
    }, [symbol, data, newsMarkers]);

    return (
        <div ref={chartContainerRef} className={styles.chart} />
    );
}
