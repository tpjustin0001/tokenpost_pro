'use client';

import useSWR from 'swr';
import styles from './KimchiPremium.module.css';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface UpbitTicker {
    trade_price: number;
}

interface BinancePrice {
    price: string;
}

interface ForexData {
    rates: {
        KRW: number;
    };
}

export default function KimchiPremium() {
    // Upbit BTC price in KRW
    const { data: upbitData } = useSWR<UpbitTicker[]>(
        '/api/kimchi/upbit',
        fetcher,
        { refreshInterval: 10000 }
    );

    // Binance BTC price in USD
    const { data: binanceData } = useSWR<BinancePrice>(
        'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
        fetcher,
        { refreshInterval: 10000 }
    );

    // USD/KRW exchange rate (cached)
    const { data: forexData } = useSWR<ForexData>(
        '/api/kimchi/forex',
        fetcher,
        { refreshInterval: 300000 } // 5분
    );

    const calculatePremium = () => {
        if (!upbitData?.[0] || !binanceData || !forexData) return null;

        const upbitPriceKrw = upbitData[0].trade_price;
        const binancePriceUsd = parseFloat(binanceData.price);
        const usdKrwRate = forexData.rates?.KRW || 1450;

        const binancePriceKrw = binancePriceUsd * usdKrwRate;
        const premium = ((upbitPriceKrw - binancePriceKrw) / binancePriceKrw) * 100;

        return {
            premium: premium.toFixed(2),
            upbitPrice: upbitPriceKrw,
            binancePrice: binancePriceKrw,
        };
    };

    const result = calculatePremium();

    const getPremiumClass = (premium: number) => {
        if (premium <= 0) return styles.green;   // 역프 (매수 기회)
        if (premium < 3) return styles.neutral;  // 통상
        if (premium < 5) return styles.orange;   // 주의
        return styles.red;                       // 과열
    };

    const getPremiumLabel = (premium: number) => {
        if (premium <= 0) return '역프리미엄';
        if (premium < 3) return '통상';
        if (premium < 5) return '주의';
        return '과열';
    };

    if (!result) {
        return (
            <div className={styles.wrapper}>
                <span className={styles.label}>김치 프리미엄</span>
                <span className={styles.value}>---</span>
            </div>
        );
    }

    const premiumNum = parseFloat(result.premium);

    return (
        <div className={styles.wrapper}>
            <div className={styles.main}>
                <span className={styles.flag}>🇰🇷</span>
                <span className={styles.label}>김치 프리미엄</span>
                <span className={`${styles.value} ${getPremiumClass(premiumNum)}`}>
                    {premiumNum >= 0 ? '+' : ''}{result.premium}%
                </span>
                <span className={`${styles.badge} ${getPremiumClass(premiumNum)}`}>
                    {getPremiumLabel(premiumNum)}
                </span>
            </div>
            <div className={styles.prices}>
                <span>업비트 ₩{result.upbitPrice.toLocaleString()}</span>
                <span className={styles.divider}>|</span>
                <span>바이낸스 ₩{Math.round(result.binancePrice).toLocaleString()}</span>
            </div>
        </div>
    );
}
