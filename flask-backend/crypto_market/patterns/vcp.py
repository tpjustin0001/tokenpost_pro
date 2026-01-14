
import pandas as pd
import numpy as np
from datetime import datetime
from market_provider import market_data_service

def find_vcp_candidates(symbols):
    """
    Scans list of symbols for VCP (Volatility Contraction Pattern) characteristics.
    Uses market_data_service (CCXT/Binance) for reliability.
    """
    candidates = []
    
    # 1. Clean symbols for CCXT (Remove -USD)
    clean_symbols = [s.replace('-USD', '').replace('USDT-', '') for s in symbols]
    
    for symbol in clean_symbols:
        try:
            # Fetch Data via Market Provider (Binance/Upbit)
            # This returns a standardized dict with 'raw_df'
            data = market_data_service.get_asset_data(symbol)
            df = data.get('raw_df')
            
            if df is None or df.empty or len(df) < 150:
                continue
                
            close = df['Close']
            current_price = data['current_price']
            
            # --- Condition 1: Long-term Trend (Mark Minervini Template) ---
            # Relaxed criteria for crypto volatility
            
            sma50 = close.tail(50).mean()
            sma150 = close.tail(150).mean()
            sma200 = close.tail(200).mean() if len(df) >= 200 else sma150
            
            # 1. Price > SMA 150 & 50
            if not (current_price > sma150 and current_price > sma50):
                continue

            # 2. SMA 150 > SMA 200 (Uptrend) - Filter if we have 200d data
            if len(df) >= 200 and not (sma150 > sma200):
                continue
                
            # 3. Price > 25% above 52-week low
            low_52w = close.min()
            if not (current_price > low_52w * 1.25):
                continue
                
            # 4. Price within 35% of 52-week high (Consolidating)
            high_52w = close.max()
            if not (current_price > high_52w * 0.65): # Crypto is volatile, handle deep pullbacks
                continue
                
            # --- Condition 2: Volatility Contraction ---
            # Volatility (Std Dev) of last 10 days < Volatility of prev 20 days
            vol_recent = close.tail(10).std()
            vol_prev = close.iloc[-30:-10].std()
            
            vol_contracting = vol_recent < vol_prev
            
            # --- Condition 3: Volume Contraction ---
            # Volume in last 3 days < 20-day Average Volume
            avg_vol_20 = df['Volume'].tail(20).mean()
            curr_vol = df['Volume'].tail(3).mean()
            vol_dry_up = curr_vol < avg_vol_20
            
            if vol_contracting or vol_dry_up:
                score = 80
                if vol_contracting: score += 10
                if vol_dry_up: score += 5
                
                candidates.append({
                    'symbol': symbol,
                    'score': score,
                    'grade': 'A' if score >= 90 else 'B',
                    'price': current_price,
                    'signal_type': 'VCP Breakout Ready' if current_price > sma50 * 1.05 else 'VCP Setup Forming'
                })
                
        except Exception as e:
            # print(f"Error checking {symbol}: {e}")
            continue
            
    # Sort by Score
    candidates.sort(key=lambda x: x['score'], reverse=True)
    return candidates

