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

    const { data: apiData, error, isLoading } = useSWR<CoinData[]>(
        '/api/markets',
        fetcher,
        { refreshInterval: 60000, revalidateOnFocus: false }
    );

    // Strict real data
    const coins = apiData || [];
    const bubblesRef = useRef<{ x: number, y: number, r: number, coin: CoinData }[]>([]);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const dpr = window.devicePixelRatio || 1;
                canvas.width = rect.width * dpr;
                canvas.height = Math.max(400, rect.height) * dpr; // Taller for better spacing
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${Math.max(400, rect.height)}px`;
                ctx.scale(dpr, dpr);
                return { width: rect.width, height: Math.max(400, rect.height) };
            }
            return null;
        };

        const rect = resizeCanvas();
        if (!rect) return;

        const width = rect.width;
        const height = rect.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Dark Background for contrast
        // ctx.fillStyle = '#0f172a';
        // ctx.fillRect(0,0, width, height); 
        // We let CSS handle background, but canvas need to be clean

        // Grid (Subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;

        const gridStep = 60;
        for (let gx = 0; gx < width; gx += gridStep) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke();
        }
        for (let gy = 0; gy < height; gy += gridStep) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke();
        }

        // Axes (Crosshair style)
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke(); // Full width X
        ctx.beginPath(); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height); ctx.stroke(); // Full height Y

        // Labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px Inter, system-ui';
        ctx.textAlign = 'right';
        ctx.fillText('1H Change →', width - 10, height / 2 - 8);
        ctx.textAlign = 'left';
        ctx.fillText('← 1H Change', 10, height / 2 - 8);
        ctx.textAlign = 'center';
        ctx.fillText('24H Change ↑', width / 2 + 50, 20);
        ctx.fillText('24H Change ↓', width / 2 + 50, height - 10);

        if (coins.length === 0) return;

        // Draw Bubbles
        const maxVolume = Math.max(...coins.map(c => c.total_volume));
        const newBubbles: { x: number, y: number, r: number, coin: CoinData }[] = [];

        // Sorting: Draw smaller bubbles last so they aren't hidden by huge ones? 
        // Or Draw largest first? Actually sorting by volume desc helps to click small ones if on top.
        // Let's sort by volume DESC (Big first) -> wait, then small on top? Yes.
        const sortedCoins = [...coins].sort((a, b) => b.total_volume - a.total_volume);

        sortedCoins.forEach(coin => {
            let change1h = coin.price_change_percentage_1h_in_currency || 0;
            let change24h = coin.price_change_percentage_24h || 0;
            const volume = coin.total_volume;

            const limitX = 12; // +/- 12%
            const limitY = 25; // +/- 25%

            const clamped1h = Math.max(-limitX, Math.min(limitX, change1h));
            const clamped24h = Math.max(-limitY, Math.min(limitY, change24h));

            const x = width / 2 + (clamped1h / limitX) * (width / 2 - 50);
            const y = height / 2 - (clamped24h / limitY) * (height / 2 - 50);

            // Much Bigger Bubbles
            const minSize = 25; // Increased from 12
            const maxSize = 85; // Increased from 55
            const size = minSize + Math.sqrt(volume / maxVolume) * (maxSize - minSize);

            newBubbles.push({ x, y, r: size, coin });

            // Color: "Crypto Bubbles" style
            const isPositive = change24h >= 0;
            const isHovered = hoveredCoin?.id === coin.id;

            // Solid, Vivid Colors
            const baseColor = isPositive ? '#16a34a' : '#dc2626'; // Darker Green/Red base
            const lightColor = isPositive ? '#4ade80' : '#f87171'; // Lighter highlight

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);

            // 3D Spherical Effect
            const grad = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, size * 0.1, x, y, size);
            grad.addColorStop(0, lightColor);
            grad.addColorStop(0.5, baseColor);
            grad.addColorStop(1, isPositive ? '#14532d' : '#7f1d1d'); // Deep shadow

            ctx.fillStyle = grad;
            // Hover effect: just add a white glow stroke
            if (isHovered) {
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 10;
            }
            ctx.fill();
            ctx.shadowBlur = 0; // Reset

            // Border
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Text
            ctx.fillStyle = '#ffffff';
            // Scale font with bubble
            const fontSizeSymbol = Math.max(10, size / 3);
            const fontSizePrice = Math.max(9, size / 3.5);

            ctx.font = `bold ${fontSizeSymbol}px Inter`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            // Shadow for text legibility
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 2;

            ctx.fillText(coin.symbol.toUpperCase(), x, y + 2);

            ctx.font = `${fontSizePrice}px Inter`;
            ctx.textBaseline = 'top';
            ctx.fillText(`${change24h > 0 ? '+' : ''}${change24h.toFixed(1)}%`, x, y + 4);

            ctx.shadowBlur = 0;
        });

        // Reverse array for hit testing (check top items (small) first)
        bubblesRef.current = newBubbles.reverse();

    }, [coins, hoveredCoin]);


    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check small bubbles (last drawn / top) first? 
        // Actually newBubbles was reversed above for hit testing logic consistency if we iterate valid hits.
        // We find FIRST hit.
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
                    마켓 트렌드 (Bubbles)
                </span>
                <div className={styles.legend}>
                    <span className={styles.legendItem}>
                        <span className={styles.dot} style={{ background: '#16a34a' }} />
                        상승
                    </span>
                    <span className={styles.legendItem}>
                        <span className={styles.dot} style={{ background: '#dc2626' }} />
                        하락
                    </span>
                </div>
            </div>
            <div ref={containerRef} className={styles.chartWrapper} style={{ height: '400px', position: 'relative' }}>
                {/* Loading State */}
                {isLoading && coins.length === 0 && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', zIndex: 5 }}>
                        <span className={styles.loadingText}>Loading Data...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', zIndex: 5 }}>
                        <span>Failed to load market data</span>
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
                        padding: '10px 14px',
                        borderRadius: '8px',
                        pointerEvents: 'none',
                        color: 'white',
                        zIndex: 20,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(8px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            {/* Coin Icon could go here */}
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fbbf24' }}>{hoveredCoin.name}</span>
                            <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', background: hoveredCoin.price_change_percentage_24h > 0 ? 'rgba(22, 163, 74, 0.3)' : 'rgba(220, 38, 38, 0.3)', color: hoveredCoin.price_change_percentage_24h > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                                {hoveredCoin.price_change_percentage_24h.toFixed(2)}%
                            </span>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>${hoveredCoin.current_price.toLocaleString()}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '8px' }}>
                            <span>Vol: ${(hoveredCoin.total_volume / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}M</span>
                            <span>Cap: ${(hoveredCoin.market_cap / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}M</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
