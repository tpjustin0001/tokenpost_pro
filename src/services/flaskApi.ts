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

export const flaskApi = {
    async getMarketGate(): Promise<MarketGateData | null> {
        try {
            const res = await fetch('/api/python/crypto/market-gate');
            if (!res.ok) throw new Error('Failed to fetch Market Gate data');
            return await res.json();
        } catch (error) {
            console.error('Error fetching Market Gate:', error);
            return null;
        }
    },

    async getLeadLag(): Promise<LeadLagData | null> {
        try {
            const res = await fetch('/api/python/crypto/lead-lag');
            if (res.ok) {
                return await res.json();
            }
            throw new Error('API Error');
        } catch (error) {
            console.warn('Lead-Lag API failed, using fallback mock data:', error);
            // Fallback mock data
            return {
                target: 'BTC_MoM',
                timestamp: new Date().toISOString(),
                leading_indicators: [
                    { variable: 'M2 Supply (YoY)', lag: 3, p_value: 0.02, correlation: 0.85, interpretation: 'Global M2 expansion leads BTC price actions by ~3 months.' },
                    { variable: 'DXY (Inverse)', lag: 1, p_value: 0.04, correlation: -0.78, interpretation: 'Dollar weakness often precedes crypto rallies.' },
                    { variable: 'NASDAQ 100', lag: 0, p_value: 0.01, correlation: 0.92, interpretation: 'High correlation with tech equities.' },
                ]
            };
        }
    },

    async getVcpSignals(): Promise<{ signals: VcpSignal[]; count: number } | null> {
        try {
            const res = await fetch('/api/python/crypto/vcp-signals');
            if (!res.ok) throw new Error('Failed to fetch VCP Signals');
            return await res.json();
        } catch (error) {
            console.error('Error fetching VCP Signals:', error);
            return null;
        }
    },

    async getContent(type: 'news' | 'research'): Promise<any[]> {
        try {
            const res = await fetch(`/api/python/content/${type}`);
            if (!res.ok) throw new Error(`Failed to fetch ${type}`);
            return await res.json();
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            return [];
        }
    },

    async getXRayAsset(symbol: string): Promise<any | null> {
        try {
            const res = await fetch(`/api/python/crypto/xray/asset/${symbol}`);
            if (!res.ok) throw new Error(`Failed to fetch X-Ray for ${symbol}`);
            return await res.json();
        } catch (error) {
            console.error('Error fetching X-Ray Asset:', error);
            return null;
        }
    },

    async getXRayGlobal(): Promise<any | null> {
        try {
            const res = await fetch('/api/python/crypto/xray/global');
            if (!res.ok) throw new Error('Failed to fetch Global X-Ray');
            return await res.json();
        } catch (error) {
            console.error('Error fetching Global X-Ray:', error);
            return null;
        }
    }
};
