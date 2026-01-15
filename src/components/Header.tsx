'use client';

import Link from 'next/link';
import styles from './Header.module.css';
import { useAuth } from '../context/AuthContext';

export default function Header() {
    const { user, isLoggedIn, loading, login, logout } = useAuth();

    return (
        <header className={styles.header}>
            <div className={styles.headerContent}>
                <Link href="/" className={styles.headerLogo}>
                    TokenPost<span>PRO</span>
                </Link>

                <div className={styles.headerActions}>
                    {loading ? (
                        <div className={styles.loadingDot}>...</div>
                    ) : isLoggedIn && user ? (
                        <div className={styles.userMenu}>
                            {user.profile_image && (
                                <img
                                    src={user.profile_image}
                                    alt="Profile"
                                    className={styles.userAvatar}
                                />
                            )}
                            <span className={styles.userName}>
                                {user.nickname || user.email || 'User'}
                            </span>
                            {user.grade_name && (
                                <span className={styles.userBadge}>{user.grade_name}</span>
                            )}
                            <button
                                className={styles.logoutBtn}
                                onClick={logout}
                            >
                                로그아웃
                            </button>
                        </div>
                    ) : (
                        <button
                            className={styles.loginBtn}
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
