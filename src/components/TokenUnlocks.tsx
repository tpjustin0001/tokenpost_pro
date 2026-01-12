'use client';

import styles from './TokenUnlocks.module.css';
import XRayTooltip from './XRayTooltip';

interface UnlockEvent {
    id: string;
    symbol: string;
    name: string;
    date: string;
    daysLeft: number;
    amount: string;
    value: string;
    percentOfSupply: string;
    type: 'cliff' | 'linear' | 'team' | 'investor';
}

const UPCOMING_UNLOCKS: UnlockEvent[] = [
    // 토큰 언락 데이터 초기화 (API 연동 대기)
];

export default function TokenUnlocks() {
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'cliff': return '클리프';
            case 'linear': return '선형';
            case 'team': return '팀';
            case 'investor': return '투자자';
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'cliff': return 'var(--accent-red)';
            case 'team': return 'var(--accent-purple)';
            case 'investor': return 'var(--accent-blue)';
            default: return 'var(--accent-yellow)';
        }
    };

    const getDaysColor = (days: number) => {
        if (days <= 7) return 'var(--accent-red)';
        if (days <= 14) return 'var(--accent-yellow)';
        return 'var(--text-secondary)';
    };

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">
                    <XRayTooltip dataKey="token_unlocks">
                        토큰 언락 일정
                    </XRayTooltip>
                </span>
                <span className={styles.subtitle}>30일 이내</span>
            </div>
            <div className={styles.list}>
                {UPCOMING_UNLOCKS.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        언락 일정을 집계하고 있습니다...
                    </div>
                ) : (
                    UPCOMING_UNLOCKS.map((unlock) => (
                        <div key={unlock.id} className={styles.unlockItem}>
                            <div className={styles.tokenInfo}>
                                <div className={styles.tokenIcon}>{unlock.symbol.slice(0, 2)}</div>
                                <div>
                                    <div className={styles.tokenName}>{unlock.name}</div>
                                    <div className={styles.tokenSymbol}>{unlock.symbol}</div>
                                </div>
                            </div>

                            <div className={styles.unlockDetails}>
                                <div className={styles.daysLeft} style={{ color: getDaysColor(unlock.daysLeft) }}>
                                    D-{unlock.daysLeft}
                                </div>
                                <div className={styles.date}>{unlock.date}</div>
                            </div>

                            <div className={styles.amountInfo}>
                                <div className={styles.amount}>{unlock.amount}</div>
                                <div className={styles.value}>{unlock.value}</div>
                            </div>

                            <div className={styles.supplyInfo}>
                                <div className={styles.percent}>{unlock.percentOfSupply}</div>
                                <span
                                    className={styles.typeBadge}
                                    style={{
                                        background: `${getTypeColor(unlock.type)}20`,
                                        color: getTypeColor(unlock.type)
                                    }}
                                >
                                    <XRayTooltip dataKey={
                                        unlock.type === 'cliff' ? 'unlock_cliff' :
                                            unlock.type === 'linear' ? 'unlock_linear' :
                                                'token_unlocks'
                                    }>
                                        {getTypeLabel(unlock.type)}
                                    </XRayTooltip>
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
