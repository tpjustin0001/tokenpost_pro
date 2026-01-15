'use client';
import React from 'react';
import styles from './ContentModal.module.css';

interface ContentModalProps {
    contentData: any;
    isOpen: boolean;
    onClose: () => void;
}

// Simple Markdown parser for content rendering
function parseMarkdown(text: string): React.ReactNode[] {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIndex) => {
        // Empty line -> break
        if (!line.trim()) {
            elements.push(<br key={`br-${lineIndex}`} />);
            return;
        }

        // YouTube URL detection and embed
        const youtubeMatch = line.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (youtubeMatch) {
            const videoId = youtubeMatch[1];
            elements.push(
                <div key={`yt-${lineIndex}`} className={styles.videoWrapper}>
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className={styles.videoIframe}
                    />
                </div>
            );
            return;
        }

        // Headers
        if (line.startsWith('### ')) {
            elements.push(<h4 key={`h4-${lineIndex}`} className={styles.h4}>{line.slice(4)}</h4>);
            return;
        }
        if (line.startsWith('## ')) {
            elements.push(<h3 key={`h3-${lineIndex}`} className={styles.h3}>{line.slice(3)}</h3>);
            return;
        }
        if (line.startsWith('# ')) {
            elements.push(<h2 key={`h2-${lineIndex}`} className={styles.h2}>{line.slice(2)}</h2>);
            return;
        }

        // Parse inline formatting
        const parseInline = (text: string): React.ReactNode[] => {
            const parts: React.ReactNode[] = [];
            let remaining = text;
            let key = 0;

            while (remaining.length > 0) {
                // Bold: **text**
                const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
                // Italic: *text*
                const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
                // Link: [text](url)
                const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);

                // Find the earliest match
                const matches = [
                    { type: 'bold', match: boldMatch, index: boldMatch?.index ?? Infinity },
                    { type: 'italic', match: italicMatch, index: italicMatch?.index ?? Infinity },
                    { type: 'link', match: linkMatch, index: linkMatch?.index ?? Infinity },
                ].sort((a, b) => a.index - b.index);

                const first = matches[0];

                if (first.match && first.index !== Infinity) {
                    // Add text before match
                    if (first.index > 0) {
                        parts.push(remaining.slice(0, first.index));
                    }

                    if (first.type === 'bold' && boldMatch) {
                        parts.push(<strong key={`b-${key++}`}>{boldMatch[1]}</strong>);
                        remaining = remaining.slice(first.index + boldMatch[0].length);
                    } else if (first.type === 'italic' && italicMatch) {
                        parts.push(<em key={`i-${key++}`}>{italicMatch[1]}</em>);
                        remaining = remaining.slice(first.index + italicMatch[0].length);
                    } else if (first.type === 'link' && linkMatch) {
                        parts.push(
                            <a key={`a-${key++}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                {linkMatch[1]}
                            </a>
                        );
                        remaining = remaining.slice(first.index + linkMatch[0].length);
                    }
                } else {
                    parts.push(remaining);
                    break;
                }
            }

            return parts;
        };

        // Bullet points
        if (line.startsWith('- ') || line.startsWith('• ')) {
            elements.push(
                <li key={`li-${lineIndex}`} className={styles.listItem}>
                    {parseInline(line.slice(2))}
                </li>
            );
            return;
        }

        // Regular paragraph with inline formatting
        elements.push(
            <p key={`p-${lineIndex}`} className={styles.paragraph}>
                {parseInline(line)}
            </p>
        );
    });

    return elements;
}

export default function ContentModal({ contentData, isOpen, onClose }: ContentModalProps) {
    if (!isOpen || !contentData) return null;

    const {
        title,
        source,
        author,
        time,
        readTime = '3분',
        thumbnail,
        summary,
        content = '',
        tags = [],
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
                    {summary && <p className={styles.summary}>{summary}</p>}
                </div>

                <div className={styles.body}>
                    {parseMarkdown(content || '')}
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
