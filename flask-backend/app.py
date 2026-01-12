#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TokenPost PRO - Flask API Server
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
import sys

# Add crypto_market to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app)  # Next.js 프론트엔드에서 호출 허용


# ============================================================
# HEALTH CHECK
# ============================================================
@app.route('/')
def index():
    return jsonify({
        'service': 'TokenPost PRO API',
        'status': 'running',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/health')
def health():
    return jsonify({'status': 'ok'})


# ============================================================
# MARKET GATE API
# ============================================================
@app.route('/api/crypto/market-gate')
def api_market_gate():
    """Market Gate 분석 API (100점 스코어링)"""
    try:
        from crypto_market.market_gate import run_market_gate_sync
        
        result = run_market_gate_sync()
        
        # 지표별 시그널 분류
        indicators = []
        for name, val in result.metrics.items():
            if name == 'gate_score_components':
                continue
            signal = 'Neutral'
            if isinstance(val, (int, float)) and val is not None:
                if name == 'btc_ema200_slope_pct_20':
                    signal = 'Bullish' if val > 1 else ('Bearish' if val < -1 else 'Neutral')
                elif name == 'fear_greed_index':
                    signal = 'Bullish' if val > 50 else ('Bearish' if val < 30 else 'Neutral')
                elif name == 'funding_rate':
                    signal = 'Bullish' if -0.0003 < val < 0.0005 else 'Bearish'
                elif name == 'alt_breadth_above_ema50':
                    signal = 'Bullish' if val > 0.5 else ('Bearish' if val < 0.35 else 'Neutral')
            
            indicators.append({
                'name': name,
                'value': val,
                'signal': signal
            })
        
        return jsonify({
            'gate_color': result.gate,
            'score': result.score,
            'summary': f"BTC 시장 상태: {result.gate} (점수: {result.score}/100)",
            'components': result.metrics.get('gate_score_components', {}),
            'indicators': indicators,
            'top_reasons': result.reasons,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# LEAD-LAG API
# ============================================================
@app.route('/api/crypto/lead-lag')
def api_lead_lag():
    """Lead-Lag 분석 API (Granger Causality)"""
    try:
        from crypto_market.lead_lag.data_fetcher import fetch_all_data
        from crypto_market.lead_lag.granger import find_granger_causal_indicators
        import pandas as pd
        
        # 데이터 수집
        df = fetch_all_data(start_date="2020-01-01", resample="monthly")
        
        if df.empty:
            return jsonify({'error': 'No data available'}), 500
        
        # BTC MoM을 예측하는 선행 지표 찾기
        target = "BTC_MoM"
        if target not in df.columns:
            target = "BTC"
        
        results = find_granger_causal_indicators(df, target=target, max_lag=6)
        
        leading_indicators = []
        for r in results[:10]:
            # 상관관계 계산
            try:
                corr = df[r.cause].corr(df[target].shift(r.best_lag))
                corr_val = float(corr) if not pd.isna(corr) else 0
            except:
                corr_val = 0
            
            leading_indicators.append({
                'variable': r.cause,
                'lag': r.best_lag,
                'p_value': r.best_p_value,
                'correlation': corr_val,
                'interpretation': r.get_interpretation()
            })
        
        return jsonify({
            'target': target,
            'leading_indicators': leading_indicators,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# VCP SIGNALS API - Real Implementation
# ============================================================
@app.route('/api/crypto/vcp-signals')
def api_vcp_signals():
    """VCP 시그널 목록 API - 실제 패턴 감지"""
    import yfinance as yf
    import numpy as np
    
    # Scan these crypto assets
    SYMBOLS = [
        'SOL-USD', 'AVAX-USD', 'LINK-USD', 'SUI20947-USD', 'XRP-USD',
        'DOT-USD', 'ATOM-USD', 'NEAR-USD', 'APT21794-USD', 'ARB11841-USD',
        'OP-USD', 'INJ-USD', 'TIA22861-USD', 'SEI-USD', 'FET-USD',
        'RNDR-USD', 'IMX-USD', 'ONDO-USD', 'AAVE-USD', 'UNI-USD'
    ]
    
    def calculate_vcp(ticker_symbol: str) -> dict:
        """Calculate VCP metrics for a single asset"""
        try:
            ticker = yf.Ticker(ticker_symbol)
            hist = ticker.history(period="6mo")
            
            if len(hist) < 60:
                return None
            
            close = hist['Close'].values
            high = hist['High'].values
            low = hist['Low'].values
            volume = hist['Volume'].values
            
            current_price = close[-1]
            
            # Find pivot high (highest point in last 3 months)
            pivot_idx = np.argmax(high[-90:]) if len(high) >= 90 else np.argmax(high[-60:])
            pivot_high = high[-90:][pivot_idx] if len(high) >= 90 else high[-60:][pivot_idx]
            
            # Calculate contractions (volatility ranges)
            # Divide the period after pivot into 3 segments
            days_since_pivot = len(close) - (len(close) - 90 + pivot_idx) if len(close) >= 90 else len(close) - pivot_idx
            if days_since_pivot < 15:
                return None
            
            segment_len = max(5, days_since_pivot // 3)
            
            # Calculate range for each contraction
            c1_range = (np.max(high[-3*segment_len:-2*segment_len]) - np.min(low[-3*segment_len:-2*segment_len])) / np.mean(close[-3*segment_len:-2*segment_len]) * 100 if len(close) > 3*segment_len else 30
            c2_range = (np.max(high[-2*segment_len:-segment_len]) - np.min(low[-2*segment_len:-segment_len])) / np.mean(close[-2*segment_len:-segment_len]) * 100 if len(close) > 2*segment_len else 20
            c3_range = (np.max(high[-segment_len:]) - np.min(low[-segment_len:])) / np.mean(close[-segment_len:]) * 100 if len(close) > segment_len else 15
            
            # ATR percentage
            tr = np.maximum(high[1:] - low[1:], 
                           np.maximum(np.abs(high[1:] - close[:-1]), 
                                     np.abs(low[1:] - close[:-1])))
            atr = np.mean(tr[-14:])
            atr_pct = (atr / current_price) * 100
            
            # Volume ratio (current vs 50-day average)
            vol_ratio = np.mean(volume[-5:]) / np.mean(volume[-50:]) if np.mean(volume[-50:]) > 0 else 1.0
            
            # Breakout percentage
            breakout_pct = ((current_price - pivot_high) / pivot_high) * 100
            
            # Determine signal type
            if breakout_pct > 1:
                signal_type = 'BREAKOUT'
            elif breakout_pct > -3:
                signal_type = 'APPROACHING'
            elif breakout_pct > -5 and vol_ratio > 1.3:
                signal_type = 'RETEST_OK'
            else:
                return None  # Not a valid VCP pattern
            
            # Score calculation
            score = 50
            
            # Contraction pattern check (each should be smaller)
            if c1_range > c2_range > c3_range:
                score += 25
            elif c1_range > c3_range:
                score += 15
            elif c2_range > c3_range:
                score += 10
            
            # Volume confirmation
            if vol_ratio > 1.5:
                score += 15
            elif vol_ratio > 1.2:
                score += 10
            elif vol_ratio > 1.0:
                score += 5
            
            # Proximity to pivot
            if -3 < breakout_pct < 3:
                score += 10
            
            # Low ATR bonus
            if atr_pct < 4:
                score += 5
            
            score = min(100, max(0, score))
            
            # Grade assignment
            if score >= 80:
                grade = 'A'
            elif score >= 65:
                grade = 'B'
            elif score >= 50:
                grade = 'C'
            else:
                grade = 'D'
            
            symbol = ticker_symbol.replace('-USD', '')
            
            return {
                'symbol': symbol,
                'grade': grade,
                'score': int(score),
                'signal_type': signal_type,
                'pivot_high': round(pivot_high, 2),
                'current_price': round(current_price, 2),
                'breakout_pct': round(breakout_pct, 1),
                'c1': round(c1_range, 1),
                'c2': round(c2_range, 1),
                'c3': round(c3_range, 1),
                'atr_pct': round(atr_pct, 1),
                'vol_ratio': round(vol_ratio, 1)
            }
        except Exception as e:
            print(f"Error processing {ticker_symbol}: {e}")
            return None
    
    # Process all symbols
    signals = []
    for symbol in SYMBOLS:
        result = calculate_vcp(symbol)
        if result:
            signals.append(result)
    
    # Sort by score descending
    signals.sort(key=lambda x: x['score'], reverse=True)
    
    return jsonify({
        'signals': signals,
        'count': len(signals),
        'timestamp': datetime.now().isoformat()
    })


# ============================================================
# SMART CRYPTO SCREENER API
# ============================================================

# Target Assets for Screener
# Target Assets for Screener (Reduced list to prevent timeouts on free tier)
SCREENER_SYMBOLS = [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD',
    'DOGE-USD', 'ADA-USD', 'AVAX-USD', 'LINK-USD'
]

def get_hist_data(symbol, period="1y"):
    """Helper to fetch historical data"""
    import yfinance as yf
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        return hist, ticker.info
    except:
        return None, None

@app.route('/api/screener/breakout')
def api_screener_breakout():
    """Tab 1: Breakout Hunter - SMA Trends"""
    import yfinance as yf
    import pandas as pd
    
    results = []
    
    for symbol in SCREENER_SYMBOLS:
        try:
            hist, info = get_hist_data(symbol)
            if hist is None or len(hist) < 200:
                continue
                
            close = hist['Close']
            current_price = close.iloc[-1]
            
            # Calculate SMAs
            sma20 = close.rolling(window=20).mean().iloc[-1]
            sma50 = close.rolling(window=50).mean().iloc[-1]
            sma200 = close.rolling(window=200).mean().iloc[-1]
            
            # Breakout Signals
            # 1. Price > SMA (Basic Breakout)
            # 2. Golden Cross (50 crossing 200) - Simplified check if 50 > 200
            
            # Status determination
            status_20 = 'Bullish' if current_price > sma20 else 'Bearish'
            status_50 = 'Bullish' if current_price > sma50 else 'Bearish'
            status_200 = 'Bull Market' if current_price > sma200 else 'Bear Market'
            
            # Check for recent crossover (approximate)
            prev_close = close.iloc[-2]
            prev_sma200 = close.rolling(window=200).mean().iloc[-2]
            
            is_fresh_breakout = (prev_close < prev_sma200) and (current_price > sma200)
            
            results.append({
                'symbol': symbol.replace('-USD', ''),
                'price': float(current_price),
                'sma20': float(sma20),
                'sma50': float(sma50),
                'sma200': float(sma200),
                'status_20': status_20,
                'status_50': status_50,
                'status_200': status_200,
                'is_fresh_breakout': bool(is_fresh_breakout),
                'pct_from_sma200': float(((current_price - sma200) / sma200) * 100)
            })
            
        except Exception as e:
            print(f"Error processing {symbol}: {e}")
            continue
            
    # Sort by 'fresh breakout' first, then distance from SMA 200 desc
    results.sort(key=lambda x: (x['is_fresh_breakout'], x['pct_from_sma200']), reverse=True)
    
    return jsonify({
        'data': results,
        'count': len(results),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/screener/price-performance')
def api_screener_performance():
    """Tab 2: Bottom Fisher - ATH/ATL Drawdown"""
    import yfinance as yf
    
    results = []
    
    for symbol in SCREENER_SYMBOLS:
        try:
            hist, info = get_hist_data(symbol, period="max") # Need extensive history
            if hist is None or len(hist) < 30:
                continue
                
            close = hist['Close']
            current_price = close.iloc[-1]
            
            # Calculate ATH / ATL
            ath = close.max()
            atl = close.min()
            ath_date = close.idxmax().strftime('%Y-%m-%d')
            atl_date = close.idxmin().strftime('%Y-%m-%d')
            
            # Drawdown %
            drawdown = ((current_price - ath) / ath) * 100
            
            # From ATL %
            from_atl = ((current_price - atl) / atl) * 100
            
            # Cycle Position (0 to 1 scale)
            # 0 = ATL, 1 = ATH
            position = (current_price - atl) / (ath - atl) if (ath - atl) > 0 else 0
            
            results.append({
                'symbol': symbol.replace('-USD', ''),
                'price': float(current_price),
                'ath': float(ath),
                'ath_date': ath_date,
                'atl': float(atl),
                'atl_date': atl_date,
                'drawdown': float(drawdown),
                'from_atl': float(from_atl),
                'cycle_position': float(position)
            })
            
        except Exception as e:
             print(f"Error processing {symbol}: {e}")
             continue

    # Sort by biggest drawdown (deepest dip first)
    results.sort(key=lambda x: x['drawdown'])
    
    return jsonify({
        'data': results,
        'count': len(results),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/screener/risk')
def api_screener_risk():
    """Tab 3: Risk Scanner - Volatility Analysis"""
    import yfinance as yf
    import numpy as np
    
    results = []
    
    # Pre-fetch BTC to calculate relative risk
    btc_hist, _ = get_hist_data('BTC-USD', period="1y")
    if btc_hist is None:
        return jsonify({'error': 'Failed to fetch BTC base data'}), 500
        
    btc_returns = btc_hist['Close'].pct_change().dropna()
    btc_volatility = btc_returns.std() * np.sqrt(365) # Annualized Vol
    
    for symbol in SCREENER_SYMBOLS:
        try:
            hist, info = get_hist_data(symbol, period="1y")
            if hist is None or len(hist) < 30:
                continue
            
            returns = hist['Close'].pct_change().dropna()
            
            # Annualized Volatility
            volatility = returns.std() * np.sqrt(365)
            
            # Relative Risk Score (BTC = 1.0)
            risk_score = volatility / btc_volatility if btc_volatility > 0 else 0
            
            # Determine Risk Rating
            if risk_score < 1.5:
                rating = 'Low'
            elif risk_score < 3.0:
                rating = 'Medium'
            else:
                rating = 'Extreme'
                
            results.append({
                'symbol': symbol.replace('-USD', ''),
                'price': float(hist['Close'].iloc[-1]),
                'volatility': float(volatility * 100), # as percentage
                'risk_score': float(risk_score),
                'rating': rating
            })
            
        except Exception as e:
            print(f"Error processing {symbol}: {e}")
            continue
            
    # Sort by Risk Score descending (Riskiest first)
    results.sort(key=lambda x: x['risk_score'], reverse=True)
    
    return jsonify({
        'data': results,
        'count': len(results),
        'timestamp': datetime.now().isoformat()
    })


# ============================================================
# CONTENT API (News & Research) - Simple In-Memory DB
# ============================================================
# In a real production app, use SQLite/PostgreSQL
import uuid

# In-memory storage
CONTENT_STORE = {
    'news': [
        {
            'id': '1', 'category': '시장', 'title': '비트코인, 현물 ETF 승인 이후 자금 유입 가속화',
            'summary': 'BlackRock IBIT 100억 달러 돌파 임박, 기관 매수세 지속',
            'source': 'TokenPost', 'published_at': datetime.now().isoformat(),
            'image_url': 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=250&fit=crop'
        },
        {
            'id': '2', 'category': 'DeFi', 'title': '이더리움 덴쿤 업그레이드, L2 수수료 대폭 인하 전망',
            'summary': 'Proto-danksharding 도입으로 롤업 비용 90% 절감 기대',
            'source': 'The Block', 'published_at': datetime.now().isoformat(),
            'image_url': 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&h=250&fit=crop'
        }
    ],
    'research': [
        {
            'id': '1', 'type': 'REPORT', 'title': '2025년 웹3 게이밍 트렌드 전망',
            'summary': 'Play-to-Earn에서 Play-and-Earn으로의 전환, AAA급 게임의 등장',
            'author': '리서치팀', 'source': 'TokenPost PRO', 'date': '2025.01.10',
            'readTime': '10분', 'isPro': True, 'tags': ['GameFi', 'Trends']
        }
    ]
}

@app.route('/api/content/<content_type>', methods=['GET'])
def get_content(content_type):
    if content_type not in CONTENT_STORE:
        return jsonify({'error': 'Invalid content type'}), 400
    
    return jsonify(CONTENT_STORE[content_type])

@app.route('/api/content/<content_type>', methods=['POST'])
def create_content(content_type):
    if content_type not in CONTENT_STORE:
        return jsonify({'error': 'Invalid content type'}), 400
    
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    new_item = {
        'id': str(uuid.uuid4()),
        'published_at': datetime.now().isoformat(),
        **data
    }
    
    # Prepend to list for latest first
    CONTENT_STORE[content_type].insert(0, new_item)
    
    return jsonify({'success': True, 'item': new_item})


@app.route('/api/content/<content_type>/<item_id>', methods=['DELETE'])
def delete_content(content_type, item_id):
    if content_type not in CONTENT_STORE:
        return jsonify({'error': 'Invalid content type'}), 400
        
    CONTENT_STORE[content_type] = [
        item for item in CONTENT_STORE[content_type] 
        if item.get('id') != item_id
    ]
    
    return jsonify({'success': True})


# ============================================================
# X-RAY ANALYSIS API
# ============================================================
@app.route('/api/crypto/xray/asset/<symbol>')
def api_xray_asset(symbol):
    """Specific Asset AI X-Ray Analysis"""
    symbol = symbol.upper()
    
    # Category mapping (simplified for backend)
    categories = {
        'BTC': 'L1', 'ETH': 'L1', 'SOL': 'L1', 'ADA': 'L1', 'AVAX': 'L1',
        'XRP': 'L1', 'DOT': 'L1', 'ATOM': 'L1', 'NEAR': 'L1', 'APT': 'L1',
        'MATIC': 'L2', 'ARB': 'L2', 'OP': 'L2', 'BASE': 'L2',
        'UNI': 'DeFi', 'AAVE': 'DeFi', 'MKR': 'DeFi', 'LDO': 'DeFi', 'CRV': 'DeFi',
        'FET': 'AI', 'RNDR': 'AI', 'TAO': 'AI', 'OCEAN': 'AI',
        'DOGE': 'Meme', 'SHIB': 'Meme', 'PEPE': 'Meme', 'WIF': 'Meme',
        'AXS': 'Gaming', 'SAND': 'Gaming', 'MANA': 'Gaming', 'IMX': 'Gaming',
        'FIL': 'DePIN', 'AR': 'DePIN', 'HNT': 'DePIN', 'IOTX': 'DePIN',
        'ONDO': 'RWA', 'PAXG': 'RWA'
    }
    
    category = categories.get(symbol, 'Unknown')
    
    # Generate deterministic mock data based on symbol hash
    seed = sum(ord(c) for c in symbol)
    score_base = (seed % 30) + 65
    overall_score = min(9.8, max(4.5, score_base / 10.0))
    
    # Adjust score based on category trends (simulated)
    if category in ['AI', 'RWA']:
        overall_score = min(9.9, overall_score + 0.5)
    elif category == 'Meme':
        overall_score = max(3.0, overall_score - 1.5)
        
    radar_data = [
        {'label': '펀더멘탈', 'value': 40 if category == 'Meme' else 85},
        {'label': '기술적', 'value': int(overall_score * 10)},
        {'label': '온체인', 'value': 90 if category == 'L1' else 70},
        {'label': '센티멘트', 'value': 95 if category in ['AI', 'Meme'] else 60},
        {'label': '혁신성', 'value': 88 if category in ['DeFi', 'AI'] else 65}
    ]
    
    metrics = [
        {'label': 'RSI (14)', 'value': '58.4', 'signal': 'neutral', 'comment': '중립 구간 매물 소화 중'},
        {'label': 'MVRV Z-Score', 'value': '1.2', 'signal': 'bullish', 'comment': '저평가 구간, 상승 여력 충분'},
        {'label': '고래 유입', 'value': '+5.4%', 'signal': 'bullish', 'comment': '지난 24시간 순매수세 지속'},
        {'label': '볼륨 변동성', 'value': '-12%', 'signal': 'bearish', 'comment': '단기 거래량 감소 추세'}
    ]
    
    risks = ['시장 변동성 확대', '규제 리스크', '단기 차익 실현 매물']
    opportunities = ['섹터 순환매 수혜', '주요 파트너십 발표 기대', '기술적 반등 구간']
    
    recommendation = (
        '적극 매수 (Strong Buy)' if overall_score > 8.0 else 
        '매수 (Buy)' if overall_score > 7.0 else
        '보유 (Hold)' if overall_score > 5.0 else '관망 (Neutral)'
    )
    
    # Generate detailed generative analysis (Simulated LLM Output)
    detailed_analysis = {
        'market_context': (
            f"현재 {category} 섹터 내에서 {symbol}의 지배력은 {overall_score * 10:.1f}%로 평가됩니다. "
            f"{'기관 투자자들의 관심이 집중되고 있으며,' if overall_score > 7.5 else '개인 투자자 주도의 흐름이 강하며,'} "
            f"거시경제적 불확실성 속에서도 {'상대적으로 견조한' if overall_score > 6.0 else '다소 약세인'} 흐름을 보이고 있습니다."
        ),
        'technical_outlook': (
            f"주가 기술적 분석상 {'강력한 상승 트렌드' if overall_score > 8.0 else '박스권 횡보' if overall_score > 5.0 else '하락 압력'} 구간에 위치해 있습니다. "
            f"특히 RSI와 MACD 지표가 {'골든크로스를 형성하며 추가 상승' if overall_score > 7.0 else '데드크로스 우려가 있어 단기 조정'} 가능성을 시사합니다. "
            f"주요 저항선 돌파 시 {int(overall_score * 15)}% 이상의 추가 상승 여력이 존재합니다."
        ),
        'on_chain_verdict': (
            f"온체인 데이터 분석 결과, {'고래 지갑(Whale Wallets)의 순유입이 지난 1주간 지속' if overall_score > 7.0 else '단기 보유자(STH)들의 매도 압력이 증가'}되고 있습니다. "
            f"MVRV 비율은 {'저평가 구간으로 매수 적기' if overall_score > 6.5 else '고평가 구간으로 차익 실현 권장'} 상태를 가리키고 있습니다. "
            f"네트워크 활성도는 전월 대비 {'증가' if overall_score > 5.5 else '감소'} 추세입니다."
        )
    }

    return jsonify({
        'assetName': symbol,
        'category': category,
        'overallScore': round(overall_score, 1),
        'summary': f"{symbol}은(는) 현재 {category} 섹터에서 강한 모멘텀을 유지하고 있습니다. 온체인 데이터 상 고래들의 매집 흔적이 뚜렷합니다.",
        'detailed_analysis': detailed_analysis,
        'radarData': radar_data,
        'metrics': metrics,
        'risks': risks,
        'opportunities': opportunities,
        'recommendation': recommendation,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/crypto/xray/global')
def api_xray_global():
    """Global Market AI X-Ray Analysis"""
    
    return jsonify({
        'overallScore': 7.2,
        'marketPhase': '초기 강세장 (Early Bull)',
        'summary': '현재 암호화폐 시장은 기관 자금 유입과 ETF 승인 효과로 강세 국면에 진입하고 있습니다. BTC가 시장을 주도하고 있으며, 알트코인 로테이션이 시작되는 단계입니다.',
        'marketHealth': [
            {'label': '거시경제', 'value': 65},
            {'label': '유동성', 'value': 85},
            {'label': '심리', 'value': 72},
            {'label': '기술적', 'value': 80},
            {'label': '온체인', 'value': 75},
        ],
        'sectorAnalysis': [
            {'name': '레이어 1', 'signal': 'bullish', 'score': 8.1, 'insight': 'BTC, ETH 주도로 강세. 기관 채택 가속화.'},
            {'name': '레이어 2', 'signal': 'neutral', 'score': 6.5, 'insight': '토큰 언락 압력 주의. TVL 성장은 긍정적.'},
            {'name': 'DeFi', 'signal': 'bullish', 'score': 7.8, 'insight': 'Real Yield 프로토콜 강세. TVL 회복 중.'},
            {'name': 'AI', 'signal': 'neutral', 'score': 6.2, 'insight': 'FDV 대비 고평가 우려. 파트너십 확대 중.'},
            {'name': 'Meme', 'signal': 'bearish', 'score': 4.5, 'insight': '과열 조정 기대. 선별적 접근 필요.'},
            {'name': 'Gaming', 'signal': 'neutral', 'score': 5.8, 'insight': 'NFT 시장 침체 영향. 신규 게임 출시 대기.'},
        ],
        'keyMetrics': [
            {'label': 'BTC 도미넌스', 'value': '54.2%', 'signal': 'neutral', 'comment': '알트코인 로테이션 시작 신호'},
            {'label': '총 스테이블코인 시총', 'value': '$200B', 'signal': 'bullish', 'comment': '유동성 풍부, 매수 대기 자금'},
            {'label': '거래소 BTC 잔고', 'value': '-2.8% (30일)', 'signal': 'bullish', 'comment': '장기 보유 성향 강화'},
            {'label': 'ETF 순유입', 'value': '+$1.2B (5일)', 'signal': 'bullish', 'comment': '기관 자금 지속 유입'},
            {'label': '펀딩 레이트', 'value': '0.012%', 'signal': 'neutral', 'comment': '적정 수준, 과열 아님'},
            {'label': '공포·탐욕 지수', 'value': '72 (탐욕)', 'signal': 'neutral', 'comment': '주의 필요하나 극단적이지 않음'},
        ],
        'risks': [
            '단기 과열 조정 가능성',
            '규제 불확실성 (글로벌 정책)',
            '거시경제 변수 (금리, 인플레이션)',
            'L2 토큰 대규모 언락 일정',
        ],
        'opportunities': [
            'BTC ETF 옵션 거래 승인',
            'DeFi Real Yield 섹터 저평가',
            '기관 채택 가속화',
            'L1 생태계 확장',
        ],
        'recommendation': '강세 초입 국면입니다. BTC/ETH 중심으로 비중을 유지하되, DeFi와 검증된 L1에 선별적 투자를 권장합니다.',
        'timestamp': datetime.now().isoformat()
    })



# ============================================================
# MAIN
# ============================================================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    print(f"🚀 TokenPost PRO API starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=debug)
