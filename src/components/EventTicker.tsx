'use client';

import styles from './EventTicker.module.css';
import Link from 'next/link';

const EVENTS: { time: string; title: string; type: string; country: string; impact: string }[] = [
    // 캘린더 데이터 초기화 요청으로 비움
];

export default function EventTicker() {
    return (
        <div className={styles.tickerContainer}>
            <div className={styles.label}>
                📅 TODAY'S SCHEDULE
            </div>

            <div className={styles.tickerWrapper}>
                <div className={styles.tickerContent}>
                    {EVENTS.length === 0 ? (
                        <div className={styles.tickerItem}>
                            <span style={{ color: 'var(--text-muted)' }}>등록된 일정이 없습니다.</span>
                        </div>
                    ) : (
                        <>
                            {EVENTS.map((event, idx) => (
                                <div key={`e1-${idx}`} className={styles.tickerItem}>
                                    <span className={styles.time}>{event.time}</span>
                                    <span className={`${styles.badge} ${styles[event.type.toLowerCase()]}`}>{event.country} {event.type}</span>
                                    <span>{event.title}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
