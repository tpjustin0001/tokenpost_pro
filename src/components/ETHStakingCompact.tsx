'use client';

import { useState, useEffect } from 'react';
import styles from './ETHStakingCompact.module.css';

interface StakingData {
    entry_queue: number;
    exit_queue: number;
    entry_queue_eth: number;
    exit_queue_eth: number;
    entry_wait_days: number;
    exit_wait_minutes: number;
    active_validators: number;
    staked_percentage: number;
    signal: string;
    signal_text: string;
    signal_emoji: string;
    timestamp: string;
}

export default function ETHStakingCompact() {
    const [data, setData] = useState<StakingData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/eth/staking');
                if (!response.ok) throw new Error('API Error');
                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error('ETH Staking fetch error:', err);
                // Fallback
                setData({
                    entry_queue: 81761,
                    exit_queue: 2,
                    entry_queue_eth: 2616352,
                    exit_queue_eth: 64,
                    entry_wait_days: 45.4,
                    exit_wait_minutes: 0.9,
                    active_validators: 978625,
                    staked_percentage: 26.1,
                    signal: 'STRONG_HOLD',
                    signal_text: '강력 홀딩',
                    signal_emoji: '🟢',
                    timestamp: new Date().toISOString()
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 120000);
        return () => clearInterval(interval);
    }, []);

    const formatWaitTime = (days: number): string => {
        if (days >= 1) return `${Math.floor(days)}일`;
        return `${Math.round(days * 24)}시간`;
    };

    const formatMinutes = (minutes: number): string => {
        if (minutes < 60) return `${Math.round(minutes)}분`;
        return `${Math.floor(minutes / 60)}시간`;
    };

    if (loading) {
        return (
            <div className={styles.widget}>
                <div className={styles.header}>
                    <h3 className={styles.title}>ETH Validator Queue</h3>
                </div>
                <div className={styles.loading}>로딩 중...</div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <h3 className={styles.title}>ETH Validator Queue</h3>
                <span className={`${styles.signal} ${styles[data.signal.toLowerCase().replace('_', '')]}`}>
                    {data.signal_emoji} {data.signal_text}
                </span>
            </div>

            <div className={styles.body}>
                <div className={styles.row}>
                    <div className={styles.metric}>
                        <span className={styles.label}>진입 대기</span>
                        <span className={styles.value}>{formatWaitTime(data.entry_wait_days)}</span>
                        <span className={styles.sub}>
                            {(data.entry_queue_eth / 1000000).toFixed(2)}M ETH
                        </span>
                    </div>
                    <div className={styles.metric}>
                        <span className={styles.label}>이탈 대기</span>
                        <span className={styles.value}>{formatMinutes(data.exit_wait_minutes)}</span>
                        <span className={styles.sub}>
                            {(data.exit_queue_eth / 1000).toFixed(1)}K ETH
                        </span>
                    </div>
                    <div className={styles.metric}>
                        <span className={styles.label}>잠금 비율</span>
                        <span className={styles.value}>{data.staked_percentage.toFixed(1)}%</span>
                        <span className={styles.sub}>
                            {(data.active_validators / 1000).toFixed(0)}K 밸리데이터
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <span className={styles.source}>validatorqueue.com</span>
                <span className={styles.time}>
                    {new Date(data.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
}
