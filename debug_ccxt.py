
try:
    import ccxt
    print("CCXT imported successfully")
    exchange = ccxt.binance()
    print("Exchange initialized")
    ohlcv = exchange.fetch_ohlcv('BTC/USDT', timeframe='1d', limit=5)
    print(f"Fetch success: {len(ohlcv)} candles")
    print(ohlcv[0])
except Exception as e:
    print(f"Error: {e}")
