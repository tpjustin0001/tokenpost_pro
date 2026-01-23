from market_provider import market_data_service
import json

def test_exchange(name):
    print(f"Testing {name}...")
    try:
        data = market_data_service.get_exchange_performance(name, limit=5)
        print(f"Success. Count: {len(data)}")
        if data:
            print(json.dumps(data[0], indent=2))
        else:
            print("No data returned.")
    except Exception as e:
        print(f"Failed: {e}")

print("--- START TEST ---")
test_exchange('upbit')
test_exchange('bithumb')
test_exchange('binance')
print("--- END TEST ---")
