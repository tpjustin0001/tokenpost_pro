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
}

export function useMarketMetrics() {
    const { data, error, isLoading } = useSWR<{ data: any }>(
        '/api/global', // 프록시 사용
        fetcher,
        {
            refreshInterval: 30000, // 30초
            revalidateOnFocus: false,
        }
    );

    const metrics: MarketMetrics | null = data?.data ? {
        spotVolume: data.data.total_volume?.usd || 0,
        marketCap: data.data.total_market_cap?.usd || 0,
        btcDominance: data.data.market_cap_percentage?.btc || 0,
        ethDominance: data.data.market_cap_percentage?.eth || 0,
        defiMarketCap: data.data.defi_market_cap || 0,
        totalCryptos: data.data.active_cryptocurrencies || 0,
    } : null;

    return { metrics, error, isLoading };
}
