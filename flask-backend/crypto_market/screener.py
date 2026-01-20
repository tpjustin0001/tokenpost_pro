
import concurrent.futures
from market_provider import market_data_service
from crypto_market.indicators import rsi, relative_volume, macd, bollinger_bands, find_support_resistance
import numpy as np
import pandas as pd
from datetime import datetime

SCREENER_SYMBOLS = [
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP',
    'ADA', 'DOGE', 'AVAX', 'TRX', 'DOT',
    'LINK', 'MATIC', 'SHIB', 'LTC', 'BCH',
    'ATOM', 'UNI', 'ETC', 'FIL', 'NEAR',
    'APT', 'INJ', 'RNDR', 'STX', 'IMX',
    'ARB', 'OP', 'SUI', 'SEI', 'TIA'
]


def calculate_signal(rsi_val, rvol, macd_data, bb_data, sr_data, current_price, sma200, is_fresh_breakout):
    """
    Calculate signal type, strength, and reason based on multiple indicators.
    Returns: (signal_type, signal_strength, signal_reason)
    """
    score = 0
    reasons = []

    # 1. Trend Analysis (SMA200)
    above_200 = current_price > sma200 if sma200 else False
    if above_200:
        score += 1
        reasons.append("장기 상승 추세")

    # 2. Breakout Detection
    if is_fresh_breakout:
        score += 2
        reasons.append("200일선 돌파")

    # 3. MACD Signal
    if macd_data['crossover'] == 'bullish_cross':
        score += 2
        reasons.append("MACD 골든크로스")
    elif macd_data['crossover'] == 'bearish_cross':
        score -= 2
        reasons.append("MACD 데드크로스")
    elif macd_data['histogram'] > 0:
        score += 1

    # 4. RSI Analysis
    if rsi_val < 30:
        score += 2
        reasons.append("과매도 구간 (RSI {:.0f})".format(rsi_val))
    elif rsi_val < 40:
        score += 1
        reasons.append("저평가 구간")
    elif rsi_val > 75:
        score -= 2
        reasons.append("과열 주의 (RSI {:.0f})".format(rsi_val))
    elif rsi_val > 65:
        score -= 1

    # 5. Volume Analysis
    if rvol > 2.0:
        score += 2
        reasons.append("거래량 급증 ({:.1f}x)".format(rvol))
    elif rvol > 1.5:
        score += 1
        reasons.append("거래량 증가")
    elif rvol < 0.5:
        score -= 1

    # 6. Bollinger Band Position
    if bb_data['position'] < 0.1:
        score += 1
        reasons.append("하단밴드 근접")
    elif bb_data['position'] > 0.9:
        score -= 1
        reasons.append("상단밴드 근접")

    # 7. Support/Resistance Proximity
    if sr_data['support_distance'] < 2:
        score += 1
        reasons.append("지지선 근접")
    if sr_data['resistance_distance'] < 2:
        reasons.append("저항선 근접")

    # Determine signal type and strength
    if score >= 4:
        signal_type = "BUY"
        signal_strength = min(5, score - 1)
    elif score >= 2:
        signal_type = "WATCH"
        signal_strength = 3
    elif score <= -3:
        signal_type = "SELL"
        signal_strength = min(5, abs(score) - 1)
    elif score <= -1:
        signal_type = "HOLD"
        signal_strength = 2
    else:
        signal_type = "HOLD"
        signal_strength = 1

    signal_reason = " + ".join(reasons[:3]) if reasons else "중립"

    return signal_type, signal_strength, signal_reason


