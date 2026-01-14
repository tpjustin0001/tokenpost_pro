import os
import requests
import json
from dotenv import load_dotenv

# Load env
load_dotenv(os.path.join(os.getcwd(), 'flask-backend', '.env'))

api_key = os.environ.get("EXTERNAL_API_KEY")
port = os.environ.get("PORT", "5000")
base_url = f"http://127.0.0.1:{port}"

if not api_key:
    print("❌ EXTERNAL_API_KEY not found in .env")
    exit(1)

print(f"🔑 API Key found: {api_key[:5]}...")
print(f"🌐 Target: {base_url}/api/external/ingest/")

payload = {
    "type": "research",
    "data": {
        "title": "Test Research Report (Local)",
        "summary": "Deep dive into market mechanics.",
        "content": "Full analysis content here...",
        "source": "Analyst Pro",
        "type": "REPORT",
        "tags": ["Macro", "OnChain"],
        "is_premium": True
    }
}

headers = {
    "X-API-KEY": api_key,
    "Content-Type": "application/json"
}

try:
    res = requests.post(f"{base_url}/api/external/ingest/", json=payload, headers=headers)
    print(f"📡 Status: {res.status_code}")
    print(f"📄 Response: {res.text}")
except Exception as e:
    print(f"❌ Request failed: {e}")
