'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface MarketMetrics {
    spotVolume: number;
    marketCap: number;
    btcDominance: number;
    ethDominance: number;
    defiMarketCap: number;
    totalCryptos: number;
    sparklines: {
        btc: number[];
        eth: number[];
    };
}

export function useMarketMetrics() {
    const { data, error, isLoading } = useSWR<{ data: any; sparklines: { btc: number[]; eth: number[] } }>(
        '/api/global', // 프록시 사용
        fetcher,
        {
            refreshInterval: 60000, // 60초
            revalidateOnFocus: false,
        }
    );

    const metrics: MarketMetrics | null = data ? {
        spotVolume: (data as any).volume_24h ? (data as any).volume_24h * 1e9 : 0, // API returns Billions
        marketCap: (data as any).total_market_cap ? (data as any).total_market_cap * 1e12 : 0, // API returns Trillions
        btcDominance: (data as any).dominance?.btc || 0,
        ethDominance: (data as any).dominance?.eth || 0,
        defiMarketCap: 0, // Not provided by simplified API
        totalCryptos: 0, // Not provided
        sparklines: { btc: [], eth: [] },
    } : null;


    return { metrics, error, isLoading };
}
