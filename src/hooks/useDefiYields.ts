'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface YieldPool {
    pool: string;
    symbol: string;
    chain: string;
    project: string;
    apy: number;
    apyBase: number;
    tvlUsd: number;
}

export function useStablecoinYields() {
    const { data, error, isLoading } = useSWR<{ data: YieldPool[] }>(
        'https://yields.llama.fi/pools',
        fetcher,
        {
            refreshInterval: 300000, // 5분
            revalidateOnFocus: false,
        }
    );

    if (!data?.data) {
        return { yields: [], isLoading, error };
    }

    // 스테이블코인 필터링 (USDT, USDC, DAI)
    const stables = data.data
        .filter(p =>
            ['USDT', 'USDC', 'DAI', 'USDC.E', 'USDT.E'].includes(p.symbol) &&
            p.tvlUsd > 1000000 // $1M+ TVL
        )
        .sort((a, b) => b.tvlUsd - a.tvlUsd)
        .slice(0, 10)
        .map(p => ({
            pool: p.pool,
            symbol: p.symbol,
            chain: p.chain,
            project: p.project,
            apy: p.apy || p.apyBase || 0,
            tvl: p.tvlUsd,
        }));

    return { yields: stables, isLoading, error };
}
