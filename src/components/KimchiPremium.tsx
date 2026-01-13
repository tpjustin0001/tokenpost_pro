'use client';

import useSWR from 'swr';
import styles from './KimchiPremium.module.css';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface UpbitResponse {
    btc_krw: number;
    btc_usd: number;
    exchange_rate: number;
    kimchi_premium: number;
}

export default function KimchiPremium() {
    // Upbit API now returns calculated premium and prices directly
    const { data: premiumData } = useSWR<UpbitResponse>(
        '/api/kimchi/upbit',
        fetcher,
        { refreshInterval: 10000 }
    );

    const calculatePremium = () => {
        if (!premiumData ||
            typeof premiumData.kimchi_premium !== 'number' ||
            typeof premiumData.btc_krw !== 'number' ||
            typeof premiumData.btc_usd !== 'number'
        ) {
            return null;
        }

        return {
            premium: premiumData.kimchi_premium.toFixed(2),
            upbitPrice: premiumData.btc_krw,
            binancePrice: premiumData.btc_usd * premiumData.exchange_rate, // Converted to KRW
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
