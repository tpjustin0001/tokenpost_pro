'use client';

import { useState } from 'react';
import styles from './SectorHeatmap.module.css';

interface SectorData {
    name: string;
    nameKo: string;
    symbol: string;
    change24h: number;
    marketCap: string;
    size: number;
}

const SECTORS: SectorData[] = [
    { name: 'Layer 1', nameKo: '레이어 1', symbol: 'L1', change24h: 2.4, marketCap: '$1.2T', size: 5 },
    { name: 'DeFi', nameKo: '디파이', symbol: 'DEFI', change24h: 4.8, marketCap: '$89B', size: 4 },
    { name: 'AI & Big Data', nameKo: 'AI·빅데이터', symbol: 'AI', change24h: -1.2, marketCap: '$45B', size: 3 },
    { name: 'Gaming', nameKo: '게이밍', symbol: 'GAME', change24h: 1.5, marketCap: '$23B', size: 3 },
    { name: 'DePIN', nameKo: 'DePIN', symbol: 'DEPIN', change24h: 6.2, marketCap: '$18B', size: 2 },
    { name: 'Meme', nameKo: '밈코인', symbol: 'MEME', change24h: -3.4, marketCap: '$65B', size: 3 },
    { name: 'Layer 2', nameKo: '레이어 2', symbol: 'L2', change24h: 0.8, marketCap: '$32B', size: 3 },
    { name: 'RWA', nameKo: '실물자산', symbol: 'RWA', change24h: 2.1, marketCap: '$12B', size: 2 },
];

function getHeatColor(change: number): string {
    if (change >= 5) return 'var(--heat-5)';
    if (change >= 3) return 'var(--heat-4)';
    if (change >= 1) return 'var(--heat-3)';
    if (change >= -1) return 'var(--heat-0)';
    if (change >= -3) return 'var(--heat-n3)';
    if (change >= -5) return 'var(--heat-n4)';
    return 'var(--heat-n5)';
}

export default function SectorHeatmap() {
    const [selectedSector, setSelectedSector] = useState<string | null>(null);

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <span className="card-title">섹터별 성과</span>
                    <span className={styles.subtitle}>24시간 변동</span>
                </div>
                <div className="tabs">
                    <button className="tab active">24시간</button>
                    <button className="tab">7일</button>
                    <button className="tab">30일</button>
                </div>
            </div>
            <div className={styles.treemapGrid}>
                {SECTORS.map((sector) => (
                    <div
                        key={sector.symbol}
                        className={`${styles.sector} ${styles[`size${sector.size}`]}`}
                        style={{ background: getHeatColor(sector.change24h) }}
                        onClick={() => setSelectedSector(sector.symbol)}
                    >
                        <div className={styles.sectorHeader}>
                            <span className={styles.sectorName}>{sector.nameKo}</span>
                            <span className={styles.sectorSymbol}>{sector.symbol}</span>
                        </div>
                        <div className={styles.sectorValue}>
                            {sector.change24h >= 0 ? '+' : ''}{sector.change24h}%
                        </div>
                        <div className={styles.sectorMcap}>
                            시총 {sector.marketCap}
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.insight}>
                자금이 AI 섹터에서 디파이로 이동 중입니다. DePIN이 가장 강한 모멘텀을 보이고 있습니다.
            </div>
        </div>
    );
}
