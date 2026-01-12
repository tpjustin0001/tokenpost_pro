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
        <header className={styles.wrapper}>
            <div className={styles.metrics}>
                <div className={styles.metric}>
                    <span className={styles.label}>총 시가총액</span>
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span className={styles.value}>{data.totalMarketCap}</span>
                        <span className={`${styles.change} ${data.marketCapChange >= 0 ? styles.positive : styles.negative}`}>
                            {data.marketCapChange >= 0 ? '+' : ''}{data.marketCapChange}%
                        </span>
                    </div>
                </div>

                <div className={styles.metric}>
                    <span className={styles.label}>BTC 도미넌스</span>
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span className={styles.value}>{data.btcDominance}</span>
                        <span className={`${styles.change} ${data.btcDomChange >= 0 ? styles.positive : styles.negative}`}>
                            {data.btcDomChange >= 0 ? '+' : ''}{data.btcDomChange}%
                        </span>
                    </div>
                </div>

                <div className={styles.metric}>
                    <span className={styles.label}>ETH 가스</span>
                    <span className={styles.value}>{data.ethGas}</span>
                </div>

                <div className={styles.metric}>
                    <span className={styles.label}>공포·탐욕 지수</span>
                    <div className={styles.fearGreed}>
                        <span className={styles.fgValue}>{data.fearGreed}</span>
                        <span className={`${styles.fgLabel} ${styles[getFearGreedClass(data.fearGreed)]}`}>
                            {getFearGreedKo(data.fearGreed)}
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.rightSide}>
                <span>환율 {data.usdKrw}원</span>
                <span style={{ color: 'var(--border-color)' }}>|</span>
                <span>김프 {data.kimchi}</span>
            </div>
        </header>
    );
}
