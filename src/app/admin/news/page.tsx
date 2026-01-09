'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, News } from '@/lib/supabase';
import styles from './page.module.css';

const COIN_OPTIONS = [
    { value: 'BTC', label: '비트코인 (BTC)' },
    { value: 'ETH', label: '이더리움 (ETH)' },
    { value: 'XRP', label: '리플 (XRP)' },
    { value: 'SOL', label: '솔라나 (SOL)' },
    { value: 'DOGE', label: '도지코인 (DOGE)' },
];

const CATEGORIES = ['규제', '시장', 'DeFi', '정책', 'Layer2', 'NFT', '기타'];

export default function AdminNewsPage() {
    const [newsList, setNewsList] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('시장');
    const [source, setSource] = useState('TokenPost');
    const [imageUrl, setImageUrl] = useState('');
    const [sentimentScore, setSentimentScore] = useState<number>(0);
    const [showOnChart, setShowOnChart] = useState(false);
    const [relatedCoin, setRelatedCoin] = useState('BTC');

    useEffect(() => {
        fetchNews();
    }, []);

    async function fetchNews() {
        if (!supabase) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('news')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error && data) {
            setNewsList(data);
        }
        setLoading(false);
    }

    function resetForm() {
        setTitle('');
        setSummary('');
        setContent('');
        setCategory('시장');
        setSource('TokenPost');
        setImageUrl('');
        setSentimentScore(0);
        setShowOnChart(false);
        setRelatedCoin('BTC');
        setEditingId(null);
        setIsEditing(false);
    }

    function handleEdit(news: News) {
        setTitle(news.title);
        setSummary(news.summary || '');
        setContent(news.content || '');
        setCategory(news.category || '시장');
        setSource(news.source || 'TokenPost');
        setImageUrl(news.image_url || '');
        setSentimentScore(news.sentiment_score || 0);
        setShowOnChart(news.show_on_chart || false);
        setRelatedCoin(news.related_coin || 'BTC');
        setEditingId(news.id);
        setIsEditing(true);
    }

    async function handleSave() {
        if (!supabase || !title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        const newsData = {
            title: title.trim(),
            summary: summary.trim() || null,
            content: content.trim() || null,
            category,
            source,
            image_url: imageUrl.trim() || null,
            sentiment_score: sentimentScore,
            show_on_chart: showOnChart,
            related_coin: showOnChart ? relatedCoin : null,
            published_at: new Date().toISOString(),
        };

        let error;
        if (editingId) {
            // Update existing
            const result = await supabase
                .from('news')
                .update(newsData)
                .eq('id', editingId);
            error = result.error;
        } else {
            // Insert new
            const result = await supabase
                .from('news')
                .insert([newsData]);
            error = result.error;
        }

        if (error) {
            alert('저장 실패: ' + error.message);
            return;
        }

        resetForm();
        fetchNews();
    }

    async function handleDelete(id: number) {
        if (!supabase) return;
        if (!confirm('정말 삭제하시겠습니까?')) return;

        const { error } = await supabase.from('news').delete().eq('id', id);
        if (error) {
            alert('삭제 실패: ' + error.message);
            return;
        }
        fetchNews();
    }

    if (!supabase) {
        return (
            <main className={styles.main}>
                <header className={styles.header}>
                    <h1>뉴스 관리</h1>
                    <Link href="/admin" className={styles.backBtn}>← 어드민으로</Link>
                </header>
                <div className={styles.noSupabase}>
                    <h2>Supabase 연결 필요</h2>
                    <p>환경 변수를 설정해주세요:</p>
                    <code>
                        NEXT_PUBLIC_SUPABASE_URL<br />
                        NEXT_PUBLIC_SUPABASE_ANON_KEY
                    </code>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1>뉴스 관리</h1>
                <div className={styles.headerActions}>
                    <button
                        className={styles.newBtn}
                        onClick={() => { resetForm(); setIsEditing(true); }}
                    >
                        + 새 뉴스 작성
                    </button>
                    <Link href="/admin" className={styles.backBtn}>← 어드민으로</Link>
                </div>
            </header>

            {/* Editor Form */}
            {isEditing && (
                <section className={styles.editorSection}>
                    <h2>{editingId ? '뉴스 수정' : '새 뉴스 작성'}</h2>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>제목 *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="뉴스 제목을 입력하세요"
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>카테고리</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>출처</label>
                                <input
                                    type="text"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    placeholder="TokenPost"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>감성 점수 (-1 ~ 1)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="-1"
                                    max="1"
                                    value={sentimentScore}
                                    onChange={(e) => setSentimentScore(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>요약</label>
                            <textarea
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="뉴스 요약을 입력하세요"
                                rows={2}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>본문 (Markdown)</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="뉴스 본문을 입력하세요"
                                rows={6}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>썸네일 URL</label>
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        {/* Chart Display Settings */}
                        <div className={styles.chartSection}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={showOnChart}
                                    onChange={(e) => setShowOnChart(e.target.checked)}
                                />
                                <span>📈 차트에 주요 이벤트로 표시 (News Impact)</span>
                            </label>

                            {showOnChart && (
                                <div className={styles.coinSelect}>
                                    <span>대상 코인:</span>
                                    <select
                                        value={relatedCoin}
                                        onChange={(e) => setRelatedCoin(e.target.value)}
                                    >
                                        {COIN_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className={styles.formActions}>
                            <button className={styles.saveBtn} onClick={handleSave}>
                                {editingId ? '수정 완료' : '저장'}
                            </button>
                            <button className={styles.cancelBtn} onClick={resetForm}>
                                취소
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* News List */}
            <section className={styles.listSection}>
                <h2>뉴스 목록</h2>
                {loading ? (
                    <div className={styles.loading}>로딩 중...</div>
                ) : newsList.length === 0 ? (
                    <div className={styles.empty}>등록된 뉴스가 없습니다.</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>카테고리</th>
                                <th>제목</th>
                                <th>출처</th>
                                <th>차트</th>
                                <th>작성일</th>
                                <th>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {newsList.map(news => (
                                <tr key={news.id}>
                                    <td>{news.id}</td>
                                    <td><span className={styles.categoryBadge}>{news.category || '-'}</span></td>
                                    <td className={styles.titleCell}>{news.title}</td>
                                    <td>{news.source}</td>
                                    <td>
                                        {news.show_on_chart && (
                                            <span className={styles.chartBadge}>{news.related_coin}</span>
                                        )}
                                    </td>
                                    <td>{new Date(news.created_at).toLocaleDateString()}</td>
                                    <td className={styles.actions}>
                                        <button onClick={() => handleEdit(news)}>수정</button>
                                        <button className={styles.deleteBtn} onClick={() => handleDelete(news.id)}>삭제</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </main>
    );
}
