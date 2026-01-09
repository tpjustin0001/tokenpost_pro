'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CrosshairMode, Time } from 'lightweight-charts';
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
    // V4: Series types are generic, but we use any for simplicity in refs or specific interfaces if imported
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

    // Fetch and Initialize Data
    useEffect(() => {
        let isMounted = true;

        async function init() {
            setLoading(true);
            setError(null);

            try {
                const binanceSymbol = `${symbol}USDT`;

                // Fetch Data
                let response = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${binanceSymbol}&interval=${interval}&limit=500`);
                if (!response.ok) {
                    response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=500`);
                }

                if (!response.ok) throw new Error(await response.text());

                const data = await response.json();
                const rawCandles = Array.isArray(data) ? data : data.candles;

                if (isMounted && rawCandles) {
                    const formatted = rawCandles.map((c: any) => ({
                        time: c[0] / 1000,
                        open: parseFloat(c[1]),
                        high: parseFloat(c[2]),
                        low: parseFloat(c[3]),
                        close: parseFloat(c[4]),
                        volume: parseFloat(c[5]),
                    }));

                    setChartData(formatted); // Save state
                    if (formatted.length > 0) {
                        setCurrentPrice(formatted[formatted.length - 1].close);
                    }

                    if (isMounted) setLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error(err);
                    setError(err.message);
                    setLoading(false);
                }
            }
        }

        init();

        return () => { isMounted = false; };
    }, [symbol, interval]);

    // WebSocket (Futures)
    useEffect(() => {
        if (!symbol || !interval) return;

        const wsSymbol = `${symbol.toLowerCase()}usdt`;
        const wsInterval = interval;
        const wsUrl = `wss://fstream.binance.com/ws/${wsSymbol}@kline_${wsInterval}`;

        // Cleanup previous websocket properly
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsLive(true);
        };

        ws.onclose = () => {
            setIsLive(false);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.e === 'kline') {
                    const k = message.k;
                    const closePrice = parseFloat(k.c);
                    setCurrentPrice(closePrice);

                    const candleTime = k.t / 1000;

                    // Update Chart Series directly
                    if (candlestickSeriesRef.current) {
                        const candle = {
                            time: candleTime,
                            open: parseFloat(k.o),
                            high: parseFloat(k.h),
                            low: parseFloat(k.l),
                            close: closePrice,
                        };
                        candlestickSeriesRef.current.update(candle as any);
                    }

                    if (volumeSeriesRef.current) {
                        const volume = {
                            time: candleTime,
                            value: parseFloat(k.v),
                            color: parseFloat(k.c) >= parseFloat(k.o) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
                        };
                        volumeSeriesRef.current.update(volume as any);
                    }
                }
            } catch (e) {
                console.error('WS Error', e);
            }
        };

        return () => {
            if (wsRef.current === ws) {
                ws.close();
                wsRef.current = null;
            }
        };
    }, [symbol, interval]);

    // Fetch News Markers
    useEffect(() => {
        let isMounted = true;
        async function fetchNews() {
            if (!supabase || chartData.length === 0) return;
            try {
                setDebugMsg('Fetching News...');
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

                            // Iterate all for matching
                            for (const c of chartData) {
                                const diff = Math.abs((c.time as number) - newsTime);
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    closest = c;
                                }
                            }

                            // Accept if within 24 hours (generous matching)
                            if (minDiff < 3600 * 24 && closest) {
                                markers.push({
                                    time: closest.time as Time,
                                    position: 'aboveBar' as const,
                                    color: (item.sentiment_score || 0) < 0 ? '#ef4444' : '#22c55e',
                                    shape: 'arrowDown' as const,
                                    text: 'NEWS',
                                    size: 2,
                                    id: item.id // custom field, library ignores it
                                });
                            }
                        });

                        markers.sort((a, b) => (a.time as number) - (b.time as number));
                        setNewsMarkers(markers);

                        if (markers.length > 0) {
                            const lastTime = chartData[chartData.length - 1].time;
                            setDebugMsg(`Markers: ${markers.length} | LastT: ${lastTime}`);
                        } else {
                            setDebugMsg(`No markers match (fetched ${data.length})`);
                        }
                    } else {
                        setDebugMsg(`Fetched: 0 news`);
                    }
                }
            } catch (e: any) {
                console.error(e);
                if (isMounted) setDebugMsg(`JS Error: ${e.message}`);
            }
        }

        if (chartData.length > 0) {
            fetchNews();
        }

        return () => { isMounted = false; };
    }, [symbol, chartData]);

    // Initialize Chart & Apply Data & Markers (V4 Syntax)
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Cleanup old chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

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
            rightPriceScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                scaleMargins: {
                    top: 0.2,
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

        // V4: addCandlestickSeries
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });
        candlestickSeriesRef.current = candlestickSeries;

        // V4: addHistogramSeries
        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume', // Separate Scale
        });

        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
            visible: false,
        });

        volumeSeriesRef.current = volumeSeries;
        chartRef.current = chart;

        // Apply Data
        if (chartData.length > 0) {
            const candles = chartData.map(d => ({
                time: d.time as Time,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            }));
            const volumes = chartData.map(d => ({
                time: d.time as Time,
                value: d.volume,
                color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
            }));

            candlestickSeries.setData(candles);
            volumeSeries.setData(volumes);

            // Markers
            if (newsMarkers.length > 0) {
                candlestickSeries.setMarkers(newsMarkers);
                // Temporarily force update debug msg if needed, but handled in fetchNews
            }
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
        };

    }, [theme, chartData, newsMarkers]); // Re-render when markers ready

    return (
        <div ref={chartWrapperRef} className={styles.chartWrapper}>
            {/* Debug Overlay */}
            <div style={{ position: 'absolute', top: 40, left: 12, color: '#fbbf24', fontSize: '11px', zIndex: 100, pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
                [NEWS DEBUG] {debugMsg}
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
