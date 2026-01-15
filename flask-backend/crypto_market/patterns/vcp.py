
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
    
    # 1. Get Top 30 Symbols dynamically if not provided or just force use listings
    # The 'symbols' argument is kept for compatibility but we prefer dynamic Top 30 for the Scanner
    
    # Fetch Top 30 from Market Provider (CMC -> Binance)
    clean_symbols = []
    try:
        listings = market_data_service.get_crypto_listings(limit=30)
        clean_symbols = [item['symbol'] for item in listings]
        # print(f"Biased VCP Scan for: {clean_symbols}")
    except Exception as e:
        print(f"VCP Scanner: Creating fallback list due to listing error: {e}")
        # Fallback to provided symbols or defaults
        clean_symbols = [s.replace('-USD', '').replace('USDT-', '') for s in symbols]
    
    if not clean_symbols:
         clean_symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX']
         
    # Ensure they are unique
    clean_symbols = list(set(clean_symbols))
    
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
            
            # 1. Price > SMA 150 (Long-term trend required) - ALSO Relaxed
            # if not (current_price > sma150):
                # print(f"❌ {symbol}: Failed SMA150 check (Price: {current_price}, SMA150: {sma150})")
                # continue

            # 1. Price > SMA 50 (Short-term trend required) - Relaxed to Optional
            # if not (current_price > sma50):
                # print(f"❌ {symbol}: Failed SMA50 check (Price: {current_price}, SMA50: {sma50})")
                # continue

            # 2. SMA 150 > SMA 200 (Uptrend)
            # if len(df) >= 200 and not (sma150 > sma200):
                # continue
                
            # 3. Price > 25% above 52-week low
            low_52w = close.min()
            # if not (current_price > low_52w * 1.25):
                # continue
                
            # 4. Price within 35% of 52-week high
            high_52w = close.max()
            # if not (current_price > high_52w * 0.65): 
                # continue
                
            # --- Condition 2: Volatility Contraction ---
            # Volatility (Std Dev) of last 10 days < Volatility of prev 20 days
            vol_recent = close.tail(10).std()
            vol_prev = close.iloc[-30:-10].std()
            
            vol_contracting = vol_recent < vol_prev
            
            # Allow slight expansion if Grade is high (Logic adjustment needed?)
            # For now, if volatility is expanding significantly, drop it.
            # if vol_recent > vol_prev * 1.2:
                # print(f"❌ {symbol}: Vola expanding (Recent: {vol_recent:.2f}, Prev: {vol_prev:.2f})")
                # continue
            
            # --- Condition 3: Volume Contraction ---
            # Volume in last 3 days < 20-day Average Volume
            avg_vol_20 = df['Volume'].tail(20).mean()
            curr_vol = df['Volume'].tail(3).mean()
            vol_ratio = curr_vol / avg_vol_20 if avg_vol_20 > 0 else 1.0
            
            # --- Metrics Calculation for Frontend ---
            pivot_high = high_52w # Using 52w High as main pivot
            breakout_pct = ((current_price - pivot_high) / pivot_high) * 100
            
            # Contraction Depths (Proxy using High-Low range in windows)
            # c1: 30 days, c2: 20 days, c3: 10 days
            def get_depth(window):
                sub = df.tail(window)
                h = sub['High'].max()
                l = sub['Low'].min()
                return ((h - l) / h) * 100 if h > 0 else 0

            c1 = get_depth(30)
            c2 = get_depth(20)
            c3 = get_depth(10)
            
            # ATR % (Approximate)
            day_high = df['High'].iloc[-1]
            day_low = df['Low'].iloc[-1]
            atr_approx = ((day_high - day_low) / current_price) * 100
            
            # Score Calculation (0-100)
            score = 60 # Base
            if current_price > sma50: score += 10
            if current_price > sma150: score += 5
            if current_price > sma200: score += 5
            if vol_ratio < 0.8: score += 10 # Volume drying up
            if c3 < c2 < c1: score += 10 # VCP Characteristic (Tightening)
            
            # Signal Type
            signal_type = 'APPROACHING'
            if breakout_pct > 0: signal_type = 'BREAKOUT'
            elif breakout_pct > -2: signal_type = 'RETEST_OK'
            elif c3 < 5.0: signal_type = 'APPROACHING' # Tight
                
            candidates.append({
                'symbol': symbol,
                'score': min(99, score),
                'grade': 'A' if score >= 85 else 'B' if score >= 70 else 'C',
                'signal_type': signal_type,
                'pivot_high': pivot_high,
                'current_price': current_price,
                'breakout_pct': breakout_pct,
                'c1': c1,
                'c2': c2,
                'c3': c3,
                'atr_pct': atr_approx,
                'vol_ratio': vol_ratio
            })
                
        except Exception as e:
            # print(f"Error checking {symbol}: {e}")
            continue
            
    # Sort by Score
    candidates.sort(key=lambda x: x['score'], reverse=True)
    return candidates

