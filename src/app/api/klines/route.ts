import { NextResponse } from 'next/server';

// Binance Kline intervals
// 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M

interface BinanceKline {
    openTime: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    closeTime: number;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    const interval = searchParams.get('interval') || '1d';
    const limit = searchParams.get('limit') || '100';

    try {
        // Try Binance.US first (likely Vercel server is in US)
        let apiUrl = `https://api.binance.us/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

        let response = await fetch(apiUrl, { next: { revalidate: 60 } });

        // If 451 or 4xx, try global Binance (api.binance.com) as backup
        if (response.status === 451 || !response.ok) {
            console.warn(`Binance.US failed (${response.status}), trying global API...`);
            apiUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
            response = await fetch(apiUrl, { next: { revalidate: 60 } });
        }

        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform to chart format
        const candles = data.map((kline: any[]) => ({
            time: Math.floor(kline[0] / 1000), // Binance uses milliseconds, chart needs seconds
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5]),
        }));

        return NextResponse.json({
            symbol,
            interval,
            candles,
        });
    } catch (error: any) {
        console.error('Binance klines error:', error);
        // @ts-ignore
        console.error(`Failed URL: ${apiUrl || 'Unknown'}`);

        return NextResponse.json(
            { error: error.message || 'Failed to fetch klines', details: error.toString() },
            { status: 500 }
        );
    }
}
