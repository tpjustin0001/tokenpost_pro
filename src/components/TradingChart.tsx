'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, CandlestickData, Time, ISeriesApi, SeriesType } from 'lightweight-charts';
import { supabase } from '@/lib/supabase';
import styles from './TradingChart.module.css';

interface TradingChartProps {
    symbol: string;
}

interface NewsMarker {
    time: Time;
    position: 'aboveBar' | 'belowBar';
    color: string;
    shape: 'arrowDown' | 'arrowUp' | 'circle' | 'square';
    text: string;
}

export default function TradingChart({ symbol }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
    const [chartData, setChartData] = useState<CandlestickData<Time>[]>([]);
    const [newsMarkers, setNewsMarkers] = useState<NewsMarker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch Binance candle data
    useEffect(() => {
        async function fetchCandles() {
            setLoading(true);
            setError(null);

            try {
                const binanceSymbol = `${symbol}USDT`;
                const response = await fetch(`/api/klines?symbol=${binanceSymbol}&interval=1d&limit=100`);

                if (!response.ok) {
                    throw new Error('Failed to fetch chart data');
                }

                const data = await response.json();

                if (data.candles && data.candles.length > 0) {
                    const formattedCandles = data.candles.map((c: any) => ({
                        time: c.time as Time,
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close,
                    }));
                    setChartData(formattedCandles);
                } else {
                    throw new Error('No candle data available');
                }
            } catch (err: any) {
                console.error('Chart data error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchCandles();
    }, [symbol]);

    // Fetch news markers from Supabase
    useEffect(() => {
        async function fetchNewsMarkers() {
            if (!supabase) return;

            const { data: newsItems } = await supabase
                .from('news')
                .select('published_at, title, sentiment_score')
                .eq('related_coin', symbol)
                .eq('show_on_chart', true)
                .order('published_at', { ascending: true });

            if (newsItems && newsItems.length > 0) {
                const markers: NewsMarker[] = newsItems.map(item => ({
                    time: Math.floor(new Date(item.published_at).getTime() / 1000) as Time,
                    position: 'aboveBar',
                    color: (item.sentiment_score || 0) < 0 ? '#f87171' : '#4ade80',
                    shape: 'arrowDown',
                    text: item.title,
                }));
                setNewsMarkers(markers);
            }
        }
        fetchNewsMarkers();
    }, [symbol]);

    // Create/update chart
    useEffect(() => {
        if (!chartContainerRef.current || chartData.length === 0) return;

        // Cleanup existing chart
        if (chartRef.current) {
            chartRef.current.remove();
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af',
                fontFamily: 'Roboto Mono, monospace',
                fontSize: 11,
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: 'rgba(96, 165, 250, 0.3)',
                    labelBackgroundColor: '#60a5fa',
                },
                horzLine: {
                    color: 'rgba(96, 165, 250, 0.3)',
                    labelBackgroundColor: '#60a5fa',
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.06)',
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.06)',
                timeVisible: true,
            },
            handleScroll: true,
            handleScale: true,
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#4ade80',
            downColor: '#f87171',
            borderUpColor: '#4ade80',
            borderDownColor: '#f87171',
            wickUpColor: '#4ade80',
            wickDownColor: '#f87171',
        });

        candlestickSeries.setData(chartData);

        // Set news markers
        if (newsMarkers.length > 0) {
            // @ts-ignore
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
    }, [chartData, newsMarkers]);

    if (loading) {
        return (
            <div className={styles.chart}>
                <div className={styles.loading}>차트 로딩 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.chart}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    return (
        <div ref={chartContainerRef} className={styles.chart} />
    );
}
