'use client';

import { useState } from 'react';
import styles from './ResearchIntel.module.css';

interface IntelItem {
    id: string;
    type: 'BREAKING' | 'KPI' | 'NEWS' | 'REPORT' | 'PRO';
    typeKo: string;
    title: string;
    source: string;
    time: string;
    isPro?: boolean;
    isBreaking?: boolean;
}

const INTEL_DATA: IntelItem[] = [
    // Breaking News
    { id: 'b1', type: 'BREAKING', typeKo: '속보', title: 'SEC, 비트코인 현물 ETF 옵션 거래 승인', source: 'Reuters', time: '방금', isBreaking: true },
    { id: 'b2', type: 'BREAKING', typeKo: '속보', title: '트럼프 암호화폐 특별보좌관 임명설', source: 'Bloomberg', time: '12분', isBreaking: true },
    // PRO Content
    { id: '1', type: 'PRO', typeKo: 'PRO', title: 'AI 분석: 비트코인 단기 지지선 $92,000', source: 'TokenPost AI', time: '방금', isPro: true },
    { id: '2', type: 'KPI', typeKo: '지표', title: '트랜잭션 수 전월 대비 +20%', source: '온체인', time: '2시간', isPro: true },
    { id: '3', type: 'KPI', typeKo: '지표', title: '활성 지갑 수 전월 대비 -15%', source: '온체인', time: '2시간', isPro: true },
    { id: '4', type: 'NEWS', typeKo: '뉴스', title: 'EIP-4844 업그레이드 성공적으로 완료', source: 'CoinDesk', time: '5시간' },
    { id: '5', type: 'REPORT', typeKo: '리포트', title: '2025년 4분기 DeFi 현황 보고서', source: '토큰포스트 리서치', time: '1일', isPro: true },
    { id: '6', type: 'PRO', typeKo: 'PRO', title: 'DeFi 섹터 로테이션 시그널 감지', source: 'TokenPost AI', time: '1시간', isPro: true },
    { id: '7', type: 'NEWS', typeKo: '뉴스', title: '일본 대형 은행, 스테이블코인 발행 추진', source: 'Nikkei', time: '3시간' },
    { id: '8', type: 'REPORT', typeKo: '리포트', title: '솔라나 생태계 심층 분석', source: '토큰포스트 리서치', time: '2일', isPro: true },
];

type TabType = 'ALL' | 'BREAKING' | 'PRO' | 'NEWS';

export default function ResearchIntel() {
    const [activeTab, setActiveTab] = useState<TabType>('ALL');

    const filteredData = INTEL_DATA.filter(item => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'BREAKING') return item.type === 'BREAKING';
        if (activeTab === 'PRO') return item.isPro;
        if (activeTab === 'NEWS') return item.type === 'NEWS';
        return true;
    });

    const breakingCount = INTEL_DATA.filter(i => i.type === 'BREAKING').length;

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'BREAKING': return 'var(--accent-red)';
            case 'KPI': return 'var(--accent-green)';
            case 'NEWS': return 'var(--accent-blue)';
            case 'REPORT': return 'var(--accent-purple)';
            case 'PRO': return 'var(--accent-yellow)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className={styles.headerLeft}>
                    <span className="card-title">리서치 & 인텔리전스</span>
                    <span className={styles.badge}>핵심 강점</span>
                    {breakingCount > 0 && (
                        <span className={styles.breakingBadge}>
                            {breakingCount} 속보
                        </span>
                    )}
                </div>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'ALL' ? styles.active : ''}`}
                        onClick={() => setActiveTab('ALL')}
                    >
                        ALL
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'BREAKING' ? styles.active : ''}`}
                        onClick={() => setActiveTab('BREAKING')}
                    >
                        <span className={styles.breakingLabel}>속보</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'PRO' ? styles.active : ''}`}
                        onClick={() => setActiveTab('PRO')}
                    >
                        <span className={styles.proBadge}>PRO</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'NEWS' ? styles.active : ''}`}
                        onClick={() => setActiveTab('NEWS')}
                    >
                        NEWS
                    </button>
                </div>
            </div>
            <div className={styles.list}>
                {filteredData.map((item) => (
                    <div key={item.id} className={`${styles.intelItem} ${item.isBreaking ? styles.breaking : ''}`}>
                        <span
                            className={styles.typeBadge}
                            style={{ color: getTypeColor(item.type), borderLeft: `2px solid ${getTypeColor(item.type)}` }}
                        >
                            {item.typeKo}
                        </span>
                        <div className={styles.content}>
                            <div className={styles.titleRow}>
                                <span className={styles.title}>{item.title}</span>
                                {item.isPro && <span className={styles.proTag}>PRO</span>}
                                {item.isBreaking && <span className={styles.liveTag}>LIVE</span>}
                            </div>
                            <div className={styles.meta}>{item.source} · {item.time}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.footer}>
                <a href="/research" className={styles.viewAll}>전체 리서치 보기 →</a>
            </div>
        </div>
    );
}
