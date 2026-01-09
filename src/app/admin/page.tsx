import Link from 'next/link';
import styles from './page.module.css';

// Mock data for admin dashboard
const PENDING_ASSETS = [
    { symbol: 'NEW1', name: 'New Token 1', status: 'draft', created: '2024-01-08' },
    { symbol: 'NEW2', name: 'New Token 2', status: 'draft', created: '2024-01-07' },
];

const RECENT_INSIGHTS = [
    { id: '1', title: '비트코인 온체인 분석 리포트', author: 'Admin', status: 'published' },
    { id: '2', title: '이더리움 L2 비교 분석', author: 'Admin', status: 'draft' },
];

const USERS_STATS = {
    total: 1234,
    pro: 156,
    enterprise: 12,
};

export default function AdminPage() {
    return (
        <main className={`container ${styles.main}`}>
            <header className={styles.header}>
                <h1>Admin Dashboard</h1>
                <Link href="/" className="btn btn-secondary">
                    ← Back to Site
                </Link>
            </header>

            {/* Stats Overview */}
            <section className={styles.statsGrid}>
                <div className={`card ${styles.statCard}`}>
                    <span className={styles.statLabel}>총 회원</span>
                    <span className={`font-mono ${styles.statValue}`}>{USERS_STATS.total}</span>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className={styles.statLabel}>PRO 구독자</span>
                    <span className={`font-mono ${styles.statValue} text-green`}>{USERS_STATS.pro}</span>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className={styles.statLabel}>Enterprise</span>
                    <span className={`font-mono ${styles.statValue} text-blue`}>{USERS_STATS.enterprise}</span>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className={styles.statLabel}>검토 대기</span>
                    <span className={`font-mono ${styles.statValue} text-red`}>{PENDING_ASSETS.length}</span>
                </div>
            </section>

            <div className={styles.contentGrid}>
                {/* Pending Assets */}
                <section className="card">
                    <div className="card-header">
                        <h2 className="card-title">⚠️ 검토 대기 자산</h2>
                        <span className="badge badge-warning">{PENDING_ASSETS.length} pending</span>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PENDING_ASSETS.map((asset) => (
                                    <tr key={asset.symbol}>
                                        <td className="font-mono">{asset.symbol}</td>
                                        <td>{asset.name}</td>
                                        <td>
                                            <span className="badge badge-warning">{asset.status}</span>
                                        </td>
                                        <td className="text-muted">{asset.created}</td>
                                        <td>
                                            <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Recent Insights */}
                <section className="card">
                    <div className="card-header">
                        <h2 className="card-title">📝 최근 인사이트</h2>
                        <button className="btn btn-primary">+ New</button>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Author</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {RECENT_INSIGHTS.map((insight) => (
                                    <tr key={insight.id}>
                                        <td>{insight.title}</td>
                                        <td className="text-muted">{insight.author}</td>
                                        <td>
                                            <span className={`badge ${insight.status === 'published' ? 'badge-green' : 'badge-warning'}`}>
                                                {insight.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Quick Actions */}
            <section className={styles.quickActions}>
                <h3>Quick Actions</h3>
                <div className={styles.actionButtons}>
                    <Link href="/admin/news" className="btn btn-primary">📰 뉴스 관리</Link>
                    <Link href="/admin/research" className="btn btn-primary">📊 리서치 관리</Link>
                    <button className="btn btn-secondary">🔄 가격 동기화</button>
                    <button className="btn btn-secondary">📧 알림 발송</button>
                    <button className="btn btn-secondary">🗑️ 캐시 초기화</button>
                </div>
            </section>
        </main>
    );
}
