'use client';

import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
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
                    <button className="btn btn-primary">
                        Login
                    </button>
                </div>
            </div>
        </header>
    );
}
