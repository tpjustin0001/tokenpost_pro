export interface MarketGateData {
    gate_color: string;
    score: number;
    summary: string;
    components: Record<string, any>;
    indicators: Array<{
        name: string;
        value: number | string | null;
        signal: string;
    }>;
    top_reasons: string[];
    timestamp: string;
}

export interface LeadLagData {
    target: string;
    leading_indicators: Array<{
        variable: string;
        lag: number;
        p_value: number;
        correlation: number;
        interpretation: string;
    }>;
    timestamp: string;
}

export interface VcpSignal {
    symbol: string;
    grade: string;
    score: number;
    signal_type: string;
}

// All Flask backend routes go through /api/python/ proxy to Render
const API_PREFIX = '/api/python';

export const flaskApi = {
    async getMarketGate(): Promise<MarketGateData | null> {
        try {
            const res = await fetch(`${API_PREFIX}/crypto/market-gate`);
            if (!res.ok) throw new Error('Failed to fetch Market Gate data');
            return await res.json();
        } catch (error) {
            console.error('Error fetching Market Gate:', error);
            return null;
        }
    },

    async getLeadLag(): Promise<LeadLagData | null> {
        try {
            const res = await fetch(`${API_PREFIX}/crypto/lead-lag`);
            if (res.ok) {
                return await res.json();
            }
            throw new Error('API Error');
        } catch (error) {
            console.warn('Lead-Lag API failed:', error);
            return null;
        }
    },

    async getVcpSignals(): Promise<{ signals: VcpSignal[]; count: number } | null> {
        try {
            const res = await fetch(`${API_PREFIX}/crypto/vcp-signals`);
            if (!res.ok) throw new Error('Failed to fetch VCP Signals');
            return await res.json();
        } catch (error) {
            console.error('Error fetching VCP Signals:', error);
            return null;
        }
    },

    async getContent(type: 'news' | 'research'): Promise<any[]> {
        try {
            const res = await fetch(`${API_PREFIX}/content/${type}`);
            if (!res.ok) throw new Error(`Failed to fetch ${type}`);
            return await res.json();
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            return [];
        }
    },

    async getXRayAsset(symbol: string): Promise<any | null> {
        try {
            const res = await fetch(`${API_PREFIX}/crypto/xray/asset/${encodeURIComponent(symbol)}`);
            if (!res.ok) {
                const text = await res.text();
                console.error(`X-Ray Asset Fetch Failed: ${res.status} ${res.statusText}`, text);
                throw new Error(`Failed to fetch X-Ray for ${symbol}: ${res.status}`);
            }
            return await res.json();
        } catch (error) {
            console.error('Error fetching X-Ray Asset:', error);
            return null;
        }
    },

    async getXRayGlobal(): Promise<any | null> {
        try {
            const res = await fetch(`${API_PREFIX}/crypto/xray/global`);
            if (!res.ok) {
                const text = await res.text();
                console.error(`Global X-Ray Fetch Failed: ${res.status} ${res.statusText}`, text);
                throw new Error(`Failed to fetch Global X-Ray: ${res.status}`);
            }
            return await res.json();
        } catch (error) {
            console.error('Error fetching Global X-Ray:', error);
            return null;
        }
    },

    async getListings(limit: number = 20): Promise<any[]> {
        try {
            const res = await fetch(`${API_PREFIX}/crypto/listings?limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch listings');
            return await res.json();
        } catch (error) {
            console.error('Error fetching listings:', error);
            return [];
        }
    }
};
