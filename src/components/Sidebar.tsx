'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
                <div className={styles.userBtn}>
                    <span className={styles.userIcon}>U</span>
                </div>
            </div>
        </aside>
    );
}
