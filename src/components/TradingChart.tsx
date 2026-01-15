'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, MouseEventParams } from 'lightweight-charts';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import styles from './TradingChart.module.css';
import XRayTooltip from './XRayTooltip';

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
    const clickHandlerRef = useRef<(t: number) => void>(() => { });

    const [selectedNews, setSelectedNews] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLive, setIsLive] = useState(false);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);

    const [dataSource, setDataSource] = useState<'futures' | 'spot'>('futures');

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
                let type: 'futures' | 'spot' = 'futures';

                if (!response.ok) {
                    // Fallback to Spot
                    response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=500`);
                    type = 'spot';
                }

                if (!response.ok) throw new Error("Failed to fetch data");

                const data = await response.json();
                const rawCandles = Array.isArray(data) ? data : data.candles;

                if (isMounted && rawCandles) {
                    const formatted = rawCandles.map((c: any) => ({
                        time: (c[0] / 1000) + (9 * 60 * 60), // KST Offset
                        open: parseFloat(c[1]),
                        high: parseFloat(c[2]),
                        low: parseFloat(c[3]),
                        close: parseFloat(c[4]),
                        volume: parseFloat(c[5]),
                    }));
                    setChartData(formatted);
                    setDataSource(type);

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

    // 2. Fetch News Markers (Real-time)
    useEffect(() => {
        if (!supabase) return;

        async function fetchMarkers() {
            if (!supabase) return;
            // Get news for this coin (e.g. BTC) or generic Market news
            const targetCoin = symbol.replace('USDT', '').replace('USD', '');

            const { data, error } = await supabase
                .from('news')
                .select('*')
                .eq('show_on_chart', true)
                .order('published_at', { ascending: false })
                .limit(50);

            if (data) {
                const markers = data
                    .filter(item => {
                        // Filter by symbol match or global market news
                        if (item.related_coin && item.related_coin !== targetCoin) return false;
                        return true;
                    })
                    .map(item => {
                        // KST Offset for markers
                        const time = (new Date(item.published_at).getTime() / 1000) + (9 * 60 * 60);
                        const isBullish = (item.sentiment_score || 0) > 0;

                        // Store full item in map for click retrieval
                        newsMapRef.current[item.id] = item;

                        return {
                            time: time,
                            position: isBullish ? 'belowBar' : 'aboveBar',
                            color: isBullish ? '#00E396' : '#FF4560',
                            shape: isBullish ? 'arrowUp' : 'arrowDown',
                            id: item.id,
                            size: 2,  // 크게 표시
                        };
                    });

                // Sort by time ascending for Lightweight Charts
                markers.sort((a, b) => (a.time as number) - (b.time as number));
                setNewsMarkers(markers);
            }
        }

        fetchMarkers();

        // Subscribe to new markers
        const channel = supabase
            .channel('chart-markers')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news', filter: 'show_on_chart=eq.true' }, (payload) => {
                fetchMarkers(); // Refresh on new insert
            })
            .subscribe();

        return () => {
            supabase?.removeChannel(channel);
        };
    }, [symbol]);

    // 3. WebSocket Setup
    useEffect(() => {
        if (!symbol || !interval || loading) return; // Wait for loading to finish to know dataSource

        const wsEndpoint = dataSource === 'futures'
            ? 'wss://fstream.binance.com/ws'
            : 'wss://stream.binance.com:9443/ws';

        const wsUrl = `${wsEndpoint}/${symbol.toLowerCase()}usdt@kline_${interval}`;

        if (wsRef.current) wsRef.current.close();

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setIsLive(true);
        // ws.onclose = () => setIsLive(false); // Don't flicker status on potential reconnects
        ws.onerror = (e) => console.warn("WS Error:", e);

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.e === 'kline') {
                    const k = msg.k;
                    const c = {
                        time: (k.t / 1000) + (9 * 60 * 60), // KST Offset
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
            if (ws.readyState === 1 || ws.readyState === 0) ws.close();
        };
    }, [symbol, interval, dataSource, loading]);

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
                vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
                horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
            },
            rightPriceScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                scaleMargins: { top: 0.2, bottom: 0.2 },
            },
            timeScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
            localization: {
                locale: 'ko-KR',
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

        // Resize
        const resizeCallback = (ent: ResizeObserverEntry[]) => {
            // Check if chart is still valid before resizing
            if (ent[0]?.contentRect && chartRef.current) {
                try {
                    chartRef.current.applyOptions({ width: ent[0].contentRect.width, height: ent[0].contentRect.height });
                } catch (e) {
                    // Ignore disposal errors
                }
            }
        };
        const ro = new ResizeObserver(resizeCallback);
        if (chartWrapperRef.current) ro.observe(chartWrapperRef.current);
        resizeObserver.current = ro;

        return () => {
            if (resizeObserver.current) {
                resizeObserver.current.disconnect();
                resizeObserver.current = null;
            }
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
            candlestickSeriesRef.current = null;
            volumeSeriesRef.current = null;
        };
    }, [theme]); // Empty dependency -> Run once

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

    }, [chartData]);

    // 6. Update Markers & Event Handler
    useEffect(() => {
        if (!candlestickSeriesRef.current || !chartRef.current) return;

        // Always set markers even if empty (to clear)
        candlestickSeriesRef.current.setMarkers(newsMarkers);

    }, [newsMarkers]);

    // 7. Click Handler with Refs
    useEffect(() => {
        clickHandlerRef.current = (clickTime: number) => {
            // Helper to get seconds from interval string
            const getIntervalSeconds = (intStr: string) => {
                const num = parseInt(intStr);
                if (intStr.endsWith('m')) return num * 60;
                if (intStr.endsWith('h')) return num * 3600;
                if (intStr.endsWith('d')) return num * 86400;
                if (intStr.endsWith('w')) return num * 604800; // Rare but possible
                return 900; // Default 15m
            };

            const intervalSeconds = getIntervalSeconds(interval);

            // Find news within this candle's duration [clickTime, clickTime + interval)
            // Reverse search to find the most "recent" or relevant one if multiple? 
            // Or just find ANY. Let's find the one closest to the center or just the first one.
            // Added 1 min buffer for safety
            // 클릭 위치에서 가장 가까운 마커 찾기
            let closestMarker = null;
            let minDiff = Infinity;

            for (const m of newsMarkers) {
                const diff = Math.abs((m.time as number) - clickTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestMarker = m;
                }
            }

            // 300초(5분) 이내의 마커만 클릭 인정
            const marker = (minDiff < 300) ? closestMarker : null;

            console.log('[NewsMarker] Click detected!', {
                clickTime,
                intervalSeconds,
                markersCount: newsMarkers.length,
                foundMarker: marker,
                newsMapKeys: Object.keys(newsMapRef.current)
            });

            if (marker && marker.id && newsMapRef.current[marker.id]) {
                const news = newsMapRef.current[marker.id];
                console.log('[NewsMarker] Setting selectedNews:', news);
                setSelectedNews(news);
            } else {
                console.log('[NewsMarker] No matching marker found');
            }
        };
    }, [newsMarkers, interval]);

    // Attach listener
    useEffect(() => {
        if (chartRef.current) {
            const handler = (p: MouseEventParams) => {
                if (p.time) {
                    clickHandlerRef.current(p.time as number);
                }
            };
            chartRef.current.subscribeClick(handler);
        }
    }, [chartRef.current]);

    return (
        <div ref={chartWrapperRef} className={styles.chartWrapper}>
            {selectedNews && (
                <div className={styles.newsModal}>
                    <div className={styles.modalHeader}>
                        <span className={`${styles.modalBadge} ${selectedNews.sentiment_score < 0 ? styles.badgeBear : styles.badgeBull}`}>
                            {selectedNews.sentiment_score < 0 ? 'BEARISH' : 'BULLISH'}
                        </span>
                        <span className={styles.modalDate}>
                            {new Date(selectedNews.published_at).toLocaleString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>
                    <h3 className={styles.modalTitle}>{selectedNews.title}</h3>
                    <div className={styles.modalContent}>
                        {selectedNews.summary || selectedNews.content}
                    </div>
                    <button className={styles.closeButton} onClick={() => setSelectedNews(null)}>
                        닫기
                    </button>
                </div>
            )}

            {/* Backdrop */}
            {selectedNews && <div className={styles.modalBackdrop} onClick={() => setSelectedNews(null)} />}

            {isLive && (
                <div className={styles.liveStatus}>
                    <XRayTooltip dataKey="live_feed">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {currentPrice && (
                                <span className={styles.livePrice}>
                                    ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            )}
                            <div className={styles.liveDot} />
                            <span>LIVE</span>
                        </div>
                    </XRayTooltip>
                </div>
            )}
            {loading && <div className={styles.loadingOverlay}><span>Loading Chart...</span></div>}
            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}
