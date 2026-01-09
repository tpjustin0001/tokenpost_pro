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
                // High DPI support
                const dpr = window.devicePixelRatio || 1;
                canvas.width = rect.width * dpr;
                canvas.height = Math.max(300, rect.height) * dpr;
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${Math.max(300, rect.height)}px`;
                ctx.scale(dpr, dpr);
                return { width: rect.width, height: Math.max(300, rect.height) };
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
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
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
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(20, height / 2); ctx.lineTo(width - 20, height / 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(width / 2, 20); ctx.lineTo(width / 2, height - 20); ctx.stroke();

        // Labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, system-ui';
        ctx.fillText('1H Change →', width - 70, height / 2 - 6);
        ctx.fillText('← 1H Change', 25, height / 2 - 6);
        ctx.textAlign = 'center';
        ctx.fillText('24H Change ↑', width / 2 + 35, 30);
        ctx.fillText('24H Change ↓', width / 2 + 35, height - 30);

        // Process Data & Draw Bubbles
        const maxVolume = Math.max(...coins.map(c => c.total_volume));
        const newBubbles: { x: number, y: number, r: number, coin: CoinData }[] = [];

        coins.forEach(coin => {
            let change1h = coin.price_change_percentage_1h_in_currency || 0;
            let change24h = coin.price_change_percentage_24h || 0;
            const volume = coin.total_volume;

            const limitX = 8;
            const limitY = 15;
            const clamped1h = Math.max(-limitX, Math.min(limitX, change1h));
            const clamped24h = Math.max(-limitY, Math.min(limitY, change24h));

            const x = width / 2 + (clamped1h / limitX) * (width / 2 - 40);
            const y = height / 2 - (clamped24h / limitY) * (height / 2 - 40);

            const minSize = 10;
            const maxSize = 50;
            const size = minSize + Math.sqrt(volume / maxVolume) * (maxSize - minSize);

            // Store for hit test
            newBubbles.push({ x, y, r: size, coin });

            const isPositive = change24h >= 0;
            const isHovered = hoveredCoin?.id === coin.id;
            const color = isPositive ? '#4ade80' : '#f87171';

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);

            const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
            grad.addColorStop(0, color + (isHovered ? '90' : '60'));
            grad.addColorStop(1, color + (isHovered ? '40' : '20'));
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.strokeStyle = isHovered ? '#ffffff' : color;
            ctx.lineWidth = isHovered ? 2 : 1.5;
            ctx.stroke();

            if (size > 14 || isHovered) {
                ctx.fillStyle = '#ffffff';
                ctx.font = isHovered ? 'bold 11px Inter' : 'bold 10px Inter';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(coin.symbol.toUpperCase(), x, y - 4);

                ctx.font = isHovered ? '10px Inter' : '9px Inter';
                ctx.fillStyle = isPositive ? '#86efac' : '#fca5a5';
                ctx.fillText(`${change24h.toFixed(1)}%`, x, y + 6);
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
                        background: 'rgba(0,0,0,0.8)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        pointerEvents: 'none',
                        fontSize: '11px',
                        color: 'white',
                        zIndex: 10
                    }}>
                        {hoveredCoin.name}: {hoveredCoin.current_price.toLocaleString()} USD
                    </div>
                )}
            </div>
        </div>
    );
}
