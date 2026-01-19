'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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

export default function WhaleTracker() {
    const [activities, setActivities] = useState<WhaleActivity[]>([]);

    useEffect(() => {
        fetchInitialData();

        const channel = supabase
            ? supabase.channel('public:whale_alerts')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whale_alerts' }, (payload) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const newRow = payload.new as any;
                    setActivities(prev => [mapRowToActivity(newRow), ...prev].slice(0, 50));
                })
                .subscribe()
            : null;

        return () => {
            if (channel) supabase?.removeChannel(channel);
        };
    }, []);

    async function fetchInitialData() {
        if (!supabase) return;

        const { data, error } = await supabase
            .from('whale_alerts')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(20);

        if (data) {
            setActivities(data.map(mapRowToActivity));
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function mapRowToActivity(row: any): WhaleActivity {
        // Format Amount (e.g. 1,234 BTC)
        const amt = parseFloat(row.amount).toLocaleString(undefined, { maximumFractionDigits: 2 });
        // Format Value (e.g. $1.5M)
        const val = parseFloat(row.value);
        let valStr = `$${val.toLocaleString()}`;
        if (val >= 1000000) valStr = `$${(val / 1000000).toFixed(1)}M`;
        else if (val >= 1000) valStr = `$${(val / 1000).toFixed(1)}K`;

        // Time diff
        const rowTime = new Date(row.timestamp);
        const now = new Date();
        const diffMin = Math.floor((now.getTime() - rowTime.getTime()) / 60000);
        let timeLabel = `${diffMin}분 전`;
        if (diffMin < 1) timeLabel = '방금 전';
        else if (diffMin > 60) timeLabel = `${Math.floor(diffMin / 60)}시간 전`;

        return {
            id: row.id.toString(),
            type: row.type === 'buy' ? 'buy' : 'sell', // Simplified (transfer logic usually needs more info)
            symbol: row.symbol,
            amount: `${amt} ${row.symbol}`,
            value: valStr,
            from: row.from_address === 'Unknown' ? '익명' : row.from_address,
            to: row.to_address === 'Binance' ? 'Binance' : row.to_address,
            time: timeLabel,
            impact: val > 5000000 ? 'high' : (val > 1000000 ? 'medium' : 'low')
        };
    }

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

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">고래 추적</span>
                <span className="badge badge-live">실시간</span>
            </div>
            <div className={styles.list}>
                {activities.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        실시간 고래 활동을 모니터링하고 있습니다...
                    </div>
                ) : (
                    activities.map((activity) => (
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
                    ))
                )}
            </div>
            <div className={styles.footer}>
                <span className={styles.hint}>$1M 이상 거래만 표시</span>
            </div>
        </div>
    );
}
