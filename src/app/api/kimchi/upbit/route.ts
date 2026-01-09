import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC', {
            next: { revalidate: 10 } // 10초 캐싱
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json([{ trade_price: 0 }], { status: 500 });
    }
}
