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
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from services.calendar_service import fetch_investing_calendar

# Add crypto_market to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
# Load Env
load_dotenv()
print("----------------------------------------------------------------")
print(f"🚀 [DEBUG] APP STARTING...")
print(f"🚀 [DEBUG] ENV PORT: {os.environ.get('PORT')}")
print(f"🚀 [DEBUG] CWD: {os.getcwd()}")
print("----------------------------------------------------------------")
CORS(app)

# Cache Config
import concurrent.futures

try:
    from flask_caching import Cache
    cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})
    print("✅ Flask-Caching loaded successfully.")
except ImportError:
    print("⚠️ Flask-Caching module not found. Caching disabled.")
    # Mock Cache to prevent crash
    class MockCache:
        def cached(self, timeout=60):
            def decorator(f):
                return f
            return decorator
    cache = MockCache()

# ----------------------------------------------------
# JSON ENCODER FIX (For numpy types)
# ----------------------------------------------------
from flask.json.provider import DefaultJSONProvider
import numpy as np

class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, np.bool_):
            return bool(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

app.json = CustomJSONProvider(app)

# ----------------------------------------------------
# SCHEDULER STARTUP
# ----------------------------------------------------
# Only run scheduler in the main process to avoid duplicates in dev
if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or os.environ.get('RAILWAY_ENVIRONMENT'):
    try:
        from scheduler_service import scheduler_service
        scheduler_service.start()
        # Optionally trigger one immediately for instant data? 
        # scheduler_service.scheduler.add_job(scheduler_service.update_market_analysis, 'date', run_date=datetime.now())
        print("✅ Scheduler Service initialized.")
    except Exception as e:
        print(f"⚠️ Scheduler failed to start: {e}")

# DEBUG: Version Check
API_VERSION = "1.0.2-fix-gitignore-env"
print(f"🚀 Starting TokenPost PRO API - Version: {API_VERSION}")

@app.route('/api/version')
def api_version():
    return jsonify({
        'version': API_VERSION,
        'timestamp': datetime.now().isoformat(),
        'status': 'active'
    })

# ----------------------------------------------------
# Vercel Middleware to strip /api/python prefix
# ----------------------------------------------------
class VercelMiddleware(object):
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        # If running on Vercel, the path might start with /api/python
        path = environ.get('PATH_INFO', '')
        if path.startswith('/api/python'):
            environ['PATH_INFO'] = path.replace('/api/python', '/api', 1)
        return self.app(environ, start_response)

app.wsgi_app = VercelMiddleware(app.wsgi_app)

# NOTE: Imports are now lazy-loaded inside routes to prevent startup crashes on Vercel
# from ai_service import ai_service
# from crypto_market.market_gate import run_market_gate_sync
# from market_data_service import market_data_service

# ============================================================
# GLOBAL ERROR HANDLER
# ============================================================
@app.errorhandler(Exception)
def handle_exception(e):
    """Return JSON instead of HTML for HTTP errors."""
    import traceback
    # print(traceback.format_exc()) # Log to Vercel Console
    return jsonify({
        "error": str(e),
        "traceback": traceback.format_exc()
    }), 500

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
# OAUTH PROXY ENDPOINTS (Bypass CORS for TokenPost OAuth API)
# ============================================================
import requests

@app.route('/api/oauth/token', methods=['POST'], strict_slashes=False)
def oauth_token_proxy():
    """Proxy for TokenPost OAuth token exchange - bypasses CORS"""
    try:
        data = request.get_json() or {}
        
        # Forward request to TokenPost OAuth API
        response = requests.post(
            'https://oapi.tokenpost.kr/oauth/v1/token',
            data={
                'grant_type': data.get('grant_type', 'authorization_code'),
                'code': data.get('code'),
                'client_id': data.get('client_id'),
                'client_secret': data.get('client_secret'),
                'redirect_uri': data.get('redirect_uri'),
                'code_verifier': data.get('code_verifier', '')
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"❌ TokenPost Token Error ({response.status_code}): {response.text}")

        return jsonify(response.json()), response.status_code
        
    except Exception as e:
        print(f"❌ OAuth Token Proxy Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/oauth/userinfo', methods=['GET'], strict_slashes=False)
def oauth_userinfo_proxy():
    """Proxy for TokenPost OAuth UserInfo API - bypasses CORS"""
    try:
        # Get bearer token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        scope = request.args.get('scope', 'user.email,user.nickname,subscription,grade,point.tpc')
        
        response = requests.get(
            f'https://oapi.tokenpost.kr/oauth/v1/userInfo?scope={scope}',
            headers={
                'Authorization': auth_header,
                'Content-Type': 'application/json'
            },
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"❌ TokenPost UserInfo Error ({response.status_code}): {response.text}")
            
        return jsonify(response.json()), response.status_code
        
    except Exception as e:
        print(f"❌ OAuth UserInfo Proxy Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/trigger-analysis', methods=['POST'], strict_slashes=False)
def trigger_analysis():
    """Manual trigger for analysis job"""
    try:
        from scheduler_service import scheduler_service
        from scheduler_service import scheduler_service
        result = scheduler_service.update_market_analysis()
        return jsonify({"success": True, "message": "Analysis triggered and saved", "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/analysis/latest', methods=['GET'])
def get_latest_analysis():
    """Get latest analysis directly from AI Service (bypassing Supabase RLS)"""
    try:
        from market_provider import market_data_service
        from ai_service import ai_service
        
        # 1. Get Market Data
        market_data = market_data_service.get_global_metrics()
        
        # 2. Get Analysis (Cached or New)
        result = ai_service.analyze_global_market(market_data)
        
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/test/hello')
def api_test_hello():
    """Dependency-free test route"""
    return jsonify({'message': 'Hello from Vercel!', 'status': 'ok'})

# ============================================================
# SIMPLE ASSET DATA API (for Market Gate cards)
# ============================================================
@app.route('/api/crypto/asset/<symbol>')
@cache.cached(timeout=10)  # Cache for 10 seconds for real-time
def api_crypto_asset(symbol):
    """Simple asset data for individual coin cards"""
    from market_provider import market_data_service
    
    symbol = symbol.upper()
    
    try:
        data = market_data_service.get_asset_data(symbol)
        
        # Calculate volatility based on ATR or price range
        df = data.get('raw_df')
        volatility = 'Normal'
        volume_signal = 'Normal'
        
        if df is not None and len(df) > 14:
            # ATR-based volatility
            high_low = df['High'] - df['Low']
            atr = high_low.tail(14).mean()
            atr_pct = (atr / data['current_price']) * 100 if data['current_price'] > 0 else 0
            
            if atr_pct <= 2.5:
                volatility = 'Low'
            elif atr_pct <= 5.0:
                volatility = 'Normal'
            else:
                volatility = 'High'
            
            # Volume signal
            vol_avg = df['Volume'].tail(20).mean()
            vol_current = df['Volume'].iloc[-1]
            
            if vol_current > vol_avg * 1.3:
                volume_signal = 'High'
            elif vol_current < vol_avg * 0.7:
                volume_signal = 'Low'
            else:
                volume_signal = 'Normal'
        
        return jsonify({
            'symbol': symbol,
            'name': data.get('name', symbol),
            'current_price': data['current_price'],
            'price_change_24h': data.get('change_24h', 0),
            'trend': data.get('trend', 'Neutral'),
            'volatility': volatility,
            'volume_signal': volume_signal,
            'ma_20': data.get('ma_20', 0),
            'ma_50': data.get('ma_50', data.get('ma_20', 0)),
            'source': data.get('source', 'Unknown')
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'symbol': symbol,
            'current_price': 0,
            'trend': 'Neutral',
            'volatility': 'Normal',
            'volume_signal': 'Normal'
        }), 500


# ============================================================
# MARKET GATE API
# ============================================================
@app.route('/api/crypto/market-gate')
@cache.cached(timeout=300)  # Cache for 5 minutes
def api_market_gate():
    """Market Gate 분석 API (100점 스코어링) - Cached 5min"""
    try:
        try:
            # Ensure module is available
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
        except Exception as inner_e:
            print(f"Market Gate Execution Error: {inner_e}")
            raise inner_e # Trigger fallback below

    except Exception as e:
        print(f"Market Gate Fallback Triggered: {e}")
    except Exception as e:
        print(f"Market Gate Fallback Triggered: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# LEAD-LAG API
# ============================================================
@app.route('/api/crypto/lead-lag')
def api_lead_lag():
    """Lead-Lag 분석 API (Granger Causality)"""
    try:
        # from crypto_market.lead_lag.data_fetcher import fetch_all_data
        # from crypto_market.lead_lag.granger import find_granger_causal_indicators
        # import pandas as pd
        
        # NOTE: Vercel 250MB limit optimization. 
        # Statsmodels is too heavy. Using Pre-calculated / Mock data for now.
        raise ImportError("Optimization: Using Mock Data")

        # 데이터 수집
        df = fetch_all_data(start_date="2020-01-01", resample="monthly")
        
        if df.empty:
            raise ValueError("Data fetch failed or empty")
        
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
        print(f"Lead-Lag API Error: {e}")
        # Fallback Data (Mock) to ensure UI is not empty
        return jsonify({
            'target': target if 'target' in locals() else 'BTC_MoM',
            'leading_indicators': [],
            'timestamp': datetime.now().isoformat(),
            'error': "Analysis unavailable (Optimization Mode)"
        })


# ============================================================
# VCP SIGNALS API
# ============================================================
@app.route('/api/crypto/vcp-signals')
@cache.cached(timeout=300)
def api_vcp_signals():
    """VCP 패턴 감지 API"""
    try:
        from crypto_market.patterns.vcp import find_vcp_candidates
        
        # 1. 대상 심볼 (업비트 원화 마켓 주요 코인 + 해외 주요 코인)
        symbols = [
            'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'ADA-USD',
            'DOGE-USD', 'AVAX-USD', 'TRX-USD', 'DOT-USD', 'LINK-USD',
            'MATIC-USD', 'SHIB-USD', 'LTC-USD', 'BCH-USD', 'ATOM-USD',
            'UNI-USD', 'ETC-USD', 'FIL-USD', 'NEAR-USD', 'APT-USD',
            'INJ-USD', 'RNDR-USD', 'STX-USD', 'IMX-USD', 'ARB-USD',
            'OP-USD', 'SUI-USD', 'SEI-USD', 'TIA-USD', 'FET-USD'
        ]
        
        candidates = find_vcp_candidates(symbols)
        
        return jsonify({
            'signals': candidates,
            'count': len(candidates),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"VCP API Error: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ETH STAKING INTELLIGENCE API
# ============================================================
@app.route('/api/eth/staking')
@cache.cached(timeout=60)  # 1분 캐시 (10분 수집 주기보다 짧게)
def api_eth_staking():
    """
    ETH Staking Intelligence API
    Returns: validator queue, wait times, signal status, AI report
    """
    try:
        from eth_staking_service import eth_staking_service
        
        # Get real-time metrics
        metrics = eth_staking_service.get_staking_metrics()
        
        return jsonify({
            'success': True,
            'entry_queue': metrics['entry_queue'],
            'exit_queue': metrics['exit_queue'],
            'entry_queue_eth': metrics['entry_queue_eth'],
            'exit_queue_eth': metrics['exit_queue_eth'],
            'entry_wait_days': metrics['entry_wait_days'],
            'entry_wait_hours': metrics['entry_wait']['hours'],
            'exit_wait_minutes': metrics['exit_wait_minutes'],
            'active_validators': metrics['active_validators'],
            'staking_apr': metrics['staking_apr'],
            'total_staked_eth': metrics['total_staked_eth'],
            'staked_percentage': metrics['staked_percentage'],
            'signal': metrics['signal'],
            'signal_color': metrics['signal_color'],
            'signal_text': metrics['signal_text'],
            'signal_emoji': metrics['signal_emoji'],
            'ai_report': metrics['ai_report'],
            'timestamp': metrics['timestamp']
        })
        
    except Exception as e:
        print(f"ETH Staking API Error: {e}")
        # Return fallback data
        return jsonify({
            'success': False,
            'error': str(e),
            'entry_queue': 80000,
            'exit_queue': 150,
            'entry_queue_eth': 2560000,
            'exit_queue_eth': 4800,
            'entry_wait_days': 40.0,
            'entry_wait_hours': 960.0,
            'exit_wait_minutes': 3.0,
            'active_validators': 980000,
            'staking_apr': 3.5,
            'total_staked_eth': 31360000,
            'staked_percentage': 26.1,
            'signal': 'STRONG_HOLD',
            'signal_color': 'green',
            'signal_text': '강력 홀딩',
            'signal_emoji': '🟢',
            'ai_report': '데이터 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            'timestamp': datetime.now().isoformat()
        })


@app.route('/api/eth/staking/history')
@cache.cached(timeout=300)  # 5분 캐시
def api_eth_staking_history():
    """
    ETH Staking History API - 7-day queue data for chart
    Returns: array of {entry_queue, exit_queue, timestamp}
    """
    try:
        if not supabase:
            raise Exception("Database not available")
        
        # Get last 7 days of data (max 1000 rows = ~7 days at 10min intervals)
        response = supabase.table('eth_staking_metrics').select(
            'entry_queue, exit_queue, entry_wait_seconds, exit_wait_seconds, created_at'
        ).order('created_at', desc=True).limit(1008).execute()
        
        if response.data:
            # Reverse to chronological order
            data = list(reversed(response.data))
            return jsonify({
                'success': True,
                'count': len(data),
                'data': data
            })
        else:
            return jsonify({
                'success': True,
                'count': 0,
                'data': [],
                'message': 'No historical data yet. Data collection starts when scheduler runs.'
            })
            
    except Exception as e:
        print(f"ETH Staking History Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'count': 0,
            'data': []
        })


# ============================================================
# SMART CRYPTO SCREENER API
# ============================================================


SCREENER_SYMBOLS = [
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP',
    'ADA', 'DOGE', 'AVAX', 'TRX', 'DOT',
    'LINK', 'MATIC', 'SHIB', 'LTC', 'BCH',
    'ATOM', 'UNI', 'ETC', 'FIL', 'NEAR',
    'APT', 'INJ', 'RNDR', 'STX', 'IMX',
    'ARB', 'OP', 'SUI', 'SEI', 'TIA'
]

@app.route('/api/screener/breakout')
@cache.cached(timeout=60)
def api_screener_breakout():
    """Tab 1: Breakout Scanner - Parallel"""
    from market_provider import market_data_service
    from crypto_market.indicators import rsi, relative_volume
    
    results = []
    
    def fetch_data(symbol):
        try:
            return market_data_service.get_asset_data(symbol)
        except:
            return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch_data, sym): sym for sym in SCREENER_SYMBOLS}
        for future in concurrent.futures.as_completed(futures):
            item = future.result()
            if not item: continue
            
            try:
                df = item['raw_df']
                current_price = item['current_price']
                if df is None or df.empty: continue

                sma20 = item['ma_20']
                sma50 = df['Close'].tail(50).mean()
                sma200 = df['Close'].tail(200).mean()
                
                # Technicals
                rsi_val = float(rsi(df['Close'], 14).iloc[-1])
                rvol = float(relative_volume(df['Volume'], 20))
                
                status_20 = 'Bullish' if current_price > sma20 else 'Bearish'
                status_50 = 'Bullish' if current_price > sma50 else 'Bearish'
                status_200 = 'Bull Market' if current_price > sma200 else 'Bear Market'
                
                is_fresh_breakout = False
                if len(df) > 2:
                    prev_close = df['Close'].iloc[-2]
                    is_fresh_breakout = (prev_close < sma200 * 0.99) and (current_price > sma200)

                # AI Insight Generation (Korean)
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
            except Exception as e:
                continue

    results.sort(key=lambda x: (x['is_fresh_breakout'], x['pct_from_sma200']), reverse=True)
    
    return jsonify({
        'data': results,
        'count': len(results),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/screener/price-performance')
@cache.cached(timeout=60)
def api_screener_real():
    """Tab 2: Price Performance - Parallel"""
    from market_provider import market_data_service
    from crypto_market.indicators import rsi
    
    results = []
    
    def fetch_data(symbol):
        try:
            return market_data_service.get_asset_data(symbol)
        except:
            return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch_data, sym): sym for sym in SCREENER_SYMBOLS}
        for future in concurrent.futures.as_completed(futures):
            item = future.result()
            if not item: continue
            
            try:
                df = item['raw_df']
                current_price = item['current_price']
                if df is None or df.empty: continue
                
                ath = df['High'].max()
                atl = df['Low'].min()
                
                # Drawdown
                drawdown = ((current_price - ath) / ath) * 100 if ath > 0 else 0
                from_atl = ((current_price - atl) / atl) * 100 if atl > 0 else 0
                
                # RSI
                rsi_val = float(rsi(df['Close'], 14).iloc[-1])

                # AI Insight (Korean)
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
    
    return jsonify({
        'data': results,
        'count': len(results),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/screener/risk')
@cache.cached(timeout=60)
def api_screener_risk():
    """Tab 3: Risk Scanner - Parallel"""
    from market_provider import market_data_service
    import numpy as np
    
    results = []
    
    def fetch_data(symbol):
        try:
            return market_data_service.get_asset_data(symbol)
        except:
            return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch_data, sym): sym for sym in SCREENER_SYMBOLS}
        for future in concurrent.futures.as_completed(futures):
            item = future.result()
            if not item: continue
            
            try:
                df = item['raw_df']
                current_price = item['current_price']
                if df is None or df.empty: continue
                
                # Volatility (Annualized)
                returns = df['Close'].pct_change().dropna()
                volatility = float(returns.std() * np.sqrt(365) * 100) if len(returns) > 1 else 0
                
                # Simplified Risk Score (0-2 scale)
                risk_score = volatility / 50.0 # Benchmark 50%
                
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

    results.sort(key=lambda x: x['risk_score'], reverse=True)
    
    return jsonify({
        'data': results,
        'count': len(results),
        'timestamp': datetime.now().isoformat()
    })


# ============================================================
# INITIALIZE SUPABASE CLIENT
# ============================================================
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase Client initialized.")
    except Exception as e:
        print(f"⚠️ Failed to initialize Supabase: {e}")


# ============================================================
# EXTERNAL INGEST API (Protected)
# ============================================================
@app.route('/api/external/ingest', methods=['POST'], strict_slashes=False)
def ingest_external_content():
    """
    Secure endpoint for external content injection (News & Research).
    Requires Header: X-API-KEY
    """
    # 1. Security Check
    msg_api_key = request.headers.get('X-API-KEY')
    server_api_key = os.getenv('EXTERNAL_API_KEY')
    
    if not server_api_key:
        return jsonify({'error': 'Server configuration error: EXTERNAL_API_KEY not set'}), 500
        
    if not msg_api_key or msg_api_key != server_api_key:
        return jsonify({'error': 'Unauthorized: Invalid API Key'}), 401
    
    # 2. Parse Payload
    data = request.json
    if not data:
        return jsonify({'error': 'No JSON payload provided'}), 400
        
    content_type = data.get('type', 'news') # Default to news
    payload = data.get('data')
    
    if not payload:
        return jsonify({'error': 'Missing data payload'}), 400

    if not supabase:
        return jsonify({'error': 'Database connection unavailable'}), 503

    # 3. Process & Insert into Supabase
    try:
        if content_type == 'news':
            # Map payload to Supabase 'news' table columns
            db_payload = {
                'title': payload.get('title'),
                'summary': payload.get('summary'),
                'content': payload.get('content'),
                'source': payload.get('source', 'External'),
                'published_at': payload.get('published_at', datetime.now().isoformat()),
                'sentiment_score': payload.get('sentiment_score'),
                'image_url': payload.get('image_url'),
                'category': payload.get('category'),
                'show_on_chart': payload.get('show_on_chart', False),
                'related_coin': payload.get('related_coin')
            }
            response = supabase.table('news').insert(db_payload).execute()
            
        elif content_type == 'research':
            # Map payload to Supabase 'research' table columns
            # Note: payload 'type' (REPORT/ANALYSIS) maps to DB 'category' or kept as is if DB has 'category'
            db_payload = {
                'title': payload.get('title'),
                'author': payload.get('author', 'TokenPost'),
                'summary': payload.get('summary'),
                'content': payload.get('content'),
                'tags': payload.get('tags', []),
                'is_premium': payload.get('is_premium', False),
                'image_url': payload.get('thumbnail_url'), # Map to DB column 'image_url'
                'category': payload.get('type', 'REPORT') # Mapping type to category column
            }
            response = supabase.table('research').insert(db_payload).execute()
        
        else:
            return jsonify({'error': f'Unsupported content type: {content_type}'}), 400

        # Check response
        # supabase-py v1.2.0 returns response object with .data and .error usually? 
        # Actually .execute() returns APIResponse which has .data
        
        inserted_data = response.data if response and response.data else []
        inserted_id = inserted_data[0]['id'] if inserted_data else 'unknown'
        
        print(f"📥 Supabase Ingest ({content_type}): ID {inserted_id}")
        return jsonify({'success': True, 'id': inserted_id, 'data': inserted_data[0] if inserted_data else None, 'message': 'Content saved to Supabase'})
        
    except Exception as e:
        print(f"Ingest Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/external/markers', methods=['POST'], strict_slashes=False)
def ingest_markers():
    """
    Dedicated endpoint for News Markers on Charts.
    Automatically sets type='news' and show_on_chart=True.
    Requires Header: X-API-KEY
    """
    # 1. Security Check
    msg_api_key = request.headers.get('X-API-KEY')
    server_api_key = os.getenv('EXTERNAL_API_KEY')
    
    if not server_api_key:
        return jsonify({'error': 'Server configuration error: EXTERNAL_API_KEY not set'}), 500
        
    if not msg_api_key or msg_api_key != server_api_key:
        return jsonify({'error': 'Unauthorized: Invalid API Key'}), 401
    
    # 2. Parse Payload
    data = request.json
    if not data:
        return jsonify({'error': 'No JSON payload provided'}), 400
        
    if not supabase:
        return jsonify({'error': 'Database connection unavailable'}), 503

    # Force marker attributes
    payload = data.get('data', data) # Support both wrapped 'data' and direct payload
    
    # 3. Process & Insert into Supabase
    try:
        db_payload = {
            'title': payload.get('title'),
            'summary': payload.get('summary'),
            'content': payload.get('content'),
            'source': payload.get('source', 'External Market'),
            'published_at': payload.get('published_at', datetime.now().isoformat()),
            'sentiment_score': payload.get('sentiment_score'),
            'image_url': payload.get('image_url'),
            'category': 'MARKER', # Distinct category for clarity
            'show_on_chart': True, # Forced
            'related_coin': payload.get('related_coin')
        }
        
        response = supabase.table('news').insert(db_payload).execute()
        
        inserted_data = response.data if response and response.data else []
        inserted_id = inserted_data[0]['id'] if inserted_data else 'unknown'

        print(f"📍 Marker Ingest: Saved to Supabase ID {inserted_id}")
        return jsonify({'success': True, 'id': inserted_id, 'data': inserted_data[0] if inserted_data else None, 'message': 'Marker stored successfully'})
        
    except Exception as e:
        print(f"Marker Ingest Error: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# X-RAY ANALYSIS API (AI Powered)
# ============================================================
@app.route('/api/crypto/xray/asset/<symbol>')
def api_xray_asset(symbol):
    """Specific Asset AI X-Ray Analysis using MarketDataService (Binance -> CMC)"""
    from news_service import news_service
    from market_provider import market_data_service
    from ai_service import ai_service
    
    symbol = symbol.upper()
    
    try:
        # 2. Fetch Market Data (Binance -> CMC Fallback)
        data = market_data_service.get_asset_data(symbol)
        
        # 3. Fetch News with Full Name context (Fixed Order: Data first to get Name)
        asset_name = data.get('name')
        news_list = news_service.get_crypto_news(symbol, name=asset_name)

        data_summary = {
            "Symbol": data['symbol'],
            "Name": asset_name, # Pass name to AI too
            "Currency": data.get('currency', 'USD'), # Explicit Currency Context
            "Source": data['source'],
            "Current Price": f"${data['current_price']:,.4f}" if data['current_price'] < 1 else f"${data['current_price']:,.2f}",
            "Change 24h": f"{data['change_24h']:.2f}%",
            "MA20": f"${data['ma_20']:,.2f}",
            "Trend": data['trend'],
            "Volume Status": data['volume_status']
        }
        
        # 3. Call AI with News
        result = ai_service.analyze_asset(symbol, data_summary, news_list)
        return jsonify(result)
        
    except Exception as e:
        from ai_service import ai_service
        print(f"Asset X-Ray Error ({symbol}): {e}")
        
        error_msg = str(e)
        user_msg = None
        
        if "Symbol" in error_msg and "not found" in error_msg:
             user_msg = f"⚠️ 바이낸스 및 CMC에서 '{symbol}'을 찾을 수 없습니다. CMC API 키를 확인해주세요."
        else:
             user_msg = f"⚠️ 데이터 조회 중 오류가 발생했습니다: {error_msg}"
             
        return jsonify(ai_service._get_mock_asset_analysis(symbol, user_msg))


@app.route('/api/crypto/xray/global')
def api_xray_global():
    """Global Market AI X-Ray Analysis using Binance API (Requests) + News"""
    try:
        import requests
        import concurrent.futures
        from news_service import news_service
        from ai_service import ai_service
        from market_provider import market_data_service

        # Parallel Fetching of Data Inputs
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            future_news = executor.submit(news_service.get_crypto_news, "Bitcoin")
            future_metrics = executor.submit(market_data_service.get_global_metrics)
            future_btc = executor.submit(market_data_service.get_asset_data, "BTC")
            future_eth = executor.submit(market_data_service.get_asset_data, "ETH")
            
            # Safe Result Retrieval
            try: news_list = future_news.result(timeout=10)
            except: news_list = []
            
            try: global_metrics = future_metrics.result(timeout=10)
            except: global_metrics = {"total_market_cap": 0, "total_volume_24h": 0, "btc_dominance": 0, "eth_dominance": 0, "market_cap_change_24h": 0}

            try: btc_data = future_btc.result(timeout=5)
            except: btc_data = {'current_price': 0, 'currency': 'USD'}

            try: eth_data = future_eth.result(timeout=5)
            except: eth_data = {'current_price': 0, 'currency': 'USD'}

        data_summary = {
            "Total Market Cap": f"${global_metrics.get('total_market_cap', 0):,.0f}",
            "24h Volume": f"${global_metrics.get('total_volume_24h', 0):,.0f}",
            "BTC Dominance": f"{global_metrics.get('btc_dominance', 0):.1f}%",
            "ETH Dominance": f"{global_metrics.get('eth_dominance', 0):.1f}%",
            "BTC Price": f"${btc_data.get('current_price', 0):,.0f} ({btc_data.get('currency', 'USD')})",
            "ETH Price": f"${eth_data.get('current_price', 0):,.0f} ({eth_data.get('currency', 'USD')})",
            "Market Cap Change": f"{global_metrics.get('market_cap_change_24h', 0):.2f}%"
        }
        
        # 3. Call AI with News (This is the slowest part, but data fetch is now fast)
        result = ai_service.analyze_global_market(data_summary, news_list)
        return jsonify(result)
        
    except Exception as e:
        print(f"Global X-Ray Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/crypto/listings')
@cache.cached(timeout=300)  # Cache for 5 minutes
def api_crypto_listings():
    """Fetch Top Crypto Listings (CMC or Binance Fallback) - Cached 5min"""
    from market_provider import market_data_service
    
    try:
        limit = request.args.get('limit', default=30, type=int)
        data = market_data_service.get_crypto_listings(limit=limit)
        print(f"📦 [Cache MISS] Fetched {len(data.get('data', []))} listings from API")
        return jsonify(data)
    except Exception as e:
        print(f"Listings API Error: {e}")
        return jsonify({'error': str(e)}), 500
@app.route('/api/kimchi/upbit')
def api_kimchi_upbit():
    """Fetch Kimchi Premium Data (Upbit vs Binance)"""
    import requests
    try:
        # 1. Exchange Rate (USD -> KRW)
        # Using a free public API for exchange rates
        try:
            er_res = requests.get("https://api.exchangerate-api.com/v4/latest/USD", timeout=3)
            er_data = er_res.json()
            usd_krw = float(er_data['rates']['KRW'])
        except:
            usd_krw = 1450.0 # Fallback if API fails
            print("⚠️ Exchange Rate API failed, using fallback 1450.0")

        # 2. Upbit Price (KRW)
        upbit_res = requests.get("https://api.upbit.com/v1/ticker?markets=KRW-BTC", timeout=3)
        upbit_data = upbit_res.json()
        btc_krw = float(upbit_data[0]['trade_price'])

        # 3. Binance Price (USD)
        binance_res = requests.get("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", timeout=3)
        binance_data = binance_res.json()
        btc_usd = float(binance_data['price'])

        # 4. Calculate Premium
        # Global Price converted to KRW
        global_krw = btc_usd * usd_krw
        premium = ((btc_krw - global_krw) / global_krw) * 100

        return jsonify({
            'btc_krw': btc_krw,
            'btc_usd': btc_usd,
            'exchange_rate': usd_krw,
            'kimchi_premium': round(premium, 2),
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        print(f"Kimchi Premium Error: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================
# CALENDAR SYNC API
# ============================================================
@app.route('/api/calendar/sync', methods=['POST'])
def sync_calendar():
    """
    Sync Investing.com economic calendar to Supabase.
    Recommend calling this once per day via Scheduler or Cron.
    """
    # Simply check API Key like ingest
    msg_api_key = request.headers.get('X-API-KEY')
    server_api_key = os.getenv('EXTERNAL_API_KEY')
    
    if not server_api_key or msg_api_key != server_api_key:
        return jsonify({'error': 'Unauthorized'}), 401

    if not supabase:
        return jsonify({'error': 'Supabase not configured'}), 500

    try:
        # 1. Fetch from Investing.com (Korea)
        events = fetch_investing_calendar()
        
        if not events:
            return jsonify({'message': 'No events found or crawl failed', 'count': 0}), 200

        # 2. Save to Supabase
        # Strategy: Delete today's events first to avoid duplicates, then insert.
        today_date = events[0]['event_date']
        
        # Delete existing events for this date
        supabase.table('calendar_events').delete().eq('event_date', today_date).execute()
        
        # Insert new events
        res = supabase.table('calendar_events').insert(events).execute()
        
        return jsonify({
            'success': True,
            'message': f'Synced {len(events)} events for {today_date}',
            'data': res.data
        })

    except Exception as e:
        print(f"Calendar Sync Error: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# MAIN
# ============================================================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    # Check Critical Keys
    cmc_key = os.getenv('COINMARKETCAP_API_KEY')
    print(f"🔑 CMC Key Present: {'Yes' if cmc_key else 'No (Metrics/Dominance will be 0)'}")
    
    print(f"🚀 TokenPost PRO API starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=debug)
# Force Redeploy: Wed Jan 14 00:10:51 KST 2026
