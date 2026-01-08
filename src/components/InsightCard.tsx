'use client';

import styles from './InsightCard.module.css';

interface InsightCardProps {
    title: string;
    summary: string;
    author?: string;
    date: string;
    isPro?: boolean;
    tags?: string[];
}

export default function InsightCard({
    title,
    summary,
    author,
    date,
    isPro = false,
    tags = [],
}: InsightCardProps) {
    return (
        <article className={`card ${styles.insightCard}`}>
            <div className={styles.header}>
                {isPro && <span className="badge badge-kimchi">PRO</span>}
                <span className={styles.date}>{date}</span>
            </div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.summary}>{summary}</p>
            <div className={styles.footer}>
                {author && <span className={styles.author}>by {author}</span>}
                <div className={styles.tags}>
                    {tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={styles.tag}>${tag}</span>
                    ))}
                </div>
            </div>
        </article>
    );
}
