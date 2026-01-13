
try:
    import ccxt
    exchange = ccxt.binance()
    print("Checking CC/USDT...")
    ohlcv = exchange.fetch_ohlcv('CC/USDT', timeframe='1d', limit=5)
    print(f"Fetch success: {len(ohlcv)} candles")
except Exception as e:
    print(f"Error checking CC: {e}")
