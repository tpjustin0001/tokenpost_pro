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
import traceback

# Force UTF-8 encoding for Windows console (Safe Wrap)
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from services.calendar_service import fetch_investing_calendar

# Add crypto_market to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
# Load Env
load_dotenv()

# Support for local development with .env.local in root
if not os.environ.get('RAILWAY_ENVIRONMENT'):
    env_local_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
    if os.path.exists(env_local_path):
        print(f"Loading .env.local from: {env_local_path}")
        load_dotenv(env_local_path)

print("----------------------------------------------------------------")
print(f"[DEBUG] APP STARTING...")
print(f"[DEBUG] ENV PORT: {os.environ.get('PORT')}")
print(f"[DEBUG] CWD: {os.getcwd()}")

def debug_env_var(name):
    val = os.environ.get(name)
    if not val:
        print(f"[ERROR] {name}: NOT SET")
    else:
        # Mask: first 4 ... last 4
        masked = val[:4] + "*" * 6 + val[-4:] if len(val) > 8 else "********"
        print(f"[OK] {name}: {masked}")

print("--- ENV VAR CHECK ---")
debug_env_var("COINMARKETCAP_API_KEY")
debug_env_var("EXTERNAL_API_KEY")
debug_env_var("OPENAI_API_KEY")
debug_env_var("XAI_API_KEY")
debug_env_var("SUPABASE_URL")
print("----------------------------------------------------------------")
CORS(app)

# Supabase Client
from supabase import create_client, Client
supabase: Client = None
if os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_KEY"):
    try:
        supabase = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))
        print("[OK] Supabase Client Initialized in App")
    except Exception as e:
        print(f"[ERROR] Failed to init Supabase in App: {e}")

# Cache Config
import concurrent.futures

try:
    from flask_caching import Cache
    cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})
    print("[OK] Flask-Caching loaded successfully.")
except ImportError:
    print("[WARN] Flask-Caching module not found. Caching disabled.")
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
        print("[OK] Scheduler Service initialized.")
    except Exception as e:
        print(f"[WARN] Scheduler failed to start: {e}")

# DEBUG: Version Check
API_VERSION = "1.0.2-fix-gitignore-env"
print(f"[START] Starting TokenPost PRO API - Version: {API_VERSION}")

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

# app.wsgi_app = VercelMiddleware(app.wsgi_app)

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
    print(traceback.format_exc()) # Log to Vercel Console
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

