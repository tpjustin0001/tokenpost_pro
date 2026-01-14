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
    const [items, setItems] = useState<MindshareItem[]>([]);
    const [globalSentiment, setGlobalSentiment] = useState<string>('Neutral');
    const [sentimentScore, setSentimentScore] = useState<number>(50);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Get Global Sentiment from Supabase (Grok Analysis)
                if (supabase) {
                    const { data } = await supabase
                        .from('global_market_snapshots')
                        .select('data')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (data?.data?.radar_data) {
                        const sentObj = data.data.radar_data.find((r: any) => r.label === 'Sentiment' || r.label === '센티멘트');
                        const score = sentObj ? sentObj.value : 50;
                        setSentimentScore(score);
                        setGlobalSentiment(score >= 60 ? 'Bullish' : score <= 40 ? 'Bearish' : 'Neutral');
                    }
                }

                // 2. Get Top Coins by Volume (Proxy for "Mindshare/Attention")
                const listings = await flaskApi.getListings(5);
                const mapped: MindshareItem[] = listings.map((coin: any) => ({
                    symbol: coin.symbol,
                    mindshare: 'High', // Top 5 volume = High Attention
                    change1M: `${coin.percent_change_1h >= 0 ? '+' : ''}${coin.percent_change_1h.toFixed(2)}%`,
                    isPositive: coin.percent_change_1h >= 0,
                    volume: `$${(coin.volume_24h / 1000000).toFixed(0)}M`
                }));
                setItems(mapped);

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

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className={styles.title}>소셜 센티멘트 (Social Vibe)</h3>
                    {!loading && (
                        <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: getScoreColor(sentimentScore) + '20',
                            color: getScoreColor(sentimentScore),
                            fontWeight: 'bold'
                        }}>
                            {globalSentiment} ({sentimentScore})
                        </span>
                    )}
                </div>
            </div>

            <div className={styles.tableHeader}>
                <span className={styles.th}>자산</span>
                <span className={`${styles.th} ${styles.thCenter}`}>주목도 (Vol)</span>
                <span className={`${styles.th} ${styles.thCenter}`}>변동 (1H)</span>
                <span className={styles.th}></span>
            </div>

            <div className={styles.list}>
                {loading ? (
                    <TableSkeleton rows={5} />
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={<MessageCircle size={32} />}
                        title="데이터 수집 중"
                        description="Grok AI가 소셜 데이터를 분석하고 있습니다."
                    />
                ) : (
                    items.map((item) => (
                        <div key={item.symbol} className={styles.row}>
                            <div className={styles.colAsset}>
                                <img
                                    src={getCoinIconUrl(item.symbol)}
                                    alt={item.symbol}
                                    className={styles.assetIcon}
                                    onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${item.symbol}&background=333&color=fff`}
                                />
                                <span className={styles.assetName}>{item.symbol}</span>
                            </div>
                            <div className={styles.colCenter}>
                                <span className={styles.badge} style={{ background: '#3b82f620', color: '#3b82f6' }}>
                                    {item.volume}
                                </span>
                            </div>
                            <div className={styles.colCenter}>
                                <span className={item.isPositive ? styles.textGreen : styles.textRed}>
                                    {item.change1M}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: 0.5 }}>
                                <BarChart2 size={14} />
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Grok Branding */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Powered by</span>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>xAI Grok</span>
            </div>
        </div>
    );
}
