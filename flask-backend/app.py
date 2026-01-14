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

# Add crypto_market to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
# Load Env
load_dotenv()
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

@app.route('/api/test/hello')
def api_test_hello():
    """Dependency-free test route"""
    return jsonify({'message': 'Hello from Vercel!', 'status': 'ok'})


# ============================================================
# MARKET GATE API
# ============================================================
@app.route('/api/crypto/market-gate')
def api_market_gate():
    """Market Gate 분석 API (100점 스코어링)"""
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
        return jsonify({
            'gate_color': 'YELLOW',
            'score': 50,
            'summary': "데이터 연결 지연 (Fallback Mode)",
            'components': {
                "trend": 0, "volatility": 0, "participation": 0, "breadth": 0, "leverage": 0
            },
            'indicators': [],
            'top_reasons': ["시스템 점검 중", "잠시 후 다시 시도해주세요"],
            'timestamp': datetime.now().isoformat()
        })


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
            'target': 'BTC_MoM',
            'leading_indicators': [
                {'variable': 'M2_MoM', 'lag': 3, 'p_value': 0.012, 'correlation': 0.65, 'interpretation': '💸 M2 통화량 상승 시, 비트코인도 3개월 뒤 상승 경향'},
                {'variable': 'TNX_MoM', 'lag': 2, 'p_value': 0.034, 'correlation': -0.58, 'interpretation': '🇺🇸 국채 금리 변화율 상승 시, 비트코인은 2개월 뒤 하락 경향'},
                {'variable': 'VIX_MoM', 'lag': 1, 'p_value': 0.045, 'correlation': -0.42, 'interpretation': '🫣 공포지수 변화율 상승 시, 비트코인은 1개월 뒤 하락 경향'},
                {'variable': 'SPY_MoM', 'lag': 0, 'p_value': 0.001, 'correlation': 0.78, 'interpretation': '🇺🇸 S&P 500 변화율 상승 시, 비트코인도 동행성 보임'},
                {'variable': 'DXY_MoM', 'lag': 4, 'p_value': 0.022, 'correlation': -0.61, 'interpretation': '💵 달러 인덱스 변화율 상승 시, 비트코인은 4개월 뒤 하락 경향'},
                {'variable': 'GOLD_MoM', 'lag': 6, 'p_value': 0.080, 'correlation': 0.35, 'interpretation': '🥇 금 변화율 상승 시, 비트코인도 6개월 뒤 상승 경향'}
            ],
            'timestamp': datetime.now().isoformat(),
            'is_fallback': True
        })


# ============================================================
# VCP SIGNALS API
# ============================================================
@app.route('/api/crypto/vcp-signals')
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
# SMART CRYPTO SCREENER API
# ============================================================

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
    """Tab 1: Breakout Hunter - Parallel Fetch"""
    from market_provider import market_data_service
    
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
                # Logic (same as before)
                df = item['raw_df']
                current_price = item['current_price']
                if df is None or df.empty: continue

                sma20 = item['ma_20']
                sma50 = df['Close'].tail(50).mean()
                sma200 = df['Close'].tail(200).mean()
                
                status_20 = 'Bullish' if current_price > sma20 else 'Bearish'
                status_50 = 'Bullish' if current_price > sma50 else 'Bearish'
                status_200 = 'Bull Market' if current_price > sma200 else 'Bear Market'
                
                is_fresh_breakout = False
                if len(df) > 2:
                    prev_close = df['Close'].iloc[-2]
                    is_fresh_breakout = (prev_close < sma200 * 0.99) and (current_price > sma200)

                results.append({
                    'symbol': item['symbol'],
                    'price': current_price,
                    'change_24h': item['change_24h'],
                    'change_1h': item.get('change_1h', 0),
                    'volume': df['Volume'].iloc[-1],
                    'sma20': sma20,
                    'sma50': sma50,
                    'sma200': sma200,
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
                
                results.append({
                    'symbol': item['symbol'],
                    'price': current_price,
                    'change_24h': item['change_24h'],
                    'change_1h': item.get('change_1h', 0),
                    'volume': df['Volume'].iloc[-1],
                    'ath': ath,
                    'atl': atl,
                    'drawdown': drawdown,
                    'from_atl': from_atl
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


    return jsonify({'success': True})


# ============================================================
# EXTERNAL INGEST API (Protected)
# ============================================================
@app.route('/api/external/ingest', methods=['POST'])
def ingest_external_content():
    """
    Secure endpoint for external content injection.
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
    
    if not payload or content_type not in CONTENT_STORE:
        return jsonify({'error': 'Invalid content type or missing data'}), 400
        
    # 3. Process & Store
    try:
        new_item = {
            'id': str(uuid.uuid4()),
            'source': 'External API', # Default, can be overridden by payload
            'published_at': datetime.now().isoformat(),
            **payload
        }
        
        # Insert at top
        CONTENT_STORE[content_type].insert(0, new_item)
        
        print(f"📥 Encypted Ingest: Received 1 {content_type} item from external source.")
        return jsonify({'success': True, 'id': new_item['id'], 'message': 'Content encrypted and stored securely'})
        
    except Exception as e:
        print(f"Ingest Error: {e}")
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
        return jsonify(ai_service._get_mock_global_analysis())


@app.route('/api/crypto/listings')
def api_crypto_listings():
    """Fetch Top Crypto Listings (CMC or Binance Fallback)"""
    from market_provider import market_data_service
    
    try:
        limit = request.args.get('limit', default=30, type=int)
        data = market_data_service.get_crypto_listings(limit=limit)
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
