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

    // Initial Data Fetch (Futures)
    useEffect(() => {
        let isMounted = true;
        async function fetchCandles() {
            setLoading(true);
            setError(null);
            try {
                const binanceSymbol = `${symbol}USDT`;

                // Binance Futures API
                let response = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${binanceSymbol}&interval=${interval}&limit=500`);

                // Fallback
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
                        // Initial Price
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

    // WebSocket for Real-time Updates (Futures)
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

                // Safety check
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
                // Debug: Check if Supabase is connected
                const { data, error } = await supabase
                    .from('news')
                    .select('*')
                    .eq('related_coin', symbol)
                    .eq('show_on_chart', true);

                if (error) {
                    console.error('Supabase fetch error:', error);
                    if (isMounted) setDebugMsg(`DB Error: ${error.message}`);
                    return;
                }

                if (isMounted) {
                    setDebugMsg(`Fetched: ${data?.length || 0} items for ${symbol}`);
                    if (data && data.length > 0) {
                        const markers: any[] = [];

                        data.forEach((item: any) => {
                            const newsTime = new Date(item.published_at).getTime() / 1000;
                            let closest = chartData[chartData.length - 1];
                            let minDiff = Number.MAX_VALUE;

                            const lastTime = chartData[chartData.length - 1].time as number;
                            // Check if within reasonable range (7 days)
                            if (Math.abs(lastTime - newsTime) < 3600 * 24 * 7) {
                                for (const c of chartData) {
                                    const diff = Math.abs((c.time as number) - newsTime);
                                    if (diff < minDiff) {
                                        minDiff = diff;
                                        closest = c;
                                    }
                                }
                            } else {
                                // If too old/new, ignore for now (or force to latest for demo?)
                                // closest = chartData[chartData.length - 1]; 
                            }

                            // If diff is reasonable (< 4 hours), add marker
                            if (minDiff < 3600 * 4 && closest) {
                                markers.push({
                                    time: closest.time,
                                    position: 'aboveBar',
                                    color: (item.sentiment_score || 0) < 0 ? '#ef4444' : '#22c55e',
                                    shape: 'arrowDown',
                                    text: 'News: ' + item.title.substring(0, 15) + '...',
                                    id: item.id
                                });
                            }
                        });

                        markers.sort((a, b) => (a.time as number) - (b.time as number));
                        setNewsMarkers(markers);
                        if (markers.length > 0) {
                            setDebugMsg(prev => `${prev} | Markers: ${markers.length}`);
                        } else {
                            setDebugMsg(prev => `${prev} | No markers match (Time diff too big?)`);
                        }
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
                scaleMargins: {
                    top: 0.2, // 마커 공간 확보
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

        // Re-apply markers after data reset
        if (newsMarkers.length > 0) {
            (candlestickSeriesRef.current as any).setMarkers(newsMarkers);
        }

    }, [chartData, newsMarkers]);

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
            {/* Debug Overlay */}
            <div style={{ position: 'absolute', top: 40, left: 12, color: '#fbbf24', fontSize: '11px', zIndex: 50, pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
                [Debug] Supabase: {debugMsg}
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
        </div>
    );
}
