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
    // 캘린더 목업 데이터 초기화 (추후 API 연동 필요: 한국/미국 주요 지표 위주)
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
                        {EVENTS.length === 0 ? (
                            <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: '60px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '12px',
                                color: 'var(--text-muted)'
                            }}>
                                <h2>📆 경제 캘린더 연동 준비 중</h2>
                                <p style={{ marginTop: '10px' }}>실시간 경제 지표 및 암호화폐 일정을 집계하고 있습니다.</p>
                            </div>
                        ) : (
                            EVENTS.map((group) => (
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
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
