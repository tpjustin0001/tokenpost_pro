
import concurrent.futures
from market_provider import market_data_service
from crypto_market.indicators import rsi, relative_volume
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

class ScreenerService:
    def run_breakout_scan(self):
        """Tab 1: Breakout Scanner"""
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
                    
                    status_20 = 'Bullish' if current_price > sma20 else 'Bearish'
                    status_50 = 'Bullish' if current_price > sma50 else 'Bearish'
                    status_200 = 'Bull Market' if current_price > sma200 else 'Bear Market'
                    
                    is_fresh_breakout = False
                    if len(df) > 2:
                        prev_close = df['Close'].iloc[-2]
                        is_fresh_breakout = (prev_close < sma200 * 0.99) and (current_price > sma200)

                    insight = "중립"
                    if is_fresh_breakout and rvol > 1.5:
                        insight = "🔥 골든크로스 (강력 매수)"
                    elif current_price > sma200 and rvol > 1.2:
                        insight = "🚀 추세 추종 (매집)"
                    elif rsi_val > 75:
                        insight = "⚠️ 과열 주의 (익절)"
                    elif current_price > sma50:
                        insight = "📈 상승 추세"
                    else:
                        insight = "❄️ 조정구간"

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
                        'ai_insight': insight,
                        'status_20': status_20,
                        'status_50': status_50,
                        'status_200': status_200,
                        'is_fresh_breakout': bool(is_fresh_breakout),
                        'pct_from_sma200': ((current_price - sma200) / sma200) * 100 if sma200 else 0
                    })
                except Exception:
                    continue

        results.sort(key=lambda x: (x['is_fresh_breakout'], x['pct_from_sma200']), reverse=True)
        return results

    def run_price_performance_scan(self):
        """Tab 2: Price Performance"""
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

                    insight = "중립"
                    if drawdown < -70 and rsi_val < 30:
                        insight = "💎 역대급 저평가 (바닥 매수)"
                    elif drawdown < -50 and rsi_val < 40:
                        insight = "🛒 가치 투자 구간 (매집)"
                    elif rsi_val > 70:
                        insight = "⚠️ 고점 경고 (위험)"
                    elif from_atl > 200:
                        insight = "🚀 고공행진 중"
                    else:
                        insight = "📉 조정 구간"

                    results.append({
                        'symbol': item['symbol'],
                        'price': current_price,
                        'change_24h': item['change_24h'],
                        'change_1h': item.get('change_1h', 0),
                        'volume': df['Volume'].iloc[-1],
                        'ath': ath,
                        'atl': atl,
                        'drawdown': drawdown,
                        'from_atl': from_atl,
                        'rsi': round(rsi_val, 1),
                        'ai_insight': insight
                    })
                except:
                    continue
        
        results.sort(key=lambda x: x['drawdown'])
        return results

    def run_risk_scan(self):
        """Tab 3: Risk Scanner"""
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
                    risk_score = volatility / 50.0 
                    
                    if risk_score > 1.5: rating = 'Extreme'
                    elif risk_score < 0.8: rating = 'Low'
                    else: rating = 'Medium'
                    
                    results.append({
                        'symbol': item['symbol'],
                        'price': current_price,
                        'change_24h': item['change_24h'],
                        'change_1h': item.get('change_1h', 0),
                        'volatility': volatility,
                        'risk_score': risk_score,
                        'rating': rating
                    })
                except:
                    continue
        return results

screener_service = ScreenerService()
