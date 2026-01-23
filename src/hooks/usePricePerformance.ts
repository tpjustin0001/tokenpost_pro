'use client';
import useSWR from 'swr';
import { flaskApi } from '@/services/flaskApi';

export interface PerformanceItem {
    symbol: string;
    name: string;
    price: number;
    change: number; // 1h change
    change_24h: number; // 24h change
    icon?: string;
}

export function usePricePerformance(exchange: string = 'upbit') {
    const { data, error, isLoading } = useSWR(
        ['price-performance', exchange],
        () => flaskApi.getPricePerformance(exchange, 30),
        {
            refreshInterval: 60000,
            revalidateOnFocus: false,
            dedupingInterval: 30000, // 30초 내 동일 요청 무시
            keepPreviousData: true,  // 탭 전환 시 이전 데이터 유지
        }
    );


    const safeData = Array.isArray(data) ? data : [];

    // Filter valid items
    const items = safeData.map(item => ({
        symbol: item.symbol,
        name: item.name || item.symbol,
        price: item.price,
        change: item.change_1h,
        change_24h: item.change_24h || 0,
        icon: item.icon
    }));

    // Sort by 24h change
    const sorted = [...items].sort((a, b) => b.change_24h - a.change_24h);

    // Limit to top 10 gainers and losers
    const gainers = sorted.slice(0, 10);
    const losers = sorted.slice().reverse().slice(0, 10);

    return {
        gainers,
        losers,
        isLoading,
        error
    };
}
