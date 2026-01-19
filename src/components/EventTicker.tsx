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
                if (!supabase) {
                    console.log('[EventTicker] Supabase not initialized');
                    return;
                }

                // Calculate "Today 00:00:00 KST" in ISO UTC format
                // KST is UTC+9. So "Today 00:00 KST" is "Yesterday 15:00 UTC"
                const now = new Date();
                const kstOffset = 9 * 60 * 60 * 1000;
                const kstNow = new Date(now.getTime() + kstOffset);

                // Get KST date string: YYYY-MM-DD
                const kstDateStr = kstNow.toISOString().split('T')[0];
                console.log('[EventTicker] Fetching events from KST Date:', kstDateStr);

                const { data, error } = await supabase
                    .from('calendar_events')
                    .select('*')
                    .gte('event_date', kstDateStr) // Filter by KST Date
                    .order('event_date', { ascending: true })
                    .order('time', { ascending: true })
                    .limit(20);

                if (error) {
                    console.error('[EventTicker] Fetch error:', error);
                    throw error;
                }
                console.log('[EventTicker] Fetched events:', data?.length || 0);
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
