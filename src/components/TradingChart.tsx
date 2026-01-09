'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, CandlestickData, Time, ISeriesApi, SeriesType, CrosshairMode } from 'lightweight-charts';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import styles from './TradingChart.module.css';

interface TradingChartProps {
    symbol: string;
    interval?: string; // e.g., '15m', '1h', '4h', '1d', '1w'
}

interface NewsMarker {
    time: Time;
    position: 'aboveBar' | 'belowBar';
    color: string;
    shape: 'arrowDown' | 'arrowUp' | 'circle' | 'square';
    text: string;
}

export default function TradingChart({ symbol, interval = '1d' }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartWrapperRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const resizeObserver = useRef<ResizeObserver | null>(null);
    const { theme } = useTheme(); // 'dark' or 'light'

    // State
    const [chartData, setChartData] = useState<CandlestickData<Time>[]>([]);
    const [newsMarkers, setNewsMarkers] = useState<NewsMarker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch Binance candle data
    useEffect(() => {
        let isMounted = true;

        async function fetchCandles() {
            setLoading(true);
            setError(null);

            try {
                // Ensure valid Binance interval
                const binanceSymbol = `${symbol}USDT`;

                // Try Binance.US first (likely Vercel server is in US)
                let apiUrl = `https://api.binance.us/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=150`;
                let response = await fetch(`/api/klines?symbol=${binanceSymbol}&interval=${interval}&limit=150`);

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(errText || `Failed to fetch chart data (${response.status})`);
                }

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                if (isMounted) {
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
                        console.warn('No candle data available', data);
                        setChartData([]);
                    }
                    setLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error('Chart data error:', err);
                    setError(err.message);
                    setLoading(false);
                }
            }
        }

        fetchCandles();

        return () => {
            isMounted = false;
        };
    }, [symbol, interval]);

    // Fetch news markers from Supabase (Dependent on chartData to match timestamps)
    useEffect(() => {
        let isMounted = true;

        async function fetchNewsMarkers() {
            if (!supabase || chartData.length === 0) return;

            try {
                const { data: newsItems } = await supabase
                    .from('news')
                    .select('published_at, title, sentiment_score')
                    .eq('related_coin', symbol)
                    .eq('show_on_chart', true)
                    .order('published_at', { ascending: true });

                if (isMounted && newsItems && newsItems.length > 0) {
                    const markers: NewsMarker[] = [];

                    newsItems.forEach(item => {
                        const newsTime = new Date(item.published_at).getTime() / 1000;

                        // Find closest candle time to attach marker
                        let closestCandle = chartData[0];
                        let minDiff = Math.abs((closestCandle.time as number) - newsTime);

                        for (const candle of chartData) {
                            const candleTime = candle.time as number;
                            const diff = Math.abs(candleTime - newsTime);

                            if (diff < minDiff) {
                                minDiff = diff;
                                closestCandle = candle;
                            }
                        }

                        markers.push({
                            time: closestCandle.time as Time,
                            position: 'aboveBar',
                            color: (item.sentiment_score || 0) < 0 ? '#f87171' : '#4ade80',
                            shape: 'arrowDown',
                            text: item.title,
                        });
                    });

                    setNewsMarkers(markers);
                } else if (isMounted) {
                    setNewsMarkers([]);
                }
            } catch (e) {
                console.error("Failed to load news markers", e);
            }
        }

        if (chartData.length > 0) {
            fetchNewsMarkers();
        }

        return () => { isMounted = false; };
    }, [symbol, chartData]);

    // Chart Options based on Theme
    const getChartOptions = (currentTheme: string) => {
        const isDark = currentTheme === 'dark';

        return {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: isDark ? '#9ca3af' : '#4b5563', // gray-400 : gray-600
                fontFamily: 'Roboto Mono, monospace',
                fontSize: 11,
            },
            grid: {
                vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' },
                horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    color: '#60a5fa',
                    labelBackgroundColor: '#60a5fa',
                },
                horzLine: {
                    color: '#60a5fa',
                    labelBackgroundColor: '#60a5fa',
                },
            },
            rightPriceScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            },
            timeScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                timeVisible: true,
                rightOffset: 12, // Add some space on the right to prevent clipping
            },
            handleScroll: true,
            handleScale: true,
        };
    };

    // Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Create Chart
        const chart = createChart(chartContainerRef.current, {
            ...getChartOptions(theme || 'dark'),
            width: chartContainerRef.current.clientWidth,
            height: 350,
        });

        // Add Series
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#4ade80',
            downColor: '#f87171',
            borderUpColor: '#4ade80',
            borderDownColor: '#f87171',
            wickUpColor: '#4ade80',
            wickDownColor: '#f87171',
        });

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        // Resize Observer
        resizeObserver.current = new ResizeObserver(entries => {
            if (entries.length === 0 || !entries[0].contentRect) return;
            const { width, height } = entries[0].contentRect;
            chart.applyOptions({ width, height });
        });

        if (chartWrapperRef.current) {
            resizeObserver.current.observe(chartWrapperRef.current);
        }

        return () => {
            if (resizeObserver.current) {
                resizeObserver.current.disconnect();
            }
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
            }
        };
    }, []); // Run once

    // Update Theme
    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.applyOptions(getChartOptions(theme || 'dark'));
        }
    }, [theme]);

    // Update Data
    useEffect(() => {
        if (!seriesRef.current || !chartRef.current) return;

        if (chartData.length > 0) {
            seriesRef.current.setData(chartData);
            chartRef.current.timeScale().fitContent();
        }

        if (seriesRef.current) {
            // @ts-ignore
            if (typeof seriesRef.current.setMarkers === 'function') {
                // @ts-ignore
                seriesRef.current.setMarkers(newsMarkers || []);
            }
        }

    }, [chartData, newsMarkers]);

    return (
        <div ref={chartWrapperRef} className={styles.chartWrapper}>
            {loading && (
                <div className={styles.loadingOverlay}>
                    <span>Loading...</span>
                </div>
            )}
            {error && (
                <div className={styles.errorOverlay}>
                    <span>{error?.includes('403') ? 'API Limit/Restricted' : error}</span>
                </div>
            )}
            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}
