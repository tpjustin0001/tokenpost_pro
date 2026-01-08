'use client';

import styles from './MarketPulse.module.css';

interface MarketData {
    totalMarketCap: string;
    marketCapChange: number;
    btcDominance: string;
    btcDomChange: number;
    ethGas: string;
    fearGreed: number;
    fearGreedLabel: string;
    usdKrw: string;
    kimchi: string;
}

const DEFAULT_DATA: MarketData = {
    totalMarketCap: '$2.45T',
    marketCapChange: 1.2,
    btcDominance: '54.2%',
    btcDomChange: -0.3,
    ethGas: '12 gwei',
    fearGreed: 65,
    fearGreedLabel: '탐욕',
    usdKrw: '1,450',
    kimchi: '+1.5%',
};

export default function MarketPulse({ data = DEFAULT_DATA }: { data?: MarketData }) {
    const getFearGreedClass = (value: number) => {
        if (value >= 60) return 'greed';
        if (value <= 40) return 'fear';
        return 'neutral';
    };

    const getFearGreedKo = (value: number) => {
        if (value >= 75) return '극심한 탐욕';
        if (value >= 60) return '탐욕';
        if (value >= 40) return '중립';
        if (value >= 25) return '공포';
        return '극심한 공포';
    };

    return (
        <header className="market-pulse">
            <div className="pulse-metrics">
                <div className="pulse-metric">
                    <span className="pulse-label">총 시가총액</span>
                    <span className="pulse-value">{data.totalMarketCap}</span>
                    <span className={`pulse-change ${data.marketCapChange >= 0 ? 'text-green' : 'text-red'}`}>
                        {data.marketCapChange >= 0 ? '+' : ''}{data.marketCapChange}%
                    </span>
                </div>

                <div className="pulse-metric">
                    <span className="pulse-label">BTC 도미넌스</span>
                    <span className="pulse-value">{data.btcDominance}</span>
                    <span className={`pulse-change ${data.btcDomChange >= 0 ? 'text-green' : 'text-red'}`}>
                        {data.btcDomChange >= 0 ? '+' : ''}{data.btcDomChange}%
                    </span>
                </div>

                <div className="pulse-metric">
                    <span className="pulse-label">ETH 가스</span>
                    <span className="pulse-value">{data.ethGas}</span>
                </div>

                <div className="pulse-metric">
                    <span className="pulse-label">공포·탐욕 지수</span>
                    <div className="fear-greed">
                        <span className="fear-greed-value">{data.fearGreed}</span>
                        <span className={`fear-greed-label ${getFearGreedClass(data.fearGreed)}`}>
                            {getFearGreedKo(data.fearGreed)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="pulse-subtle">
                환율 {data.usdKrw}원 · 김프 {data.kimchi}
            </div>
        </header>
    );
}
