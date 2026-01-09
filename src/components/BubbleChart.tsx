'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import styles from './BubbleChart.module.css';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface CoinData {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_1h_in_currency: number;
    price_change_percentage_24h: number;
    total_volume: number;
    market_cap: number;
}

// Fallback Mock Data
const MOCK_COINS: CoinData[] = [
    { id: 'btc', symbol: 'btc', name: 'Bitcoin', current_price: 65000, price_change_percentage_1h_in_currency: 0.5, price_change_percentage_24h: 2.5, total_volume: 50000000000, market_cap: 1200000000000 },
    { id: 'eth', symbol: 'eth', name: 'Ethereum', current_price: 3500, price_change_percentage_1h_in_currency: -0.2, price_change_percentage_24h: 1.8, total_volume: 20000000000, market_cap: 400000000000 },
    { id: 'sol', symbol: 'sol', name: 'Solana', current_price: 150, price_change_percentage_1h_in_currency: 1.2, price_change_percentage_24h: 5.5, total_volume: 5000000000, market_cap: 80000000000 },
    { id: 'bnb', symbol: 'bnb', name: 'BNB', current_price: 600, price_change_percentage_1h_in_currency: 0.1, price_change_percentage_24h: -1.2, total_volume: 1000000000, market_cap: 90000000000 },
    { id: 'xrp', symbol: 'xrp', name: 'XRP', current_price: 0.6, price_change_percentage_1h_in_currency: -0.5, price_change_percentage_24h: -2.5, total_volume: 2000000000, market_cap: 30000000000 },
    { id: 'doge', symbol: 'doge', name: 'Dogecoin', current_price: 0.12, price_change_percentage_1h_in_currency: 2.0, price_change_percentage_24h: 8.0, total_volume: 3000000000, market_cap: 18000000000 },
    { id: 'ada', symbol: 'ada', name: 'Cardano', current_price: 0.45, price_change_percentage_1h_in_currency: -0.1, price_change_percentage_24h: -0.8, total_volume: 500000000, market_cap: 16000000000 },
];

