'use client';

import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

interface CalendarEvent {
    id: string;
    time: string;
    title: string;
    country: string; // 'US', 'EU', 'KR', 'GLOBAL' (for crypto)
    type: string;
    importance: 1 | 2 | 3;
    actual?: string;
    forecast?: string;
    previous?: string;
}

const EVENTS: { date: string; isToday?: boolean; items: CalendarEvent[] }[] = [
    {
        date: '2025. 11. 14 (금)',
        isToday: true,
        items: [
            {
                id: '1',
                time: '22:30',
                title: '미국 소비자물가지수 (CPI) (전년비/10월)',
                country: 'US',
                type: 'Macro',
                importance: 3,
                actual: '3.2%',
                forecast: '3.3%',
                previous: '3.7%'
            },
            {
                id: '2',
                time: '23:00',
                title: '솔라나 브레이크포인트 컨퍼런스',
                country: 'GLOBAL',
                type: 'Crypto',
                importance: 2,
            }
        ]
    },
    {
        date: '2025. 11. 15 (토)',
        items: [
            {
                id: '3',
                time: '18:00',
                title: '셀레스티아 (TIA) 토큰 언락 ($1.4억)',
                country: 'GLOBAL',
                type: 'Unlock',
                importance: 3,
                forecast: '공급량의 12.5%'
            },
        ]
    },
    {
        date: '2025. 11. 17 (월)',
        items: [
            {
                id: '4',
                time: '09:00',
                title: '중국 GDP 성장률',
                country: 'CN',
                type: 'Macro',
                importance: 3,
                forecast: '4.9%',
                previous: '5.2%'
            },
        ]
    }
];

export default function CalendarPage() {
    return (
        <div className={styles.appLayout}>
            <Sidebar />
            <div className={styles.mainArea}>
                <main className={styles.content}>
                    <div className={styles.pageHeader}>
                        <div>
                            <h1 className={styles.pageTitle}>경제 캘린더</h1>
                            <p className={styles.pageDesc}>주요 암호화폐 일정 및 글로벌 거시경제 지표</p>
                        </div>
                        <div className={styles.controls}>
                            <button className={styles.controlBtn}>필터</button>
                            <button className={styles.controlBtn}>내보내기</button>
                        </div>
                    </div>

                    <div className={styles.calendarGrid}>
                        {EVENTS.map((group) => (
                            <div key={group.date} className={styles.dateGroup}>
                                <div className={styles.dateHeader}>
                                    {group.date}
                                    {group.isToday && <span className={styles.todayBadge}>오늘</span>}
                                </div>
                                <div className={styles.eventList}>
                                    {group.items.map((event) => (
                                        <div key={event.id} className={styles.eventItem}>
                                            <div className={styles.eventTime}>{event.time}</div>

                                            <div className={styles.eventInfo}>
                                                <div className={styles.eventTitle}>
                                                    <span className={styles.country}>{event.country}</span>
                                                    {event.title}
                                                </div>
                                                <div className={styles.eventType}>{event.type}</div>
                                            </div>

                                            <div className={styles.eventImpact}>
                                                <div className={styles.importance}>
                                                    {[1, 2, 3].map((star) => (
                                                        <span key={star} className={`${styles.star} ${star <= event.importance ? styles.active : ''}`}>★</span>
                                                    ))}
                                                </div>
                                                <span className={`${styles.impactValue} ${event.importance === 3 ? styles.high : styles.med}`}>
                                                    {event.importance === 3 ? '높음' : '보통'}
                                                </span>
                                            </div>

                                            <div className={styles.eventValues}>
                                                {event.actual ? (
                                                    <div className={styles.actual}>{event.actual}</div>
                                                ) : (
                                                    <div className={styles.actual} style={{ color: 'var(--text-muted)' }}>-</div>
                                                )}
                                                <div className={styles.forecast}>
                                                    예측: {event.forecast || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
