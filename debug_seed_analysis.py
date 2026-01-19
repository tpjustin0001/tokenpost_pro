
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load env
try:
    with open('.env.local', 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            if '=' in line:
                k, v = line.split('=', 1)
                os.environ[k] = v.strip('"').strip("'")
except Exception as e:
    print(f"⚠️ Failed to load .env.local: {e}")

# Add flask-backend to path
sys.path.append(os.path.join(os.getcwd(), 'flask-backend'))

from supabase import create_client
from crypto_market.market_gate import run_market_gate_sync
from crypto_market.patterns.vcp import find_vcp_candidates
from crypto_market.screener import screener_service
from market_provider import market_data_service

def seed_analysis():
    print("🚀 Starting Analysis Seeder...")
    
    # 1. Init Supabase
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("❌ Missing Supabase Credentials")
        return

    supabase = create_client(url, key)
    print("✅ Supabase Connected")

    # 2. Market Gate
    try:
        print("🚦 Running Market Gate...")
        result = run_market_gate_sync()
        data = {}
        if hasattr(result, 'gate'):
            from dataclasses import asdict
            data = asdict(result)
            data['gate_color'] = data['gate']
            data['summary'] = ", ".join(data['reasons'])
        elif isinstance(result, dict):
            data = result
        
        if data:
            supabase.table('market_gate').insert({
                'gate_color': data.get('gate_color'),
                'score': data.get('score'),
                'summary': data.get('summary'),
                'metrics_json': data.get('metrics'),
                'created_at': datetime.now().isoformat()
            }).execute()
            print("✅ Market Gate Saved")
    except Exception as e:
        print(f"❌ Market Gate Failed: {e}")

    # 3. VCP Scan
    try:
        print("📉 Running VCP Scan...")
        listings = market_data_service.get_crypto_listings(limit=50)
        symbols = [item['symbol'] for item in listings]
        candidates = find_vcp_candidates(symbols)
        
        if candidates:
            # Clean floats (NaN/Inf) - simpler fix
            import math
            def clean_floats(obj):
                if isinstance(obj, float):
                    if math.isnan(obj) or math.isinf(obj): return 0
                    return obj
                if isinstance(obj, dict):
                    return {k: clean_floats(v) for k, v in obj.items()}
                if isinstance(obj, list):
                    return [clean_floats(i) for i in obj]
                return obj
                
            candidates = clean_floats(candidates)

            supabase.table('analysis_results').insert({
                'analysis_type': 'VCP',
                'data_json': candidates, 
                'created_at': datetime.now().isoformat()
            }).execute()
            print(f"✅ VCP Scan Saved: {len(candidates)} items")
    except Exception as e:
        print(f"❌ VCP Scan Failed: {e}")

    # 4. Screeners
    try:
        print("🔍 Running Screeners...")
        
        # Breakout
        breakout = screener_service.run_breakout_scan()
        if breakout:
            supabase.table('analysis_results').insert({
                'analysis_type': 'SCREENER_BREAKOUT',
                'data_json': breakout,
                'created_at': datetime.now().isoformat()
            }).execute()
            print("✅ Breakout Screener Saved")

        # Performance
        perf = screener_service.run_price_performance_scan()
        if perf:
            supabase.table('analysis_results').insert({
                'analysis_type': 'SCREENER_PERFORMANCE',
                'data_json': perf,
                'created_at': datetime.now().isoformat()
            }).execute()
            print("✅ Performance Screener Saved")

        # Risk
        risk = screener_service.run_risk_scan()
        if risk:
            supabase.table('analysis_results').insert({
                'analysis_type': 'SCREENER_RISK',
                'data_json': risk,
                'created_at': datetime.now().isoformat()
            }).execute()
            print("✅ Risk Screener Saved")

    except Exception as e:
        print(f"❌ Screeners Failed: {e}")

if __name__ == "__main__":
    seed_analysis()
