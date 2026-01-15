'use client';

import Link from 'next/link';
import styles from './Header.module.css';
import { useAuth } from '../context/AuthContext';

export default function Header() {
    const { user, isLoggedIn, loading, login, logout } = useAuth();

    return (
        <header className="header">
            <div className="header-content container">
                <Link href="/" className="header-logo">
                    TokenPost<span>PRO</span>
                </Link>

                <nav className="header-nav">
                    <Link href="/" className="nav-link active">
                        Dashboard
                    </Link>
                    <Link href="/markets" className="nav-link">
                        Markets
                    </Link>
                    <Link href="/insights" className="nav-link">
                        Insights
                    </Link>
                    <Link href="/admin" className="nav-link">
                        Admin
                    </Link>
                </nav>

                <div className={styles.headerActions}>
                    {loading ? (
                        <div className={styles.loadingDot}>...</div>
                    ) : isLoggedIn && user ? (
                        <div className={styles.userMenu}>
                            <span className={styles.userName}>
                                {user.nickname || user.email || 'User'}
                            </span>
                            {user.grade_name && (
                                <span className={styles.userBadge}>{user.grade_name}</span>
                            )}
                            <button
                                className="btn btn-secondary"
                                onClick={logout}
                            >
                                로그아웃
                            </button>
                        </div>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={login}
                        >
                            로그인
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
