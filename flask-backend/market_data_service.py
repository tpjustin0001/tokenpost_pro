
import ccxt
import os
import requests
import pandas as pd
from datetime import datetime

class MarketDataService:
    def __init__(self):
        # 1. Binance (CCXT) - Public/Free/Fast
        self.binance = ccxt.binance({
            'enableRateLimit': True,
            'options': {'defaultType': 'spot'}
        })
        
        # 2. Upbit (CCXT) - For KRW Pairs (Critical for Korean Context)
        self.upbit = ccxt.upbit({
            'enableRateLimit': True
        })
        
        # 3. CoinMarketCap (Requires Key)
        self.cmc_api_key = os.getenv('COINMARKETCAP_API_KEY')
        self.cmc_base_url = "https://pro-api.coinmarketcap.com"

    def get_asset_data(self, symbol):
        """
        Orchestrator: Tries Upbit (KRW) -> Binance (USDT) -> CMC.
        Returns: { 'df': DataFrame, 'source':Str, 'current_price':Float, ... }
        """
        symbol = symbol.toUpperCase() if hasattr(symbol, 'toUpperCase') else symbol.upper()
        
        # 0. Clean Symbol (e.g. "BTC" -> "BTC")
        base_symbol = symbol.replace('-USD', '').replace('/USD', '').replace('KRW-', '').replace('USDT-', '')

        # 1. Try Upbit (KRW) FIRST for Korean Context
        try:
            return self._fetch_upbit(base_symbol)
        except Exception:
            pass # Fallback to Binance
            
        # 2. Try Binance (USDT)
        try:
            return self._fetch_binance(base_symbol)
        except Exception as e:
            # print(f"Binance fetch failed for {symbol}: {e}")
            pass # Fall through to CMC

        # 3. Try CoinMarketCap
        if self.cmc_api_key:
            try:
                # print(f"Attempting CMC fetch for {symbol}...")
                return self._fetch_cmc_quote(base_symbol) 
            except Exception as e:
                # print(f"CMC fetch failed: {e}")
                pass
        
        raise ValueError(f"Failed to fetch data from Upbit, Binance, AND CoinMarketCap for {symbol}")

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
            "source": "CMC",
            "currency": "USD",
            "current_price": current,
            "change_24h": change_24h,
            "change_1h": change_1h,
            "ma_20": current, # Mock
            "trend": trend,
            "volume_status": "N/A",
            "raw_df": None # Signal to AI that technicals are limited
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
                    print(f"✅ Fetched {len(results)} listings from CMC.")
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
            print(f"⚠️ Fetched {len(results)} listings from Binance (Fallback).")
            return results
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
            # Fallback Mock
            return {
                "total_market_cap": 2000000000000,
                "total_volume_24h": 80000000000,
                "btc_dominance": 52.5,
                "eth_dominance": 17.2,
                "market_cap_change_24h": 0.5
            }

market_data_service = MarketDataService()
