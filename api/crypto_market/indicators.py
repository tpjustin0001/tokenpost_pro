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
