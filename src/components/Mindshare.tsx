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
                // 1. First try Supabase (cached scheduler data - fast)
                if (supabase) {
                    const { data: snaps } = await supabase
                        .from('global_market_snapshots')
                        .select('data')
                        .eq('is_latest', true)
                        .limit(1)
                        .single();

                    if (snaps?.data && snaps.data.grok_saying) {
                        console.log("✅ Mindshare: Loaded from Supabase cache");
                        setData(snaps.data);
                        setLoading(false);
                        return;
                    }
                }

                // 2. Fallback: Call Flask API (triggers Grok - slow)
                console.log("⚠️ Mindshare: No cache, calling Flask API...");
                const res = await fetch('/api/python/crypto/xray/global');
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.grok_saying) {
                        setData(json);
                    }
                }
            } catch (error) {
                console.error("Mindshare Load Failed:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        // Refresh every 5 minutes
        const interval = setInterval(fetchData, 300000);
        return () => clearInterval(interval);
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
    const influencers = data?.top_influencers || data?.top_tweets || [];
    const whales = data?.whale_alerts || [];

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className={styles.title}>AI 마켓 & 속보</h3>
                    <span className="liveBadge">LIVE</span>
                </div>
            </div>

            {/* Scrollable content area */}
            <div className={styles.scrollContent}>
                {/* 1. Grok Insight Card */}
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span style={{ fontSize: '18px' }}>🧠</span>
                        <span style={{ fontWeight: 600, color: '#e5e7eb' }}>AI 인사이트</span>
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
                {influencers.length > 0 && (
                    <div className={styles.section} style={{ marginTop: '16px' }}>
                        <h4 className={styles.sectionTitle}>🗣️ Top 5 Major Influencers (xAI Analysis)</h4>
                        <div className={styles.feedList}>
                            {influencers.slice(0, 5).map((t: any, i: number) => (
                                <div key={i} className={styles.tweetItem}>
                                    <div className={styles.tweetHeader}>
                                        <span className={styles.tweetAuthor}>{t.author}</span>
                                        <span className={styles.tweetHandle}>{t.handle}</span>
                                        {t.likes && <span style={{ color: '#ef4444', fontSize: '11px', marginLeft: '6px' }}>❤️ {t.likes}</span>}
                                        <span className={styles.tweetTime}>· {t.time}</span>
                                    </div>
                                    <p className={styles.tweetContent}>{t.content}</p>
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