@app.route('/api/admin/trigger-screener', methods=['POST'], strict_slashes=False)
def trigger_screener():
    """Manual trigger for screener job"""
    try:
        from scheduler_service import scheduler_service
        # Run in thread pool to avoid blocking response too long
        # But for manual trigger, waiting a bit is fine or returning accepted.
        # Let's run synchronously to see result or return Accepted.
        # Re-using internal method
        scheduler_service.run_screeners()
        return jsonify({"success": True, "message": "Screener scan triggered and saved"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/admin/trigger-vcp', methods=['POST'], strict_slashes=False)
def trigger_vcp():
    """Manual trigger for VCP scan job"""
    try:
        from scheduler_service import scheduler_service
        # Run synchronous for immediate feedback
        scheduler_service.run_vcp_scan()
        return jsonify({"success": True, "message": "VCP Scan triggered and completed"})
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
    return jsonify({'message': 'MODIFIED_VERIFIED', 'status': 'ok'})

@app.route('/api/pingtest')
def api_pingtest():
    """Test Route Refactored"""
    return jsonify({"status": "ok"}), 200

@app.route('/api/prices/performance')
@cache.cached(timeout=60, query_string=True)  # 60초 캐시, exchange 파라미터별 개별 캐시
def api_price_performance():
    """
    Get Price Performance (DB First, then Live Fallback)
    Cached for 60 seconds to prevent API overload
    """
    exchange = request.args.get('exchange', 'upbit')
    limit = request.args.get('limit', default=20, type=int)
    
    # 1. Try DB First (Fast Path)
    try:
        if supabase:
            res = supabase.table('analysis_results') \
                .select('data_json, created_at') \
                .eq('analysis_type', f'PERFORMANCE_{exchange.upper()}') \
                .order('created_at', desc=True) \
                .limit(1) \
                .execute()
            
            if res.data and len(res.data) > 0:
                data = res.data[0]['data_json']
                # Ensure proper format for frontend
                return jsonify({'data': data, 'source': 'db', 'cached_at': res.data[0].get('created_at')})
    except Exception as e:
        print(f"[PERF] DB Cache Miss/Error: {e}")

    # 2. Live Fallback (Slow Path - only if DB empty)
    try:
        from market_provider import market_data_service
        data = market_data_service.get_exchange_performance(exchange, limit=limit)
        
        # Save to DB for next request (insert, not upsert to avoid on_conflict issue)
        try:
            if supabase and data:
                supabase.table('analysis_results').insert({
                    'analysis_type': f'PERFORMANCE_{exchange.upper()}',
                    'data_json': data,
                }).execute()
        except Exception as save_err:
            print(f"[PERF] DB Save Error (ignored): {save_err}")

        return jsonify({'data': data, 'source': 'live'})
    except Exception as e:
        print(f"[PERF] Live Fallback Error: {e}")
        return jsonify({'error': str(e), 'data': []}), 500

# ============================================================
# SIMPLE ASSET DATA API (for Market Gate cards)
# ============================================================
@app.route('/api/crypto/asset/<symbol>')
@cache.cached(timeout=10)  # Cache for 10 seconds for real-time
def api_crypto_asset(symbol):
    """Simple asset data for individual coin cards"""
    symbol = symbol.upper()
    
    try:
        print(f"[DEBUG] Importing market_provider for {symbol}...")
        from market_provider import market_data_service
        print(f"[DEBUG] market_provider imported. Fetching data...")
        
        # Prefer KRW source (Upbit) for market pulse / single asset view
        data = market_data_service.get_asset_data(symbol, prefer_krw=True)
        
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
        print(f"[ERROR] Failed to fetch data for {symbol}: {e}")
        traceback.print_exc()
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
@cache.cached(timeout=30) # Short cache, DB is source of truth
def api_market_gate():
    """Market Gate - Fetch from DB"""
    try:
        if not supabase:
            return jsonify({'error': 'Database not connected'}), 503

        # Fetch latest
        response = supabase.table('market_gate').select('*').order('created_at', desc=True).limit(1).execute()
        
        if not response.data:
            return jsonify({'gate_color': 'GRAY', 'score': 0, 'summary': 'No data available', 'timestamp': datetime.now().isoformat()})
            
        latest = response.data[0]
        
        # Parse metrics_json if it's a string (though supabase-py usually returns dict for json columns)
        metrics = latest.get('metrics_json', {})
        if isinstance(metrics, str):
            import json
            metrics = json.loads(metrics)

        # Construct Indicators List for Frontend
        indicators = []
        # We can reconstruct indicators from metrics if needed, or store them.
        # For now, let's map the essential ones that the frontend expects.
        # Front expects: "indicators": [{name, value, signal}]
        # We might need to quickly re-evaluate signal from value, or store signal in DB.
        # Storing signal in DB would be better, but we only stored metrics map.
        # Let's re-evaluate signal here (cheap).
        
        def get_signal(name, val):
            if val is None: return 'Neutral'
            if name == 'btc_ema200_slope_pct_20': return 'Bullish' if val > 1 else ('Bearish' if val < -1 else 'Neutral')
            if name == 'fear_greed_index': return 'Bullish' if val > 50 else ('Bearish' if val < 30 else 'Neutral')
            if name == 'funding_rate': return 'Bullish' if -0.0003 < val < 0.0005 else 'Bearish'
            if name == 'alt_breadth_above_ema50': return 'Bullish' if val > 0.5 else ('Bearish' if val < 0.35 else 'Neutral')
            return 'Neutral'

        for k, v in metrics.items():
            if k == 'gate_score_components': continue
            indicators.append({'name': k, 'value': v, 'signal': get_signal(k, v)})

        return jsonify({
            'gate_color': latest['gate_color'],
            'score': latest['score'],
            'summary': latest['summary'],
            'components': metrics.get('gate_score_components', {}),
            'indicators': indicators,
            'top_reasons': latest.get('summary', '').split(', '), # simplistic
            'timestamp': latest['created_at']
        })

    except Exception as e:
        print(f"Market Gate API Error: {e}")
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
@cache.cached(timeout=30)
def api_vcp_signals():
    """VCP 패턴 감지 API - DB Read"""
    try:
        if not supabase: return jsonify({'error': 'DB Error'}), 503
        
        response = supabase.table('analysis_results').select('data_json, created_at').eq('analysis_type', 'VCP').order('created_at', desc=True).limit(1).execute()
        
        if response.data:
            import json
            data = response.data[0]['data_json']
            if isinstance(data, str): data = json.loads(data)
            return jsonify({'signals': data, 'count': len(data), 'timestamp': response.data[0]['created_at']})
            
        return jsonify({'signals': [], 'count': 0, 'timestamp': datetime.now().isoformat()})
        
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
        
        # Get last 7 days of data (max 1008 rows) 
        # Filter out anomalous spikes > 500k (e.g. bad data)
        response = supabase.table('eth_staking_metrics').select(
            'entry_queue, exit_queue, entry_wait_seconds, exit_wait_seconds, created_at'
        ).lt('entry_queue', 500000).order('created_at', desc=True).limit(1008).execute()
        
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
@cache.cached(timeout=30)
def api_screener_breakout():
    """Tab 1: Breakout Scanner - DB Read"""
    try:
        if not supabase: return jsonify({'data': [], 'count': 0}), 200
        
        res = supabase.table('analysis_results').select('data_json').eq('analysis_type', 'SCREENER_BREAKOUT').order('created_at', desc=True).limit(1).execute()
        if res.data:
            import json
            d = res.data[0]['data_json']
            if isinstance(d, str): d = json.loads(d)
            return jsonify({'data': d, 'count': len(d)})
        return jsonify({'data': [], 'count': 0})
    except Exception as e:
         return jsonify({'error': str(e)}), 500

@app.route('/api/screener/price-performance')
@cache.cached(timeout=30)
def api_screener_real():
    """Tab 2: Price Performance - DB Read"""
    try:
        if not supabase: return jsonify({'data': [], 'count': 0}), 200
        
        res = supabase.table('analysis_results').select('data_json').eq('analysis_type', 'SCREENER_PERFORMANCE').order('created_at', desc=True).limit(1).execute()
        if res.data:
            import json
            d = res.data[0]['data_json']
            if isinstance(d, str): d = json.loads(d)
            return jsonify({'data': d, 'count': len(d)})
        return jsonify({'data': [], 'count': 0})
    except Exception as e:
         return jsonify({'error': str(e)}), 500

@app.route('/api/screener/risk')
@cache.cached(timeout=30)
def api_screener_risk():
    """Tab 3: Risk Scanner - DB Read"""
    try:
        if not supabase: return jsonify({'data': [], 'count': 0}), 200
        
        res = supabase.table('analysis_results').select('data_json').eq('analysis_type', 'SCREENER_RISK').order('created_at', desc=True).limit(1).execute()
        if res.data:
            import json
            d = res.data[0]['data_json']
            if isinstance(d, str): d = json.loads(d)
            return jsonify({'data': d, 'count': len(d)})
        return jsonify({'data': [], 'count': 0})
    except Exception as e:
         return jsonify({'error': str(e)}), 500


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
        print("[OK] Supabase Client initialized.")
    except Exception as e:
        print(f"[WARN] Failed to initialize Supabase: {e}")


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
        
    except ValueError as ve:
        # 심볼을 찾을 수 없는 경우 (MarketDataService에서 ValueError 발생)
        print(f"Asset Not Found ({symbol}): {ve}")
        return jsonify({"error": "Asset not found", "details": str(ve)}), 404

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Asset X-Ray Error ({symbol}): {e}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


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
        
        # 4. Save to Supabase for Mindshare component
        if supabase and result and result.get('grok_saying'):
            try:
                # Mark previous as not latest
                supabase.table('global_market_snapshots').update({'is_latest': False}).eq('is_latest', True).execute()
                # Insert new
                supabase.table('global_market_snapshots').insert({
                    'data': result,
                    'model_used': 'grok-4.1-fast (x_search)',
                    'is_latest': True
                }).execute()
                print("AI Analysis saved to Supabase")
            except Exception as db_err:
                print(f"⚠️ Supabase save failed: {db_err}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Global X-Ray Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/crypto/xray/deep', methods=['GET'])
def api_xray_deep():
    """
    GPT-4o Deep Analysis Endpoint (for GlobalXRay modal)
    """
    try:
        from market_provider import market_data_service
        from ai_service import ai_service
        import concurrent.futures
        
        # Reuse logic to gather market data (Simplified)
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future_global = executor.submit(market_data_service.get_global_metrics)
            future_btc = executor.submit(market_data_service.get_asset_data, 'BTC')
            future_eth = executor.submit(market_data_service.get_asset_data, 'ETH')
            
            # Safe retrieval with timeouts
            try: global_metrics = future_global.result(timeout=5) or {}
            except: global_metrics = {}

            try: btc_data = future_btc.result(timeout=5)
            except: btc_data = {'current_price': 0}

            try: eth_data = future_eth.result(timeout=5)
            except: eth_data = {'current_price': 0}

        data_summary = {
            "Total Market Cap": f"${global_metrics.get('total_market_cap', 0):,.0f}",
            "BTC Dominance": f"{global_metrics.get('btc_dominance', 0):.1f}%",
            "BTC Price": f"${btc_data.get('current_price', 0):,.0f}",
            "ETH Price": f"${eth_data.get('current_price', 0):,.0f}",
            "Market Cap Change": f"{global_metrics.get('market_cap_change_24h', 0):.2f}%"
        }

        # Call GPT-4o
        result = ai_service.analyze_global_deep_market(data_summary)

        if not result:
            return jsonify({"error": "Failed to generate deep analysis"}), 500

        # Save to Supabase (global_deep_analysis table)
        if supabase:
            try:
                supabase.table('global_deep_analysis').update({'is_latest': False}).eq('is_latest', True).execute()
                supabase.table('global_deep_analysis').insert({
                    'data': result,
                    'model_used': 'gpt-4o',
                    'is_latest': True
                }).execute()
                print("Deep Analysis saved to Supabase (global_deep_analysis)")
            except Exception as db_err:
                print(f"⚠️ Supabase save failed: {db_err}")

        return jsonify(result)

    except Exception as e:
        print(f"Deep X-Ray Error: {e}")
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
@app.route('/api/test/market/<symbol>', methods=['GET'])
def test_market_fetch(symbol):
    """
    Directly test market data fetching for a symbol.
    Returns verbose details about success/failure.
    """
    import traceback
    result = {
        "target": symbol,
        "status": "unknown",
        "data": None,
        "error": None,
        "traceback": None
    }
    
    try:
        from market_provider import market_data_service
        data = market_data_service.get_asset_data(symbol.upper())
        result["status"] = "success"
        
        # Simplify data for response
        if 'raw_df' in data:
            del data['raw_df'] # Cannot serialize DF
            
        result["data"] = data
        return jsonify(result), 200
        
    except Exception as e:
        result["status"] = "failed"
        result["error"] = str(e)
        result["traceback"] = traceback.format_exc()
        return jsonify(result), 500


if __name__ == '__main__':
    # Deployment Safety: Use provided PORT or default to 5002
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development' or os.environ.get('FLASK_DEBUG') == '1'
    print(f"[START] TokenPost PRO API starting on port {port}...")
    
    # DEBUG: Print all registered routes
    with app.app_context():
        print(app.url_map)
        
    app.run(host='0.0.0.0', port=port, debug=debug)

# ============================================================
# START SCHEDULER (Gunicorn/Prod)
# ============================================================
# This ensures the scheduler runs when hosted via Gunicorn
# "WERKZEUG_RUN_MAIN" check avoids double-start in local dev reloader
if not os.environ.get("WERKZEUG_RUN_MAIN") or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    try:
        from scheduler_service import scheduler_service
        # Start scheduler if not already running (Internal check in service)
        print("⏰ Starting Scheduler from app.py...")
        scheduler_service.start()
    except Exception as e:
        print(f"❌ Failed to start Scheduler in app.py: {e}")

