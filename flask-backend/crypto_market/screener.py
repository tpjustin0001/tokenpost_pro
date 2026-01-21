
import concurrent.futures
from market_provider import market_data_service
from crypto_market.indicators import (
    rsi, relative_volume, macd, bollinger_bands, 
    find_support_resistance, detect_rsi_divergence, 
    calculate_risk_reward, get_entry_quality
)
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


def generate_action_guide(item):
    """
    투자자가 바로 실행할 수 있는 한글 가이드 생성
    """
    signal_type = item['grade_data']['grade'] # A, B, C, D
    rr_ratio = item['rr_ratio']
    current_price = item['price']
    support = item['support']
    resistance = item['resistance']
    rsi_val = item['rsi']
    
    # 기본 가이드 템플릿
    action = "관망"
    guide_msg = "뚜렷한 진입 신호가 없습니다."
    
    if signal_type in ['A', 'B']:
        action = "매수 고려"
        # R/R 가이드
        rr_desc = "매우 좋음" if rr_ratio >= 3 else "좋음"
        
        reasons = item['grade_data']['reasons']
        main_reason = reasons[0] if reasons else "기술적 지표 호전"
        
        guide_msg = f"{main_reason}. 지지선({support:,.0f})을 손절 기준으로 잡고 진입 시 {rr_desc} 수익 구간 기대 가능."
        
        if rsi_val < 30:
            guide_msg = f"RSI 과매도({rsi_val:.0f}) 구간으로 반등 기대. " + guide_msg
            
    elif signal_type == 'D':
        if rsi_val > 70:
            action = "매도/익절 고려"
            guide_msg = f"RSI 과열({rsi_val:.0f}) 및 저항선 근접. 보유 물량 축소 고려."
        else:
            action = "진입 주의"
            guide_msg = "하락 리스크가 높거나 변동성이 큽니다. 확실한 지지 확인 전까지 관망."
            
    return {
        'action': action,
        'entry_zone': f"{support * 1.005:,.0f} ~ {current_price:,.0f}",
        'stop_loss': f"{support * 0.98:,.0f}", # 지지선 2% 아래
        'target': f"{resistance:,.0f}",
        'guide': guide_msg
    }


class ScreenerService:
    def run_breakout_scan(self):
        """Tab 1: Breakout Scanner - Enhanced with Actionable Guides"""
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
                    
                    # 1. 기술적 지표 계산
                    sma20 = item['ma_20'] if item.get('ma_20') else df['Close'].tail(20).mean()
                    sma200 = df['Close'].tail(200).mean()
                    
                    rsi_val = float(rsi(df['Close'], 14).iloc[-1])
                    rvol = float(relative_volume(df['Volume'], 20))
                    macd_data = macd(df['Close'])
                    bb_data = bollinger_bands(df['Close'])
                    sr_data = find_support_resistance(df)
                    
                    # 다이버전스 감지 (신규)
                    divergence = detect_rsi_divergence(df['Close'], rsi(df['Close'], 14))
                    
                    # 2. 위험보상비율 계산 (신규)
                    rr_ratio = calculate_risk_reward(current_price, sr_data['support'], sr_data['resistance'])
                    
                    # 3. 진입 적합도 평가 (신규)
                    grade_data = get_entry_quality(rr_ratio, rsi_val, macd_data['crossover'], divergence)
                    
                    # 4. 데이터셋 구성
                    data_item = {
                        'symbol': item['symbol'],
                        'price': current_price,
                        'change_24h': item['change_24h'],
                        'change_1h': item.get('change_1h', 0),
                        'volume': df['Volume'].iloc[-1],
                        'sma200': sma200,
                        'rsi': round(rsi_val, 1),
                        'rvol': round(rvol, 2),
                        'macd_signal': macd_data['crossover'],
                        'bb_position': round(bb_data['position'], 2),
                        'support': sr_data['support'],
                        'resistance': sr_data['resistance'],
                        'rr_ratio': rr_ratio,
                        'divergence': divergence,
                        'grade_data': grade_data, # score, grade, label, reasons
                        'pct_from_sma200': round(((current_price - sma200) / sma200) * 100 if sma200 else 0, 1)
                    }
                    
                    # 5. 투자 가이드 생성 (신규)
                    data_item['action_guide'] = generate_action_guide(data_item)
                    
                    # 기존 프론트엔드 호환성 유지 래퍼 (signal_type, strength 등)
                    data_item['signal_type'] = "BUY" if grade_data['grade'] in ['A', 'B'] else ("SELL" if grade_data['grade'] == 'D' and rsi_val > 70 else "WATCH")
                    data_item['signal_strength'] = grade_data['score']
                    data_item['signal_reason'] = data_item['action_guide']['guide']

                    results.append(data_item)
                except Exception as e:
                    # print(f"Scan Error {future}: {e}")
                    continue

        # 정렬: 등급(A->D) 순, 그 다음 점수 순
        results.sort(key=lambda x: x['grade_data']['score'], reverse=True)
        return results

    def run_price_performance_scan(self):
        """Tab 2: Value & Price Performance"""
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
                    
                    sr_data = find_support_resistance(df)
                    rr_ratio = calculate_risk_reward(current_price, sr_data['support'], sr_data['resistance'])
                    
                    # 저평가 점수
                    score = 0
                    if drawdown < -70: score += 2
                    if rsi_val < 30: score += 2
                    if rr_ratio > 3: score += 2
                    
                    # 간단 가이드
                    guide = "관망"
                    if score >= 4: guide = "강력 매수 기회 (저평가)"
                    elif score >= 2: guide = "분할 매수 고려"
                    
                    results.append({
                        'symbol': item['symbol'],
                        'price': current_price,
                        'change_24h': item['change_24h'],
                        'ath': ath,
                        'drawdown': round(drawdown, 1),
                        'from_atl': round(from_atl, 1),
                        'rsi': round(rsi_val, 1),
                        'rr_ratio': rr_ratio,
                        'value_score': score,
                        'action_guide': guide,
                        'support': sr_data['support']
                    })
                except:
                    continue
        
        # 저평가 순 (Drawdown 큰 순서)
        results.sort(key=lambda x: x['drawdown'])
        return results

    def run_risk_scan(self):
        """Tab 3: Risk & Volatility Analysis"""
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
                    
                    rsi_val = float(rsi(df['Close'], 14).iloc[-1])
                    bb_data = bollinger_bands(df['Close'])
                    
                    # 리스크 점수 (높을수록 위험)
                    risk_score = volatility / 20.0 # 기본 변동성 점수
                    
                    if rsi_val > 70 or rsi_val < 30: risk_score += 1.5
                    if bb_data['position'] > 0.95 or bb_data['position'] < 0.05: risk_score += 1.0
                    
                    rating = 'Low'
                    if risk_score > 5: rating = 'Extreme'
                    elif risk_score > 3: rating = 'High'
                    elif risk_score > 1.5: rating = 'Medium'
                    
                    results.append({
                        'symbol': item['symbol'],
                        'price': current_price,
                        'change_24h': item['change_24h'],
                        'volatility': round(volatility, 1),
                        'risk_score': round(risk_score, 1),
                        'rating': rating,
                        'rsi': round(rsi_val, 1),
                        'bb_position': round(bb_data['position'], 2)
                    })
                except:
                    continue
        
        results.sort(key=lambda x: x['risk_score'])
        return results


screener_service = ScreenerService()
