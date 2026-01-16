'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { flaskApi } from '../services/flaskApi';
import { TrendingUp, MessageCircle, BarChart2 } from 'lucide-react';
import styles from './Mindshare.module.css';
import { TableSkeleton } from './LoadingSkeleton';
import EmptyState from './EmptyState';

interface MindshareItem {
    symbol: string;
    mindshare: string;
    change1M: string;
    isPositive: boolean;
    volume: string;
}

// Direct CoinGecko image URLs
function getCoinIconUrl(symbol: string): string {
    const clean = symbol.toUpperCase();
    return `https://assets.coincap.io/assets/icons/${clean.toLowerCase()}@2x.png`;
}

export default function Mindshare() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (supabase) {
                    const { data: snaps, error } = await supabase
                        .from('global_market_snapshots')
                        .select('data')
                        .order('created_at', { ascending: false })
                        .limit(1);

                    if (error) {
                        console.error("Supabase Error:", error);
                    }

                    if (snaps && snaps.length > 0) {
                        setData(snaps[0].data);
                    } else {
                        // Fallback: Fetch directly from Backend API (Bypasses RLS)
                        console.log("Supabase empty, trying backend API...");
                        const res = await fetch('/api/python/analysis/latest');
                        if (res.ok) {
                            const json = await res.json();
                            if (json.success && json.data) {
                                setData(json.data);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Mindshare Load Failed:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 60) return '#10b981';
        if (score <= 40) return '#ef4444';
        return '#fbbf24';
    };

    if (loading) return <TableSkeleton rows={3} />;

    const sentimentScore = data?.atmosphere_score || 50;
    const sentimentLabel = data?.atmosphere_label || 'Neutral';
    const grokSaying = data?.grok_saying || "시장 데이터를 분석 중입니다...";
    const keywords = data?.market_keywords || [];
    const tweets = data?.top_tweets || [];
    const whales = data?.whale_alerts || [];

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className={styles.title}>🤖 Grok Market Pulse</h3>
                    <span className={styles.liveBadge}>LIVE</span>
                </div>
            </div>

            {/* Scrollable content area */}
            <div className={styles.scrollContent}>
                {/* 1. Grok Insight Card */}
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span style={{ fontSize: '18px' }}>🧠</span>
                        <span style={{ fontWeight: 600, color: '#e5e7eb' }}>Grok's Insight</span>
                    </div>
                    <p className={styles.insightText}>
                        "{grokSaying}"
                    </p>
                </div>

                {/* 2. Atmosphere Gauge */}
                <div className={styles.section} style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                        <span style={{ color: '#ef4444' }}>😨 공포 (Fear)</span>
                        <span style={{ color: getScoreColor(sentimentScore), fontWeight: 'bold' }}>{sentimentLabel} ({sentimentScore})</span>
                        <span style={{ color: '#10b981' }}>🤑 탐욕 (Greed)</span>
                    </div>
                    <div className={styles.phBarBg}>
                        <div
                            className={styles.phBarFill}
                            style={{
                                width: `${sentimentScore}%`,
                                background: `linear-gradient(90deg, #ef4444 0%, #fbbf24 50%, #10b981 100%)`
                            }}
                        />
                        <div
                            className={styles.phIndicator}
                            style={{ left: `${sentimentScore}%` }}
                        />
                    </div>
                </div>

                {/* 3. Trending Keywords */}
                {keywords.length > 0 && (
                    <div className={styles.section} style={{ marginTop: '16px' }}>
                        <h4 className={styles.sectionTitle}>🔥 Trending Keywords</h4>
                        <div className={styles.keywordGrid}>
                            {keywords.map((k: string, i: number) => (
                                <span key={i} className={styles.keywordTag}>{k}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Live X Feed */}
                {tweets.length > 0 && (
                    <div className={styles.section} style={{ marginTop: '16px' }}>
                        <h4 className={styles.sectionTitle}>🐦 Real-time X Feed (Top 5)</h4>
                        <div className={styles.feedList}>
                            {tweets.map((t: any, i: number) => (
                                <div key={i} className={styles.tweetItem}>
                                    <div className={styles.tweetHeader}>
                                        <span className={styles.tweetAuthor}>{t.author}</span>
                                        <span className={styles.tweetHandle}>{t.handle}</span>
                                        <span className={styles.tweetTime}>· {t.time}</span>
                                    </div>
                                    <p className={styles.tweetContent}>{t.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Whale Alerts */}
                {whales.length > 0 && (
                    <div className={styles.section} style={{ marginTop: '16px' }}>
                        <h4 className={styles.sectionTitle}>🐳 고래 추적 (Whale Alert)</h4>
                        <div className={styles.feedList}>
                            {whales.map((w: any, i: number) => (
                                <div key={i} className={styles.whaleItem}>
                                    <span className={styles.whaleSymbol}>{w.symbol}</span>
                                    <span className={w.type === '매수' ? styles.whaleBuy : styles.whaleSell}>{w.type}</span>
                                    <span className={styles.whaleAmount}>{w.amount}</span>
                                    <span className={styles.whaleNote}>{w.note}</span>
                                    <span className={styles.tweetTime}>{w.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', opacity: 0.6 }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Powered by</span>
                    <span style={{ fontSize: '10px', fontWeight: 'bold' }}>xAI Grok 4.1</span>
                </div>
            </div>
        </div>
    );
}
