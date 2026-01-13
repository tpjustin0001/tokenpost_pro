import { NextResponse } from 'next/server';

// 캐시 저장소
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 60000; // 60초 (스파크라인 포함이라 조금 더 넉넉하게)

export async function GET() {
    const now = Date.now();

    // 캐시 유효
    if (cache && now - cache.timestamp < CACHE_DURATION) {
        return NextResponse.json(cache.data);
    }

    try {
        // 1. Global Data
        const globalRes = await fetch(
            'https://api.coingecko.com/api/v3/global',
            { headers: { 'Accept': 'application/json' }, next: { revalidate: 60 } }
        );

        // 2. BTC/ETH Sparkline Data (for real graphs)
        // vs_currency=usd, ids=bitcoin,ethereum, sparkline=true
        const marketRes = await fetch(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&order=market_cap_desc&per_page=2&page=1&sparkline=true',
            { headers: { 'Accept': 'application/json' }, next: { revalidate: 60 } }
        );

        if (!globalRes.ok || !marketRes.ok) {
            throw new Error(`CoinGecko API error: ${globalRes.status} / ${marketRes.status}`);
        }

        const globalData = await globalRes.json();
        const marketData = await marketRes.json(); // Array of [BTC, ETH]

        // Extract sparklines
        const btcSparkline = marketData.find((c: any) => c.id === 'bitcoin')?.sparkline_in_7d?.price || [];
        const ethSparkline = marketData.find((c: any) => c.id === 'ethereum')?.sparkline_in_7d?.price || [];

        const combinedData = {
            // Flattened structure for matching Frontend Hook
            volume_24h: globalData.data.total_volume.usd / 1e9, // Billions
            total_market_cap: globalData.data.total_market_cap.usd / 1e12, // Trillions
            dominance: {
                btc: globalData.data.market_cap_percentage.btc,
                eth: globalData.data.market_cap_percentage.eth
            },
            sparklines: {
                btc: btcSparkline,
                eth: ethSparkline
            }
        };

        cache = { data: combinedData, timestamp: now };

        return NextResponse.json(combinedData);
    } catch (error) {
        console.error("Global API Error:", error);
        // 캐시된 데이터가 있으면 반환
        if (cache) {
            return NextResponse.json(cache.data);
        }
        return NextResponse.json({ data: {}, sparklines: { btc: [], eth: [] } }, { status: 500 });
    }
}
