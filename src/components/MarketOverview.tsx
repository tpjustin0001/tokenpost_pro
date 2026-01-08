'use client';

import styles from './MarketOverview.module.css';

interface MarketOverviewProps {
    totalMarketCap: string;
    volume24h: string;
    btcDominance: string;
    ethDominance: string;
}

export default function MarketOverview({
    totalMarketCap = '$3.31T',
    volume24h = '$26.55B',
    btcDominance = '54.99%',
    ethDominance = '11.51%',
}: Partial<MarketOverviewProps>) {
    return (
        <div className="market-stats">
            <div className="market-stat">
                <div className="stat-label">MarketCap</div>
                <div className="stat-value">{totalMarketCap}</div>
                <div className="stat-change text-green">+1.47%</div>
            </div>
            <div className="market-stat">
                <div className="stat-label">Volume</div>
                <div className="stat-value">{volume24h}</div>
                <div className="stat-change text-green">+25.35%</div>
            </div>
            <div className="market-stat">
                <div className="stat-label">BTC.D</div>
                <div className="stat-value">{btcDominance}</div>
                <div className="stat-change text-green">+0.00%</div>
            </div>
            <div className="market-stat">
                <div className="stat-label">ETH.D</div>
                <div className="stat-value">{ethDominance}</div>
                <div className="stat-change text-red">-0.83%</div>
            </div>
        </div>
    );
}
