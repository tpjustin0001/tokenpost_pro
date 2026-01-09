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

export default function TradingChart({ symbol, interval = '15m' }: TradingChartProps) {
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
    const [isLive, setIsLive] = useState(false);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [debugMsg, setDebugMsg] = useState<string>('');

    // Initial Data Fetch
    useEffect(() => {
        let isMounted = true;
        async function fetchCandles() {
            setLoading(true);
            setError(null);
            try {
                const binanceSymbol = `${symbol}USDT`;

                // Binance Futures API
                let response = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${binanceSymbol}&interval=${interval}&limit=500`);

                if (!response.ok) {
                    console.warn('Futures API failed, trying Spot API');
                    response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=500`);
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
                        if (formatted.length > 0) {
                            setCurrentPrice(formatted[formatted.length - 1].close);
                        }
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

    // WebSocket (Futures)
    useEffect(() => {
        if (!symbol || !interval) return;

        const wsSymbol = `${symbol.toLowerCase()}usdt`;
        const wsInterval = interval;
        const wsUrl = `wss://fstream.binance.com/ws/${wsSymbol}@kline_${wsInterval}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsLive(true);
        };

        ws.onclose = () => {
            setIsLive(false);
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.e === 'kline') {
                const k = message.k;
                const closePrice = parseFloat(k.c);
                setCurrentPrice(closePrice);

                const candleTime = k.t / 1000;

                const lastData = candlestickSeriesRef.current?.data().slice(-1)[0] as any;
                if (lastData && candleTime < (lastData.time as number)) {
                    return;
                }

                const candle = {
                    time: candleTime,
                    open: parseFloat(k.o),
                    high: parseFloat(k.h),
                    low: parseFloat(k.l),
                    close: closePrice,
                };
                const volume = {
                    time: candleTime,
                    value: parseFloat(k.v),
                    color: parseFloat(k.c) >= parseFloat(k.o) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
                };

                try {
                    if (candlestickSeriesRef.current) candlestickSeriesRef.current.update(candle as any);
                    if (volumeSeriesRef.current) volumeSeriesRef.current.update(volume as any);
                } catch (e) {
                    console.error('Chart update error', e);
                }
            }
        };

        return () => {
            if (ws.readyState === 1) ws.close();
        };
    }, [symbol, interval]);

    // Fetch News Markers
    useEffect(() => {
        let isMounted = true;
        async function fetchNews() {
            if (!supabase || chartData.length === 0) return;
            try {
                const { data, error } = await supabase
                    .from('news')
                    .select('*')
                    .eq('related_coin', symbol)
                    .eq('show_on_chart', true);

                if (error) {
                    if (isMounted) setDebugMsg(`DB Error: ${error.message}`);
                    return;
                }

                if (isMounted) {
                    if (data && data.length > 0) {
                        const markers: any[] = [];

                        data.forEach((item: any) => {
                            const newsTime = new Date(item.published_at).getTime() / 1000;
                            let closest = chartData[chartData.length - 1];
                            let minDiff = Number.MAX_VALUE;

                            // Iterate all for safety
                            for (const c of chartData) {
                                const diff = Math.abs((c.time as number) - newsTime);
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    closest = c;
                                }
                            }

                            // Accept if within 1 day (for easier matching)
                            if (minDiff < 3600 * 24 && closest) {
                                markers.push({
                                    time: closest.time, // Must match exact candle time
                                    position: 'aboveBar', // Back to aboveBar
                                    color: '#facc15', // Yellow
                                    shape: 'arrowDown', // Big Arrow
                                    size: 2,
                                    text: 'NEWS',
                                    id: item.id
                                });
                            }
                        });

                        markers.sort((a, b) => (a.time as number) - (b.time as number));
                        setNewsMarkers(markers);

                        if (markers.length > 0) {
                            const lastTime = chartData[chartData.length - 1].time;
                            const markerTime = markers[markers.length - 1].time;
                            setDebugMsg(`M: ${markers.length} | LastT: ${lastTime} | MarkerT: ${markerTime}`);
                        } else {
                            setDebugMsg(`No match`);
                        }
                    } else {
                        setDebugMsg(`Fetched: 0`);
                    }
                }
            } catch (e: any) {
                console.error(e);
                if (isMounted) setDebugMsg(`JS Error: ${e.message}`);
            }
        }
        if (chartData.length > 0) fetchNews();
        return () => { isMounted = false; };
    }, [symbol, chartData]);

    // Chart Initialization & Marker Rendering
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
                scaleMargins: {
                    top: 0.2, // Ensure space for aboveBar markers
                    bottom: 0.2,
                },
            },
            timeScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                timeVisible: true,
            },
            // @ts-ignore
            watermark: {
                visible: true,
                fontSize: 24,
                horzAlign: 'center',
                vertAlign: 'center',
                color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                text: `BINANCE FUTURES: ${symbol}USDT`,
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

        // Separate Volume Series
        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume', // Separate Scale
        });

        // Configure Volume Scale
        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
            visible: false, // Hide volume axis labels
        });

        volumeSeriesRef.current = volumeSeries;

        chartRef.current = chart;

        // Initial Data Render
        if (chartData.length > 0) {
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
            candlestickSeries.setData(candles);
            volumeSeries.setData(volumes);
        }

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

    }, [theme, chartData]); // Re-create chart if needed? ideally not but for simplicity

    // Update Markers Effect (Separated)
    useEffect(() => {
        if (candlestickSeriesRef.current && newsMarkers.length > 0) {
            const series = candlestickSeriesRef.current as any;
            const setMarkersFn = series.setMarkers;

            if (typeof setMarkersFn === 'function') {
                try {
                    setMarkersFn.call(series, newsMarkers);
                    setDebugMsg(prev => `${prev} | SetMarkers: OK`);
                } catch (e: any) {
                    setDebugMsg(prev => `${prev} | SetMarkers Error: ${e.message}`);
                }
            } else {
                setDebugMsg(prev => `${prev} | SetMarkers: Missing`);
            }
        }
    }, [newsMarkers, chartData]); // Ensure it runs when data or markers update

    return (
        <div ref={chartWrapperRef} className={styles.chartWrapper}>
            {/* Debug Overlay */}
            <div style={{ position: 'absolute', top: 40, left: 12, color: '#fbbf24', fontSize: '11px', zIndex: 50, pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
                [Debug] {debugMsg}
            </div>

            {isLive && (
                <div className={styles.liveStatus}>
                    {currentPrice && (
                        <span className={styles.livePrice}>
                            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    )}
                    <div className={styles.liveDot} />
                    <span>LIVE</span>
                </div>
            )}
            {loading && <div className={styles.loadingOverlay}>Loading...</div>}
            {error && (chartData.length === 0) && <div className={styles.errorOverlay}>{error}</div>}
            <div ref={chartContainerRef} className={styles.chart} />
            <div id="chart-watermark" style={{ display: 'none' }}>BINANCE FUTURES</div>
        </div>
    );
}
