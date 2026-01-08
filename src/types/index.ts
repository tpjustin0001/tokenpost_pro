// Types for TokenPost PRO

export interface Asset {
    id: string;
    symbol: string;
    name_en: string;
    name_ko?: string;
    description_ko?: string;
    logo_url?: string;
    sector_tags?: string[];
    contract_address?: string;
    status: 'draft' | 'published';
    created_at: string;
    updated_at: string;
}

export interface PriceData {
    symbol: string;
    upbit: {
        price: number;
        change24h: number;
        volume24h: number;
    } | null;
    binance: {
        price: number;
        change24h: number;
        volume24h: number;
    } | null;
    kimchiPremium: number | null;
    usdKrwRate: number;
    timestamp: number;
}

export interface User {
    id: string;
    email: string;
    nickname?: string;
    tier: 'guest' | 'basic' | 'pro' | 'enterprise';
    created_at: string;
    last_login_at?: string;
}

export interface Insight {
    id: string;
    title: string;
    content?: string;
    author_id?: string;
    access_tier: 'all' | 'pro' | 'enterprise';
    asset_symbols?: string[];
    published_at?: string;
    created_at: string;
}

export interface VC {
    id: string;
    name: string;
    logo_url?: string;
    website?: string;
}

export type MembershipTier = 'guest' | 'basic' | 'pro' | 'enterprise';

export interface TickerInfo {
    symbol: string;
    name: string;
    name_ko: string;
    logo?: string;
}

// Common tickers with Korean names
export const SUPPORTED_TICKERS: TickerInfo[] = [
    { symbol: 'BTC', name: 'Bitcoin', name_ko: '비트코인' },
    { symbol: 'ETH', name: 'Ethereum', name_ko: '이더리움' },
    { symbol: 'XRP', name: 'Ripple', name_ko: '리플' },
    { symbol: 'SOL', name: 'Solana', name_ko: '솔라나' },
    { symbol: 'DOGE', name: 'Dogecoin', name_ko: '도지코인' },
    { symbol: 'ADA', name: 'Cardano', name_ko: '카르다노' },
    { symbol: 'AVAX', name: 'Avalanche', name_ko: '아발란체' },
    { symbol: 'DOT', name: 'Polkadot', name_ko: '폴카닷' },
    { symbol: 'MATIC', name: 'Polygon', name_ko: '폴리곤' },
    { symbol: 'LINK', name: 'Chainlink', name_ko: '체인링크' },
];
