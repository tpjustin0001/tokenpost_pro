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

export default function BubbleChart() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredCoin, setHoveredCoin] = useState<CoinData | null>(null);

    const { data: coins } = useSWR<CoinData[]>(
        '/api/markets',
        fetcher,
        { refreshInterval: 60000 }
    );

    // Store processed bubble positions for hit testing
    const bubblesRef = useRef<{ x: number, y: number, r: number, coin: CoinData }[]>([]);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current || !coins) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dynamic Resize
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

        // Draw axes & background grid
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'; // Slightly more visible grid
        ctx.lineWidth = 1;

        // Grid lines
        const gridStep = 50;
        for (let gx = 0; gx < width; gx += gridStep) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke();
        }
        for (let gy = 0; gy < height; gy += gridStep) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke();
        }

        // Center axes
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(20, height / 2); ctx.lineTo(width - 20, height / 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(width / 2, 20); ctx.lineTo(width / 2, height - 20); ctx.stroke();

        // Labels
        ctx.fillStyle = '#cbd5e1'; // Brighter text
        ctx.font = '11px Inter, system-ui';
        ctx.fillText('1H Change →', width - 60, height / 2 - 6);
        ctx.fillText('← 1H Change', 10, height / 2 - 6);
        ctx.textAlign = 'center';
        ctx.fillText('24H Change ↑', width / 2 + 40, 20);
        ctx.fillText('24H Change ↓', width / 2 + 40, height - 20);

        // Process Data & Draw Bubbles
        const maxVolume = Math.max(...coins.map(c => c.total_volume));
        const newBubbles: { x: number, y: number, r: number, coin: CoinData }[] = [];

        coins.forEach(coin => {
            let change1h = coin.price_change_percentage_1h_in_currency || 0;
            let change24h = coin.price_change_percentage_24h || 0;
            const volume = coin.total_volume;

            // Widen range to avoid clumping
            const limitX = 10; // +/- 10%
            const limitY = 20; // +/- 20%

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
            const color = isPositive ? '#4ade80' : '#f87171'; // Green : Red

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);

            // Stronger Opacity
            const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
            grad.addColorStop(0, color + (isHovered ? '99' : '90')); // More opaque center
            grad.addColorStop(1, color + (isHovered ? '60' : '40')); // More opaque edge
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.strokeStyle = isHovered ? '#ffffff' : color;
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.stroke();

            // Bigger & Bolder Text
            if (size > 14 || isHovered) {
                ctx.fillStyle = '#ffffff';
                ctx.font = isHovered ? 'bold 12px Inter' : 'bold 11px Inter';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 4;
                ctx.fillText(coin.symbol.toUpperCase(), x, y - 5);
                ctx.shadowBlur = 0; // Reset

                ctx.font = isHovered ? '11px Inter' : '10px Inter';
                ctx.fillStyle = '#ffffff'; // Always white for readability
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

        // Simple hit test
        const hit = bubblesRef.current.find(b => {
            const dx = mouseX - b.x;
            const dy = mouseY - b.y;
            return Math.sqrt(dx * dx + dy * dy) <= b.r;
        });

        // Optimize: verify logic for high dpi
        // Actually the mouse coordinates are in CSS pixels, which match our 'bubblesRef' logic
        // because we calculated x/y based on 'width/height' derived from rect (CSS pixels).
        // The context scale handled drawing, but logical coords are CSS pixels. Correct.

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
        <div className="card">
            <div className="card-header">
                <span className="card-title">시장 심리 & 유동성 (Top 100)</span>
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
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        pointerEvents: 'none',
                        fontSize: '12px',
                        color: 'white',
                        zIndex: 10,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}>
                        <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>{hoveredCoin.symbol.toUpperCase()}</span>
                        <span style={{ margin: '0 6px' }}>|</span>
                        <span>${hoveredCoin.current_price.toLocaleString()}</span>
                        <div style={{ marginTop: '2px', fontSize: '11px', opacity: 0.8 }}>
                            Vol: ${(hoveredCoin.total_volume / 1000000).toFixed(0)}M
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
