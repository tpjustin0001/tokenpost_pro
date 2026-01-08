'use client';

import useSWR from 'swr';
import { PriceData } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function usePrices() {
    const { data, error, isLoading, mutate } = useSWR<{
        success: boolean;
        data: PriceData[];
        timestamp: number;
    }>('/api/prices', fetcher, {
        refreshInterval: 5000, // Refresh every 5 seconds
        revalidateOnFocus: true,
    });

    return {
        prices: data?.data ?? [],
        isLoading,
        isError: error || !data?.success,
        refresh: mutate,
        lastUpdated: data?.timestamp,
    };
}

export function formatPrice(price: number, currency: 'KRW' | 'USD' = 'KRW'): string {
    if (currency === 'KRW') {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            maximumFractionDigits: 0,
        }).format(price);
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
}

export function formatVolume(volume: number): string {
    if (volume >= 1_000_000_000_000) {
        return `${(volume / 1_000_000_000_000).toFixed(2)}조`;
    }
    if (volume >= 100_000_000) {
        return `${(volume / 100_000_000).toFixed(1)}억`;
    }
    if (volume >= 10_000) {
        return `${(volume / 10_000).toFixed(1)}만`;
    }
    return volume.toLocaleString('ko-KR');
}

export function formatChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
}

export function formatKimchiPremium(premium: number | null): string {
    if (premium === null) return '-';
    const sign = premium >= 0 ? '+' : '';
    return `${sign}${premium.toFixed(2)}%`;
}
