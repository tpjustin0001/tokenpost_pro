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


def detect_rsi_divergence(price_series: pd.Series, rsi_series: pd.Series, lookback: int = 20) -> str:
    """
    RSI Divergence 감지
    - bullish_div: 가격 하락 but RSI 상승 → 매수 신호
    - bearish_div: 가격 상승 but RSI 하락 → 매도 신호
    - none: 다이버전스 없음
    """
    if len(price_series) < lookback or len(rsi_series) < lookback:
        return 'none'
    
    recent_prices = price_series.tail(lookback)
    recent_rsi = rsi_series.tail(lookback)
    
    # 최근 저점 2개 찾기
    price_lows = []
    rsi_lows = []
    
    for i in range(2, lookback - 2):
        if (recent_prices.iloc[i] < recent_prices.iloc[i-1] and 
            recent_prices.iloc[i] < recent_prices.iloc[i-2] and
            recent_prices.iloc[i] < recent_prices.iloc[i+1] and
            recent_prices.iloc[i] < recent_prices.iloc[i+2]):
            price_lows.append((i, recent_prices.iloc[i]))
            rsi_lows.append((i, recent_rsi.iloc[i]))
    
    # 강세 다이버전스: 가격 저점 하락, RSI 저점 상승
    if len(price_lows) >= 2:
        if (price_lows[-1][1] < price_lows[-2][1] and 
            rsi_lows[-1][1] > rsi_lows[-2][1]):
            return 'bullish_div'
    
    # 최근 고점 2개 찾기
    price_highs = []
    rsi_highs = []
    
    for i in range(2, lookback - 2):
        if (recent_prices.iloc[i] > recent_prices.iloc[i-1] and 
            recent_prices.iloc[i] > recent_prices.iloc[i-2] and
            recent_prices.iloc[i] > recent_prices.iloc[i+1] and
            recent_prices.iloc[i] > recent_prices.iloc[i+2]):
            price_highs.append((i, recent_prices.iloc[i]))
            rsi_highs.append((i, recent_rsi.iloc[i]))
    
    # 약세 다이버전스: 가격 고점 상승, RSI 고점 하락
    if len(price_highs) >= 2:
        if (price_highs[-1][1] > price_highs[-2][1] and 
            rsi_highs[-1][1] < rsi_highs[-2][1]):
            return 'bearish_div'
    
    return 'none'


def calculate_risk_reward(current_price: float, support: float, resistance: float) -> float:
    """
    위험보상비율 계산
    R/R >= 2.0 : 좋은 기회
    R/R >= 3.0 : 매우 좋은 기회
    """
    risk = current_price - support
    reward = resistance - current_price
    
    if risk <= 0 or reward <= 0:
        return 0.0
    
    return round(reward / risk, 2)


def get_entry_quality(rr_ratio: float, rsi: float, macd_cross: str, divergence: str) -> dict:
    """
    진입 적합도 종합 평가
    """
    score = 0
    reasons = []
    
    # 위험보상비율
    if rr_ratio >= 3.0:
        score += 3
        reasons.append("R/R 3:1 이상")
    elif rr_ratio >= 2.0:
        score += 2
        reasons.append("R/R 2:1 이상")
    elif rr_ratio >= 1.0:
        score += 1
    
    # RSI
    if rsi < 30:
        score += 2
        reasons.append("RSI 과매도")
    elif rsi < 40:
        score += 1
    elif rsi > 70:
        score -= 1
        reasons.append("RSI 과열")
    
    # MACD
    if macd_cross == 'bullish_cross':
        score += 2
        reasons.append("MACD 골든크로스")
    elif macd_cross == 'bearish_cross':
        score -= 2
    
    # Divergence
    if divergence == 'bullish_div':
        score += 3
        reasons.append("강세 다이버전스")
    elif divergence == 'bearish_div':
        score -= 3
    
    # 등급 결정
    if score >= 6:
        grade = 'A'
        label = '매우 좋은 진입 시점'
    elif score >= 4:
        grade = 'B'
        label = '좋은 진입 시점'
    elif score >= 2:
        grade = 'C'
        label = '보통'
    else:
        grade = 'D'
        label = '진입 주의'
    
    return {
        'score': score,
        'grade': grade,
        'label': label,
        'reasons': reasons
    }
