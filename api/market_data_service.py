
import os
import requests
# import pandas as pd # Panda is too heavy, we will use raw dicts or basic stats

class MarketDataService:
    def __init__(self):
        # 1. Binance (Requests) - Public/Free/Fast (Use US for Vercel)
        self.binance_url = "https://api.binance.us/api/v3"
        
        # 2. CoinMarketCap (Requires Key)
        self.cmc_api_key = os.getenv('COINMARKETCAP_API_KEY')
        self.cmc_base_url = "https://pro-api.coinmarketcap.com"

    def get_asset_data(self, symbol):
        """
        Orchestrator: Tries Binance first, then CMC.
        Returns: { 'source':Str, 'current_price':Float, ... }
        """
        symbol = symbol.upper()
        
        # 1. Try Binance
        try:
            return self._fetch_binance(symbol)
        except Exception as e:
            # print(f"Binance fetch failed for {symbol}: {e}")
            pass # Fall through to CMC

        # 2. Try CoinMarketCap
        if self.cmc_api_key:
            try:
                # print(f"Attempting CMC fetch for {symbol}...")
                return self._fetch_cmc_quote(symbol) 
            except Exception as e:
                print(f"CMC fetch failed: {e}")
                raise ValueError(f"Failed to fetch data from Binance AND CoinMarketCap for {symbol}")
        
        raise ValueError(f"Symbol {symbol} not found on Binance and no CMC Key provided.")

    def _fetch_binance(self, symbol):
        target_pair = f"{symbol}USDT"
        if symbol == 'BTC-USD': target_pair = "BTCUSDT"
        if '-' in symbol: target_pair = symbol.replace('-', '') + "USDT" # Basic normalization
        if 'USDT' not in target_pair: target_pair += 'USDT'

        # Fetch Candles (Klines)
        # url: https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=50
        url = f"{self.binance_url}/klines"
        params = {'symbol': target_pair, 'interval': '1d', 'limit': 50}
        
        r = requests.get(url, params=params, timeout=5)
        if r.status_code != 200:
            raise ValueError(f"Binance Error {r.status_code}")
            
        data = r.json()
        if not data:
             raise ValueError("Empty data from Binance")

        # Parse: [time, open, high, low, close, volume, ...]
        closes = [float(x[4]) for x in data]
        volumes = [float(x[5]) for x in data]
        
        current = closes[-1]
        prev = closes[-2] if len(closes) > 1 else current
        change_24h = ((current - prev) / prev) * 100
        
        # MA 20
        ma_20 = sum(closes[-20:]) / len(closes[-20:]) if len(closes) >= 20 else current
        
        # Volume Avg
        vol_avg = sum(volumes[-20:]) / len(volumes[-20:]) if len(volumes) >= 20 else 0
        
        return {
            "symbol": symbol,
            "source": "Binance",
            "current_price": current,
            "change_24h": change_24h,
            "ma_20": ma_20,
            "trend": "Bullish" if current > ma_20 else "Bearish",
            "volume_status": "High" if volumes[-1] > vol_avg else "Normal",
            "raw_df": None # Deprecated DF
        }

    def _fetch_cmc_quote(self, symbol):
        """
        Fetches latest quote from CMC.
        """
        url = f"{self.cmc_base_url}/v1/cryptocurrency/quotes/latest"
        parameters = {
            'symbol': symbol,
            'convert': 'USD'
        }
        headers = {
            'Accepts': 'application/json',
            'X-CMC_PRO_API_KEY': self.cmc_api_key,
        }
        
        response = requests.get(url, headers=headers, params=parameters, timeout=5)
        data = response.json()
        
        if data['status']['error_code'] != 0:
            raise ValueError(data['status']['error_message'])
            
        coin_data = data['data'][symbol]
        quote = coin_data['quote']['USD']
        
        current = quote['price']
        change_24h = quote['percent_change_24h']
        
        return {
            "symbol": symbol,
            "source": "CoinMarketCap",
            "current_price": current,
            "change_24h": change_24h,
            "ma_20": current, # Approximation
            "trend": "Bullish" if change_24h > 0 else "Bearish", 
            "volume_status": "N/A",
            "raw_df": None
        }

    def get_crypto_listings(self, limit=30):
        """
        Fetches top N cryptocurrencies.
        """
        # 1. Try CoinMarketCap
        if self.cmc_api_key:
            try:
                url = f"{self.cmc_base_url}/v1/cryptocurrency/listings/latest"
                parameters = {
                    'start': '1',
                    'limit': str(limit),
                    'convert': 'USD',
                    'sort': 'market_cap'
                }
                headers = {
                    'Accepts': 'application/json',
                    'X-CMC_PRO_API_KEY': self.cmc_api_key,
                }
                response = requests.get(url, headers=headers, params=parameters, timeout=5)
                data = response.json()
                
                if data['status']['error_code'] == 0:
                    results = []
                    for item in data['data']:
                        quote = item['quote']['USD']
                        results.append({
                            'id': item['slug'],
                            'rank': item['cmc_rank'],
                            'name': item['name'],
                            'symbol': item['symbol'],
                            'price': quote['price'],
                            'change24h': quote['percent_change_24h'],
                            'change7d': quote['percent_change_7d'],
                            'marketCap': quote['market_cap'],
                            'volume24h': quote['volume_24h'],
                            'fdv': quote.get('fully_diluted_market_cap', 0)
                        })
                    # print(f"✅ Fetched {len(results)} listings from CMC.")
                    return results
            except Exception as e:
                print(f"CMC Listings error: {e}")

        # 2. Fallback to Binance (Requests)
        try:
            # Defined major symbols to look for
            target_symbols = [
                'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 
                'TRX', 'DOT', 'LINK', 'MATIC', 'SHIB', 'LTC', 'BCH', 
                'ATOM', 'UNI', 'ETC', 'FIL', 'NEAR', 'APT', 'INJ', 
                'RNDR', 'STX', 'IMX', 'ARB', 'OP', 'SUI', 'SEI', 'TIA'
            ]
            
            # Use Ticker 24hr for all symbols is efficient on Binance
            # But we can't filter neatly by market cap without fetching all.
            # We will fetch specific tickers.
            
            import json
            # Valid pairs
            valid_pairs = [f"{s}USDT" for s in target_symbols]
            symbols_param = json.dumps(valid_pairs)
            
            url = f"{self.binance_url}/ticker/24hr?symbols={symbols_param}"
            r = requests.get(url, timeout=5)
            data = r.json()
            
            results = []
            rank = 1
            
            # Map back to ordered list
            data_map = {item['symbol']: item for item in data}
            
            for sym in target_symbols:
                pair = f"{sym}USDT"
                if pair in data_map:
                    t = data_map[pair]
                    results.append({
                        'id': sym.lower(),
                        'rank': rank, 
                        'name': sym,
                        'symbol': sym,
                        'price': float(t['lastPrice']),
                        'change24h': float(t['priceChangePercent']),
                        'change7d': 0, 
                        'marketCap': 0, 
                        'volume24h': float(t['quoteVolume']),
                        'fdv': 0
                    })
                    rank += 1
                    
            # print(f"⚠️ Fetched {len(results)} listings from Binance (Fallback).")
            return results
        except Exception as e:
            print(f"Binance Fallback error: {e}")
            return []

market_data_service = MarketDataService()
