
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

    def save_to_db(self, news_items, supabase_client):
        """
        Save news items to Supabase 'news' table.
        Avoids duplicates by checking URL.
        """
        if not supabase_client or not news_items:
            return 0
            
        count = 0
        for item in news_items:
            try:
                # Check if exists (using URL as unique key)
                # Note: Ideally, do a bulk upsert. For simplicity, check one by one or rely on ON CONFLICT if configured.
                # Since we didn't set explicit UNIQUE constraint in SQL (wait, did I? Yes, 'url TEXT UNIQUE'),
                # we can try insert and ignore error, or check first.
                
                # Payload matching schema
                payload = {
                    'title': item['title'],
                    'source': item['source'],
                    'url': item.get('link'),
                    'published_at': item.get('pubDate'), # Need to parse this? It's string.
                    'tickers': [], # TODO: Extract regex?
                    'sentiment': 'Neutral'
                }
                
                # Check duplicate
                existing = supabase_client.table('news').select('id').eq('url', payload['url']).execute()
                if existing.data:
                    continue
                    
                supabase_client.table('news').insert(payload).execute()
                count += 1
                
            except Exception as e:
                print(f"Failed to save news item: {e}")
                continue
                
        return count

    def fetch_and_store_news(self, supabase_client=None):
        """
        Orchestrates fetching news from multiple sources and saving to DB.
        """
        try:
            print("📰 Fetching News Feed...")
            all_news = []
            
            # 1. Fetch General Crypto News
            # We can target top coins + general keywords
            targets = ['Crypto', 'Bitcoin', 'Ethereum', 'DeFi', 'Regulation']
            for t in targets:
                items = self.get_crypto_news(t, limit=3)
                all_news.extend(items)
                
            # 2. Fetch Whale News
            whale_items = self.get_whale_news(limit=5)
            all_news.extend(whale_items)
            
            # 3. Save to DB
            if supabase_client and all_news:
                count = self.save_to_db(all_news, supabase_client)
                print(f"✅ News Feed Updated: {count} new items")
                return count
            
            return 0
            
        except Exception as e:
            print(f"❌ Failed to update news feed: {e}")
            return 0

# Singleton
news_service = NewsService()
