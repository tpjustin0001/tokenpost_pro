'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface CoinData {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_1h_in_currency: number;
    image: string;
}

export function usePricePerformance() {
    const { data, error, isLoading } = useSWR<CoinData[]>(
        '/api/markets', // 프록시 사용
        fetcher,
        {
            refreshInterval: 60000, // 1분
            revalidateOnFocus: false,
        }
    );

    if (!data || !Array.isArray(data)) {
        return { gainers: [], losers: [], isLoading, error };
    }

    const withChange = data.filter(c => c.price_change_percentage_1h_in_currency !== null);
    const sorted = [...withChange].sort(
        (a, b) => (b.price_change_percentage_1h_in_currency || 0) -
            (a.price_change_percentage_1h_in_currency || 0)
    );

    return {
        gainers: sorted.slice(0, 7).map(c => ({
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            change: c.price_change_percentage_1h_in_currency,
            price: c.current_price,
            icon: c.image,
        })),
        losers: sorted.slice(-7).reverse().map(c => ({
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            change: c.price_change_percentage_1h_in_currency,
            price: c.current_price,
            icon: c.image,
        })),
        isLoading,
        error,
    };
}
