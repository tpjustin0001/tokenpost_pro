'use client';

import styles from './TopBar.module.css';

export default function TopBar() {
    return (
        <header className="top-bar">
            <div className="search-box">
                <span className={styles.searchIcon}>⌘</span>
                <input type="text" placeholder="Search or jump to..." />
                <kbd className={styles.shortcut}>/</kbd>
            </div>

            <div className={styles.timeframes}>
                {['12H', '1D', '1W', '1M', '3M', 'YTD', '1Y', '3Y', '5Y'].map((tf) => (
                    <button
                        key={tf}
                        className={`btn ${tf === '1D' ? 'active' : ''}`}
                    >
                        {tf}
                    </button>
                ))}
            </div>

            <div className="top-actions">
                <button className="btn btn-primary">
                    Ask Copilot
                </button>
            </div>
        </header>
    );
}
