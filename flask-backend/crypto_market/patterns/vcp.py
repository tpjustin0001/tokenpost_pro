
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
    
    # Fixed list of Top 100 tickers by market cap (matching frontend icons)
    SUPPORTED_TICKERS = [
        # Top 10
        'BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'DOGE', 'ADA', 'TRX', 'AVAX', 'LINK',
        # 11-20
        'TON', 'SHIB', 'DOT', 'XLM', 'BCH', 'SUI', 'HBAR', 'LTC', 'PEPE', 'UNI',
        # 21-30
        'NEAR', 'APT', 'ICP', 'ETC', 'MATIC', 'TAO', 'AAVE', 'FIL', 'STX', 'VET',
        # 31-40
        'ATOM', 'INJ', 'RNDR', 'IMX', 'ARB', 'OP', 'MKR', 'GRT', 'THETA', 'FTM',
        # 41-50
        'ALGO', 'SEI', 'TIA', 'SAND', 'MANA', 'XTZ', 'AXS', 'LDO', 'WOO', 'ZEC',
        # 51-60
        'JUP', 'BONK', 'STRK', 'PYTH', 'BLUR', 'WEMIX', 'GALA', 'YFI', 'FRAX', 'ONT',
        # 61-70
        'ZRX', 'RAY', 'EOS', 'MASK', 'APE', 'CRO', 'CFX', 'FLOW', 'ONE', 'AR',
        # 71-80
        'LUNA', 'EGLD', 'ENS', 'DYDX', 'ICX', 'COMP', 'SUSHI', 'SNX', 'PENDLE', 'HT',
        # 81-90
        'AGIX', 'OCEAN', 'NEO', 'KAVA', 'ANKR', 'IOTA', 'CRV', 'IO', 'POL', 'WLFI',
        # 91-100
        'KCS', 'W', 'DAI', 'WBTC', 'STETH', 'USDT', 'USDC', 'BUSD', '1INCH', 'CC'
    ]
    
    clean_symbols = SUPPORTED_TICKERS
         
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
            sma50 = close.tail(50).mean()
            sma150 = close.tail(150).mean()
            sma200 = close.tail(200).mean() if len(df) >= 200 else sma150
            
            # Track trend alignment for scoring (not filtering)
            above_sma50 = current_price > sma50
            above_sma150 = current_price > sma150
            above_sma200 = current_price > sma200
            sma_aligned = sma50 > sma150 > sma200  # Perfect alignment
                
            # 3. Price > 25% above 52-week low
            low_52w = close.min()
            above_52w_low = current_price > low_52w * 1.25
                
            # 4. Price within 35% of 52-week high
            high_52w = close.max()
            near_52w_high = current_price > high_52w * 0.65
            
            # --- RSI Calculation (14-period) ---
            delta = close.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            current_rsi = rsi.iloc[-1] if not rsi.empty else 50
                
            # --- Condition 2: Volatility Contraction ---
            vol_recent = close.tail(10).std()
            vol_prev = close.iloc[-30:-10].std()
            
            vol_contracting = vol_recent < vol_prev
            
            # --- Condition 3: Volume Contraction ---
            avg_vol_20 = df['Volume'].tail(20).mean()
            curr_vol = df['Volume'].tail(3).mean()
            vol_ratio = curr_vol / avg_vol_20 if avg_vol_20 > 0 else 1.0
            
            # --- Metrics Calculation for Frontend ---
            pivot_high = high_52w
            breakout_pct = ((current_price - pivot_high) / pivot_high) * 100
            
            # Contraction Depths
            def get_depth(window):
                sub = df.tail(window)
                h = sub['High'].max()
                l = sub['Low'].min()
                return ((h - l) / h) * 100 if h > 0 else 0

            c1 = get_depth(30)
            c2 = get_depth(20)
            c3 = get_depth(10)
            
            # ATR %
            day_high = df['High'].iloc[-1]
            day_low = df['Low'].iloc[-1]
            atr_approx = ((day_high - day_low) / current_price) * 100
            
            # --- Enhanced Score Calculation (0-100) ---
            score = 20  # Lowered base score (Stricter)
            
            # Trend conditions (+30 max)
            if above_sma50: score += 8
            if above_sma150: score += 7
            if above_sma200: score += 5
            if sma_aligned: score += 10  # Critical for high score
            
            # Price position (+15 max)
            if above_52w_low: score += 5
            if near_52w_high: score += 10
            
            # VCP Pattern (+25 max)
            if vol_contracting: score += 10
            if c3 < c2 < c1: score += 15  # Classic VCP tightening
            
            # Volume analysis (+10 max)
            if vol_ratio < 0.6: score += 10  # Stricter volume dry-up (0.7 -> 0.6)
            elif vol_ratio > 1.8: score += 5  # Strong breakout volume
            
            # RSI adjustment (+5 max, -10 penalty)
            if 50 <= current_rsi <= 70: score += 5
            elif current_rsi > 75: score -= 10  # Stricter overbought penalty (80 -> 75)
            
            # Signal Type
            signal_type = 'APPROACHING'
            if breakout_pct > 0: signal_type = 'BREAKOUT'
            elif breakout_pct > -2: signal_type = 'RETEST_OK'
            elif c3 < 5.0: signal_type = 'APPROACHING'
            
            # Determine grade based on score
            final_score = min(99, max(10, score))
            
            # Cap score if trend is not perfect (Stricter)
            if not sma_aligned and final_score > 85:
                final_score = 85
            if final_score >= 80: grade = 'A'
            elif final_score >= 65: grade = 'B'
            elif final_score >= 50: grade = 'C'
            else: grade = 'D'
                
            # Filter out invalid prices
            if current_price <= 0:
                continue

            candidates.append({
                'symbol': symbol,
                'score': final_score,
                'grade': grade,
                'signal_type': signal_type,
                'pivot_high': pivot_high,
                'current_price': current_price,
                'breakout_pct': breakout_pct,
                'c1': c1,
                'c2': c2,
                'c3': c3,
                'atr_pct': atr_approx,
                'vol_ratio': vol_ratio,
                'rsi': current_rsi,
                'currency': 'KRW' if 'KRW' in data.get('source', '') else 'USD'
            })
                
        except Exception as e:
            # print(f"Error checking {symbol}: {e}")
            continue
            
    # Sort by Score
    candidates.sort(key=lambda x: x['score'], reverse=True)
    return candidates

