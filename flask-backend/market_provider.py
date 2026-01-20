import ccxt
import os
import requests
import pandas as pd
from datetime import datetime

print("DEBUG: Loaded MarketDataService Module")

class MarketDataService:
    def __init__(self):
        # 1. Binance (CCXT) - Public/Free/Fast
        self.binance = ccxt.binance({
            'enableRateLimit': True,
            'options': {'defaultType': 'spot'},
            'timeout': 3000  # 3s timeout
        })
        
        # 2. Upbit (CCXT) - For KRW Pairs (Critical for Korean Context)
        self.upbit = ccxt.upbit({
            'enableRateLimit': True,
            'timeout': 3000  # 3s timeout
        })
        
        # 3. CoinMarketCap (Requires Key)
        self.cmc_api_key = os.getenv('COINMARKETCAP_API_KEY')
        self.cmc_base_url = "https://pro-api.coinmarketcap.com"

    def get_asset_data(self, symbol, prefer_krw=False):
        """
        Orchestrator: Uses Binance (USDT) as primary source for consistency.
        Returns: { 'df': DataFrame, 'source':Str, 'current_price':Float, 'currency': 'USD', ... }
        """
        symbol = symbol.upper()
        
        # 0. Clean Symbol
        base_symbol = symbol.replace('-USD', '').replace('/USD', '').replace('KRW-', '').replace('USDT-', '')

        result = None
        
        # A. If KRW preferred (e.g., for Market Pulse/Gate), try Upbit FIRST
        if prefer_krw:
            try:
                result = self._fetch_upbit(base_symbol)
                # Return immediately if found (keep as KRW)
                if result:
                    return result
            except Exception as e:
                print(f"[Market] Upbit preferred failed for {symbol}: {e}")
                pass

        # 1. Try Binance (USDT) - Primary source for USD consistency
        try:
            result = self._fetch_binance(base_symbol)
        except Exception as e:
            # print(f"[Market] Binance failed for {symbol}: {e}")
            pass # Fall through to CMC

        # 2. Try CoinMarketCap as fallback
        if not result and self.cmc_api_key:
            try:
                result = self._fetch_cmc_ohlcv(base_symbol)
            except Exception as e:
                try:
                    result = self._fetch_cmc_quote(base_symbol)
                except Exception as e2:
                    pass
        
        # 3. Try Upbit as last resort (convert to USD for display consistency)
        if not result:
            try:
                data = self._fetch_upbit(base_symbol)
                
                # If we explicitly wanted KRW but failed earlier, we should return this as KRW? 
                # No, if prefer_krw was True, we tried A and failed. 
                # If we are here, it matches logic 3 (fallback), so convert to USD for consistency
                # UNLESS prefer_krw is set? Let's check.
                # If prefer_krw is True, we probably want KRW even if we fell back here?
                # But _fetch_upbit returns KRW by default. 
                # So we only convert if NOT prefer_krw.
                
                if not prefer_krw:
                    # Convert KRW to USD for consistency
                    usd_krw_rate = 1450.0
                    try:
                        ticker = self.upbit.fetch_ticker('USDT/KRW')
                        usd_krw_rate = ticker['last']
                    except Exception:
                        pass
                    data['current_price'] = data['current_price'] / usd_krw_rate
                    data['currency'] = "USD"
                    data['source'] = "Upbit (converted)"
                
                result = data
            except Exception as e:
                pass
        
        if result:
            return result
            
        raise ValueError(f"Failed to fetch data from Binance, CMC, or Upbit for {symbol}")

    def _fetch_upbit(self, symbol):
        """Fetch from Upbit (KRW Pair)"""
        target_pair = f"{symbol}/KRW"
        
        # Fetch Candles (Day)
        ohlcv = self.upbit.fetch_ohlcv(target_pair, timeframe='1d', limit=200)
        if not ohlcv:
            raise ValueError(f"No OHLCV data for {target_pair}")
            
        columns = ['timestamp', 'Open', 'High', 'Low', 'Close', 'Volume']
        df = pd.DataFrame(ohlcv, columns=columns)
        
        # Calculate Metrics
        current = df['Close'].iloc[-1]
        prev = df['Close'].iloc[-2]
        change_24h = ((current - prev) / prev) * 100
        ma_20 = df['Close'].tail(20).mean()
        vol_avg = df['Volume'].tail(20).mean()
        
        return {
            "symbol": symbol,
            "name": symbol, # Upbit doesn't provide easy name, fallback to symbol
            "source": "Upbit (KRW)",
            "currency": "KRW",
            "current_price": current,
            "change_24h": change_24h,
            "change_1h": self._get_1h_change(self.upbit, target_pair),
            "ma_20": ma_20,
            "trend": "Bullish" if current > ma_20 else "Bearish",
            "volume_status": "High" if df['Volume'].iloc[-1] > vol_avg else "Normal",
            "raw_df": df
        }

    def _get_1h_change(self, exchange, pair):
        try:
            ohlcv = exchange.fetch_ohlcv(pair, timeframe='1h', limit=2)
            if ohlcv and len(ohlcv) >= 2:
                prev = ohlcv[-2][4]
                curr = ohlcv[-1][4]
                return ((curr - prev) / prev) * 100
        except:
            return 0
        return 0

    def _fetch_binance(self, symbol):
        """Fetch from Binance (USDT Pair)"""
        target_pair = f"{symbol}/USDT"
        
        # Fetch Candles
        ohlcv = self.binance.fetch_ohlcv(target_pair, timeframe='1d', limit=200)
        if not ohlcv:
            raise ValueError(f"No OHLCV data for {target_pair}")
            
        columns = ['timestamp', 'Open', 'High', 'Low', 'Close', 'Volume']
        df = pd.DataFrame(ohlcv, columns=columns)
        
        # Calculate Metrics
        current = df['Close'].iloc[-1]
        prev = df['Close'].iloc[-2]
        change_24h = ((current - prev) / prev) * 100
        ma_20 = df['Close'].tail(20).mean()
        vol_avg = df['Volume'].tail(20).mean()
        
        return {
            "symbol": symbol,
            "name": symbol, # Binance Ticker doesn't include name
            "source": "Binance",
            "currency": "USD",
            "current_price": current,
            "change_24h": change_24h,
            "change_1h": self._get_1h_change(self.binance, target_pair),
            "ma_20": ma_20,
            "trend": "Bullish" if current > ma_20 else "Bearish",
            "volume_status": "High" if df['Volume'].iloc[-1] > vol_avg else "Normal",
            "raw_df": df
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
        
        session = requests.Session()
        response = session.get(url, headers=headers, params=parameters)
        data = response.json()
        
        if data['status']['error_code'] != 0:
            raise ValueError(data['status']['error_message'])
            
        coin_data = data['data'][symbol]
        quote = coin_data['quote']['USD']
        
        current = quote['price']
        change_24h = quote['percent_change_24h']
        change_1h = quote['percent_change_1h']
        
        # Since we have no candles from Quotes endpoint, we estimate/mock technicals 
        # based on the 24h/7d change provided by CMC
        trend = "Bullish" if change_24h > 0 else "Bearish"
        
        # Create a single-row DF just to satisfy contract if needed, or return simplified obj
        # For AI compatibility, we return standardized keys
        return {
            "symbol": symbol,
            "name": coin_data['name'], # Use Full Name from CMC
            "source": "CMC",
            "currency": "USD",
            "current_price": current,
            "change_24h": change_24h,
            "change_1h": change_1h,
            "change_1h": change_1h,
            "ma_20": None, # Cannot calculate without history
            "trend": trend,
            "trend": trend,
            "volume_status": "N/A",
            "raw_df": None # Signal to AI that technicals are limited
        }

    def _fetch_cmc_ohlcv(self, symbol):
        """
        Fetch Historical Data from CMC (Requires Standard Plan or higher).
        Endpoint: /v2/cryptocurrency/ohlcv/historical
        """
        url = f"{self.cmc_base_url}/v2/cryptocurrency/ohlcv/historical"
        parameters = {
            'symbol': symbol,
            'convert': 'USD',
            'count': '200', # 200 days
            'interval': 'daily'
        }
        headers = {
            'Accepts': 'application/json',
            'X-CMC_PRO_API_KEY': self.cmc_api_key,
        }
        
        session = requests.Session()
        response = session.get(url, headers=headers, params=parameters)
        data = response.json()
        
        if data['status']['error_code'] != 0:
            raise ValueError(data['status']['error_message'])
            
        # CMC v2 Structure: data -> symbol -> [0] -> quotes
        if symbol not in data['data']:
             raise ValueError(f"No OHLCV data found for {symbol}")

        quotes = data['data'][symbol][0]['quotes']
        
        rows = []
        for q in quotes:
            quote = q['quote']['USD']
            rows.append({
                'timestamp': quote['timestamp'],
                'Open': quote['open'],
                'High': quote['high'],
                'Low': quote['low'],
                'Close': quote['close'],
                'Volume': quote['volume']
            })
            
        df = pd.DataFrame(rows)
        if df.empty:
            raise ValueError("Empty OHLCV dataframe from CMC")

        # Normalize Columns if needed (already standard)
        
        # Calculate Metrics similar to other sources
        current = df['Close'].iloc[-1]
        prev = df['Close'].iloc[-2]
        change_24h = ((current - prev) / prev) * 100
        ma_20 = df['Close'].tail(20).mean()
        vol_avg = df['Volume'].tail(20).mean()
        
        # Get Name context from first response meta if possible, or fallback
        # CMC OHLCV doesn't give name easily in quotes items, but data[symbol][0] has 'name'?
        # Actually v2 structure: data: { "BTC": [ { "id": 1, "name": "Bitcoin", "symbol": "BTC", "quotes": [...] } ] }
        name = data['data'][symbol][0].get('name', symbol)
        
        return {
            "symbol": symbol,
            "name": name,
            "source": "CMC (Historical)",
            "currency": "USD",
            "current_price": current,
            "change_24h": change_24h,
            "change_1h": 0, # OHLCV Daily doesn't have 1h change, set 0
            "ma_20": ma_20,
            "trend": "Bullish" if current > ma_20 else "Bearish",
            "volume_status": "High" if df['Volume'].iloc[-1] > vol_avg else "Normal",
            "raw_df": df
        }

    def get_crypto_listings(self, limit=30):
        """
        Fetches top N cryptocurrencies.
        Source: CoinMarketCap (listings/latest) -> Binance (fallback ticker list)
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
                session = requests.Session()
                response = session.get(url, headers=headers, params=parameters)
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
                    print(f"Fetched {len(results)} listings from CMC.")
                    return results
            except Exception as e:
                print(f"CMC Listings error: {e}")

        # 2. Fallback to Binance (CCXT)
        try:
            # Defined major symbols to look for
            target_symbols = [
                'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 
                'TRX', 'DOT', 'LINK', 'MATIC', 'SHIB', 'LTC', 'BCH', 
                'ATOM', 'UNI', 'ETC', 'FIL', 'NEAR', 'APT', 'INJ', 
                'RNDR', 'STX', 'IMX', 'ARB', 'OP', 'SUI', 'SEI', 'TIA'
            ]
            
            # Fetch all tickers is efficient
            tickers = self.binance.fetch_tickers([f"{s}/USDT" for s in target_symbols])
            
            results = []
            rank = 1
            for sym in target_symbols:
                pair = f"{sym}/USDT"
                if pair in tickers:
                    t = tickers[pair]
                    results.append({
                        'id': sym.lower(),
                        'rank': rank, # Fake rank based on our list order
                        'name': sym,
                        'symbol': sym,
                        'price': t['last'],
                        'change24h': t['percentage'],
                        'change7d': 0, # Not available from simple ticker
                        'marketCap': 0, # Not available
                        'volume24h': t['quoteVolume'],
                        'fdv': 0
                    })
                    rank += 1
            print(f"Fetched {len(results)} listings from Binance (Fallback).")
            return results
        except Exception as e:
            print(f"Binance Fallback error: {e}")
            return []

    def get_global_metrics(self):
        """
        Fetch Global Market Metrics from CoinMarketCap.
        Used for AI Global X-Ray.
        """
        if not self.cmc_api_key:
            raise ValueError("No CMC API Key provided for global metrics")
            
        try:
            url = f"{self.cmc_base_url}/v1/global-metrics/quotes/latest"
            headers = {
                'Accepts': 'application/json',
                'X-CMC_PRO_API_KEY': self.cmc_api_key,
            }
            session = requests.Session()
            response = session.get(url, headers=headers)
            data = response.json()
            
            if data['status']['error_code'] != 0:
                raise ValueError(data['status']['error_message'])
                
            quote = data['data']['quote']['USD']
            
            return {
                "total_market_cap": quote['total_market_cap'],
                "total_volume_24h": quote['total_volume_24h'],
                "btc_dominance": data['data']['btc_dominance'],
                "eth_dominance": data['data']['eth_dominance'],
                "market_cap_change_24h": quote.get('total_market_cap_yesterday_percentage_change', 0)
            }
            
        except Exception as e:
            print(f"CMC Global Metrics Error: {e}")
            print(f"CMC Global Metrics Error: {e}")
            raise e
            
    def get_recent_large_trades(self, min_value_usd=500000):
        """
        Fetch recent trades from Binance and filter for Large Trades (Whales).
        """
        target_symbols = ['BTC', 'ETH', 'SOL', 'XRP']
        results = []
        
        for sym in target_symbols:
            try:
                pair = f"{sym}/USDT"
                trades = self.binance.fetch_trades(pair, limit=50) # Fetch last 50 trades
                
                for t in trades:
                    # t structure: { 'amount': float, 'price': float, 'cost': float, 'side': 'buy'/'sell', 'timestamp': int, ... }
                    cost = t['cost'] if t.get('cost') else (t['amount'] * t['price'])
                    
                    if cost >= min_value_usd:
                        results.append({
                            'symbol': sym,
                            'type': t['side'], # 'buy' or 'sell'
                            'price': t['price'],
                            'amount': t['amount'],
                            'value': cost,
                            'timestamp': t['timestamp'],
                            'source': 'Binance'
                        })
            except Exception as e:
                # print(f"Whale Trade fetch error for {sym}: {e}")
                continue
                
        # Sort by latest
        results.sort(key=lambda x: x['timestamp'], reverse=True)
        return results

market_data_service = MarketDataService()
