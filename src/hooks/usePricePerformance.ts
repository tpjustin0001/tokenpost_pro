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

// Helper to get reliable icon URLs
// Helper to get reliable icon URLs
function getCoinIconUrl(symbol: string): string {
    // Use SpotHQ's high-quality icon set (covers most assets)
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol.toLowerCase()}.png`;
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

    // API returns 24h/1h change (mapped to 'change' prop), we use that for performance sorting
    const sorted = [...withChange].sort((a, b) => b.change - a.change);

    return {
        gainers: sorted.slice(0, 7).map(c => ({
            symbol: c.symbol,
            name: c.symbol, // We don't have full names in this lightweight API
            change: c.change,
            price: c.price,
            icon: getCoinIconUrl(c.symbol)
        })),
        losers: sorted.slice(-7).reverse().map(c => ({
            symbol: c.symbol,
            name: c.symbol,
            change: c.change,
            price: c.price,
            icon: getCoinIconUrl(c.symbol)
        })),
        isLoading,
        error,
    };
}
