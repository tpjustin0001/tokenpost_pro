#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Market Gate - 시장 건전성 평가 시스템 (100점 만점)
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Tuple, List, Optional, Any
import numpy as np
import pandas as pd

from .models import Candle
from .indicators import ema, atr


@dataclass
class MarketGateResult:
    gate: str          # "GREEN" | "YELLOW" | "RED"
    score: int         # 0~100
    reasons: List[str]
    metrics: Dict[str, Any]


def candles_to_df(candles: List[Candle]) -> pd.DataFrame:
    df = pd.DataFrame([{
        "ts": c.ts, "open": c.open, "high": c.high, "low": c.low, "close": c.close, "volume": c.volume
    } for c in candles]).sort_values("ts").reset_index(drop=True)
    return df


def zscore_last(series: pd.Series, window: int = 50) -> Optional[float]:
    if len(series) < window + 5:
        return None
    s = series.tail(window)
    mu = float(s.mean())
    sd = float(s.std(ddof=0))
    if sd <= 0:
        return 0.0
    return float((s.iloc[-1] - mu) / sd)


def slope_pct(series: pd.Series, lookback: int = 20) -> Optional[float]:
    if len(series) < lookback + 2:
        return None
    a = float(series.iloc[-1])
    b = float(series.iloc[-1 - lookback])
    if b == 0:
        return None
    return (a - b) / b * 100.0


def compute_alt_breadth_above_ema50(
    candles_map: Dict[Tuple[str, str], List[Candle]],
    symbols: List[str],
    timeframe: str = "1d",
    lookback: int = 220
) -> Optional[float]:
    ok = 0
    total = 0

    for sym in symbols:
        c = candles_map.get((sym, timeframe))
        if not c or len(c) < 50:
            continue
        df = candles_to_df(c)
        close = df["close"]
        e50 = ema(close, 50)
        if pd.isna(e50.iloc[-1]):
            continue
        total += 1
        if float(close.iloc[-1]) > float(e50.iloc[-1]):
            ok += 1

    if total < 3:
        return None
    return ok / total


