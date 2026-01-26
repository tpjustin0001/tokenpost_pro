import requests

def test_endpoint(url):
    print(f"Testing {url}...")
    try:
        r = requests.get(url, timeout=60)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text[:200]}...")
    except Exception as e:
        print(f"Error: {e}")

test_endpoint('http://127.0.0.1:5001/api/crypto/xray/global')
test_endpoint('http://127.0.0.1:5001/api/crypto/xray/deep')
