'use client';

import React from 'react';
import styles from './SectorList.module.css';

interface Sector {
    name: string;
    change: number;
}

const SECTORS: Sector[] = [
    { name: 'AI Agents', change: 12.5 },
    { name: 'RWA', change: 8.2 },
    { name: 'DePIN', change: 5.4 },
    { name: 'Meme', change: -2.3 },
    { name: 'Gaming', change: -4.1 },
    { name: 'Layer 1', change: 1.8 },
    { name: 'Layer 2', change: -0.5 },
    { name: 'DeFi', change: 0.9 },
];

export default function SectorList() {
    return (
        <div className={styles.sectorContainer}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <span className={styles.titleIcon}>📊</span>
                    Sector Performance
                </div>
            </div>

            <div className={styles.sectorList}>
                {SECTORS.map((sector) => (
                    <div key={sector.name} className={styles.sectorItem}>
                        <div className={styles.sectorName}>
                            <div className={styles.sectorInitial}>{sector.name.charAt(0)}</div>
                            {sector.name}
                        </div>

                        <div className={styles.barWrapper}>
                            <div
                                className={styles.bar}
                                style={{
                                    width: `${Math.min(Math.abs(sector.change) * 5, 100)}%`,
                                    background: sector.change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
                                }}
                            />
                        </div>

                        <div className={`${styles.sectorValue} ${sector.change >= 0 ? styles.positive : styles.negative}`}>
                            {sector.change > 0 ? '+' : ''}{sector.change}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
