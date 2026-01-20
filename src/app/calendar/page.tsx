'use client';

import { useState, useEffect, useMemo } from 'react';
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

type ViewMode = 'today' | 'week' | 'month';

const COUNTRY_FLAGS: Record<string, string> = {
    'USD': '🇺🇸',
    'EUR': '🇪🇺',
    'JPY': '🇯🇵',
    'CNY': '🇨🇳',
    'KRW': '🇰🇷',
    'GBP': '🇬🇧',
};

const TYPE_COLORS: Record<string, string> = {
    '금리': '#f59e0b',
    'PMI': '#3b82f6',
    '물가': '#ef4444',
    'GDP': '#10b981',
    '고용': '#8b5cf6',
    '소매': '#ec4899',
    '주택': '#06b6d4',
    '무역': '#84cc16',
    '연설': '#6366f1',
    '정책': '#f97316',
    '기자회견': '#d946ef',
    '심리지수': '#14b8a6',
    '제조업': '#0ea5e9',
    '기타': '#6b7280',
};

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('today');
    const [selectedCountry, setSelectedCountry] = useState<string>('all');

    // Get KST dates
    const { today, weekEnd, monthEnd } = useMemo(() => {
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstNow = new Date(now.getTime() + kstOffset);
        const todayStr = kstNow.toISOString().split('T')[0];

        const weekEndDate = new Date(kstNow);
        weekEndDate.setDate(weekEndDate.getDate() + (7 - weekEndDate.getDay()));
        const weekEndStr = weekEndDate.toISOString().split('T')[0];

        const monthEndDate = new Date(kstNow.getFullYear(), kstNow.getMonth() + 1, 0);
        const monthEndStr = monthEndDate.toISOString().split('T')[0];

        return { today: todayStr, weekEnd: weekEndStr, monthEnd: monthEndStr };
    }, []);

    useEffect(() => {
        async function fetchEvents() {
            try {
                if (!supabase) return;

                const endDate = viewMode === 'today' ? today
                    : viewMode === 'week' ? weekEnd
                        : monthEnd;

                const { data, error } = await supabase
                    .from('calendar_events')
                    .select('*')
                    .gte('event_date', today)
                    .lte('event_date', endDate)
                    .order('event_date', { ascending: true })
                    .order('time', { ascending: true });

                if (error) throw error;
                setEvents(data || []);
            } catch (err) {
                console.error('Failed to fetch calendar:', err);
            } finally {
                setLoading(false);
            }
        }

        setLoading(true);
        fetchEvents();
    }, [viewMode, today, weekEnd, monthEnd]);

    // Group events by date
    const groupedEvents = useMemo(() => {
        let filtered = events;
        if (selectedCountry !== 'all') {
            filtered = events.filter(e => e.country === selectedCountry);
        }

        const groups: Record<string, CalendarEvent[]> = {};
        filtered.forEach(event => {
            if (!groups[event.event_date]) groups[event.event_date] = [];
            groups[event.event_date].push(event);
        });
        return groups;
    }, [events, selectedCountry]);

    // Count events by impact
    const stats = useMemo(() => {
        const high = events.filter(e => e.impact === 'HIGH').length;
        const medium = events.filter(e => e.impact === 'MEDIUM').length;
        const low = events.filter(e => e.impact === 'LOW').length;
        return { high, medium, low, total: events.length };
    }, [events]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayName = days[date.getDay()];
        return { month, day, dayName, isToday: dateStr === today };
    };

    return (
        <div className={styles.appLayout}>
            <Sidebar />
            <div className={styles.mainArea}>
                <main className={styles.content}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.title}>📅 경제 캘린더</h1>
                            <p className={styles.subtitle}>글로벌 거시경제 주요 일정</p>
                        </div>
                        <div className={styles.headerRight}>
                            <div className={styles.statBox}>
                                <span className={styles.statValue}>{stats.total}</span>
                                <span className={styles.statLabel}>전체</span>
                            </div>
                            <div className={`${styles.statBox} ${styles.high}`}>
                                <span className={styles.statValue}>{stats.high}</span>
                                <span className={styles.statLabel}>HIGH</span>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className={styles.tabContainer}>
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${viewMode === 'today' ? styles.active : ''}`}
                                onClick={() => setViewMode('today')}
                            >
                                오늘
                            </button>
                            <button
                                className={`${styles.tab} ${viewMode === 'week' ? styles.active : ''}`}
                                onClick={() => setViewMode('week')}
                            >
                                이번주
                            </button>
                            <button
                                className={`${styles.tab} ${viewMode === 'month' ? styles.active : ''}`}
                                onClick={() => setViewMode('month')}
                            >
                                이번달
                            </button>
                        </div>
                        <div className={styles.filters}>
                            <select
                                className={styles.countryFilter}
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                            >
                                <option value="all">모든 국가</option>
                                <option value="USD">🇺🇸 미국</option>
                                <option value="EUR">🇪🇺 유럽</option>
                                <option value="JPY">🇯🇵 일본</option>
                                <option value="CNY">🇨🇳 중국</option>
                                <option value="KRW">🇰🇷 한국</option>
                            </select>
                        </div>
                    </div>

                    {/* Events List */}
                    <div className={styles.eventContainer}>
                        {loading ? (
                            <div className={styles.loading}>
                                <div className={styles.spinner}></div>
                                <p>일정을 불러오는 중...</p>
                            </div>
                        ) : Object.keys(groupedEvents).length === 0 ? (
                            <div className={styles.empty}>
                                <span className={styles.emptyIcon}>📭</span>
                                <h3>예정된 일정이 없습니다</h3>
                                <p>선택한 기간에 등록된 경제 일정이 없습니다.</p>
                            </div>
                        ) : (
                            Object.entries(groupedEvents).map(([date, dateEvents]) => {
                                const { month, day, dayName, isToday } = formatDate(date);
                                return (
                                    <div key={date} className={styles.dateGroup}>
                                        <div className={`${styles.dateHeader} ${isToday ? styles.todayHeader : ''}`}>
                                            <div className={styles.dateInfo}>
                                                <span className={styles.dateNumber}>{day}</span>
                                                <div className={styles.dateMeta}>
                                                    <span className={styles.dateMonth}>{month}월</span>
                                                    <span className={styles.dateDay}>{dayName}요일</span>
                                                </div>
                                                {isToday && <span className={styles.todayBadge}>TODAY</span>}
                                            </div>
                                            <span className={styles.eventCount}>{dateEvents.length}개 일정</span>
                                        </div>

                                        <div className={styles.eventList}>
                                            {dateEvents.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className={`${styles.eventCard} ${event.impact === 'HIGH' ? styles.highImpact : ''}`}
                                                >
                                                    <div className={styles.eventTime}>
                                                        {event.time?.slice(0, 5)}
                                                    </div>

                                                    <div className={styles.eventContent}>
                                                        <div className={styles.eventTop}>
                                                            <span className={styles.countryFlag}>
                                                                {COUNTRY_FLAGS[event.country] || '🌍'}
                                                            </span>
                                                            <span className={styles.countryCode}>{event.country}</span>
                                                            <span
                                                                className={styles.eventType}
                                                                style={{
                                                                    backgroundColor: `${TYPE_COLORS[event.type] || TYPE_COLORS['기타']}20`,
                                                                    color: TYPE_COLORS[event.type] || TYPE_COLORS['기타']
                                                                }}
                                                            >
                                                                {event.type}
                                                            </span>
                                                        </div>
                                                        <div className={styles.eventTitle}>{event.title}</div>
                                                    </div>

                                                    <div className={styles.eventImpact}>
                                                        <div className={styles.impactStars}>
                                                            {[1, 2, 3].map((star) => (
                                                                <span
                                                                    key={star}
                                                                    className={`${styles.star} ${(event.impact === 'HIGH' && star <= 3) ||
                                                                            (event.impact === 'MEDIUM' && star <= 2) ||
                                                                            (event.impact === 'LOW' && star <= 1)
                                                                            ? styles.filled : ''
                                                                        }`}
                                                                >
                                                                    ★
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <span className={`${styles.impactLabel} ${styles[event.impact?.toLowerCase() || 'low']}`}>
                                                            {event.impact}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
