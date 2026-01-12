import sys
import os
sys.path.insert(0, os.path.abspath('flask-backend'))

import traceback

try:
    from crypto_market.market_gate import run_market_gate_sync
    print("Import successful")
    result = run_market_gate_sync()
    print("Result:", result)
except Exception:
    traceback.print_exc()
