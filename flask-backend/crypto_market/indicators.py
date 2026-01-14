#!/usr/bin/env python3
import pandas as pd

def ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()

def atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high = df['high']
    low = df['low']
    close = df['close']
    
    tr = pd.concat([
        high - low,
        (high - close.shift()).abs(),
        (low - close.shift()).abs()
    ], axis=1).max(axis=1)
    
    return tr.rolling(period).mean()

def wick_ratio(o: float, h: float, l: float, c: float) -> float:
    body = abs(c - o)
    total = h - l
    if total <= 0:
        return 0.0
    return (total - body) / total

def rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).ewm(alpha=1/period, adjust=False).mean()
    loss = (-delta.where(delta < 0, 0)).ewm(alpha=1/period, adjust=False).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def relative_volume(volume_series: pd.Series, period: int = 20) -> float:
    if len(volume_series) < period:
        return 1.0
    avg_vol = volume_series.tail(period).mean()
    current_vol = volume_series.iloc[-1]
    return current_vol / avg_vol if avg_vol > 0 else 1.0
