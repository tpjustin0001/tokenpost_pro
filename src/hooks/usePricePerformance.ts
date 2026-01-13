'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface MarketData {
    symbol: string;
    price: number;
    change: number; // 24h change
    volume: number;
    market_cap: number;
}

export function usePricePerformance() {
    const { data, error, isLoading } = useSWR<MarketData[]>(
        '/api/markets',
        fetcher,
        {
            refreshInterval: 60000,
            revalidateOnFocus: false,
        }
    );

    if (!data || !Array.isArray(data)) {
        return { gainers: [], losers: [], isLoading, error };
    }

    // Filter out null changes just in case
    const withChange = data.filter(c => c.change !== undefined && c.change !== null);

    // API returns 24h change, we use that for performance sorting
    const sorted = [...withChange].sort((a, b) => b.change - a.change);

    return {
        gainers: sorted.slice(0, 7).map(c => ({
            symbol: c.symbol,
            name: c.symbol, // We don't have full names in this lightweight API
            change: c.change,
            price: c.price,
            icon: `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/32/icon/${c.symbol.toLowerCase()}.png`
        })),
        losers: sorted.slice(-7).reverse().map(c => ({
            symbol: c.symbol,
            name: c.symbol,
            change: c.change,
            price: c.price,
            icon: `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/32/icon/${c.symbol.toLowerCase()}.png`
        })),
        isLoading,
        error,
    };
}
