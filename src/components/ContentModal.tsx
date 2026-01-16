'use client';
import React, { useEffect } from 'react';
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

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        // 1. Code Block (``` ... ```)
        if (line.trim().startsWith('```')) {
            const lang = line.trim().slice(3);
            let codeContent = '';
            i++; // Skip start line
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeContent += lines[i] + '\n';
                i++;
            }
            // Push code block
            elements.push(
                <pre key={`code-${i}`} className={styles.codeBlock}>
                    <code>{codeContent}</code>
                </pre>
            );
            i++; // Skip end line
            continue;
        }

        // 2. Collapsible Details (<details> ... </details>)
        // Simple support: assumes <details> and <summary> are on their own lines or start of line
        if (line.trim().startsWith('<details>')) {
            let innerLines: string[] = [];
            let summaryText = 'Click to expand';
            i++; // Skip <details>

            while (i < lines.length && !lines[i].trim().startsWith('</details>')) {
                const subLine = lines[i];
                if (subLine.trim().startsWith('<summary>')) {
                    // Extract summary text
                    summaryText = subLine.replace(/<\/?summary>/g, '').trim();
                } else {
                    innerLines.push(subLine);
                }
                i++;
            }

            // Recursively parse inner content
            const detailContent = parseMarkdown(innerLines.join('\n'));

            elements.push(
                <details key={`details-${i}`} className={styles.details}>
                    <summary className={styles.summary}>{summaryText}</summary>
                    <div className={styles.detailsContent}>
                        {detailContent}
                    </div>
                </details>
            );
            i++; // Skip </details>
            continue;
        }

        // 3. YouTube URL detection
        const youtubeMatch = line.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (youtubeMatch) {
            const videoId = youtubeMatch[1];
            elements.push(
                <div key={`yt-${i}`} className={styles.videoWrapper}>
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
            i++;
            continue;
        }

        // 4. Headers
        if (line.startsWith('### ')) {
            elements.push(<h4 key={`h4-${i}`} className={styles.h4}>{line.slice(4)}</h4>);
            i++; continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<h3 key={`h3-${i}`} className={styles.h3}>{line.slice(3)}</h3>);
            i++; continue;
        }
        if (line.startsWith('# ')) {
            elements.push(<h2 key={`h2-${i}`} className={styles.h2}>{line.slice(2)}</h2>);
            i++; continue;
        }

        // 5. Empty line
        if (!line.trim()) {
            elements.push(<br key={`br-${i}`} />);
            i++; continue;
        }

        // 6. Lists
        if (line.startsWith('- ') || line.startsWith('• ')) {
            // Parse inline formatting
            const parseInline = (text: string): React.ReactNode[] => {
                const parts: React.ReactNode[] = [];
                let remaining = text;
                let key = 0;

                while (remaining.length > 0) {
                    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
                    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
                    const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);

                    const matches = [
                        { type: 'bold', match: boldMatch, index: boldMatch?.index ?? Infinity },
                        { type: 'italic', match: italicMatch, index: italicMatch?.index ?? Infinity },
                        { type: 'link', match: linkMatch, index: linkMatch?.index ?? Infinity },
                    ].sort((a, b) => a.index - b.index);

                    const first = matches[0];

                    if (first.match && first.index !== Infinity) {
                        if (first.index > 0) parts.push(remaining.slice(0, first.index));
                        if (first.type === 'bold' && boldMatch) {
                            parts.push(<strong key={`b-${key++}`}>{boldMatch[1]}</strong>);
                            remaining = remaining.slice(first.index + boldMatch[0].length);
                        } else if (first.type === 'italic' && italicMatch) {
                            parts.push(<em key={`i-${key++}`}>{italicMatch[1]}</em>);
                            remaining = remaining.slice(first.index + italicMatch[0].length);
                        } else if (first.type === 'link' && linkMatch) {
                            parts.push(<a key={`a-${key++}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className={styles.link}>{linkMatch[1]}</a>);
                            remaining = remaining.slice(first.index + linkMatch[0].length);
                        }
                    } else {
                        parts.push(remaining);
                        break;
                    }
                }
                return parts;
            };

            elements.push(
                <li key={`li-${i}`} className={styles.listItem}>
                    {parseInline(line.slice(2))}
                </li>
            );
            i++; continue;
        }

        // 7. Regular paragraph
        // Parse inline formatting (Reuse logic, duplicate for now to keep scope clean or move helper out)
        const parseInline = (text: string): React.ReactNode[] => {
            const parts: React.ReactNode[] = [];
            let remaining = text;
            let key = 0;

            while (remaining.length > 0) {
                const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
                const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
                const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);

                const matches = [
                    { type: 'bold', match: boldMatch, index: boldMatch?.index ?? Infinity },
                    { type: 'italic', match: italicMatch, index: italicMatch?.index ?? Infinity },
                    { type: 'link', match: linkMatch, index: linkMatch?.index ?? Infinity },
                ].sort((a, b) => a.index - b.index);

                const first = matches[0];

                if (first.match && first.index !== Infinity) {
                    if (first.index > 0) parts.push(remaining.slice(0, first.index));
                    if (first.type === 'bold' && boldMatch) {
                        parts.push(<strong key={`b-${key++}`}>{boldMatch[1]}</strong>);
                        remaining = remaining.slice(first.index + boldMatch[0].length);
                    } else if (first.type === 'italic' && italicMatch) {
                        parts.push(<em key={`i-${key++}`}>{italicMatch[1]}</em>);
                        remaining = remaining.slice(first.index + italicMatch[0].length);
                    } else if (first.type === 'link' && linkMatch) {
                        parts.push(<a key={`a-${key++}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className={styles.link}>{linkMatch[1]}</a>);
                        remaining = remaining.slice(first.index + linkMatch[0].length);
                    }
                } else {
                    parts.push(remaining);
                    break;
                }
            }
            return parts;
        };

        elements.push(
            <p key={`p-${i}`} className={styles.paragraph}>
                {parseInline(line)}
            </p>
        );
        i++;
    }

    return elements;
}

export default function ContentModal({ contentData, isOpen, onClose }: ContentModalProps) {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

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

    console.log('[ContentModal] Rendering with data:', { title, hasContent: !!content, contentLength: content?.length });
    // console.log('[ContentModal] Content raw:', content);

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

                    {/* Debug / Fallback View */}
                    <div style={{ marginTop: '40px', padding: '20px', borderTop: '1px dashed #333', opacity: 0.7 }}>
                        <details>
                            <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#666' }}>
                                🛠 개발자 도구 (Raw Data View) - 본문이 안 보일 때 확인용
                            </summary>
                            <div style={{ marginTop: '10px', fontSize: '12px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#aaa' }}>
                                <p><strong>Length:</strong> {content?.length || 0}</p>
                                <p><strong>Content Preview:</strong></p>
                                <div style={{ background: '#111', padding: '10px', borderRadius: '4px' }}>
                                    {content || '데이터 없음 (Empty)'}
                                </div>
                            </div>
                        </details>
                    </div>
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