class ScreenerService:
    def run_breakout_scan(self):
        """Tab 1: Breakout Scanner - Enhanced with professional signals"""
        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(market_data_service.get_asset_data, sym): sym for sym in SCREENER_SYMBOLS}
            for future in concurrent.futures.as_completed(futures):
                try:
                    item = future.result()
                    if not item: continue
                    
                    df = item['raw_df']
                    current_price = item['current_price']
                    if df is None or df.empty: continue

                    sma20 = item['ma_20']
                    sma50 = df['Close'].tail(50).mean()
                    sma200 = df['Close'].tail(200).mean()
                    
                    rsi_val = float(rsi(df['Close'], 14).iloc[-1])
                    rvol = float(relative_volume(df['Volume'], 20))
                    macd_data = macd(df['Close'])
                    bb_data = bollinger_bands(df['Close'])
                    sr_data = find_support_resistance(df)
                    
                    # Fresh breakout detection
                    is_fresh_breakout = False
                    if len(df) > 2:
                        prev_close = df['Close'].iloc[-2]
                        is_fresh_breakout = (prev_close < sma200 * 0.99) and (current_price > sma200)

                    # Calculate signal
                    signal_type, signal_strength, signal_reason = calculate_signal(
                        rsi_val, rvol, macd_data, bb_data, sr_data, 
                        current_price, sma200, is_fresh_breakout
                    )

                    results.append({
                        'symbol': item['symbol'],
                        'price': current_price,
                        'change_24h': item['change_24h'],
                        'change_1h': item.get('change_1h', 0),
                        'volume': df['Volume'].iloc[-1],
                        'sma20': sma20,
                        'sma50': sma50,
                        'sma200': sma200,
                        'rsi': round(rsi_val, 1),
                        'rvol': round(rvol, 2),
                        'macd_signal': macd_data['crossover'],
                        'bb_position': round(bb_data['position'], 2),
                        'support': sr_data['support'],
                        'resistance': sr_data['resistance'],
                        'signal_type': signal_type,
                        'signal_strength': signal_strength,
                        'signal_reason': signal_reason,
                        'is_fresh_breakout': bool(is_fresh_breakout),
                        'pct_from_sma200': round(((current_price - sma200) / sma200) * 100 if sma200 else 0, 1)
                    })
                except Exception as e:
                    continue

        # Sort by signal strength (highest first), then by breakout status
        results.sort(key=lambda x: (x['signal_strength'], x['is_fresh_breakout']), reverse=True)
        return results

    def run_price_performance_scan(self):
        """Tab 2: Price Performance - Value investing signals"""
        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(market_data_service.get_asset_data, sym): sym for sym in SCREENER_SYMBOLS}
            for future in concurrent.futures.as_completed(futures):
                try:
                    item = future.result()
                    if not item: continue
                    
                    df = item['raw_df']
                    current_price = item['current_price']
                    if df is None or df.empty: continue
                    
                    ath = df['High'].max()
                    atl = df['Low'].min()
                    
                    drawdown = ((current_price - ath) / ath) * 100 if ath > 0 else 0
                    from_atl = ((current_price - atl) / atl) * 100 if atl > 0 else 0
                    rsi_val = float(rsi(df['Close'], 14).iloc[-1])
                    bb_data = bollinger_bands(df['Close'])

                    # Value signal calculation
                    score = 0
                    reasons = []
                    
                    if drawdown < -70 and rsi_val < 30:
                        score = 5
                        reasons.append("역대급 저평가")
                        reasons.append("RSI 과매도")
                    elif drawdown < -50 and rsi_val < 40:
                        score = 4
                        reasons.append("가치투자 구간")
                    elif drawdown < -30:
                        score = 3
                        reasons.append("조정 구간")
                    elif rsi_val > 75:
                        score = -2
                        reasons.append("과열 경고")
                    elif from_atl > 300:
                        score = -1
                        reasons.append("고공행진 중")
                    
                    if bb_data['position'] < 0.15:
                        score += 1
                        reasons.append("하단밴드")

                    if score >= 4:
                        signal_type = "BUY"
                    elif score >= 2:
                        signal_type = "WATCH"
                    elif score <= -1:
                        signal_type = "SELL"
                    else:
                        signal_type = "HOLD"

                    results.append({
                        'symbol': item['symbol'],
                        'price': current_price,
                        'change_24h': item['change_24h'],
                        'change_1h': item.get('change_1h', 0),
                        'volume': df['Volume'].iloc[-1],
                        'ath': ath,
                        'atl': atl,
                        'drawdown': round(drawdown, 1),
                        'from_atl': round(from_atl, 1),
                        'rsi': round(rsi_val, 1),
                        'bb_position': round(bb_data['position'], 2),
                        'signal_type': signal_type,
                        'signal_strength': max(1, abs(score)),
                        'signal_reason': " + ".join(reasons[:2]) if reasons else "중립"
                    })
                except:
                    continue
        
        # Sort by drawdown (most oversold first)
        results.sort(key=lambda x: x['drawdown'])
        return results

    def run_risk_scan(self):
        """Tab 3: Risk Scanner - Volatility and risk assessment"""
        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(market_data_service.get_asset_data, sym): sym for sym in SCREENER_SYMBOLS}
            for future in concurrent.futures.as_completed(futures):
                try:
                    item = future.result()
                    if not item: continue
                    
                    df = item['raw_df']
                    current_price = item['current_price']
                    if df is None or df.empty: continue
                    
                    returns = df['Close'].pct_change().dropna()
                    volatility = float(returns.std() * np.sqrt(365) * 100) if len(returns) > 1 else 0
                    
                    # Enhanced risk scoring
                    rsi_val = float(rsi(df['Close'], 14).iloc[-1])
                    bb_data = bollinger_bands(df['Close'])
                    
                    # Risk score (higher = riskier)
                    risk_score = volatility / 50.0
                    
                    # Adjust for current conditions
                    if rsi_val > 70 or rsi_val < 30:
                        risk_score += 0.3  # Extreme RSI increases risk
                    if bb_data['position'] > 0.9 or bb_data['position'] < 0.1:
                        risk_score += 0.2  # Near band edges increases risk
                    
                    if risk_score > 1.5:
                        rating = 'Extreme'
                        signal_reason = "고위험 - 변동성 {:.0f}%".format(volatility)
                    elif risk_score < 0.7:
                        rating = 'Low'
                        signal_reason = "저위험 - 안정적"
                    else:
                        rating = 'Medium'
                        signal_reason = "보통 - 변동성 {:.0f}%".format(volatility)
                    
                    results.append({
                        'symbol': item['symbol'],
                        'price': current_price,
                        'change_24h': item['change_24h'],
                        'change_1h': item.get('change_1h', 0),
                        'volatility': round(volatility, 1),
                        'risk_score': round(risk_score, 2),
                        'rating': rating,
                        'rsi': round(rsi_val, 1),
                        'bb_position': round(bb_data['position'], 2),
                        'signal_reason': signal_reason
                    })
                except:
                    continue
        
        # Sort by risk score (lowest risk first)
        results.sort(key=lambda x: x['risk_score'])
        return results


screener_service = ScreenerService()
