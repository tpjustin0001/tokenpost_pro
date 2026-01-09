'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface BinanceOI {
    symbol: string;
    openInterest: string;
    time: number;
}

export function useOpenInterest() {
    // BTC Open Interest
    const { data: btcOI } = useSWR<BinanceOI>(
        'https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT',
        fetcher,
        { refreshInterval: 10000 }
    );

    // ETH Open Interest
    const { data: ethOI } = useSWR<BinanceOI>(
        'https://fapi.binance.com/fapi/v1/openInterest?symbol=ETHUSDT',
        fetcher,
        { refreshInterval: 10000 }
    );

    // 현재 가격 가져오기 (OI를 USD로 계산)
    const { data: btcPrice } = useSWR<{ price: string }>(
        'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
        fetcher,
        { refreshInterval: 10000 }
    );

    const { data: ethPrice } = useSWR<{ price: string }>(
        'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT',
        fetcher,
        { refreshInterval: 10000 }
    );

    const btcOIUsd = btcOI && btcPrice
        ? parseFloat(btcOI.openInterest) * parseFloat(btcPrice.price)
        : 0;

    const ethOIUsd = ethOI && ethPrice
        ? parseFloat(ethOI.openInterest) * parseFloat(ethPrice.price)
        : 0;

    return {
        btcOpenInterest: btcOIUsd,
        ethOpenInterest: ethOIUsd,
        totalOpenInterest: btcOIUsd + ethOIUsd,
    };
}
