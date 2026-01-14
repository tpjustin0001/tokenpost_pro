import sys
import os

# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from market_provider import MarketDataService
from datetime import datetime

def verify_data():
    print(f"[{datetime.now()}] 🔍 Verifying Real Data Connection...")
    service = MarketDataService()
    
    symbol = "BTC"
    print(f"[{datetime.now()}] 📡 Fetching live data for {symbol}...")
    
    try:
        data = service.get_asset_data(symbol)
        
        print(f"🔑 Available Keys: {list(data.keys())}")
        print("="*50)
        print(f"💰 Current Price: {data['current_price']:,}")
        # print(f"📊 24h Volume:    ${data.get('volume', 0):,.0f}") 
        print(f"📈 24h Change:    {data.get('change_24h', 0)}%")
        print(f"🕒 Timestamp:     {datetime.now().isoformat()}")
        print("-" * 50)
        print(f"📜 Raw Data Source: {len(data['raw_df'])} daily candles fetched.")
        print(f"🔎 Latest Close:    ${data['raw_df']['Close'].iloc[-1]:,}")
        print("="*50 + "\n")
        
    except Exception as e:
        print(f"❌ FETCH FAILED: {e}")

if __name__ == "__main__":
    verify_data()
