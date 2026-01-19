import os
import sys
from dotenv import load_dotenv

# Setup path to run from flask-backend root or finding modules
sys.path.insert(0, os.path.abspath("flask-backend"))

load_dotenv(".env.local")

try:
    print("--- 1. Testing ETH Staking Service ---")
    from eth_staking_service import eth_staking_service
    staking_metrics = eth_staking_service.get_staking_metrics()
    print("✅ ETH Metrics fetched with keys:", list(staking_metrics.keys()))
except Exception as e:
    print(f"❌ ETH Staking Error: {e}")

try:
    print("\n--- 2. Testing Market Pulse (AI Service) ---")
    from market_provider import market_data_service
    from ai_service import ai_service
    
    print("Fetching Market Data...")
    market_data = market_data_service.get_global_metrics()
    
    print("Running AI Analysis (Grok + GPT)...")
    # Using empty news list to test AI logic primarily
    result = ai_service.analyze_global_market(market_data, news_list=[], whale_news_list=[])
    
    print("✅ AI Analysis Result Keys:", list(result.keys()))
    if 'top_tweets' in result:
        print("Twitter Data:", result['top_tweets'])
        
except Exception as e:
    print(f"❌ AI Service Error: {e}")
