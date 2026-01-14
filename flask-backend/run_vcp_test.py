
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from crypto_market.patterns.vcp import find_vcp_candidates

print("🚀 Starting VCP Logic Test (using CCXT)...")

# Test Symbols (Top Liquid)
symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD']

try:
    results = find_vcp_candidates(symbols)
    print(f"\n✅ Scan Completed. Found {len(results)} candidates.")
    
    for r in results:
        print(f" - {r['symbol']}: Score {r['score']}, Grade {r['grade']}, Signal: {r['signal_type']}")
        
    if not results:
        print("ℹ️ No VCP patterns candidates found in this small sample (expected behavior if market is choppy).")
        
except Exception as e:
    print(f"❌ Test Failed: {e}")
    import traceback
    traceback.print_exc()
