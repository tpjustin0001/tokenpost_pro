
import os
import requests
from dotenv import load_dotenv

# Load env manually
load_dotenv('flask-backend/.env')

api_key = os.getenv('COINMARKETCAP_API_KEY')
print(f"API Key: {api_key[:5]}... (Length: {len(api_key)})" if api_key else "API Key: NOT FOUND")

if not api_key:
    print("❌ No API Key found in .env")
    exit(1)

url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"
parameters = {
    'symbol': 'CC',
    'convert': 'USD'
}
headers = {
    'Accepts': 'application/json',
    'X-CMC_PRO_API_KEY': api_key,
}

print(f"Fetching 'CC' from CMC...")
try:
    response = requests.get(url, headers=headers, params=parameters)
    data = response.json()
    
    if data['status']['error_code'] == 0:
        print("✅ SUCCESS!")
        cc_data = data['data']['CC']
        print(f"Name: {cc_data['name']}")
        print(f"Price: ${cc_data['quote']['USD']['price']}")
    else:
        print(f"❌ CMC API Error: {data['status']['error_message']}")
        
except Exception as e:
    print(f"❌ Exception: {e}")
