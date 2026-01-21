'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
    const [lightboxOpen, setLightboxOpen] = useState(false);

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

    // Use createPortal to render at document.body level (fullscreen overlay)
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                {thumbnail && (
                    <div className={styles.thumbnailWrapper} style={{ position: 'relative' }}>
                        <img src={thumbnail} alt="" className={styles.thumbnail} />
                        <button
                            onClick={() => setLightboxOpen(true)}
                            style={{
                                position: 'absolute',
                                bottom: '12px',
                                right: '12px',
                                width: '36px',
                                height: '36px',
                                background: 'rgba(0,0,0,0.6)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(59,130,246,0.8)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                            }}
                            title="이미지 확대 보기"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="11" y1="8" x2="11" y2="14" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Image Lightbox Popup */}
                {lightboxOpen && thumbnail && createPortal(
                    <div
                        onClick={() => setLightboxOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10000,
                            cursor: 'zoom-out',
                        }}
                    >
                        <button
                            onClick={() => setLightboxOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                width: '48px',
                                height: '48px',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                color: 'white',
                                fontSize: '28px',
                                cursor: 'pointer',
                            }}
                        >×</button>
                        <img
                            src={thumbnail}
                            alt=""
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                maxWidth: '90vw',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                cursor: 'default',
                            }}
                        />
                    </div>,
                    document.body
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
        </div>,
        document.body
    );
}
