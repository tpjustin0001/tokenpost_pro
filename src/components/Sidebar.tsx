'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useXRay } from '@/context/XRayContext';
import { useTheme } from '@/context/ThemeContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
    { id: 'home', icon: 'H', label: '홈', href: '/' },
    { id: 'research', icon: 'R', label: '리서치', href: '/research' },
    { id: 'datasets', icon: 'D', label: '데이터', href: '/datasets' },
    { divider: true },
    { id: 'screener', icon: 'SC', label: '스크리너', href: '/screener' },
    { id: 'watchlist', icon: 'WL', label: '관심목록', href: '/watchlist' },
    { divider: true },
    { id: 'news', icon: 'N', label: '뉴스', href: '/news' },
    { id: 'unlock', icon: 'UL', label: '언락일정', href: '/unlocks' },
    { id: 'fundraising', icon: 'FR', label: '펀드레이징', href: '/fundraising' },
    { divider: true },
    { id: 'admin', icon: 'AD', label: '관리자', href: '/admin' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { isXRayMode, toggleXRayMode } = useXRay();
    const { theme, toggleTheme } = useTheme();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <span className={styles.logoText}>TP</span>
                <span className={styles.logoSub}>PRO</span>
            </div>

            <nav className={styles.nav}>
                {NAV_ITEMS.map((item, index) => {
                    if ('divider' in item) {
                        return <div key={index} className={styles.divider} />;
                    }

                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            title={item.label}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                {/* Theme Toggle */}
                <button
                    className={styles.themeBtn}
                    onClick={toggleTheme}
                    title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
                >
                    <span className={styles.themeIcon}>{theme === 'dark' ? '☀️' : '🌙'}</span>
                    <span className={styles.themeLabel}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>

                {/* X-Ray Mode Button */}
                <button
                    className={`${styles.xrayBtn} ${isXRayMode ? styles.xrayActive : ''}`}
                    onClick={toggleXRayMode}
                    title="X-Ray 학습 모드"
                >
                    <span className={styles.xrayIcon}>?</span>
                    <span className={styles.xrayLabel}>X-Ray</span>
                </button>

                <div className={styles.userBtn}>
                    <span className={styles.userIcon}>U</span>
                </div>
            </div>
        </aside>
    );
}
