
import requests
import xml.etree.ElementTree as ET
from datetime import datetime

class NewsService:
    def __init__(self):
        self.base_url = "https://news.google.com/rss/search"

    def get_crypto_news(self, symbol, name=None, limit=3):
        """
        Fetches latest news for a crypto symbol using Google News RSS.
        """
        try:
            # Construct query: Use Name if available for better accuracy
            search_term = f'"{name}" {symbol}' if name and name != symbol else symbol
            query = f"{search_term} crypto when:3d"
            
            # hl=en-US, gl=US, ceid=US:en -> Global/US news preferred
            url = f"{self.base_url}?q={query}&hl=en-US&gl=US&ceid=US:en"
            
            response = requests.get(url, timeout=5)
            if response.status_code != 200:
                print(f"News fetch failed: {response.status_code}")
                return []

            # Parse XML
            root = ET.fromstring(response.content)
            
            news_items = []
            # Iterate channel -> item
            for item in root.findall('./channel/item')[:limit]:
                title = item.find('title').text if item.find('title') is not None else "No Title"
                link = item.find('link').text if item.find('link') is not None else "#"
                pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
                
                # Cleanup title (Google News often adds " - SourceName")
                source = "Unknown"
                if " - " in title:
                    parts = title.rsplit(" - ", 1)
                    title = parts[0]
                    source = parts[1]
                
                news_items.append({
                    'title': title,
                    'link': link,
                    'pubDate': pub_date,
                    'source': source
                })
                
            return news_items

            return news_items

        except Exception as e:
            print(f"Error fetching news for {symbol}: {e}")
            return []

    def get_whale_news(self, limit=5):
        """
        Fetches specific news related to crypto whales and large transactions.
        """
        try:
            query = '"crypto whale" OR "whale alert" OR "large transaction" when:24h'
            url = f"{self.base_url}?q={query}&hl=en-US&gl=US&ceid=US:en"
            
            response = requests.get(url, timeout=5)
            if response.status_code != 200:
                print(f"Whale news fetch failed: {response.status_code}")
                return []

            root = ET.fromstring(response.content)
            news_items = []
            
            for item in root.findall('./channel/item')[:limit]:
                title = item.find('title').text if item.find('title') is not None else "No Title"
                pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
                
                # Cleanup title
                source = "Unknown"
                if " - " in title:
                    parts = title.rsplit(" - ", 1)
                    title = parts[0]
                    source = parts[1]
                
                news_items.append({
                    'title': title,
                    'source': source,
                    'pubDate': pub_date
                })
                
            return news_items

        except Exception as e:
            print(f"Error fetching whale news: {e}")
            return []

# Singleton
news_service = NewsService()
