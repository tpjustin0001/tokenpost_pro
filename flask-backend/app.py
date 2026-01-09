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
# VCP SIGNALS API (Mock for now)
# ============================================================
@app.route('/api/crypto/vcp-signals')
def api_vcp_signals():
    """VCP 시그널 목록 API"""
    # TODO: Implement actual VCP scanning
    mock_signals = [
        {'symbol': 'SOL', 'grade': 'A', 'score': 85, 'signal_type': 'BREAKOUT'},
        {'symbol': 'AVAX', 'grade': 'A', 'score': 78, 'signal_type': 'APPROACHING'},
        {'symbol': 'LINK', 'grade': 'B', 'score': 72, 'signal_type': 'RETEST_OK'},
        {'symbol': 'SUI', 'grade': 'B', 'score': 68, 'signal_type': 'BREAKOUT'},
        {'symbol': 'XRP', 'grade': 'C', 'score': 55, 'signal_type': 'APPROACHING'},
    ]
    
    return jsonify({
        'signals': mock_signals,
        'count': len(mock_signals),
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