def evaluate_market_gate(
    btc_candles_1d: List[Candle],
    btc_candles_4h: List[Candle],
    candles_map: Dict[Tuple[str, str], List[Candle]],
    alt_symbols: List[str],
    funding_rate: Optional[float] = None,
    open_interest_delta_z: Optional[float] = None,
) -> MarketGateResult:
    reasons: List[str] = []
    metrics: Dict[str, Any] = {}

    if not btc_candles_1d or len(btc_candles_1d) < 200:
        return MarketGateResult(
            gate="RED", score=0,
            reasons=["BTC 1D 데이터 부족"],
            metrics={}
        )

    btc1 = candles_to_df(btc_candles_1d)
    close = btc1["close"]
    vol = btc1["volume"]

    e50 = ema(close, 50)
    e200 = ema(close, 200)

    price = float(close.iloc[-1])
    ema50 = float(e50.iloc[-1])
    ema200 = float(e200.iloc[-1])
    ema200_slope = slope_pct(e200, 20)
    vol_z = zscore_last(vol, 50)

    a = atr(btc1, 14)
    atrp = float(a.iloc[-1] / price * 100.0) if price > 0 else None

    metrics.update({
        "btc_price": price,
        "btc_ema50": ema50,
        "btc_ema200": ema200,
        "btc_ema200_slope_pct_20": ema200_slope,
        "btc_volume_z_50": vol_z,
        "btc_atrp_14_pct": atrp,
    })

    # 1) TREND (0~35점)
    trend = 0.0
    if price > ema50 > ema200:
        trend += 22.0
    elif price > ema50:
        trend += 12.0
        reasons.append("BTC가 EMA50 위지만 EMA200 아래")
    else:
        reasons.append("BTC가 EMA50 아래 (하락 추세)")

    if ema200_slope is not None:
        if ema200_slope > 1.0:
            trend += 13.0
        elif ema200_slope > 0:
            trend += 8.0
        elif ema200_slope > -1.0:
            trend += 3.0
            reasons.append("EMA200 기울기 약함")
        else:
            reasons.append("EMA200 하락 중")

    # 2) VOLATILITY (0~18점)
    vol_score = 0.0
    if atrp is not None:
        if atrp <= 2.0:
            vol_score = 18.0
        elif atrp <= 3.5:
            vol_score = 14.0
        elif atrp <= 5.0:
            vol_score = 8.0
            reasons.append("변동성 높음")
        else:
            vol_score = 2.0
            reasons.append("변동성 급증")
    else:
        vol_score = 9.0

    # 3) PARTICIPATION (0~18점)
    part = 0.0
    if vol_z is not None:
        if vol_z >= 1.0:
            part = 18.0
        elif vol_z >= 0.3:
            part = 12.0
        elif vol_z >= -0.3:
            part = 6.0
            reasons.append("거래량 평범")
        else:
            part = 2.0
            reasons.append("거래량 부족")
    else:
        part = 9.0

    # 4) BREADTH (0~18점)
    breadth_ratio = compute_alt_breadth_above_ema50(
        candles_map=candles_map,
        symbols=alt_symbols,
        timeframe="1d",
    )
    metrics["alt_breadth_above_ema50"] = breadth_ratio

    breadth = 0.0
    if breadth_ratio is not None:
        if breadth_ratio >= 0.65:
            breadth = 18.0
        elif breadth_ratio >= 0.50:
            breadth = 12.0
        elif breadth_ratio >= 0.35:
            breadth = 6.0
            reasons.append(f"알트 breadth 약함 ({breadth_ratio:.0%})")
        else:
            breadth = 2.0
            reasons.append(f"알트 breadth 붕괴 ({breadth_ratio:.0%})")
    else:
        breadth = 9.0

    # 5) LEVERAGE (0~11점)
    lev = 0.0
    metrics["funding_rate"] = funding_rate

    if funding_rate is not None:
        if -0.0003 < funding_rate < 0.0005:
            lev = 9.0
        elif funding_rate > 0.001:
            lev = 2.0
            reasons.append(f"펀딩 과열 ({funding_rate*100:.3f}%)")
        elif funding_rate < -0.0005:
            lev = 4.0
            reasons.append(f"펀딩 공포 ({funding_rate*100:.3f}%)")
        else:
            lev = 6.0
    else:
        lev = 5.5

    lev = min(lev, 11.0)

    # 총점
    total = trend + vol_score + part + breadth + lev
    score = int(round(max(0.0, min(100.0, total))))
    
    metrics["gate_score_components"] = {
        "trend": round(trend, 1),
        "volatility": round(vol_score, 1),
        "participation": round(part, 1),
        "breadth": round(breadth, 1),
        "leverage": round(lev, 1),
    }

    if score >= 72:
        gate = "GREEN"
    elif score >= 48:
        gate = "YELLOW"
    else:
        gate = "RED"

    reasons = reasons[:5] if reasons else ["조건이 전반적으로 양호함"]

    return MarketGateResult(
        gate=gate,
        score=score,
        reasons=reasons,
        metrics=metrics,
    )



