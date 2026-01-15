
import requests
import requests

def test_rss():
    url = "https://coindar.org/en/rss"
    print(f"Testing {url}...")
    try:
        resp = requests.get(url, timeout=10)
        print(f"Status: {resp.status_code}")
        print(resp.text[:500])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_rss()
