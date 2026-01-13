'use client';

import styles from './EventTicker.module.css';
import Link from 'next/link';

const EVENTS: { time: string; title: string; type: string; country: string; impact: string }[] = [
    { time: '22:30', title: '미국 1월 CPI 소비자물가지수 발표', type: 'Economic', country: '🇺🇸', impact: 'High' },
    { time: '23:00', title: '연준 파월 의장 연설', type: 'Speech', country: '🇺🇸', impact: 'High' },
    { time: '03:00', title: 'FOMC 의사록 공개', type: 'Economic', country: '🇺🇸', impact: 'Medium' },
    { time: '09:00', title: '한국 금통위 기준금리 결정', type: 'Economic', country: '🇰🇷', impact: 'High' },
    { time: '18:00', title: '유로존 GDP 성장률 발표', type: 'Economic', country: '🇪🇺', impact: 'Medium' },
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
