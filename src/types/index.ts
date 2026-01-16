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

// Common tickers with Korean names - All 30 crawled + new coins
export const SUPPORTED_TICKERS: TickerInfo[] = [
    // Top 10
    { symbol: 'BTC', name: 'Bitcoin', name_ko: '비트코인' },
    { symbol: 'ETH', name: 'Ethereum', name_ko: '이더리움' },
    { symbol: 'XRP', name: 'Ripple', name_ko: '리플' },
    { symbol: 'SOL', name: 'Solana', name_ko: '솔라나' },
    { symbol: 'BNB', name: 'BNB', name_ko: '바이낸스코인' },
    { symbol: 'DOGE', name: 'Dogecoin', name_ko: '도지코인' },
    { symbol: 'ADA', name: 'Cardano', name_ko: '카르다노' },
    { symbol: 'AVAX', name: 'Avalanche', name_ko: '아발란체' },
    { symbol: 'TRX', name: 'Tron', name_ko: '트론' },
    { symbol: 'DOT', name: 'Polkadot', name_ko: '폴카닷' },
    // 11-20
    { symbol: 'LINK', name: 'Chainlink', name_ko: '체인링크' },
    { symbol: 'MATIC', name: 'Polygon', name_ko: '폴리곤' },
    { symbol: 'SHIB', name: 'Shiba Inu', name_ko: '시바이누' },
    { symbol: 'LTC', name: 'Litecoin', name_ko: '라이트코인' },
    { symbol: 'BCH', name: 'Bitcoin Cash', name_ko: '비트코인캐시' },
    { symbol: 'ATOM', name: 'Cosmos', name_ko: '코스모스' },
    { symbol: 'UNI', name: 'Uniswap', name_ko: '유니스왑' },
    { symbol: 'ETC', name: 'Ethereum Classic', name_ko: '이더리움클래식' },
    { symbol: 'FIL', name: 'Filecoin', name_ko: '파일코인' },
    { symbol: 'NEAR', name: 'Near Protocol', name_ko: '니어' },
    // 21-30 (Crawled)
    { symbol: 'APT', name: 'Aptos', name_ko: '앱토스' },
    { symbol: 'INJ', name: 'Injective', name_ko: '인젝티브' },
    { symbol: 'RNDR', name: 'Render', name_ko: '렌더' },
    { symbol: 'STX', name: 'Stacks', name_ko: '스택스' },
    { symbol: 'IMX', name: 'Immutable X', name_ko: '이뮤터블X' },
    { symbol: 'ARB', name: 'Arbitrum', name_ko: '아비트럼' },
    { symbol: 'OP', name: 'Optimism', name_ko: '옵티미즘' },
    { symbol: 'SUI', name: 'Sui', name_ko: '수이' },
    { symbol: 'SEI', name: 'Sei', name_ko: '세이' },
    { symbol: 'TIA', name: 'Celestia', name_ko: '셀레스티아' },
    // Additional Popular
    { symbol: 'ICP', name: 'Internet Computer', name_ko: '인터넷컴퓨터' },
    { symbol: 'XLM', name: 'Stellar', name_ko: '스텔라' },
    { symbol: 'SAND', name: 'The Sandbox', name_ko: '샌드박스' },
    { symbol: 'MANA', name: 'Decentraland', name_ko: '디센트럴랜드' },
    { symbol: 'AAVE', name: 'Aave', name_ko: '에이브' },
    { symbol: 'CRV', name: 'Curve', name_ko: '커브' },
    { symbol: 'MKR', name: 'Maker', name_ko: '메이커' },
    { symbol: 'LDO', name: 'Lido DAO', name_ko: '리도' },
    // New/Trending Coins
    { symbol: 'WLFI', name: 'World Liberty Financial', name_ko: 'WLFI' },
    { symbol: 'TRUMP', name: 'TRUMP', name_ko: '트럼프' },
    { symbol: 'PEPE', name: 'Pepe', name_ko: '페페' },
    { symbol: 'WIF', name: 'dogwifhat', name_ko: '도그위프햇' },
    { symbol: 'BONK', name: 'Bonk', name_ko: '봉크' },
    { symbol: 'FLOKI', name: 'Floki', name_ko: '플로키' },
    { symbol: 'JUP', name: 'Jupiter', name_ko: '주피터' },
    { symbol: 'HYPE', name: 'Hyperliquid', name_ko: '하이퍼리퀴드' },
    { symbol: 'EIGEN', name: 'EigenLayer', name_ko: '아이겐레이어' },
];
