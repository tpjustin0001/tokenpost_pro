'use client';

import styles from './NewsFeed.module.css';

interface NewsItem {
    id: string;
    time: string;
    source: string;
    title: string;
    tags?: string[];
}

const MOCK_NEWS: NewsItem[] = [
    {
        id: '1',
        time: '37m',
        source: 'CoinDesk',
        title: 'Bitcoin, ether ease after early January pop as markets price fed cuts',
        tags: ['BTC', 'ETH'],
    },
    {
        id: '2',
        time: '60m',
        source: 'CoinDesk',
        title: "XRP slips 5% as CNBC terms it 'hottest trade' of 2026 over bitcoin and ether",
        tags: ['XRP'],
    },
    {
        id: '3',
        time: '1h',
        source: 'The Block',
        title: 'Kalshi CEO endorses bill banning insider trading on prediction markets',
    },
    {
        id: '4',
        time: '1h',
        source: 'CoinDesk',
        title: 'Ethereum bumps blob capacity as it gears for Fusaka upgrade',
        tags: ['ETH'],
    },
    {
        id: '5',
        time: '2h',
        source: 'Decrypt',
        title: 'World Liberty Financial Applies for OCC Trust Bank Charter',
    },
    {
        id: '6',
        time: '3h',
        source: 'The Block',
        title: 'Sei warns USDC token holders to swap for native stablecoin ahead of planned upgrade',
        tags: ['SEI'],
    },
];

export default function NewsFeed() {
    return (
        <div className="news-list">
            {MOCK_NEWS.map((news) => (
                <article key={news.id} className="news-item">
                    <div className="news-meta">
                        <span className="news-time">{news.time}</span>
                        <span className="news-source">{news.source}</span>
                    </div>
                    <h3 className="news-title">{news.title}</h3>
                </article>
            ))}
        </div>
    );
}
