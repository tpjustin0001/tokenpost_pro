from dotenv import load_dotenv
load_dotenv('.env')
from ai_service import AIService
import logging
import sys

# logging setup
logging.basicConfig(level=logging.INFO)

print("🔑 Checking Keys...")
import os
print(f"OPENAI: {os.getenv('OPENAI_API_KEY')[:5]}...")

service = AIService()
if not service.client_gpt:
    print("❌ Client GPT is None")
    sys.exit(1)

data = {
    'Total Market Cap': '$3.2T',
    'BTC Price': '$95,000'
}
print("🚀 Calling GPT Deep Analysis...")
try:
    res = service.analyze_global_deep_market(data)
    if res:
        print("✅ Success!")
        print(str(res)[:100])
    else:
        print("❌ Failed (Returned None)")
except Exception as e:
    print(f"❌ Exception: {e}")
