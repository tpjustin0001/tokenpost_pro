import sys
import os

# Add flask-backend to path
sys.path.append(os.path.join(os.getcwd(), 'flask-backend'))

import pandas as pd
from crypto_market.indicators import rsi, relative_volume

# Mock Data
data = {
    'Close': [100, 102, 104, 103, 105, 108, 110, 115, 120, 118, 122, 125, 130, 135, 140, 138, 142, 145, 150, 155],
    'Volume': [1000] * 20
}
df = pd.DataFrame(data)

# Test RSI
rsi_val = rsi(df['Close'], 14).iloc[-1]
print(f"RSI (expected ~70+): {rsi_val:.2f}")

# Test RVol
rvol = relative_volume(df['Volume'], 20)
print(f"RVol (expected 1.0): {rvol:.2f}")

# Test Insight Logic
is_fresh_breakout = True
rvol_mock = 1.6
insight = "Neutral"
if is_fresh_breakout and rvol_mock > 1.5:
    insight = "🔥 Golden Cross (Strong Buy)"
print(f"Insight Test: {insight}")
