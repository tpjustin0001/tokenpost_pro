'use client';

import styles from './StatsCard.module.css';

interface StatsCardProps {
    title: string;
    value: string;
    change?: string;
    isPositive?: boolean;
    icon?: string;
    badge?: string;
}

export default function StatsCard({
    title,
    value,
    change,
    isPositive = true,
    icon,
    badge
}: StatsCardProps) {
    return (
        <div className={`card ${styles.statsCard}`}>
            <div className={styles.statsHeader}>
                {icon && <span className={styles.icon}>{icon}</span>}
                <span className={styles.title}>{title}</span>
                {badge && <span className={`badge badge-blue ${styles.badge}`}>{badge}</span>}
            </div>
            <div className={styles.statsValue}>
                <span className="font-mono">{value}</span>
                {change && (
                    <span className={`badge ${isPositive ? 'badge-green' : 'badge-red'}`}>
                        {change}
                    </span>
                )}
            </div>
        </div>
    );
}
