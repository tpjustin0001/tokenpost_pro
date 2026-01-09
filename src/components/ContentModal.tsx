'use client';

import { useState } from 'react';
import styles from './ContentModal.module.css';

interface ContentData {
    id: string;
    title: string;
    type: string;
    author: string;
    publishedAt: string;
    readTime: string;
    thumbnail: string;
    summary: string;
    content: string;
    tags: string[];
}

// Mock content database
const CONTENT_DB: Record<string, ContentData> = {
    '1': {
        id: '1',
        title: 'SEC 비트코인 현물 ETF 승인 임박 보도',
        type: 'PRO',
        author: 'TokenPost',
        publishedAt: '2026-01-09',
        readTime: '3분',
        thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop',
        summary: 'SEC의 비트코인 현물 ETF 승인이 48시간 내 발표될 것으로 예상됩니다.',
        content: `SEC 관계자에 따르면 비트코인 현물 ETF에 대한 최종 결정이 이번 주 내로 발표될 예정입니다.

BlackRock, Fidelity, ARK Invest 등 주요 자산운용사들의 신청이 동시에 승인될 가능성이 높습니다.

시장 전문가들은 ETF 승인 시 약 100억 달러 규모의 기관 자금이 유입될 것으로 전망하고 있습니다.`,
        tags: ['ETF', 'SEC', '비트코인', '규제']
    },
    '2': {
        id: '2',
        title: '트랜잭션 수 전월 대비 +20%',
        type: 'PRO',
        author: 'TokenPost AI',
        publishedAt: '2026-01-09',
        readTime: '2분',
        thumbnail: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=400&fit=crop',
        summary: '이더리움 네트워크 활동이 급증하고 있습니다.',
        content: `온체인 데이터 분석 결과, 이더리움 네트워크의 일일 트랜잭션 수가 전월 대비 20% 증가했습니다.

주요 원인:
- DeFi 프로토콜 활성화
- Layer 2 브릿지 사용량 증가
- NFT 마켓플레이스 거래 증가

가스비는 안정적인 수준을 유지하고 있어 네트워크 효율성이 개선된 것으로 보입니다.`,
        tags: ['이더리움', '온체인', '트랜잭션']
    },
    '3': {
        id: '3',
        title: '활성 지갑 수 전월 대비 -15%',
        type: 'PRO',
        author: 'TokenPost AI',
        publishedAt: '2026-01-09',
        readTime: '2분',
        thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=400&fit=crop',
        summary: '활성 지갑 수 감소, 시장 조정 신호일 수 있습니다.',
        content: `지난 30일간 활성 지갑 수가 15% 감소했습니다.

해석:
- 단기 투기 세력 이탈
- 장기 보유자 비율 증가 (긍정적 신호)
- 전반적인 시장 참여 감소

과거 데이터에 따르면, 활성 지갑 감소 후 3-6개월 내 상승장이 시작되는 패턴이 있었습니다.`,
        tags: ['온체인', '지갑', '시장분석']
    }
};

interface ContentModalProps {
    contentId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ContentModal({ contentId, isOpen, onClose }: ContentModalProps) {
    if (!isOpen || !contentId) return null;

    const content = CONTENT_DB[contentId];
    if (!content) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                <div className={styles.thumbnailWrapper}>
                    <img src={content.thumbnail} alt="" className={styles.thumbnail} />
                </div>

                <div className={styles.header}>
                    <div className={styles.meta}>
                        <span className={styles.proBadge}>PRO</span>
                        <span className={styles.author}>{content.author}</span>
                        <span className={styles.dot}>·</span>
                        <span>{content.publishedAt}</span>
                        <span className={styles.dot}>·</span>
                        <span>{content.readTime} 읽기</span>
                    </div>
                    <h2 className={styles.title}>{content.title}</h2>
                    <p className={styles.summary}>{content.summary}</p>
                </div>

                <div className={styles.body}>
                    {content.content.split('\n').map((line, i) => (
                        line.trim() ? <p key={i} className={styles.paragraph}>{line}</p> : <br key={i} />
                    ))}
                </div>

                <div className={styles.tags}>
                    {content.tags.map(tag => (
                        <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
