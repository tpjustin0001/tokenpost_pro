'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useXRay } from '@/context/XRayContext';
import styles from './Sidebar.module.css';

import { LayoutDashboard, Newspaper, Search, BarChart3, Radio, Bot, GraduationCap, CalendarDays, Menu, X } from 'lucide-react';

// Using Lucide icons
const NAV_ITEMS = [
    { id: 'home', icon: <LayoutDashboard size={20} />, label: '터미널 (Terminal)', href: '/' },
    { id: 'data', icon: <BarChart3 size={20} />, label: '마켓 데이터 (Data)', href: '/data' },
    { id: 'analysis', icon: <Bot size={20} />, label: 'AI 전략 (Strategy)', href: '/analysis' },
    { id: 'news', icon: <Newspaper size={20} />, label: '뉴스피드 (News)', href: '/news' },
    { id: 'research', icon: <Search size={20} />, label: '인사이트 (Insights)', href: '/research' },
    { id: 'calendar', icon: <CalendarDays size={20} />, label: '일정 (Calendar)', href: '/calendar' },
    { id: 'academy', icon: <GraduationCap size={20} />, label: '아카데미 (Academy)', href: 'https://academy.tokenpost.kr/', external: true },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const { isXRayActive, toggleXRay } = useXRay();
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
                <div className={styles.userProfile}>
                    <div className={styles.userAvatar}>QP</div>
                    <div className={styles.userInfo}>
                        <span className={styles.username}>Admin User</span>
                        <span className={styles.userRole}>PRO MEMBER</span>
                    </div>
                </div>

                <button
                    className={`${styles.themeBtn} ${isXRayActive ? styles.activeXRay : ''}`}
                    onClick={toggleXRay}
                    style={isXRayActive ? { borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)' } : { marginBottom: '8px' }}
                >
                    <Radio size={16} />
                    <span>X-Ray Mode</span>
                </button>

                <button
                    className={styles.themeBtn}
                    onClick={toggleTheme}
                    title="테마 변경"
                >
                    <span className={styles.themeIcon}>{theme === 'dark' ? '☀️' : '🌙'}</span>
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
            </div>
        </aside>
        </>
    );
}
