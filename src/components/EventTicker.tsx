'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './EventTicker.module.css';
import Link from 'next/link';

const EVENT_TYPE_MAP: Record<string, string> = {
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low'
};

export default function EventTicker() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            try {
                if (!supabase) return;

                // Fetch today's and coming events
                const { data, error } = await supabase
                    .from('calendar_events')
                    .select('*')
                    .gte('event_date', new Date().toISOString().split('T')[0]) // From today
                    .order('event_date', { ascending: true })
                    .order('time', { ascending: true })
                    .limit(10);

                if (error) throw error;
                if (data) setEvents(data);
            } catch (err) {
                console.error('Failed to fetch calendar events:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();

        // Refresh every 5 minutes
        const interval = setInterval(fetchEvents, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.tickerContainer}>
            <div className={styles.label}>
                📅 TODAY'S SCHEDULE
            </div>

            <div className={styles.tickerWrapper}>
                <div className={styles.tickerContent}>
                    {loading ? (
                        <div className={styles.tickerItem}>
                            <span style={{ color: 'var(--text-muted)' }}>일정을 불러오는 중...</span>
                        </div>
                    ) : events.length === 0 ? (
                        <div className={styles.tickerItem}>
                            <span style={{ color: 'var(--text-muted)' }}>등록된 일정이 없습니다.</span>
                        </div>
                    ) : (
                        <>
                            {events.map((event, idx) => (
                                <div key={event.id || idx} className={styles.tickerItem}>
                                    <span className={styles.time}>{event.time?.slice(0, 5)}</span>
                                    <span className={`${styles.badge} ${styles[event.impact?.toLowerCase() || 'medium']}`}>
                                        {event.country} {event.type}
                                    </span>
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
