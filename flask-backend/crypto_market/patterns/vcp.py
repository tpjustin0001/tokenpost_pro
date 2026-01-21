
import pandas as pd
import numpy as np
from datetime import datetime
from market_provider import market_data_service


import pandas as pd
import numpy as np
from datetime import datetime
from market_provider import market_data_service

def find_vcp_candidates(symbols):
    """
    Scans list of symbols for Mark Minervini's VCP (Volatility Contraction Pattern).
    Focuses on High Value Signals:
    1. Trend Template (Stage 2 Uptrend)
    2. Volatility Contraction (2-4 contractions, decreasing depth)
    3. Volume Dry-Up (Supply exhaustion)
    4. Pivot Point (Buy signal)
    """
    candidates = []
    
    # Target Major Mid-Large Caps for reliable patterns
    SUPPORTED_TICKERS = [
        'BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'DOGE', 'ADA', 'TRX', 'AVAX', 'LINK',
        'TON', 'SHIB', 'DOT', 'XLM', 'BCH', 'SUI', 'HBAR', 'LTC', 'PEPE', 'UNI',
        'NEAR', 'APT', 'ICP', 'ETC', 'MATIC', 'TAO', 'AAVE', 'FIL', 'STX', 'VET',
        'ATOM', 'INJ', 'RNDR', 'IMX', 'ARB', 'OP', 'MKR', 'GRT', 'THETA', 'FTM',
        'ALGO', 'SEI', 'TIA', 'SAND', 'MANA', 'XTZ', 'AXS', 'LDO', 'WOO', 'ZEC',
        'JUP', 'BONK', 'STRK', 'PYTH', 'BLUR', 'WEMIX', 'GALA', 'YFI', 'FRAX', 'ONT',
        'ZRX', 'RAY', 'EOS', 'MASK', 'APE', 'CRO', 'CFX', 'FLOW', 'ONE', 'AR'
    ]
    
    clean_symbols = list(set(SUPPORTED_TICKERS))
    
    for symbol in clean_symbols:
        try:
            data = market_data_service.get_asset_data(symbol, prefer_krw=True)
            df = data.get('raw_df')
            
            if df is None or df.empty or len(df) < 200:
                continue
                
            close = df['Close']
            current_price = data['current_price']
            
            # ---------------------------------------------------------
            # 1. Trend Template (Mark Minervini's Stage 2 Criteria)
            # ---------------------------------------------------------
            sma50 = close.tail(50).mean()
            sma150 = close.tail(150).mean()
            sma200 = close.tail(200).mean()
            
            # Conditions
            c1 = current_price > sma150 and current_price > sma200
            c2 = sma150 > sma200
            c3 = sma200 > sma200 * 1.01 # 200 SMA trending up (mock slope check needed or simple comparison)
            # Ideally compare sma200 now vs 1 month ago
            sma200_1m_ago = close.iloc[-30:-1].tail(200).mean() # Approx
            c3 = sma200 > sma200_1m_ago
            
            c4 = sma50 > sma150 and sma50 > sma200
            c5 = current_price > sma50
            
            low_52w = close.tail(365).min()
            high_52w = close.tail(365).max()
            
            c6 = current_price > low_52w * 1.30 # At least 30% above 52w low
            c7 = current_price > high_52w * 0.75 # Within 25% of 52w high (Consolidating near highs)
            
            # Trend Score
            trend_passed = c1 and c2 and c4 and c5 and c6 and c7
            if not trend_passed:
                # Allow slight misses for crypto volatility, but score them lower
                pass

            # ---------------------------------------------------------
            # 2. VCP Contraction Detection
            # ---------------------------------------------------------
            # Logic: Find recent swing highs and lows to detect waves (T1, T2, T3)
            # A valid VCP should have diminishing depth (e.g., -20%, -10%, -5%)
            
            window = 60 # Look at last 60 days for the base
            base_df = df.tail(window).copy()
            base_high = base_df['High'].max()
            
            # Simple contraction metric: StdDev of price in recent chunks
            vol_last_10 = base_df['Close'].tail(10).std()
            vol_prev_20 = base_df['Close'].iloc[-30:-10].std()
            
            is_contracting = vol_last_10 < vol_prev_20 * 0.8
            
            # Depth Calculation (Drawdown from recent high)
            recent_high = base_df['High'].tail(20).max()
            depth_pct = ((recent_high - current_price) / recent_high) * 100
            
            # Time Consolidation
            days_since_high = (base_df.index[-1] - base_df['High'].tail(20).idxmax()) if not isinstance(base_df.index, pd.RangeIndex) else 0 # Complicated with default integer index
            
            # ---------------------------------------------------------
            # 3. Volume Dry-Up
            # ---------------------------------------------------------
            vol_sma_50 = df['Volume'].tail(50).mean()
            vol_recent_avg = df['Volume'].tail(5).mean()
            
            # We want volume to be below average during the tightest part
            volume_dry_up = vol_recent_avg < vol_sma_50 * 0.7
            
            dry_up_ratio = vol_recent_avg / vol_sma_50
            
            # ---------------------------------------------------------
            # 4. Pivot Point & Signal
            # ---------------------------------------------------------
            # Ideally buying when it breaks above the pivot (recent minor high)
            pivot_price = recent_high
            dist_to_pivot = ((pivot_price - current_price) / current_price) * 100
            
            # ---------------------------------------------------------
            # Scoring System (0-100)
            # ---------------------------------------------------------
            score = 0
            
            # A. Trend (40pts)
            if c1 and c2: score += 10
            if c4: score += 10
            if c5: score += 10
            if c7: score += 10 # Near 52w high is crucial for Leader stocks
            
            # B. Pattern Structure (30pts)
            if is_contracting: score += 15
            if depth_pct < 10: score += 15 # Tight close
            elif depth_pct < 15: score += 10
            
            # C. Volume (20pts)
            if volume_dry_up: score += 20
            elif dry_up_ratio < 1.0: score += 10
            
            # D. Momentum (10pts)
            rsi = 50 # Default
            try:
                delta = close.diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                rs = gain / loss
                rsi = 100 - (100 / (1 + rs))
                rsi = rsi.iloc[-1]
            except: pass
            
            if 50 < rsi < 70: score += 10 # Sweet spot
            
            # Grade Assignment
            if score >= 85: grade = 'A'
            elif score >= 70: grade = 'B'
            elif score >= 50: grade = 'C'
            else: grade = 'D'
            
            # Detailed Reason for UI
            reasons = []
            if c7: reasons.append("52주 신고가 근접")
            if is_contracting: reasons.append("변동성 축소 확인")
            if volume_dry_up: reasons.append(f"거래량 급감 (평소 대비 {int(dry_up_ratio*100)}%)")
            if depth_pct < 5: reasons.append("초밀집 구간 (Pivot 임박)")
            
            # Construct Result
            if score >= 50: # Only return actionable candidates
                candidates.append({
                    'symbol': symbol,
                    'score': score,
                    'grade': grade,
                    'current_price': current_price,
                    'pivot_price': pivot_price,
                    'depth_pct': depth_pct,
                    'dry_up_ratio': dry_up_ratio,
                    'vol_contracting': is_contracting,
                    'reasons': reasons,
                    'currency': 'KRW' if 'KRW' in data.get('source', '') else 'USD',
                    'timestamp': datetime.now().isoformat()
                })
                
        except Exception as e:
            continue
            
    # Sort
    candidates.sort(key=lambda x: x['score'], reverse=True)
    return candidates

