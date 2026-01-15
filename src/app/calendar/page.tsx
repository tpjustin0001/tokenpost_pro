'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

interface CalendarEvent {
    id: number;
    time: string;
    title: string;
    country: string;
    type: string;
    impact: string;
    event_date: string;
}

interface DateGroup {
    date: string;
    isToday: boolean;
    items: CalendarEvent[];
}

export default function CalendarPage() {
    const [groups, setGroups] = useState<DateGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            try {
                if (!supabase) return;

                // Fetch events from today onwards
                const today = new Date().toISOString().split('T')[0];
                const { data, error } = await supabase
                    .from('calendar_events')
                    .select('*')
                    .gte('event_date', today)
                    .order('event_date', { ascending: true })
                    .order('time', { ascending: true });

                if (error) throw error;

                if (data) {
                    // Group by date
                    const grouped: Record<string, CalendarEvent[]> = {};
                    data.forEach((event: CalendarEvent) => {
                        const date = event.event_date;
                        if (!grouped[date]) grouped[date] = [];
                        grouped[date].push(event);
                    });

                    // Convert to array
                    const groupArray: DateGroup[] = Object.keys(grouped).map(date => ({
                        date,
                        isToday: date === today,
                        items: grouped[date]
                    })).sort((a, b) => a.date.localeCompare(b.date));

                    setGroups(groupArray);
                }
            } catch (err) {
                console.error('Failed to fetch calendar:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    const getImpactScore = (impact: string) => {
        switch (impact?.toLowerCase()) {
            case 'high': return 3;
            case 'medium': return 2;
            default: return 1;
        }
    };

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
                        {loading ? (
                            <div className={styles.loadingState}>
                                로딩 중...
                            </div>
                        ) : groups.length === 0 ? (
                            <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: '60px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '12px',
                                color: 'var(--text-muted)'
                            }}>
                                <h2>📆 등록된 일정이 없습니다</h2>
                                <p style={{ marginTop: '10px' }}>오늘 예정된 주요 경제 지표가 없습니다.</p>
                            </div>
                        ) : (
                            groups.map((group) => (
                                <div key={group.date} className={styles.dateGroup}>
                                    <div className={styles.dateHeader}>
                                        {group.date}
                                        {group.isToday && <span className={styles.todayBadge}>오늘</span>}
                                    </div>
                                    <div className={styles.eventList}>
                                        {group.items.map((event) => {
                                            const importance = getImpactScore(event.impact);
                                            return (
                                                <div key={event.id} className={styles.eventItem}>
                                                    <div className={styles.eventTime}>{event.time?.slice(0, 5)}</div>

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
                                                                <span key={star} className={`${styles.star} ${star <= importance ? styles.active : ''}`}>★</span>
                                                            ))}
                                                        </div>
                                                        <span className={`${styles.impactValue} ${importance === 3 ? styles.high : styles.med}`}>
                                                            {event.impact}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
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
