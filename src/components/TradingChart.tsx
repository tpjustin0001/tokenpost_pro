'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, MouseEventParams } from 'lightweight-charts';
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

    // Data State
    const [chartData, setChartData] = useState<any[]>([]);
    const [newsMarkers, setNewsMarkers] = useState<any[]>([]);
    // Use a ref for newsMap to access it inside the click handler closure without re-binding
    const newsMapRef = useRef<Record<string, any>>({});

    const [selectedNews, setSelectedNews] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLive, setIsLive] = useState(false);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [debugMsg, setDebugMsg] = useState<string>('');

    // 1. Initial Data Fetch
    useEffect(() => {
        let isMounted = true;
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const binanceSymbol = `${symbol}USDT`;
                // Try Futures first
                let response = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${binanceSymbol}&interval=${interval}&limit=500`);
                if (!response.ok) {
                    // Fallback to Spot
                    response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=500`);
                }
                if (!response.ok) throw new Error("Failed to fetch data");

                const data = await response.json();
                const rawCandles = Array.isArray(data) ? data : data.candles;

                if (isMounted && rawCandles) {
                    const formatted = rawCandles.map((c: any) => ({
                        time: c[0] / 1000, // Unix timestamp (seconds)
                        open: parseFloat(c[1]),
                        high: parseFloat(c[2]),
                        low: parseFloat(c[3]),
                        close: parseFloat(c[4]),
                        volume: parseFloat(c[5]),
                    }));
                    setChartData(formatted);

                    if (formatted.length > 0) {
                        setCurrentPrice(formatted[formatted.length - 1].close);
                    }
                    setLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        }
        fetchData();
        return () => { isMounted = false; };
    }, [symbol, interval]);

    // 2. Fetch News (Depends on ChartData being ready)
    useEffect(() => {
        if (!supabase || chartData.length === 0) return;

        async function fetchNews() {
            try {
                const { data, error } = await supabase!
                    .from('news')
                    .select('*')
                    .eq('related_coin', symbol)
                    .eq('show_on_chart', true);

                if (data && data.length > 0) {
                    const markers: any[] = [];
                    const map: Record<string, any> = {};

                    data.forEach((item: any) => {
                        map[item.id] = item;

                        const newsTime = new Date(item.published_at).getTime() / 1000;
                        // Find closest candle time
                        let minDiff = Number.MAX_VALUE;
                        let closestTime: number | null = null;

                        for (const c of chartData) {
                            const diff = Math.abs((c.time as number) - newsTime);
                            if (diff < minDiff) {
                                minDiff = diff;
                                closestTime = c.time as number;
                            }
                        }

                        if (closestTime && minDiff < 86400) { // Within 24hr
                            markers.push({
                                time: closestTime,
                                position: 'aboveBar',
                                color: (item.sentiment_score || 0) < 0 ? '#ef4444' : '#22c55e',
                                shape: 'arrowDown',
                                text: 'NEWS',
                                size: 2,
                                id: item.id
                            });
                        }
                    });

                    markers.sort((a, b) => (a.time as number) - (b.time as number));
                    setNewsMarkers(markers);
                    newsMapRef.current = map; // Update Ref
                    setDebugMsg(`News Loaded: ${markers.length}`);
                }
            } catch (e: any) {
                console.error(e);
            }
        }
        fetchNews();
    }, [symbol, chartData]); // Only refetch if symbol/data changes

    // 3. WebSocket Setup
    useEffect(() => {
        if (!symbol || !interval) return;

        const wsUrl = `wss://fstream.binance.com/ws/${symbol.toLowerCase()}usdt@kline_${interval}`;
        if (wsRef.current) wsRef.current.close();

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setIsLive(true);
        ws.onclose = () => setIsLive(false);
        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.e === 'kline') {
                    const k = msg.k;
                    const c = {
                        time: k.t / 1000,
                        open: parseFloat(k.o),
                        high: parseFloat(k.h),
                        low: parseFloat(k.l),
                        close: parseFloat(k.c),
                    };
                    setCurrentPrice(c.close);

                    if (candlestickSeriesRef.current) {
                        candlestickSeriesRef.current.update(c as any);
                    }
                    if (volumeSeriesRef.current) {
                        volumeSeriesRef.current.update({
                            time: c.time,
                            value: parseFloat(k.v),
                            color: c.close >= c.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
                        } as any);
                    }
                }
            } catch (e) { }
        };

        return () => {
            if (ws.readyState === 1) ws.close();
        };
    }, [symbol, interval]);

    // 4. Chart Initialization (Run ONCE)
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
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                scaleMargins: { top: 0.2, bottom: 0.2 },
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
            },
        });

        const candleSeries = chart.addCandlestickSeries({
            upColor: '#26a69a', downColor: '#ef5350',
            borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350',
        });
        candlestickSeriesRef.current = candleSeries;

        const volSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });
        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
            visible: false,
        });
        volumeSeriesRef.current = volSeries;
        chartRef.current = chart;

        // Click Logic
        chart.subscribeClick((param: MouseEventParams) => {
            const clickTime = param.time as number;
            // Use current ref value for map
            const currentMap = newsMapRef.current;

            if (clickTime) {
                // Determine if there's a marker at this time
                // We need to access the LATEST markers. 
                // Since this closure is created once, we'll need to look up via the series or a ref.
                // However, accessing state inside this stale closure is unsafe.
                // Best way: check if ANY news exists for this time in the map.

                // We stored news in newsMap by ID. 
                // Let's iterate values of newsMapRef.current to find time match? 
                // Or better, let's just find if any marker matches this time.
                // WE CANNOT ACCESS newsMarkers state here easily if it's stale.
                // BUT we can assume newsMapRef is up to date.

                const matches = Object.values(currentMap).find((item: any) => {
                    // Match against chart bars is tricky without the exact aligned time.
                    // But we can check if we have a mapped marker time.
                    // Let's try to rebuild the match logic or store a time->news map.
                    return false; // Conceptual placeholder
                });

                // Better: Just use a global variable or ref for [time -> newsId] map
                // For now, let's use the debug overlay to inspect 'clickTime'
                setDebugMsg(`Clicked Time: ${clickTime}`);
            }
        });

        // Resize
        const resizeCallback = (ent: ResizeObserverEntry[]) => {
            if (ent[0]?.contentRect && chart) {
                chart.applyOptions({ width: ent[0].contentRect.width, height: ent[0].contentRect.height });
            }
        };
        const ro = new ResizeObserver(resizeCallback);
        if (chartWrapperRef.current) ro.observe(chartWrapperRef.current);
        resizeObserver.current = ro;

        return () => {
            chart.remove();
            chartRef.current = null;
            ro.disconnect();
        };
    }, []); // Empty dependency -> Run once

    // 5. Update Data Series
    useEffect(() => {
        if (!candlestickSeriesRef.current || chartData.length === 0) return;

        const cData = chartData.map(d => ({ ...d, time: d.time as Time }));
        const vData = chartData.map(d => ({
            time: d.time as Time,
            value: d.volume,
            color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
        }));

        candlestickSeriesRef.current.setData(cData);
        volumeSeriesRef.current?.setData(vData);

    }, [chartData]); // Update when data loads

    // 6. Update Markers & Event Handler (Re-bind click if needed or use Ref)
    useEffect(() => {
        if (!candlestickSeriesRef.current || newsMarkers.length === 0 || !chartRef.current) return;

        candlestickSeriesRef.current.setMarkers(newsMarkers);
        // Handler logic is managed via Ref, no need to resubscribe.

    }, [newsMarkers]);

    // 7. Click Handler with Refs (To ensure always fresh access)
    // We update a Ref that holds the lookup logic
    const clickHandlerRef = useRef<(t: number) => void>(() => { });

    useEffect(() => {
        clickHandlerRef.current = (clickTime: number) => {
            // Find news with this EXACT candle time
            const marker = newsMarkers.find(m => Math.abs((m.time as number) - clickTime) < 1); // tolerance just in case
            if (marker && marker.id && newsMapRef.current[marker.id]) {
                const news = newsMapRef.current[marker.id];
                setDebugMsg(`OPENING: ${news.title.substring(0, 10)}...`);
                setSelectedNews(news);
            } else {
                setDebugMsg(`Time: ${clickTime} | No News`);
            }
        };
    }, [newsMarkers]);

    // Attach the perpetual listener that calls the Ref
    useEffect(() => {
        if (chartRef.current) {
            const handler = (p: MouseEventParams) => {
                if (p.time) {
                    clickHandlerRef.current(p.time as number);
                }
            };
            chartRef.current.subscribeClick(handler);
            // No clean way to unsubscribe specific handler without reference, 
            // but since this effect runs once (dependent on chartRef creation), it's fine.
        }
    }, [chartRef.current]); // Runs when chart is created


    return (
        <div ref={chartWrapperRef} className={styles.chartWrapper}>
            <div style={{ position: 'absolute', top: 40, left: 12, zIndex: 50, color: 'gold', background: 'rgba(0,0,0,0.7)', pointerEvents: 'none' }}>
                [DEBUG] {debugMsg}
            </div>

            {/* Manual Trigger for Testing */}
            <div style={{ position: 'absolute', top: 10, right: 60, zIndex: 100 }}>
                <button onClick={() => {
                    setDebugMsg("Manual Test Clicked");
                    setSelectedNews({ title: "Test News", content: "This is a test.", sentiment_score: 0.5, published_at: new Date().toISOString() });
                }} style={{ background: 'blue', color: 'white', padding: '5px', fontSize: '10px' }}>
                    TEST MODAL
                </button>
            </div>

            {selectedNews && (
                <div style={{
                    position: 'fixed', // Changed to fixed
                    top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    zIndex: 9999, // Super high
                    background: '#1f2937', color: 'white', padding: '20px', borderRadius: '8px',
                    boxShadow: '0 0 50px rgba(0,0,0,0.8)',
                    width: '300px', border: '1px solid #374151'
                }}>
                    <h4>{selectedNews.title}</h4>
                    <p style={{ fontSize: '12px', margin: '10px 0', opacity: 0.8 }}>{selectedNews.content?.substring(0, 100)}...</p>
                    <button onClick={() => setSelectedNews(null)} style={{ width: '100%', padding: '5px', background: '#4b5563' }}>Close</button>
                </div>
            )}

            {selectedNews && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }} onClick={() => setSelectedNews(null)} />}

            {loading && <div className={styles.loadingOverlay}>Loading...</div>}
            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}
