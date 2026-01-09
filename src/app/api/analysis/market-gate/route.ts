import { NextResponse } from 'next/server';

/**
 * Market Gate API - 시장 건전성 평가 (100점 만점)
 * 
 * 컴포넌트별 배점:
 * - Trend (35점): BTC EMA 배열 + 기울기
 * - Volatility (18점): ATR% 안정성
 * - Participation (18점): 거래량 Z-score
 * - Breadth (18점): 알트 EMA50 위 비율
 * - Leverage (11점): 펀딩비
 */

interface MarketData {
    prices: number[];
    volumes: number[];
}

// EMA 계산
function ema(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const result: number[] = [];
    let prevEma = data[0];

    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            result.push(data[0]);
        } else {
            prevEma = data[i] * k + prevEma * (1 - k);
            result.push(prevEma);
        }
    }
    return result;
}

// ATR% 계산 (단순화)
function atrPercent(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 3.0;

    const trs: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        const high = prices[i] * 1.02; // 추정
        const low = prices[i] * 0.98;
        const prevClose = prices[i - 1];
        const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
        trs.push(tr);
    }

    const atr = trs.slice(-period).reduce((a, b) => a + b, 0) / period;
    const currentPrice = prices[prices.length - 1];
    return (atr / currentPrice) * 100;
}

// Z-Score 계산
function zScore(data: number[], window: number = 50): number {
    if (data.length < window) return 0;
    const slice = data.slice(-window);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
    const std = Math.sqrt(variance);
    if (std === 0) return 0;
    return (slice[slice.length - 1] - mean) / std;
}

// 기울기 % 계산
function slopePercent(data: number[], lookback: number = 20): number {
    if (data.length < lookback + 1) return 0;
    const a = data[data.length - 1];
    const b = data[data.length - 1 - lookback];
    if (b === 0) return 0;
    return ((a - b) / b) * 100;
}

