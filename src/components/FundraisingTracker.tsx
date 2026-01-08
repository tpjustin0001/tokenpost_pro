'use client';

import styles from './FundraisingTracker.module.css';

interface FundraisingRound {
    id: string;
    project: string;
    symbol: string;
    round: string;
    amount: string;
    valuation: string;
    investors: string[];
    date: string;
    sector: string;
}

const RECENT_FUNDRAISING: FundraisingRound[] = [
    {
        id: '1', project: 'Monad', symbol: 'MONAD',
        round: 'Series A', amount: '$225M', valuation: '$3B',
        investors: ['Paradigm', 'Electric Capital'],
        date: '2025.01.06', sector: 'L1'
    },
    {
        id: '2', project: 'Berachain', symbol: 'BERA',
        round: 'Series B', amount: '$100M', valuation: '$1.5B',
        investors: ['Polychain', 'Hack VC'],
        date: '2025.01.04', sector: 'L1'
    },
    {
        id: '3', project: 'Story Protocol', symbol: 'STORY',
        round: 'Series B', amount: '$80M', valuation: '$2.25B',
        investors: ['a16z', 'Polychain'],
        date: '2025.01.02', sector: 'Infrastructure'
    },
    {
        id: '4', project: 'Symbiotic', symbol: 'SYM',
        round: 'Seed', amount: '$5.8M', valuation: '$100M',
        investors: ['Paradigm', 'Cyber Fund'],
        date: '2024.12.28', sector: 'DeFi'
    },
    {
        id: '5', project: 'Ritual', symbol: 'RITUAL',
        round: 'Series A', amount: '$25M', valuation: '$500M',
        investors: ['Archetype', 'Accomplice'],
        date: '2024.12.26', sector: 'AI'
    },
];

export default function FundraisingTracker() {
    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">최근 펀드레이징</span>
                <span className={styles.period}>7일</span>
            </div>
            <div className={styles.list}>
                {RECENT_FUNDRAISING.map((round) => (
                    <div key={round.id} className={styles.roundItem}>
                        <div className={styles.projectInfo}>
                            <div className={styles.projectIcon}>{round.symbol.slice(0, 2)}</div>
                            <div>
                                <div className={styles.projectName}>{round.project}</div>
                                <div className={styles.roundType}>{round.round}</div>
                            </div>
                        </div>

                        <div className={styles.amountInfo}>
                            <div className={styles.amount}>{round.amount}</div>
                            <div className={styles.valuation}>@{round.valuation}</div>
                        </div>

                        <div className={styles.investorsInfo}>
                            <div className={styles.investors}>
                                {round.investors.slice(0, 2).join(', ')}
                            </div>
                            <div className={styles.sector}>{round.sector}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>총 모금액</span>
                    <span className={styles.summaryValue}>$435.8M</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>건수</span>
                    <span className={styles.summaryValue}>5건</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>주요 섹터</span>
                    <span className={styles.summaryValue}>L1</span>
                </div>
            </div>
        </div>
    );
}