export default function BubbleChart() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredCoin, setHoveredCoin] = useState<CoinData | null>(null);

    const { data: apiData, error, isLoading } = useSWR<CoinData[]>(
        '/api/markets',
        fetcher,
        { refreshInterval: 60000 }
    );

    // Use Mock if API fails or is loading strictly for demo, 
    // BUT we prefer real data. If error or empty, use Mock to prove "Working".
    const coins = (apiData && apiData.length > 0) ? apiData : (error ? MOCK_COINS : []);
    const showMockWarning = !!error || (apiData && apiData.length === 0);

    const bubblesRef = useRef<{ x: number, y: number, r: number, coin: CoinData }[]>([]);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        // Don't render until we have SOME data to render (or mock)
        if (coins.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const dpr = window.devicePixelRatio || 1;
                canvas.width = rect.width * dpr;
                canvas.height = Math.max(350, rect.height) * dpr;
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${Math.max(350, rect.height)}px`;
                ctx.scale(dpr, dpr);
                return { width: rect.width, height: Math.max(350, rect.height) };
            }
            return null;
        };

        const rect = resizeCanvas();
        if (!rect) return;

        const width = rect.width;
        const height = rect.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;

        const gridStep = 50;
        for (let gx = 0; gx < width; gx += gridStep) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke();
        }
        for (let gy = 0; gy < height; gy += gridStep) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(20, height / 2); ctx.lineTo(width - 20, height / 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(width / 2, 20); ctx.lineTo(width / 2, height - 20); ctx.stroke();

        // Labels
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '11px Inter, system-ui';
        ctx.fillText('1H Change →', width - 60, height / 2 - 6);
        ctx.fillText('← 1H Change', 10, height / 2 - 6);
        ctx.textAlign = 'center';
        ctx.fillText('24H Change ↑', width / 2 + 40, 20);
        ctx.fillText('24H Change ↓', width / 2 + 40, height - 20);

        // Draw Bubbles
        const maxVolume = Math.max(...coins.map(c => c.total_volume));
        const newBubbles: { x: number, y: number, r: number, coin: CoinData }[] = [];

        coins.forEach(coin => {
            let change1h = coin.price_change_percentage_1h_in_currency || 0;
            let change24h = coin.price_change_percentage_24h || 0;
            const volume = coin.total_volume;

            const limitX = 10;
            const limitY = 20;

            const clamped1h = Math.max(-limitX, Math.min(limitX, change1h));
            const clamped24h = Math.max(-limitY, Math.min(limitY, change24h));

            const x = width / 2 + (clamped1h / limitX) * (width / 2 - 40);
            const y = height / 2 - (clamped24h / limitY) * (height / 2 - 40);

            const minSize = 12;
            const maxSize = 55;
            const size = minSize + Math.sqrt(volume / maxVolume) * (maxSize - minSize);

            newBubbles.push({ x, y, r: size, coin });

            const isPositive = change24h >= 0;
            const isHovered = hoveredCoin?.id === coin.id;
            const color = isPositive ? '#4ade80' : '#f87171';

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);

            const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
            grad.addColorStop(0, color + (isHovered ? '99' : '90'));
            grad.addColorStop(1, color + (isHovered ? '60' : '40'));
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.strokeStyle = isHovered ? '#ffffff' : color;
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.stroke();

            // Text
            if (size > 14 || isHovered) {
                ctx.fillStyle = '#ffffff';
                ctx.font = isHovered ? 'bold 12px Inter' : 'bold 11px Inter';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 4;
                ctx.fillText(coin.symbol.toUpperCase(), x, y - 5);
                ctx.shadowBlur = 0;

                ctx.font = isHovered ? '11px Inter' : '10px Inter';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`${change24h.toFixed(1)}%`, x, y + 7);
            }
        });

        bubblesRef.current = newBubbles;

    }, [coins, hoveredCoin]);


    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const hit = bubblesRef.current.find(b => {
            const dx = mouseX - b.x;
            const dy = mouseY - b.y;
            return Math.sqrt(dx * dx + dy * dy) <= b.r;
        });
        if (hit) {
            setHoveredCoin(hit.coin);
            if (canvasRef.current) canvasRef.current.style.cursor = 'pointer';
        } else {
            setHoveredCoin(null);
            if (canvasRef.current) canvasRef.current.style.cursor = 'default';
        }
    };

    const handleMouseLeave = () => {
        setHoveredCoin(null);
    };

    return (
        <div className="card" style={{ position: 'relative' }}>
            <div className="card-header">
                <span className="card-title">
                    시장 심리 & 유동성 (Top 100)
                    {showMockWarning && <span style={{ fontSize: '10px', color: 'orange', marginLeft: '8px' }}>(API Limit - Showing Demo Data)</span>}
                </span>
                <div className={styles.legend}>
                    <span className={styles.legendItem}>
                        <span className={styles.dot} style={{ background: '#4ade80' }} />
                        상승 (Green)
                    </span>
                    <span className={styles.legendItem}>
                        <span className={styles.dot} style={{ background: '#f87171' }} />
                        하락 (Red)
                    </span>
                </div>
            </div>
            <div ref={containerRef} className={styles.chartWrapper} style={{ height: '350px', position: 'relative' }}>
                {isLoading && !coins.length && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', zIndex: 5 }}>
                        Loading Market Data...
                    </div>
                )}

                <canvas
                    ref={canvasRef}
                    className={styles.canvas}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                />

                {hoveredCoin && (
                    <div style={{
                        position: 'absolute',
                        top: 10, left: 10,
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        pointerEvents: 'none',
                        fontSize: '12px',
                        color: 'white',
                        zIndex: 20,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '140px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>{hoveredCoin.symbol.toUpperCase()}</span>
                            <span style={{ color: hoveredCoin.price_change_percentage_24h > 0 ? '#4ade80' : '#f87171' }}>
                                {hoveredCoin.price_change_percentage_24h > 0 ? '+' : ''}{hoveredCoin.price_change_percentage_24h.toFixed(2)}%
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#fff' }}>${hoveredCoin.current_price.toLocaleString()}</div>
                        <div style={{ marginTop: '2px', fontSize: '11px', color: '#94a3b8' }}>
                            Vol: ${(hoveredCoin.total_volume / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}M
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
