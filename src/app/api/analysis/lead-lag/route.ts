import { NextResponse } from 'next/server';

/**
 * Lead-Lag Analysis API
 * Proxies to Flask Backend for Granger Causality Analysis
 */

export async function GET() {
    try {
        const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5001';
        const response = await fetch(`${backendUrl}/api/crypto/lead-lag`, {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Lead-Lag API Error:', error);

        // Fallback with mock data when backend is unavailable
        const mockData = {
            target: 'BTC_MoM',
            leading_indicators: [
                { variable: 'TNX', lag: 21, p_value: 0.003, correlation: -0.42, interpretation: '10년물 국채 금리가 BTC를 21일 선행' },
                { variable: 'SPY', lag: 3, p_value: 0.001, correlation: 0.68, interpretation: 'S&P 500이 BTC를 3일 선행' },
                { variable: 'VIX', lag: 5, p_value: 0.008, correlation: -0.55, interpretation: 'VIX 공포지수가 BTC와 역상관' },
                { variable: 'DXY', lag: 14, p_value: 0.012, correlation: -0.38, interpretation: '달러 인덱스가 BTC와 역상관' },
                { variable: 'GOLD', lag: 7, p_value: 0.005, correlation: 0.45, interpretation: '금 가격이 BTC를 7일 선행' },
                { variable: 'M2_MoM', lag: 30, p_value: 0.002, correlation: 0.52, interpretation: 'M2 통화량 증가가 BTC 상승 선행' },
            ],
            timestamp: new Date().toISOString(),
            error: 'Using fallback data - backend unavailable'
        };

        return NextResponse.json(mockData);
    }
}
