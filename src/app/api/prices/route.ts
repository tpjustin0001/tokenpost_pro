import { NextResponse } from 'next/server';

// Supported symbols for price fetching
const SYMBOLS = ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK'];

// Fixed USD/KRW rate (in production, fetch from exchange rate API)
const USD_KRW_RATE = 1450;

interface UpbitTicker {
    market: string;
    trade_price: number;
    change_rate: number;
    acc_trade_volume_24h: number;
    acc_trade_price_24h: number;
}

interface BinanceTicker {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
    volume: string;
    quoteVolume: string;
}

async function fetchUpbitPrices(): Promise<Record<string, UpbitTicker>> {
    try {
        const markets = SYMBOLS.map(s => `KRW-${s}`).join(',');
        const response = await fetch(
            `https://api.upbit.com/v1/ticker?markets=${markets}`,
            { next: { revalidate: 5 } }
        );

        if (!response.ok) return {};

        const data: UpbitTicker[] = await response.json();
        const result: Record<string, UpbitTicker> = {};

        for (const ticker of data) {
            const symbol = ticker.market.replace('KRW-', '');
            result[symbol] = ticker;
        }

        return result;
    } catch {
        console.error('Failed to fetch Upbit prices');
        return {};
    }
}

async function fetchBinancePrices(): Promise<Record<string, BinanceTicker>> {
    try {
        const symbols = SYMBOLS.map(s => `"${s}USDT"`).join(',');
        const response = await fetch(
            `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`,
            { next: { revalidate: 5 } }
        );

        if (!response.ok) return {};

        const data: BinanceTicker[] = await response.json();
        const result: Record<string, BinanceTicker> = {};

        for (const ticker of data) {
            const symbol = ticker.symbol.replace('USDT', '');
            result[symbol] = ticker;
        }

        return result;
    } catch {
        console.error('Failed to fetch Binance prices');
        return {};
    }
}

function calculateKimchiPremium(
    upbitKrw: number | null,
    binanceUsdt: number | null,
    usdKrwRate: number
): number | null {
    if (!upbitKrw || !binanceUsdt) return null;

    const globalKrwPrice = binanceUsdt * usdKrwRate;
    const premium = ((upbitKrw - globalKrwPrice) / globalKrwPrice) * 100;

    return Math.round(premium * 100) / 100;
}

export async function GET() {
    try {
        // Fetch prices from both exchanges in parallel
        const [upbitPrices, binancePrices] = await Promise.all([
            fetchUpbitPrices(),
            fetchBinancePrices(),
        ]);

        const prices = SYMBOLS.map(symbol => {
            const upbit = upbitPrices[symbol];
            const binance = binancePrices[symbol];

            const upbitPrice = upbit?.trade_price ?? null;
            const binancePrice = binance ? parseFloat(binance.lastPrice) : null;

            return {
                symbol,
                upbit: upbit ? {
                    price: upbit.trade_price,
                    change24h: Math.round(upbit.change_rate * 10000) / 100,
                    volume24h: upbit.acc_trade_price_24h,
                } : null,
                binance: binance ? {
                    price: parseFloat(binance.lastPrice),
                    change24h: parseFloat(binance.priceChangePercent),
                    volume24h: parseFloat(binance.quoteVolume),
                } : null,
                kimchiPremium: calculateKimchiPremium(upbitPrice, binancePrice, USD_KRW_RATE),
                usdKrwRate: USD_KRW_RATE,
                timestamp: Date.now(),
            };
        });

        return NextResponse.json({
            success: true,
            data: prices,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('Price API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch prices' },
            { status: 500 }
        );
    }
}
