'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { flaskApi, MarketGateData, VcpSignal } from '@/services/flaskApi';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getAnalyticsSummary, getUserActivities, AnalyticsSummary, UserActivity } from '@/services/analytics';

import { Shield, Lock, Activity, Server, FileText, Database, RefreshCw, LayoutDashboard, Plus, Save, FilePlus, LogIn, AlertTriangle, BarChart3, Users, Eye, Clock } from 'lucide-react';

// Admin Email Whitelist
const ADMIN_EMAILS = [
    'james@tokenpost.kr',
    'justin@tokenpost.kr',
    'simon@tokenpost.kr',
    'dan@tokenpost.kr',
    'sonny@tokenpost.kr',
    'ain@tokenpost.kr',
];

export default function AdminPage() {
    const [marketGate, setMarketGate] = useState<MarketGateData | null>(null);
    const [vcpSignals, setVcpSignals] = useState<VcpSignal[]>([]);
    const [loading, setLoading] = useState(true);

    // OAuth Auth State (replaces password auth)
    const { user, isLoggedIn, loading: authLoading, login, logout } = useAuth();

    // Development mode: bypass authentication for easier testing
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Check if user is in admin whitelist (bypassed in development)
    const isAdmin = isDevelopment || (isLoggedIn && user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

    // CMS State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'research' | 'analytics'>('dashboard');

    // Analytics State
    const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
    const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Form States
    const [newsForm, setNewsForm] = useState({ title: '', category: 'Market', summary: '', source: 'Admin' });
    const [researchForm, setResearchForm] = useState({ title: '', type: 'ANALYSIS', content: '', isPro: true });

    useEffect(() => {
        // Load data when admin is authenticated
        if (isAdmin) {
            loadData();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [isAdmin, authLoading]);

    // Load analytics when tab is selected
    useEffect(() => {
        if (activeTab === 'analytics' && isAdmin) {
            loadAnalytics();
        }
    }, [activeTab, isAdmin]);

    async function loadAnalytics() {
        setAnalyticsLoading(true);
        try {
            const [summary, activities] = await Promise.all([
                getAnalyticsSummary(7),
                getUserActivities(7)
            ]);
            if (summary) setAnalyticsSummary(summary);
            setUserActivities(activities);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    }

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

    // Login is now handled by useAuth() hook
    const handleLogin = () => {
        login(); // Redirects to TokenPost OAuth
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

    // Show loading state
    if (authLoading) {
        return (
            <main className={styles.loginWrapper}>
                <div className={styles.loginCard}>
                    <div className={styles.loginHeader}>
                        <Shield size={32} color="var(--accent-blue)" />
                        <h1>인증 확인 중...</h1>
                        <p>잠시만 기다려 주세요</p>
                    </div>
                </div>
            </main>
        );
    }

    // Not logged in - show login button
    if (!isLoggedIn) {
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
                        <p>TokenPost 계정으로 로그인이 필요합니다</p>
                    </div>

                    <div className={styles.loginForm}>
                        <button
                            onClick={handleLogin}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: '8px', alignItems: 'center' }}
                        >
                            <LogIn size={18} />
                            TokenPost 계정으로 로그인
                        </button>
                    </div>

                    <div className={styles.systemBadge}>
                        <Activity size={12} />
                        <span>보안 연결됨 (Secure)</span>
                    </div>
                </div>
            </main>
        );
    }

    // Logged in but not admin - show access denied
    if (!isAdmin) {
        return (
            <main className={styles.loginWrapper}>
                <div className={styles.loginCard}>
                    <div className={styles.loginHeader}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: '#ef4444' }}>
                                <AlertTriangle size={32} />
                            </div>
                        </div>
                        <h1>접근 권한 없음</h1>
                        <p>관리자 권한이 없는 계정입니다</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            로그인: {user?.email || '알 수 없음'}
                        </p>
                    </div>

                    <div className={styles.loginForm}>
                        <button
                            onClick={logout}
                            className="btn btn-secondary"
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            다른 계정으로 로그인
                        </button>
                        <Link href="/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px', textDecoration: 'none' }}>
                            메인으로 돌아가기
                        </Link>
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
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</span>
                    <button onClick={logout} className="btn btn-secondary">
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
                <button
                    className={`${styles.navTab} ${activeTab === 'analytics' ? styles.active : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    <BarChart3 size={18} /> 사용자 분석
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

            {activeTab === 'analytics' && (
                <>
                    {/* Analytics Summary Cards */}
                    <section className={styles.statsGrid}>
                        <div className={`card ${styles.statCard}`}>
                            <span className={styles.statLabel}>
                                <Eye size={14} style={{ marginRight: '4px' }} />
                                총 페이지 뷰
                            </span>
                            <span className={`font-mono ${styles.statValue} text-blue`}>
                                {analyticsLoading ? '...' : analyticsSummary?.totalPageViews ?? 0}
                            </span>
                            <span className="text-xs text-muted">최근 7일</span>
                        </div>
                        <div className={`card ${styles.statCard}`}>
                            <span className={styles.statLabel}>
                                <Users size={14} style={{ marginRight: '4px' }} />
                                고유 사용자
                            </span>
                            <span className={`font-mono ${styles.statValue} text-green`}>
                                {analyticsLoading ? '...' : analyticsSummary?.uniqueUsers ?? 0}
                            </span>
                            <span className="text-xs text-muted">로그인 사용자 기준</span>
                        </div>
                        <div className={`card ${styles.statCard}`}>
                            <span className={styles.statLabel}>
                                <BarChart3 size={14} style={{ marginRight: '4px' }} />
                                인기 페이지
                            </span>
                            <span className={`font-mono ${styles.statValue}`}>
                                {analyticsLoading ? '...' : analyticsSummary?.topPages?.[0]?.page_path || '-'}
                            </span>
                            <span className="text-xs text-muted">
                                {analyticsSummary?.topPages?.[0]?.count || 0}회 방문
                            </span>
                        </div>
                        <div className={`card ${styles.statCard}`}>
                            <span className={styles.statLabel}>
                                <Clock size={14} style={{ marginRight: '4px' }} />
                                데이터 기간
                            </span>
                            <span className={`font-mono ${styles.statValue}`}>7일</span>
                            <span className="text-xs text-muted">분석 기간</span>
                        </div>
                    </section>

                    <div className={styles.contentGrid}>
                        {/* Top Pages */}
                        <section className="card">
                            <div className="card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BarChart3 size={20} color="var(--accent-blue)" />
                                    <h2 className="card-title">인기 페이지 TOP 10</h2>
                                </div>
                                <button onClick={loadAnalytics} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>순위</th>
                                            <th>페이지 경로</th>
                                            <th>방문 수</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analyticsLoading ? (
                                            <tr><td colSpan={3} className="text-center p-4">로딩 중...</td></tr>
                                        ) : !analyticsSummary?.topPages?.length ? (
                                            <tr><td colSpan={3} className="text-center p-4 text-muted">데이터가 없습니다</td></tr>
                                        ) : (
                                            analyticsSummary.topPages.map((page, idx) => (
                                                <tr key={page.page_path}>
                                                    <td className="font-mono font-bold">{idx + 1}</td>
                                                    <td className="font-mono" style={{ fontSize: '13px' }}>{page.page_path}</td>
                                                    <td className="font-mono text-blue">{page.count}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* User Activity */}
                        <section className="card">
                            <div className="card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users size={20} color="var(--accent-green)" />
                                    <h2 className="card-title">사용자별 활동</h2>
                                </div>
                                <span className="badge badge-primary">{userActivities.length}명</span>
                            </div>
                            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>이메일</th>
                                            <th>페이지 뷰</th>
                                            <th>마지막 접속</th>
                                            <th>자주 방문</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analyticsLoading ? (
                                            <tr><td colSpan={4} className="text-center p-4">로딩 중...</td></tr>
                                        ) : !userActivities.length ? (
                                            <tr><td colSpan={4} className="text-center p-4 text-muted">로그인 사용자 데이터가 없습니다</td></tr>
                                        ) : (
                                            userActivities.slice(0, 15).map((user) => (
                                                <tr key={user.email}>
                                                    <td style={{ fontSize: '13px' }}>{user.email}</td>
                                                    <td className="font-mono text-blue">{user.pageViews}</td>
                                                    <td className="text-muted" style={{ fontSize: '12px' }}>
                                                        {user.lastSeen ? new Date(user.lastSeen).toLocaleString('ko-KR', {
                                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        }) : '-'}
                                                    </td>
                                                    <td style={{ fontSize: '12px' }}>
                                                        {user.topPages.slice(0, 2).join(', ') || '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    {/* Recent Activity (if needed) */}
                    {analyticsSummary?.recentActivity && analyticsSummary.recentActivity.length > 0 && (
                        <section className="card" style={{ marginTop: '24px' }}>
                            <div className="card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Activity size={20} color="var(--accent-blue)" />
                                    <h2 className="card-title">최근 활동</h2>
                                </div>
                            </div>
                            <div className="card-body" style={{ padding: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                                {analyticsSummary.recentActivity.slice(0, 10).map((event, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <span style={{ fontSize: '13px' }}>{event.page_path}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {event.user_email || '익명'} • {new Date(event.created_at).toLocaleTimeString('ko-KR')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </main>
    );
}

