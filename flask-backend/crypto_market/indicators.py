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


def macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> dict:
    """
    Calculate MACD (Moving Average Convergence Divergence)
    Returns: dict with 'macd_line', 'signal_line', 'histogram', 'crossover'
    """
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    
    # Detect crossover
    crossover = 'neutral'
    if len(macd_line) >= 2:
        prev_macd = macd_line.iloc[-2]
        prev_signal = signal_line.iloc[-2]
        curr_macd = macd_line.iloc[-1]
        curr_signal = signal_line.iloc[-1]
        
        if prev_macd <= prev_signal and curr_macd > curr_signal:
            crossover = 'bullish_cross'
        elif prev_macd >= prev_signal and curr_macd < curr_signal:
            crossover = 'bearish_cross'
    
    return {
        'macd_line': float(macd_line.iloc[-1]),
        'signal_line': float(signal_line.iloc[-1]),
        'histogram': float(histogram.iloc[-1]),
        'crossover': crossover
    }


def bollinger_bands(series: pd.Series, period: int = 20, std_dev: int = 2) -> dict:
    """
    Calculate Bollinger Bands
    Returns: dict with 'upper', 'middle', 'lower', 'position' (0-1 scale)
    """
    middle = series.rolling(window=period).mean()
    std = series.rolling(window=period).std()
    upper = middle + (std * std_dev)
    lower = middle - (std * std_dev)
    
    current_price = series.iloc[-1]
    band_width = upper.iloc[-1] - lower.iloc[-1]
    
    # Position: 0 = at lower band, 1 = at upper band
    if band_width > 0:
        position = (current_price - lower.iloc[-1]) / band_width
    else:
        position = 0.5
    
    return {
        'upper': float(upper.iloc[-1]),
        'middle': float(middle.iloc[-1]),
        'lower': float(lower.iloc[-1]),
        'position': float(min(max(position, 0), 1))  # Clamp to 0-1
    }


def find_support_resistance(df: pd.DataFrame, lookback: int = 50) -> dict:
    """
    Find nearest support and resistance levels using pivot points
    Returns: dict with 'support', 'resistance', 'support_distance', 'resistance_distance'
    """
    if len(df) < lookback:
        lookback = len(df)
    
    recent_df = df.tail(lookback)
    current_price = df['Close'].iloc[-1]
    
    # Simple approach: use recent highs/lows as S/R levels
    highs = recent_df['High'].values
    lows = recent_df['Low'].values
    
    # Find resistance: lowest high above current price
    resistance_candidates = [h for h in highs if h > current_price]
    resistance = min(resistance_candidates) if resistance_candidates else current_price * 1.05
    
    # Find support: highest low below current price
    support_candidates = [l for l in lows if l < current_price]
    support = max(support_candidates) if support_candidates else current_price * 0.95
    
    # Calculate distances as percentages
    resistance_distance = ((resistance - current_price) / current_price) * 100
    support_distance = ((current_price - support) / current_price) * 100
    
    return {
        'support': float(support),
        'resistance': float(resistance),
        'support_distance': float(support_distance),
        'resistance_distance': float(resistance_distance)
    }

