'use client';

import styles from './WhaleTracker.module.css';

interface WhaleActivity {
    id: string;
    type: 'buy' | 'sell' | 'transfer';
    symbol: string;
    amount: string;
    value: string;
    from: string;
    to: string;
    time: string;
    impact: 'high' | 'medium' | 'low';
}

const WHALE_ACTIVITIES: WhaleActivity[] = [
    {
        id: '1', type: 'buy', symbol: 'BTC',
        amount: '1,250 BTC', value: '$125.8M',
        from: 'Binance', to: 'Unknown Wallet',
        time: '12분 전', impact: 'high'
    },
    {
        id: '2', type: 'transfer', symbol: 'ETH',
        amount: '32,000 ETH', value: '$108.5M',
        from: 'Whale #847', to: 'Coinbase',
        time: '28분 전', impact: 'high'
    },
    {
        id: '3', type: 'sell', symbol: 'SOL',
        amount: '485,000 SOL', value: '$87.3M',
        from: 'FTX Wallet', to: 'Kraken',
        time: '45분 전', impact: 'medium'
    },
    {
        id: '4', type: 'buy', symbol: 'ETH',
        amount: '15,200 ETH', value: '$51.6M',
        from: 'OKX', to: 'Unknown Wallet',
        time: '1시간 전', impact: 'medium'
    },
    {
        id: '5', type: 'transfer', symbol: 'BTC',
        amount: '500 BTC', value: '$50.4M',
        from: 'Mt.Gox', to: 'BitstampC',
        time: '2시간 전', impact: 'high'
    },
];

export default function WhaleTracker() {
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'buy': return '매수';
            case 'sell': return '매도';
            case 'transfer': return '이동';
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'buy': return 'var(--accent-green)';
            case 'sell': return 'var(--accent-red)';
            default: return 'var(--accent-blue)';
        }
    };

    const getImpactLabel = (impact: string) => {
        switch (impact) {
            case 'high': return '높음';
            case 'medium': return '보통';
            default: return '낮음';
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">고래 추적</span>
                <span className={styles.live}>LIVE</span>
            </div>
            <div className={styles.list}>
                {WHALE_ACTIVITIES.map((activity) => (
                    <div key={activity.id} className={styles.activityItem}>
                        <div className={styles.activityType}>
                            <span
                                className={styles.typeBadge}
                                style={{
                                    background: `${getTypeColor(activity.type)}20`,
                                    color: getTypeColor(activity.type)
                                }}
                            >
                                {getTypeLabel(activity.type)}
                            </span>
                            <span className={styles.symbol}>{activity.symbol}</span>
                        </div>

                        <div className={styles.amountSection}>
                            <div className={styles.amount}>{activity.amount}</div>
                            <div className={styles.value}>{activity.value}</div>
                        </div>

                        <div className={styles.flowSection}>
                            <span className={styles.address}>{activity.from}</span>
                            <span className={styles.arrow}>→</span>
                            <span className={styles.address}>{activity.to}</span>
                        </div>

                        <div className={styles.metaSection}>
                            <span className={styles.time}>{activity.time}</span>
                            {activity.impact === 'high' && (
                                <span className={styles.highImpact}>주의</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.footer}>
                <span className={styles.hint}>$50M 이상 거래만 표시</span>
            </div>
        </div>
    );
}
