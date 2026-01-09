'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, HistogramSeries, ISeriesApi, CrosshairMode } from 'lightweight-charts';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import styles from './TradingChart.module.css';

interface TradingChartProps {
    symbol: string;
    interval?: string;
}

export default function TradingChart({ symbol, interval = '1d' }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartWrapperRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    // @ts-ignore
    const resizeObserver = useRef<ResizeObserver | null>(null);
    const { theme } = useTheme();

    // State
    const [chartData, setChartData] = useState<any[]>([]);
    const [newsMarkers, setNewsMarkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        let isMounted = true;
        async function fetchCandles() {
            setLoading(true);
            setError(null);
            try {
                const binanceSymbol = `${symbol}USDT`;
                // Try Binance.US first
                let response = await fetch(`https://api.binance.us/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=500`);

                if (response.status === 451 || !response.ok) {
                    response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=500`);
                }
                if (response.status === 451 || !response.ok) {
                    response = await fetch(`/api/klines?symbol=${binanceSymbol}&interval=${interval}&limit=200`);
                }

                if (!response.ok) throw new Error(await response.text());

                const data = await response.json();
                const candles = Array.isArray(data) ? data : data.candles;

                if (isMounted) {
                    if (candles && Array.isArray(candles)) {
                        const formatted = candles.map((c: any) => {
                            if (Array.isArray(c)) {
                                return {
                                    time: c[0] / 1000,
                                    open: parseFloat(c[1]),
                                    high: parseFloat(c[2]),
                                    low: parseFloat(c[3]),
                                    close: parseFloat(c[4]),
                                    volume: parseFloat(c[5]),
                                };
                            }
                            return c;
                        });
                        setChartData(formatted);
                    }
                    setLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error(err);
                    setError(err.message);
                    setLoading(false);
                }
            }
        }
        fetchCandles();
        return () => { isMounted = false; };
    }, [symbol, interval]);

    // WebSocket for Real-time Updates
    useEffect(() => {
        if (!symbol || !interval || chartData.length === 0) return;

        const wsSymbol = `${symbol.toLowerCase()}usdt`;
        const wsInterval = interval;
        const wsUrl = `wss://stream.binance.com:9443/ws/${wsSymbol}@kline_${wsInterval}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            // connected
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.e === 'kline') {
                const k = message.k;
                const candle = {
                    time: k.t / 1000,
                    open: parseFloat(k.o),
                    high: parseFloat(k.h),
                    low: parseFloat(k.l),
                    close: parseFloat(k.c),
                };
                const volume = {
                    time: k.t / 1000,
                    value: parseFloat(k.v),
                    color: parseFloat(k.c) >= parseFloat(k.o) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
                };

                if (candlestickSeriesRef.current) candlestickSeriesRef.current.update(candle as any);
                if (volumeSeriesRef.current) volumeSeriesRef.current.update(volume as any);
            }
        };

        return () => {
            if (ws.readyState === 1) ws.close();
        };
    }, [symbol, interval, chartData.length]);

    // Fetch News Markers
    useEffect(() => {
        let isMounted = true;
        async function fetchNews() {
            if (!supabase || chartData.length === 0) return;
            try {
                const { data } = await supabase
                    .from('news')
                    .select('*')
                    .eq('related_coin', symbol) // 'BTC'
                    .eq('show_on_chart', true);

                if (isMounted && data && data.length > 0) {
                    const markers: any[] = [];

                    data.forEach((item: any) => {
                        const newsTime = new Date(item.published_at).getTime() / 1000;
                        let closest = chartData[chartData.length - 1];
                        let minDiff = Number.MAX_VALUE;

                        const lastTime = chartData[chartData.length - 1].time as number;
                        if (Math.abs(lastTime - newsTime) < 3600 * 24 * 7) {
                            for (const c of chartData) {
                                const diff = Math.abs((c.time as number) - newsTime);
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    closest = c;
                                }
                            }
                        } else {
                            closest = chartData[chartData.length - 1];
                        }

                        // Force snap if diff is reasonably small (e.g. same candle interval)
                        // If logic is too strict, markers disappear.

                        if (closest) {
                            markers.push({
                                time: closest.time,
                                position: 'aboveBar',
                                color: (item.sentiment_score || 0) < 0 ? '#ef4444' : '#22c55e',
                                shape: 'arrowDown',
                                text: 'News: ' + item.title.substring(0, 15) + '...', // Shorten
                                id: item.id
                            });
                        }
                    });

                    markers.sort((a, b) => (a.time as number) - (b.time as number));
                    setNewsMarkers(markers);
                }
            } catch (e) {
                console.error(e);
            }
        }
        if (chartData.length > 0) fetchNews();
        return () => { isMounted = false; };
    }, [symbol, chartData]);

    // Chart Initialization
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const isDark = theme === 'dark' || !theme;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: isDark ? '#D9D9D9' : '#191919',
                fontFamily: 'Inter, sans-serif',
            },
            grid: {
                vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
                horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
            timeScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                timeVisible: true,
            },
            width: chartContainerRef.current.clientWidth,
            height: 350,
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });
        candlestickSeriesRef.current = candlestickSeries;

        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: '',
        });
        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });
        volumeSeriesRef.current = volumeSeries;

        chartRef.current = chart;

        const resizeCallback = (entries: ResizeObserverEntry[]) => {
            if (entries[0]?.contentRect && chartRef.current) {
                try {
                    chartRef.current.applyOptions({
                        width: entries[0].contentRect.width,
                        height: entries[0].contentRect.height
                    });
                } catch (e) { }
            }
        };

        const ro = new ResizeObserver(resizeCallback);
        if (chartWrapperRef.current) ro.observe(chartWrapperRef.current);
        // @ts-ignore
        resizeObserver.current = ro;

        return () => {
            if (resizeObserver.current) {
                // @ts-ignore
                resizeObserver.current.disconnect();
            }
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
            if (wsRef.current) wsRef.current.close();
        };

    }, [theme]);

    // Initial Data Rendering
    useEffect(() => {
        if (!candlestickSeriesRef.current || !volumeSeriesRef.current || chartData.length === 0) return;

        const candles = chartData.map(d => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));

        const volumes = chartData.map(d => ({
            time: d.time,
            value: d.volume,
            color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        }));

        candlestickSeriesRef.current.setData(candles);
        volumeSeriesRef.current.setData(volumes);

    }, [chartData]);

    // Update Markers
    useEffect(() => {
        if (candlestickSeriesRef.current && newsMarkers.length > 0) {
            const series = candlestickSeriesRef.current as any;
            if (series && typeof series.setMarkers === 'function') {
                try {
                    series.setMarkers(newsMarkers);
                } catch (e) {
                    console.error('Marker error', e);
                }
            }
        }
    }, [newsMarkers]);

    return (
        <div ref={chartWrapperRef} className={styles.chartWrapper}>
            {loading && <div className={styles.loadingOverlay}>Loading...</div>}
            {error && <div className={styles.errorOverlay}>{error}</div>}
            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}
