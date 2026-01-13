
import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime

def find_vcp_candidates(symbols):
    """
    Scans list of symbols for VCP (Volatility Contraction Pattern) characteristics.
    """
    candidates = []
    
    # Bulk download for speed if list is long, but for robustness iteration is safer here
    # Use yfinance data
    
    for symbol in symbols:
        try:
            # Fetch data (daily) - 1 year needed for SMA 200, but analysis is recent
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="1y")
            
            if hist.empty or len(hist) < 200:
                continue
                
            close = hist['Close']
            high = hist['High']
            
            current_price = close.iloc[-1]
            
            # --- Condition 1: Long-term Trend (Mark Minervini Template) ---
            sma50 = close.rolling(window=50).mean().iloc[-1]
            sma150 = close.rolling(window=150).mean().iloc[-1]
            sma200 = close.rolling(window=200).mean().iloc[-1]
            
            # 1. Price > SMA 150 & SMA 200
            if not (current_price > sma150 and current_price > sma200):
                continue
                
            # 2. SMA 150 > SMA 200
            if not (sma150 > sma200):
                continue
                
            # 3. SMA 200 Trending up (current > 1 month ago)
            sma200_1m_ago = close.rolling(window=200).mean().iloc[-30]
            if not (sma200 > sma200_1m_ago):
                continue
                
            # 4. Price > SMA 50 (Strong Momentum)
            if not (current_price > sma50):
                continue
                
            # 5. Price > 25% above 52-week low
            low_52w = close.min()
            if not (current_price > low_52w * 1.25):
                continue
                
            # 6. Price within 25% of 52-week high (Consolidating near highs)
            high_52w = close.max()
            if not (current_price > high_52w * 0.75):
                continue
                
            # --- Condition 2: Volatility Contraction (Simplified VCP Check) ---
            # Check for declining volatility in the last 30 days vs previous 30 days
            vol_recent = close.tail(10).std()
            vol_prev = close.iloc[-20:-10].std()
            
            vol_contracting = vol_recent < vol_prev
            
            # --- Condition 3: Pivot Point (Volume Dry Up) ---
            # Volume in last 5 days should be below average volume
            avg_vol_20 = hist['Volume'].tail(20).mean()
            recent_vol_3 = hist['Volume'].tail(3).mean()
            
            vol_dry_up = recent_vol_3 < avg_vol_20
            
            if vol_contracting:
                candidates.append({
                    'symbol': symbol.replace('-USD', ''),
                    'score': 95 if vol_dry_up else 85,
                    'grade': 'A' if vol_dry_up else 'B',
                    'price': current_price,
                    'signal_type': 'VCP Breakout Ready' if current_price > sma50 else 'VCP Setup Forming'
                })
                
        except Exception as e:
            # print(f"Error checking {symbol}: {e}")
            continue
            
    # Sort by Score
    candidates.sort(key=lambda x: x['score'], reverse=True)
    return candidates
