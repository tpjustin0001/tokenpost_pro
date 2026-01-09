'use client';

import { useEffect, useRef } from 'react';
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

const SECTOR_COLORS: Record<string, string> = {
    'Layer1': '#8b5cf6',
    'DeFi': '#22c55e',
    'AI': '#3b82f6',
    'Meme': '#f59e0b',
    'Default': '#64748b'
};

const COIN_SECTORS: Record<string, string> = {
    'btc': 'Layer1', 'eth': 'Layer1', 'sol': 'Layer1', 'ada': 'Layer1', 'avax': 'Layer1',
    'uni': 'DeFi', 'aave': 'DeFi', 'mkr': 'DeFi', 'ldo': 'DeFi', 'crv': 'DeFi',
    'render': 'AI', 'fet': 'AI', 'agix': 'AI', 'ocean': 'AI',
    'doge': 'Meme', 'shib': 'Meme', 'pepe': 'Meme', 'floki': 'Meme', 'bonk': 'Meme',
};

export default function BubbleChart() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { data: coins } = useSWR<CoinData[]>(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=false&price_change_percentage=1h,24h',
        fetcher,
        { refreshInterval: 60000 }
    );

    useEffect(() => {
        if (!canvasRef.current || !coins) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);

        const width = rect.width;
        const height = rect.height;

        // Clear
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, width, height);

        // Draw axes
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;

        // X axis (center)
        ctx.beginPath();
        ctx.moveTo(40, height / 2);
        ctx.lineTo(width - 20, height / 2);
        ctx.stroke();

        // Y axis (center)
        ctx.beginPath();
        ctx.moveTo(width / 2, 20);
        ctx.lineTo(width / 2, height - 30);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#64748b';
        ctx.font = '10px system-ui';
        ctx.fillText('1H +', width - 30, height / 2 - 5);
        ctx.fillText('1H -', 45, height / 2 - 5);
        ctx.fillText('24H +', width / 2 + 5, 25);
        ctx.fillText('24H -', width / 2 + 5, height - 25);

        // Map data to bubbles
        const maxVolume = Math.max(...coins.map(c => c.total_volume));

        coins.forEach(coin => {
            const change1h = coin.price_change_percentage_1h_in_currency || 0;
            const change24h = coin.price_change_percentage_24h || 0;
            const volume = coin.total_volume;

            // Normalize positions
            const x = width / 2 + (change1h / 15) * (width / 2 - 50);
            const y = height / 2 - (change24h / 30) * (height / 2 - 40);

            // Bubble size based on volume
            const minSize = 8;
            const maxSize = 35;
            const size = minSize + (volume / maxVolume) * (maxSize - minSize);

            // Get sector color
            const sector = COIN_SECTORS[coin.symbol.toLowerCase()] || 'Default';
            const color = SECTOR_COLORS[sector];

            // Draw bubble
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = color + '40';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Draw symbol if bubble is large enough
            if (size > 15) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px system-ui';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(coin.symbol.toUpperCase(), x, y);
            }
        });

    }, [coins]);

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">마켓 버블 차트</span>
                <div className={styles.legend}>
                    {Object.entries(SECTOR_COLORS).map(([sector, color]) => (
                        sector !== 'Default' && (
                            <span key={sector} className={styles.legendItem}>
                                <span className={styles.dot} style={{ background: color }} />
                                {sector}
                            </span>
                        )
                    ))}
                </div>
            </div>
            <div className={styles.chartWrapper}>
                <canvas ref={canvasRef} className={styles.canvas} />
            </div>
        </div>
    );
}
