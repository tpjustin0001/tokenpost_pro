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
function getCoinIconUrl(symbol: string): string {
    const s = symbol.toUpperCase();
    const urls: Record<string, string> = {
        'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
        'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
        'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
        'XRP': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
        'ADA': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
        'DOGE': 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
        'AVAX': 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
        'SHIB': 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
        'DOT': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
        'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
        'TRX': 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
        'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
        'LTC': 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
        'BCH': 'https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png',
        'XLM': 'https://assets.coingecko.com/coins/images/100/small/stellar_symbol_300_300.png',
    };
    return urls[s] || `https://ui-avatars.com/api/?name=${s}&background=3b82f6&color=fff&size=64&bold=true&length=3`;
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
