'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
    { id: 'home', icon: 'H', label: '대시보드', href: '/' },
    { id: 'news', icon: 'N', label: '뉴스', href: '/news' },
    { id: 'research', icon: 'R', label: '리서치', href: '/research' },
    { id: 'data', icon: 'D', label: '데이터', href: '/data' },
    { id: 'analysis', icon: 'AI', label: 'AI 분석', href: '/analysis' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    return (
        <aside className={styles.sidebar}>
            <Link href="/" className={styles.logo}>
                <img src="/icon.jpg" alt="TokenPost PRO" className={styles.logoImg} />
            </Link>

            <nav className={styles.nav}>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

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
                <button
                    className={styles.themeBtn}
                    onClick={toggleTheme}
                    title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
                >
                    <span className={styles.themeIcon}>{theme === 'dark' ? 'L' : 'D'}</span>
                    <span className={styles.themeLabel}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
            </div>
        </aside>
    );
}
