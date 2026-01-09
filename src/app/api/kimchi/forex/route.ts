import { NextResponse } from 'next/server';

// 환율 데이터 캐시 (5분)
let cachedRate: { rate: number; timestamp: number } | null = null;

export async function GET() {
    const now = Date.now();

    // 5분 캐시 유효
    if (cachedRate && now - cachedRate.timestamp < 300000) {
        return NextResponse.json({ rates: { KRW: cachedRate.rate } });
    }

    try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();

        cachedRate = {
            rate: data.rates.KRW,
            timestamp: now
        };

        return NextResponse.json({ rates: { KRW: data.rates.KRW } });
    } catch (error) {
        // 실패 시 고정 환율 반환
        return NextResponse.json({ rates: { KRW: 1450 } });
    }
}
