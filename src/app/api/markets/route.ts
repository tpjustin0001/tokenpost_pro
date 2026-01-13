import { NextResponse } from 'next/server';

// 캐시 저장소
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 60000; // 1분

export async function GET() {
    const now = Date.now();

    // 캐시 유효
    if (cache && now - cache.timestamp < CACHE_DURATION) {
        return NextResponse.json(cache.data);
    }

    try {
        const res = await fetch(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false&price_change_percentage=1h,24h',
            {
                headers: {
                    'Accept': 'application/json',
                },
                next: { revalidate: 60 }
            }
        );

        if (!res.ok) {
            throw new Error(`CoinGecko API error: ${res.status}`);
        }

        const rawData = await res.json();

        // Normalize data for usePricePerformance hook
        const normalizedData = rawData.map((coin: any) => ({
            symbol: coin.symbol?.toUpperCase() || 'UNKNOWN',
            price: coin.current_price || 0,
            change: coin.price_change_percentage_24h || 0,
            volume: coin.total_volume || 0,
            market_cap: coin.market_cap || 0,
        }));

        cache = { data: normalizedData, timestamp: now };
        return NextResponse.json(normalizedData);
    } catch (error) {
        // 캐시된 데이터가 있으면 반환
        if (cache) {
            return NextResponse.json(cache.data);
        }
        return NextResponse.json([], { status: 500 });
    }
}
