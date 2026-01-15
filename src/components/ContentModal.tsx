'use client';
import styles from './ContentModal.module.css';

interface ContentModalProps {
    contentData: any; // Ideally this should utilize the shared IntelItem interface
    isOpen: boolean;
    onClose: () => void;
}

export default function ContentModal({ contentData, isOpen, onClose }: ContentModalProps) {
    if (!isOpen || !contentData) return null;

    const {
        title,
        source,
        author,
        time,
        readTime = '3분', // Default if not present
        thumbnail,
        summary,
        content = '',
        tags = [],
        type,
        isPro,
        date
    } = contentData;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                {thumbnail && (
                    <div className={styles.thumbnailWrapper}>
                        <img src={thumbnail} alt="" className={styles.thumbnail} />
                    </div>
                )}

                <div className={styles.header}>
                    <div className={styles.meta}>
                        {isPro && <span className={styles.proBadge}>PRO</span>}
                        <span className={styles.author}>{author || source || 'TokenPost'}</span>
                        <span className={styles.dot}>·</span>
                        <span>{date || time}</span>
                        <span className={styles.dot}>·</span>
                        <span>{readTime} 읽기</span>
                    </div>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.summary}>{summary}</p>
                </div>

                <div className={styles.body}>
                    {(content || '').split('\n').map((line: string, i: number) => (
                        line.trim() ? <p key={i} className={styles.paragraph}>{line}</p> : <br key={i} />
                    ))}
                </div>

                {tags.length > 0 && (
                    <div className={styles.tags}>
                        {tags.map((tag: string) => (
                            <span key={tag} className={styles.tag}>#{tag}</span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
