'use client';

import styles from './EventTicker.module.css';
import Link from 'next/link';

const EVENTS = [
    { time: '22:30', title: 'US CPI (YoY)', type: 'Macro', country: '🇺🇸', impact: 'HIGH' },
    { time: '23:00', title: 'Solana Breakpoint', type: 'Crypto', country: '🌐', impact: 'MED' },
    { time: '09:00', title: 'China GDP Growth', type: 'Macro', country: '🇨🇳', impact: 'HIGH' },
    { time: '18:00', title: 'TIA Token Unlock ($140M)', type: 'Unlock', country: '🔓', impact: 'HIGH' },
];

export default function EventTicker() {
    return (
        <div className={styles.tickerContainer}>
            <div className={styles.label}>
                📅 TODAY'S SCHEDULE
            </div>

            <div className={styles.tickerWrapper}>
                <div className={styles.tickerContent}>
                    {EVENTS.map((event, idx) => (
                        <div key={`e1-${idx}`} className={styles.tickerItem}>
                            <span className={styles.time}>{event.time}</span>
                            <span className={`${styles.badge} ${styles[event.type.toLowerCase()]}`}>{event.country} {event.type}</span>
                            <span>{event.title}</span>
                        </div>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {EVENTS.map((event, idx) => (
                        <div key={`e2-${idx}`} className={styles.tickerItem}>
                            <span className={styles.time}>{event.time}</span>
                            <span className={`${styles.badge} ${styles[event.type.toLowerCase()]}`}>{event.country} {event.type}</span>
                            <span>{event.title}</span>
                        </div>
                    ))}
                    {EVENTS.map((event, idx) => (
                        <div key={`e3-${idx}`} className={styles.tickerItem}>
                            <span className={styles.time}>{event.time}</span>
                            <span className={`${styles.badge} ${styles[event.type.toLowerCase()]}`}>{event.country} {event.type}</span>
                            <span>{event.title}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