export async function GET() {
    try {
        // 1. BTC 시세 데이터 (CoinGecko)
        const btcRes = await fetch(
            'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365',
            { next: { revalidate: 300 } }
        );
        const btcData = await btcRes.json();

        if (!btcData.prices || btcData.prices.length < 200) {
            throw new Error('BTC 데이터 부족');
        }

        const prices = btcData.prices.map((p: [number, number]) => p[1]);
        const volumes = btcData.total_volumes?.map((v: [number, number]) => v[1]) || [];

        // 2. 알트코인 데이터 (Breadth 계산용)
        const altRes = await fetch(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=false&price_change_percentage=24h',
            { next: { revalidate: 300 } }
        );
        const altData = await altRes.json();

        // 3. 공포탐욕지수
        let fearGreedIndex = 50;
        try {
            const fngRes = await fetch('https://api.alternative.me/fng/?limit=1');
            const fngData = await fngRes.json();
            fearGreedIndex = parseInt(fngData.data?.[0]?.value || '50');
        } catch { }

        // 4. 펀딩비 (Binance)
        let fundingRate = 0.0001;
        try {
            const fundingRes = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT');
            const fundingData = await fundingRes.json();
            fundingRate = parseFloat(fundingData.lastFundingRate || '0.0001');
        } catch { }

        // === 점수 계산 ===
        const currentPrice = prices[prices.length - 1];
        const ema50 = ema(prices, 50);
        const ema200 = ema(prices, 200);
        const ema50Last = ema50[ema50.length - 1];
        const ema200Last = ema200[ema200.length - 1];
        const ema200Slope = slopePercent(ema200, 20);
        const volZ = zScore(volumes, 50);
        const atrp = atrPercent(prices, 14);

        // 알트 Breadth (EMA50 위 비율)
        let altAboveEma50 = 0;
        if (Array.isArray(altData)) {
            const aboveCount = altData.filter((c: any) =>
                c.price_change_percentage_24h > 0
            ).length;
            altAboveEma50 = altData.length > 0 ? aboveCount / altData.length : 0.5;
        }

        // 1) TREND (0~35점)
        let trend = 0;
        if (currentPrice > ema50Last && ema50Last > ema200Last) {
            trend += 22;
        } else if (currentPrice > ema50Last) {
            trend += 12;
        }
        if (ema200Slope > 1.0) trend += 13;
        else if (ema200Slope > 0) trend += 8;
        else if (ema200Slope > -1.0) trend += 3;

        // 2) VOLATILITY (0~18점)
        let volatility = 9;
        if (atrp <= 2.0) volatility = 18;
        else if (atrp <= 3.5) volatility = 14;
        else if (atrp <= 5.0) volatility = 8;
        else volatility = 2;

        // 3) PARTICIPATION (0~18점)
        let participation = 9;
        if (volZ >= 1.0) participation = 18;
        else if (volZ >= 0.3) participation = 12;
        else if (volZ >= -0.3) participation = 6;
        else participation = 2;

        // 4) BREADTH (0~18점)
        let breadth = 9;
        if (altAboveEma50 >= 0.65) breadth = 18;
        else if (altAboveEma50 >= 0.50) breadth = 12;
        else if (altAboveEma50 >= 0.35) breadth = 6;
        else breadth = 2;

        // 5) LEVERAGE (0~11점)
        let leverage = 5.5;
        if (fundingRate > -0.0003 && fundingRate < 0.0005) leverage = 9;
        else if (fundingRate > 0.001) leverage = 2;
        else if (fundingRate < -0.0005) leverage = 4;
        else leverage = 6;

        // 총점
        const totalScore = Math.round(Math.min(100, Math.max(0,
            trend + volatility + participation + breadth + leverage
        )));

        // Gate 결정
        let gateColor: 'GREEN' | 'YELLOW' | 'RED';
        if (totalScore >= 72) gateColor = 'GREEN';
        else if (totalScore >= 48) gateColor = 'YELLOW';
        else gateColor = 'RED';

        // 지표 목록
        const indicators = [
            { name: 'BTC 가격', value: Math.round(currentPrice), signal: currentPrice > ema50Last ? 'Bullish' : 'Bearish' },
            { name: 'EMA50', value: Math.round(ema50Last), signal: currentPrice > ema50Last ? 'Bullish' : 'Bearish' },
            { name: 'EMA200', value: Math.round(ema200Last), signal: ema50Last > ema200Last ? 'Bullish' : 'Bearish' },
            { name: 'EMA200 기울기', value: `${ema200Slope > 0 ? '+' : ''}${ema200Slope.toFixed(1)}%`, signal: ema200Slope > 1 ? 'Bullish' : (ema200Slope < -1 ? 'Bearish' : 'Neutral') },
            { name: 'ATR%', value: `${atrp.toFixed(1)}%`, signal: atrp < 3 ? 'Bullish' : (atrp > 5 ? 'Bearish' : 'Neutral') },
            { name: '거래량 Z-Score', value: volZ.toFixed(2), signal: volZ > 0.5 ? 'Bullish' : (volZ < -0.5 ? 'Bearish' : 'Neutral') },
            { name: '공포탐욕지수', value: fearGreedIndex, signal: fearGreedIndex > 50 ? 'Bullish' : (fearGreedIndex < 30 ? 'Bearish' : 'Neutral') },
            { name: '알트 Breadth', value: `${(altAboveEma50 * 100).toFixed(0)}%`, signal: altAboveEma50 > 0.5 ? 'Bullish' : 'Bearish' },
            { name: '펀딩비', value: `${(fundingRate * 100).toFixed(3)}%`, signal: Math.abs(fundingRate) < 0.0005 ? 'Neutral' : 'Bearish' },
        ];

        return NextResponse.json({
            score: totalScore,
            gate_color: gateColor,
            summary: `BTC 시장 상태: ${gateColor} (점수: ${totalScore}/100)`,
            components: {
                trend: Math.round(trend),
                volatility: Math.round(volatility),
                participation: Math.round(participation),
                breadth: Math.round(breadth),
                leverage: Math.round(leverage),
            },
            indicators,
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('Market Gate error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to calculate market gate' },
            { status: 500 }
        );
    }
}