def run_market_gate_sync() -> MarketGateResult:
    """Flask API Sync Wrapper - Uses MarketDataService (CCXT)"""
    from market_provider import market_data_service
    import requests
    
    try:
        # 1. BTC 1D Data (via Binance CCXT)
        try:
            btc_data = market_data_service.get_asset_data("BTC")
            raw_df = btc_data.get('raw_df')
            
            if raw_df is None or raw_df.empty or len(raw_df) < 200:
                raise ValueError("Insufficient BTC Data")
                
            candles_1d = [Candle(
                ts=int(idx.timestamp() * 1000),
                open=float(row['Open']),
                high=float(row['High']),
                low=float(row['Low']),
                close=float(row['Close']),
                volume=float(row['Volume'])
            ) for idx, row in raw_df.iterrows()]
            
        except Exception as e:
            return MarketGateResult(
                gate="YELLOW", score=50,
                reasons=[f"BTC 데이터 오류: {str(e)}"], metrics={}
            )
        
        # 2. Altcoin Breadth (Approximate via Top 10 Listings)
        # We don't have full history for all alts in one go without heavy API usage.
        # We'll approximate Breadth using 'Trend' from get_asset_data for Top 10 Alts.
        alt_tickers = ["ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "TRX", "DOT", "LINK", "AVAX"]
        candles_map = {}
        
        # NOTE: Fetching 10 assets individually is slow-ish but reliable.
        # In a real prod, we'd batch this. For now, max_workers=5 in ThreadPool could be better but let's keep it simple sync or pseudo.
        
        # Improvement: Just check their current price vs MA20/MA50 from get_asset_data summary
        # But evaluate_market_gate expects candles_map.
        # We will create a fake candle map with just enough info (Current Close & EMA50 proxy = MA20 provided by service)
        
        bad_breadth_count = 0
        total_alts = 0
        
        for sym in alt_tickers:
            try:
                d = market_data_service.get_asset_data(sym)
                # Create a synthetic history where MA50 ~ MA20 logic or just rely on the 'trend' field
                # If trend is "Bullish", we assume Close > MA20 (Proxy for MA50)
                # This is a simplification to save API calls.
                
                price = d['current_price']
                ma_val = d['ma_20'] # Proxy
                
                # Construct 2 candles: [One long ago for MA calc, One now]
                # Actually, compute_alt_breadth checks Close > EMA50.
                # We'll pass a 1-day DF where EMA50 calculation by 'ema' function (pandas ewm) works?
                # No, standard EMA needs history.
                
                # Hack: We will inject a pre-calculated Breadth Ratio into metrics later 
                # instead of letting evaluate_market_gate compute it fully if we lack history.
                
                if price > ma_val: # Bullish
                    pass 
                else: 
                    bad_breadth_count += 1
                total_alts += 1
                
            except:
                continue
                
        # Manually compute breadth ratio proxy
        breadth_ratio = 1.0 - (bad_breadth_count / total_alts) if total_alts > 0 else 0.5
        
        # 3. Funding Rate
        funding_rate = 0.0001
        try:
            # Try Binance Future API directly (public)
            resp = requests.get("https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT", timeout=3)
            data = resp.json()
            if 'lastFundingRate' in data:
                funding_rate = float(data['lastFundingRate'])
        except:
            pass
        
        # 4. Fear & Greed
        fng_index = 50
        try:
            fng_resp = requests.get("https://api.alternative.me/fng/?limit=1", timeout=3)
            fng_data = fng_resp.json()
            if 'data' in fng_data:
                fng_index = int(fng_data['data'][0]['value'])
        except:
            pass
        
        # Construct Result
        # We use evaluate_market_gate for BTC metrics, but override Breadth
        
        result = evaluate_market_gate(
            btc_candles_1d=candles_1d,
            btc_candles_4h=[],
            candles_map={}, # Empty map
            alt_symbols=[],
            funding_rate=funding_rate,
        )
        
        # OVERRIDE Breadth (Since we didn't provide candles map)
        result.metrics["alt_breadth_above_ema50"] = breadth_ratio
        
        # Recalculate Score with new Breadth
        # Breadth Score Logic:
        breadth_score = 0.0
        if breadth_ratio >= 0.65: breadth_score = 18.0
        elif breadth_ratio >= 0.50: breadth_score = 12.0
        elif breadth_ratio >= 0.35: breadth_score = 6.0
        else: breadth_score = 2.0
        
        # Remove default '9.0' from breadth (which is added if map is empty)
        base_score = result.score
        # Re-sum components from metrics (safest)
        comps = result.metrics['gate_score_components']
        
        # Update Components
        comps['breadth'] = round(breadth_score, 1)
        comps['participation'] = comps['participation'] # Keep
        comps['trend'] = comps['trend'] # Keep
        comps['volatility'] = comps['volatility'] # Keep
        comps['leverage'] = comps['leverage'] # Keep
        
        # New Total
        new_total = sum(comps.values())
        result.score = int(min(100, max(0, new_total)))
        
        # Update Gate Color
        if result.score >= 72: result.gate = "GREEN"
        elif result.score >= 48: result.gate = "YELLOW"
        else: result.gate = "RED"
        
        # Update metrics
        result.metrics['fear_greed_index'] = fng_index
        
        return result
        
    except Exception as e:
        return MarketGateResult(
            gate="YELLOW", score=50,
            reasons=[f"분석 오류: {str(e)}"], metrics={}
        )

