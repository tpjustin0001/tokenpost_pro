'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, HistogramSeries, ISeriesApi, CrosshairMode, MouseEventParams } from 'lightweight-charts';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import styles from './TradingChart.module.css';

interface TradingChartProps {
    symbol: string;
    interval?: string;
}

interface NewsMarker {
    time: number; // Use number for easier comparison
    position: 'aboveBar' | 'belowBar';
    color: string;
    shape: 'arrowDown' | 'arrowUp' | 'circle' | 'square';
    text: string;
}

export default function TradingChart({ symbol, interval = '1d' }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartWrapperRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const resizeObserver = useRef<ResizeObserver | null>(null);
    const { theme } = useTheme();

    // Tooltip Refs
    const tooltipRef = useRef<HTMLDivElement>(null);

    // State
    const [chartData, setChartData] = useState<any[]>([]); // { time, open, high, low, close, volume }
    const [newsMarkers, setNewsMarkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch Candle Data
    useEffect(() => {
        let isMounted = true;
        async function fetchCandles() {
            setLoading(true);
            setError(null);
            try {
                const binanceSymbol = `${symbol}USDT`;
                // Try Binance.US first
                const res1 = await fetch(`https://api.binance.us/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=200`);
                let response = res1;

                if (res1.status === 451 || !res1.ok) {
                    // Fallback to Global
                    response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=200`);
                }

                // Fallback to internal proxy if both fail or CORS issues (though direct fetch might be faster if allowed)
                // Actually, client-side fetch to Binance might get CORS error. Better use our proxy always?
                // Reverting to use our proxy which handles the failover logic safely
                const proxyRes = await fetch(`/api/klines?symbol=${binanceSymbol}&interval=${interval}&limit=200`);
                if (!proxyRes.ok) throw new Error(await proxyRes.text());

                const data = await proxyRes.json();
                if (data.error) throw new Error(data.error);

                if (isMounted) {
                    if (data.candles) {
                        setChartData(data.candles);
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

    // Fetch News Markers
    useEffect(() => {
        let isMounted = true;
        async function fetchNews() {
            if (!supabase || chartData.length === 0) return;
            try {
                const { data } = await supabase
                    .from('news')
                    .select('*')
                    .eq('related_coin', symbol)
                    .eq('show_on_chart', true);

                if (isMounted && data && data.length > 0) {
                    const markers: any[] = [];
                    data.forEach((item: any) => {
                        const newsTime = new Date(item.published_at).getTime() / 1000;
                        // Find closest candle
                        let closest = chartData[0];
                        let minDiff = Math.abs((closest.time as number) - newsTime);

                        for (const c of chartData) {
                            const diff = Math.abs((c.time as number) - newsTime);
                            if (diff < minDiff) {
                                minDiff = diff;
                                closest = c;
                            }
                        }

                        markers.push({
                            time: closest.time,
                            position: 'aboveBar',
                            color: item.sentiment_score < 0 ? '#ef4444' : '#22c55e',
                            shape: 'arrowDown',
                            text: item.title,
                            id: item.id // Keep ID for reference
                        });
                    });
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

        const isDark = theme === 'dark' || !theme; // Default dark

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
                visible: true,
            },
            timeScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                timeVisible: true,
                rightOffset: 5,
            },
            width: chartContainerRef.current.clientWidth,
            height: 350,
        });

        // Candlestick Series
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });
        candlestickSeriesRef.current = candlestickSeries;

        // Volume Series (Histogram)
        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: '', // Overlay on same scale? or separate? usually separate
        });
        // Setting volume to overlay at bottom
        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8, // Highest volume bar takes up bottom 20%
                bottom: 0,
            },
        });
        volumeSeriesRef.current = volumeSeries;


        chartRef.current = chart;

        // Tooltip updates
        chart.subscribeCrosshairMove((param: MouseEventParams) => {
            if (!chartContainerRef.current || !tooltipRef.current) return;

            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartContainerRef.current.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartContainerRef.current.clientHeight
            ) {
                tooltipRef.current.style.display = 'none';
                return;
            }

            const dateStr = new Date((param.time as number) * 1000).toLocaleString();

            // Get data
            const candle = param.seriesData.get(candlestickSeries) as any;
            const volume = param.seriesData.get(volumeSeries) as any;

            if (candle) {
                tooltipRef.current.style.display = 'block';
                const open = candle.open.toFixed(2);
                const high = candle.high.toFixed(2);
                const low = candle.low.toFixed(2);
                const close = candle.close.toFixed(2);
                const vol = volume ? volume.value.toFixed(2) : 'N/A';
                const color = candle.close >= candle.open ? '#26a69a' : '#ef5350';

                // Find visible marker text for this time if any
                // (Complex to find exact marker data here easily, for now just OHLCV)

                tooltipRef.current.innerHTML = `
                    <div style="font-size: 10px; color: ${isDark ? '#9ca3af' : '#6b7280'}">${dateStr}</div>
                    <div style="display: flex; gap: 8px; font-size: 11px; font-weight: 600;">
                        <span style="color: ${isDark ? '#fff' : '#000'}">O: ${open}</span>
                        <span style="color: ${isDark ? '#fff' : '#000'}">H: ${high}</span>
                        <span style="color: ${isDark ? '#fff' : '#000'}">L: ${low}</span>
                        <span style="color: ${color}">C: ${close}</span>
                    </div>
                    <div style="font-size: 10px; color: ${isDark ? '#9ca3af' : '#6b7280'}">Vol: ${vol}</div>
                `;
            }
        });

        // Resize
        resizeObserver.current = new ResizeObserver(entries => {
            if (entries[0]?.contentRect && chart) {
                chart.applyOptions({
                    width: entries[0].contentRect.width,
                    height: entries[0].contentRect.height
                });
            }
        });
        if (chartWrapperRef.current) resizeObserver.current.observe(chartWrapperRef.current);

        return () => {
            resizeObserver.current?.disconnect();
            chart.remove();
        };

    }, [theme]); // Re-create chart on theme change to reset options easily

    // Update Data
    useEffect(() => {
        if (!candlestickSeriesRef.current || !volumeSeriesRef.current || chartData.length === 0) return;

        // Separate data
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
        chartRef.current?.timeScale().fitContent();

    }, [chartData]);

    // Update Markers
    useEffect(() => {
        if (candlestickSeriesRef.current && newsMarkers.length > 0) {
            // @ts-ignore
            candlestickSeriesRef.current.setMarkers(newsMarkers);
        }
    }, [newsMarkers]);

    return (
        <div ref={chartWrapperRef} className={styles.chartWrapper}>
            <div
                ref={tooltipRef}
                className={styles.tooltip} // Need to add css
                style={{ display: 'none' }}
            />

            {loading && <div className={styles.loadingOverlay}>Loading...</div>}
            {error && <div className={styles.errorOverlay}>{error}</div>}

            <div ref={chartContainerRef} className={styles.chart} />
        </div>
    );
}
