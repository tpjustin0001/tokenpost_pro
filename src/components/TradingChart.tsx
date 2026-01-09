'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, CandlestickData, Time, ISeriesApi, SeriesType, CrosshairMode } from 'lightweight-charts';
import { supabase } from '@/lib/supabase';
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
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

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
                // Binance intervals: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
                // Our props: '15m', '1h', '4h', '1d', '1w' -> Matches Binance
                const binanceSymbol = `${symbol}USDT`;
                const response = await fetch(`/api/klines?symbol=${binanceSymbol}&interval=${interval}&limit=100`);

                if (!response.ok) {
                    throw new Error('Failed to fetch chart data');
                }

                const data = await response.json();

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
                        // Don't throw here to avoid full crash, just log
                        console.warn('No candle data available', data);
                        setChartData([]);
                    }
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error('Chart data error:', err);
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchCandles();

        return () => {
            isMounted = false;
        };
    }, [symbol, interval]);

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
            } else {
                setNewsMarkers([]);
            }
        }
        fetchNewsMarkers();
    }, [symbol]);

    // Initialize Chart (Run once or when container changes)
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Initialize Chart
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
                mode: CrosshairMode.Normal,
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

        // Initialize Series
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

        // Resize handler
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

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
            }
        };
    }, []); // Only run once on mount (and unmount)

    // Update Data
    useEffect(() => {
        if (!seriesRef.current || !chartRef.current) return;

        // Update Candle Data
        if (chartData.length > 0) {
            seriesRef.current.setData(chartData);
            chartRef.current.timeScale().fitContent();
        }

        // Update Markers (Needs to happen after data set generally, or lightweight-charts handles it)
        if (seriesRef.current) {
            // Check if setMarkers exists before calling (it should for CandlestickSeries)
            // @ts-ignore
            if (typeof seriesRef.current.setMarkers === 'function') {
                // @ts-ignore
                seriesRef.current.setMarkers(newsMarkers || []);
            }
        }

    }, [chartData, newsMarkers]); // Run when data changes

    return (
        <div className={styles.chartWrapper}>
            {loading && (
                <div className={styles.loadingOverlay}>
                    <span>Loading...</span>
                </div>
            )}
            {error && (
                <div className={styles.errorOverlay}>
                    <span>{error}</span>
                </div>
            )}
            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}
