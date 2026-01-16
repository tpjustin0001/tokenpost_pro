'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useXRay } from '@/context/XRayContext';
import styles from './Sidebar.module.css';

import { LayoutDashboard, Newspaper, Search, BarChart3, Radio, Bot, GraduationCap, CalendarDays, Menu, X } from 'lucide-react';

// Using Lucide icons
const NAV_ITEMS = [
    { id: 'home', icon: <LayoutDashboard size={20} />, label: '터미널', href: '/' },
    { id: 'data', icon: <BarChart3 size={20} />, label: '마켓 데이터', href: '/data' },
    { id: 'analysis', icon: <Bot size={20} />, label: 'AI 전략', href: '/analysis' },
    { id: 'news', icon: <Newspaper size={20} />, label: '뉴스피드', href: '/news' },
    { id: 'research', icon: <Search size={20} />, label: '인사이트', href: '/research' },
    { id: 'calendar', icon: <CalendarDays size={20} />, label: '일정', href: '/calendar' },
    { id: 'academy', icon: <GraduationCap size={20} />, label: '아카데미', href: 'https://academy.tokenpost.kr/', external: true },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const { isXRayActive, toggleXRay } = useXRay();
    const { user, login, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Close menu on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isMobileMenuOpen]);

    return (
        <>
            {/* Mobile Menu Toggle Button */}
            <button
                className={styles.mobileMenuToggle}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
                aria-expanded={isMobileMenuOpen}
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className={styles.mobileOverlay}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
                {/* Logo Area */}
                <Link href="/" className={styles.logo}>
                    {/* Simulated Logo text/image */}
                    <span style={{ fontSize: '18px', fontWeight: 'bold', background: 'linear-gradient(90deg, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        TOKENPOST PRO
                    </span>
                    <span className={styles.betaBadge}>BETA</span>
                </Link>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            >
                                <span className={styles.icon}>{item.icon}</span>
                                <span className={styles.label}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / User Profile */}
                <div className={styles.footer}>
                    {user && (
                        <div className={styles.userProfile}>
                            {user.profile_image ? (
                                <img src={user.profile_image} alt="" className={styles.userAvatarImg} />
                            ) : (
                                <div className={styles.userAvatar}>
                                    {(user.nickname || user.email || 'U').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className={styles.userInfo}>
                                <span className={styles.username}>{user.nickname || user.email || '사용자'}</span>
                                <span className={styles.userRole}>{user.grade_name || 'PRO'}</span>
                            </div>
                        </div>
                    )}

                    <button
                        className={`${styles.themeBtn} ${isXRayActive ? styles.activeXRay : ''}`}
                        onClick={toggleXRay}
                        style={isXRayActive ? { borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)' } : { marginBottom: '8px' }}
                    >
                        <Radio size={16} />
                        <span>X-Ray 모드</span>
                    </button>

                    <button
                        className={styles.themeBtn}
                        onClick={toggleTheme}
                        title="테마 변경"
                    >
                        <span className={styles.themeIcon}>{theme === 'dark' ? '☀️' : '🌙'}</span>
                        <span>{theme === 'dark' ? '라이트 모드' : '다크 모드'}</span>
                    </button>

                    {/* Login/Logout Button */}
                    {user ? (
                        <button
                            className={styles.themeBtn}
                            onClick={logout}
                            style={{ marginTop: '8px', color: '#ef4444' }}
                        >
                            <span>🚪</span>
                            <span>로그아웃</span>
                        </button>
                    ) : (
                        <button
                            className={styles.themeBtn}
                            onClick={login}
                            style={{ marginTop: '8px', color: '#10b981' }}
                        >
                            <span>🔑</span>
                            <span>로그인</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
