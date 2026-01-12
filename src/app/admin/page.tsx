'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { flaskApi, MarketGateData, VcpSignal } from '@/services/flaskApi';
import { supabase } from '@/lib/supabase';

import { Shield, Lock, Activity, Server, FileText, Database, RefreshCw, LayoutDashboard, Plus, Save, FilePlus } from 'lucide-react';

export default function AdminPage() {
    const [marketGate, setMarketGate] = useState<MarketGateData | null>(null);
    const [vcpSignals, setVcpSignals] = useState<VcpSignal[]>([]);
    const [loading, setLoading] = useState(true);

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // CMS State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'research'>('dashboard');

    // Form States
    const [newsForm, setNewsForm] = useState({ title: '', category: 'Market', summary: '', source: 'Admin' });
    const [researchForm, setResearchForm] = useState({ title: '', type: 'ANALYSIS', content: '', isPro: true });

    useEffect(() => {
        // Check session
        const session = localStorage.getItem('admin_session');
        if (session === 'valid') {
            setIsAuthenticated(true);
            loadData();
        } else {
            setLoading(false); // Stop loading if not auth
        }
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [gateData, signalsData] = await Promise.all([
                flaskApi.getMarketGate(),
                flaskApi.getVcpSignals()
            ]);

            if (gateData) setMarketGate(gateData);
            if (signalsData) setVcpSignals(signalsData.signals);
        } catch (error) {
            console.error('Admin Dashboard Data Error:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple password for demo
        if (password === 'tokenpost123!') {
            localStorage.setItem('admin_session', 'valid');
            setIsAuthenticated(true);
            loadData();
        } else {
            setError('Invalid credentials');
        }
    };

    const handleNewsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!supabase) throw new Error('Supabase client not initialized');

            const { error } = await supabase.from('news').insert({
                title: newsForm.title,
                category: newsForm.category,
                summary: newsForm.summary,
                source: newsForm.source,
                published_at: new Date().toISOString(),
                author: 'Admin'
            });

            if (error) throw error;

            alert('뉴스가 성공적으로 발행되었습니다!');
            setNewsForm({ title: '', category: 'Market', summary: '', source: 'Admin' });
        } catch (err) {
            console.error('News Publish Error:', err);
            alert('뉴스 발행에 실패했습니다.');
        }
    };

    const handleResearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!supabase) throw new Error('Supabase client not initialized');

            const { error } = await supabase.from('research').insert({
                title: researchForm.title,
                category: researchForm.type, // Mapping 'type' to 'category' column
                content: researchForm.content,
                summary: researchForm.content.substring(0, 100) + '...',
                author: 'Admin',
                is_premium: researchForm.isPro,
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            alert('리서치 리포트가 발행되었습니다!');
            setResearchForm({ title: '', type: 'ANALYSIS', content: '', isPro: true });
        } catch (err) {
            console.error('Research Publish Error:', err);
            alert('리서치 발행에 실패했습니다. (테이블이 존재하는지 확인해주세요)');
        }
    };

    if (!isAuthenticated) {
        return (
            <main className={styles.loginWrapper}>
                <div className={styles.loginCard}>
                    <div className={styles.loginHeader}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', color: 'var(--accent-blue)' }}>
                                <Shield size={32} />
                            </div>
                        </div>
                        <h1>관리자 콘솔</h1>
                        <p>보안 시스템 접근 승인이 필요합니다</p>
                    </div>

                    <form onSubmit={handleLogin} className={styles.loginForm}>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                placeholder="접근 키 입력 (Access Key)"
                                className={styles.inputField}
                                style={{ paddingLeft: '40px', width: '100%' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <span style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center' }}>인증 정보가 올바르지 않습니다.</span>}
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            시스템 접속
                        </button>
                    </form>

                    <div className={styles.systemBadge}>
                        <Activity size={12} />
                        <span>보안 연결됨 (Secure)</span>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={`container ${styles.main}`}>
            <header className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={24} color="var(--accent-blue)" />
                    <h1>최고 관리자 (Administrator)</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => { localStorage.removeItem('admin_session'); setIsAuthenticated(false); }} className="btn btn-secondary">
                        로그아웃
                    </button>
                    <Link href="/" className="btn btn-primary">
                        메인 앱으로 이동 →
                    </Link>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className={styles.adminNav}>
                <button
                    className={`${styles.navTab} ${activeTab === 'dashboard' ? styles.active : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <LayoutDashboard size={18} /> 대시보드
                </button>
                <button
                    className={`${styles.navTab} ${activeTab === 'news' ? styles.active : ''}`}
                    onClick={() => setActiveTab('news')}
                >
                    <Plus size={18} /> 뉴스 작성
                </button>
                <button
                    className={`${styles.navTab} ${activeTab === 'research' ? styles.active : ''}`}
                    onClick={() => setActiveTab('research')}
                >
                    <FilePlus size={18} /> 리서치 발행
                </button>
            </nav>

            {/* Tab Content */}
            {activeTab === 'dashboard' && (
                <>
                    {/* System Status Overview */}
                    <section className={styles.statsGrid}>
                        <div className={`card ${styles.statCard}`}>
                            <span className={styles.statLabel}>마켓 게이트 (Market Gate)</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                    className={`font-mono ${styles.statValue}`}
                                    style={{ color: marketGate?.gate_color === 'GREEN' ? '#10b981' : marketGate?.gate_color === 'RED' ? '#ef4444' : '#f59e0b' }}
                                >
                                    {loading ? '...' : `${marketGate?.score ?? 0}`}
                                </span>
                                <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>점수</span>
                            </div>
                            <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: marketGate?.gate_color === 'GREEN' ? '#10b981' : marketGate?.gate_color === 'RED' ? '#ef4444' : '#f59e0b' }} />
                                {marketGate?.gate_color ? `${marketGate.gate_color} 모드` : '오프라인'}
                            </span>
                        </div>
                        <div className={`card ${styles.statCard}`}>
                            <span className={styles.statLabel}>활성 시그널</span>
                            <span className={`font-mono ${styles.statValue} text-blue`}>{loading ? '...' : vcpSignals.length}</span>
                            <span className="text-xs text-muted">감지된 VCP 패턴</span>
                        </div>
                        <div className={`card ${styles.statCard}`}>
                            <span className={styles.statLabel}>시스템 상태</span>
                            <span className={`font-mono ${styles.statValue} text-green`}>99.9%</span>
                            <span className="text-xs text-muted">24시간 가동률</span>
                        </div>
                        <div className={`card ${styles.statCard}`}>
                            <span className={styles.statLabel}>API 지연시간</span>
                            <span className={`font-mono ${styles.statValue}`}>12ms</span>
                            <span className="text-xs text-muted">Flask 백엔드</span>
                        </div>
                    </section>

                    <div className={styles.contentGrid}>
                        {/* VCP Signals Management */}
                        <section className="card">
                            <div className="card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Activity size={20} color="var(--accent-blue)" />
                                    <h2 className="card-title">실시간 포착 시그널</h2>
                                </div>
                                <span className="badge badge-primary">{vcpSignals.length}개 활성</span>
                            </div>
                            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>심볼 (Symbol)</th>
                                            <th>등급 (Grade)</th>
                                            <th>점수 (Score)</th>
                                            <th>유형 (Type)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={4} className="text-center p-4">동기화 중...</td></tr>
                                        ) : vcpSignals.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center p-4 text-muted">활성화된 시그널이 없습니다.</td></tr>
                                        ) : (
                                            vcpSignals.map((signal, idx) => (
                                                <tr key={idx}>
                                                    <td className="font-mono font-bold">{signal.symbol}</td>
                                                    <td>
                                                        <span className={`badge ${signal.grade === 'A' ? 'badge-green' : 'badge-warning'}`}>
                                                            {signal.grade}등급
                                                        </span>
                                                    </td>
                                                    <td className="font-mono">{signal.score}</td>
                                                    <td>{signal.signal_type}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className={styles.quickActions}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Database size={20} />
                                <h3>시스템 작업</h3>
                            </div>
                            <div className={styles.actionButtons}>
                                <button className="btn btn-secondary" onClick={() => window.location.reload()} style={{ flex: 1 }}>
                                    <RefreshCw size={14} style={{ marginRight: '6px' }} />
                                    DB 새로고침
                                </button>
                                <button className="btn btn-secondary" style={{ flex: 1 }}>
                                    <Server size={14} style={{ marginRight: '6px' }} />
                                    로그 확인
                                </button>
                            </div>
                        </section>
                    </div>
                </>
            )}

            {activeTab === 'news' && (
                <section className={styles.formCard}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={20} color="var(--accent-blue)" />
                        새 뉴스 작성
                    </h2>
                    <form onSubmit={handleNewsSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>제목 (Title)</label>
                            <input
                                className={styles.inputField}
                                value={newsForm.title}
                                onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                                placeholder="뉴스 헤드라인을 입력하세요..."
                                required
                            />
                        </div>
                        <div className={styles.formGroup} style={{ maxWidth: '200px' }}>
                            <label className={styles.formLabel}>카테고리</label>
                            <select
                                className={styles.select}
                                value={newsForm.category}
                                onChange={e => setNewsForm({ ...newsForm, category: e.target.value })}
                            >
                                <option value="Market">시장 (Market)</option>
                                <option value="Global">글로벌 (Global)</option>
                                <option value="Tech">기술 (Tech)</option>
                                <option value="Policy">정책 (Policy)</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>요약 / 본문</label>
                            <textarea
                                className={styles.textArea}
                                value={newsForm.summary}
                                onChange={e => setNewsForm({ ...newsForm, summary: e.target.value })}
                                placeholder="뉴스 내용을 입력하세요..."
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Save size={18} /> 뉴스 발행하기
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {activeTab === 'research' && (
                <section className={styles.formCard}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FilePlus size={20} color="var(--accent-blue)" />
                        신규 리서치 리포트 작성
                    </h2>
                    <form onSubmit={handleResearchSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>리포트 제목</label>
                            <input
                                className={styles.inputField}
                                value={researchForm.title}
                                onChange={e => setResearchForm({ ...researchForm, title: e.target.value })}
                                placeholder="리서치 리포트 제목을 입력하세요..."
                                required
                            />
                        </div>
                        <div className={styles.formGroup} style={{ maxWidth: '200px' }}>
                            <label className={styles.formLabel}>리포트 유형</label>
                            <select
                                className={styles.select}
                                value={researchForm.type}
                                onChange={e => setResearchForm({ ...researchForm, type: e.target.value })}
                            >
                                <option value="ANALYSIS">분석 (Analysis)</option>
                                <option value="REPORT">리포트 (Report)</option>
                                <option value="INSIGHT">인사이트 (Insight)</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>전체 내용</label>
                            <textarea
                                className={styles.textArea}
                                style={{ minHeight: '200px' }}
                                value={researchForm.content}
                                onChange={e => setResearchForm({ ...researchForm, content: e.target.value })}
                                placeholder="심층 분석 내용을 작성하세요..."
                                required
                            />
                        </div>
                        <label className={styles.checkboxGroup}>
                            <input
                                type="checkbox"
                                checked={researchForm.isPro}
                                onChange={e => setResearchForm({ ...researchForm, isPro: e.target.checked })}
                            />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>PRO 전용 콘텐츠로 설정</span>
                        </label>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Save size={18} /> 리서치 발행하기
                            </button>
                        </div>
                    </form>
                </section>
            )}
        </main>
    );
}
