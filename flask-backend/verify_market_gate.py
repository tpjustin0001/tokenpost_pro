import sys
import os
import pandas as pd

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from crypto_market.market_gate import run_market_gate_sync
from market_provider import MarketDataService

def verify_market_gate():
    print("🔍 Diagnostic: Running Market Gate Logic...")
    
    try:
        # 1. Fetch Data manually to ensure we have it
        service = MarketDataService()
        btc_data = service.get_asset_data("BTC")
        print(f"✅ Data Fetched: BTC Price ${btc_data['current_price']:,}")
        
        # 2. Run Gate Logic
        print("🚀 Executing run_market_gate_sync()...")
        result = run_market_gate_sync()
        
        print("\n" + "="*50)
        print(f"🏁 FINAL SCORE: {result.score}")
        print(f"🚦 GATE COLOR:  {result.gate}")
        print(f"❓ REASONS:     {result.reasons}")
        print("="*50)
        print("📊 COMPONENTS:")
        for k, v in result.components.items():
            print(f"  - {k}: {v}")
            
        print("\n📈 METRICS:")
        for k, v in result.metrics.items():
            print(f"  - {k}: {v}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_market_gate()
