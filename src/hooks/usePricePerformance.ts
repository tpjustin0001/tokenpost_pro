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
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false&price_change_percentage=1h',
        fetcher,
        {
            refreshInterval: 60000, // 1분
            revalidateOnFocus: false,
        }
    );

    if (!data) {
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
