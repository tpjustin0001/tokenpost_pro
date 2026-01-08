'use client';

import styles from './ResearchPanel.module.css';

interface ResearchItem {
    id: string;
    title: string;
    author: string;
    date: string;
}

const MOCK_RESEARCH: ResearchItem[] = [
    {
        id: '1',
        title: 'Helium Mobile Discontinues Buybacks: Analysis and Investor Relations...',
        author: 'Dylan Bane',
        date: '',
    },
    {
        id: '2',
        title: 'io.net: New Tokenomics and the Path to Sustainable Incentives',
        author: 'Whynorah',
        date: '',
    },
    {
        id: '3',
        title: 'State of Stacks Q3 2025 Brief',
        author: 'Whynorah',
        date: '',
    },
    {
        id: '4',
        title: 'Manta Labs: Scaling Retail Adoption',
        author: 'Manta Labs',
        date: '',
    },
];

export default function ResearchPanel() {
    return (
        <div className={styles.wrapper}>
            {MOCK_RESEARCH.map((item) => (
                <article key={item.id} className={styles.item}>
                    <div className={styles.iconWrap}>
                        <span className={styles.iconText}>R</span>
                    </div>
                    <div className={styles.content}>
                        <h4 className={styles.title}>{item.title}</h4>
                        <div className={styles.meta}>
                            <span className={styles.author}>@{item.author}</span>
                        </div>
                    </div>
                </article>
            ))}
            <div className={styles.createReport}>
                <button className={styles.createBtn}>
                    Create Your Own Report
                    <span className={styles.arrow}>→</span>
                </button>
            </div>
        </div>
    );
}
