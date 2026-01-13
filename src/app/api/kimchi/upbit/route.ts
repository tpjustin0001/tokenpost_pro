import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Fetch all data with better error handling
        const [upbitRes, binanceRes, forexRes] = await Promise.all([
            fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC', {
                cache: 'no-store',
                headers: { 'Accept': 'application/json' }
            }),
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
                cache: 'no-store',
                headers: { 'Accept': 'application/json' }
            }),
            fetch('https://api.exchangerate-api.com/v4/latest/USD', {
                next: { revalidate: 3600 }
            })
        ]);

        // Parse responses with individual error handling
        let btcKrw = 0;
        let btcUsd = 0;
        let exchangeRate = 1450; // Fallback exchange rate

        if (upbitRes.ok) {
            const upbitData = await upbitRes.json();
            btcKrw = upbitData[0]?.trade_price || 0;
        } else {
            console.error('Upbit API failed:', upbitRes.status);
        }

        if (binanceRes.ok) {
            const binanceData = await binanceRes.json();
            btcUsd = parseFloat(binanceData.price) || 0;
        } else {
            console.error('Binance API failed:', binanceRes.status);
            // Fallback: calculate USD from KRW price
            if (btcKrw > 0 && exchangeRate > 0) {
                btcUsd = btcKrw / exchangeRate;
            }
        }

        if (forexRes.ok) {
            const forexData = await forexRes.json();
            exchangeRate = forexData.rates?.KRW || 1450;
        } else {
            console.error('Forex API failed:', forexRes.status);
        }

        // Calculate premium
        let premium = 0;
        if (btcKrw > 0 && btcUsd > 0 && exchangeRate > 0) {
            const globalKrw = btcUsd * exchangeRate;
            premium = ((btcKrw - globalKrw) / globalKrw) * 100;
        }

        return NextResponse.json({
            btc_krw: btcKrw,
            btc_usd: btcUsd,
            exchange_rate: exchangeRate,
            kimchi_premium: parseFloat(premium.toFixed(2))
        });
    } catch (error) {
        console.error("Kimchi API Error:", error);
        return NextResponse.json({
            btc_krw: 0, btc_usd: 0, exchange_rate: 1450, kimchi_premium: 0
        }, { status: 500 });
    }
}
