import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from dateutil import parser
import os
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

# OpenAI Client (Lazy Init)
def get_client():
    key = os.getenv("OPENAI_API_KEY")
    return OpenAI(api_key=key) if key else None

def translate_text(text):
    """
    Translate text to Korean using GPT-4o-mini
    """
    client = get_client()
    if not client:
        return text # Fallback

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional crypto translator. Translate the following event title to concise Korean. Remove unnecessary words."},
                {"role": "user", "content": text}
            ],
            max_tokens=60,
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        return text

def fetch_investing_calendar():
    """
    Fetch Crypto Events from Coindar RSS and translate to Korean
    """
    url = "https://coindar.org/en/rss"
    
    try:
        print(f"📡 Fetching Coindar RSS from {url}...")
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        channel = root.find('channel')
        
        events = []
        # Parse items (limit to 10 latest to save tokens/time)
        items = channel.findall('item')[:8] 
        
        print(f"🔎 Found {len(items)} items. Translating...")

        for item in items:
            try:
                title_en = item.find('title').text
                # description = item.find('description').text # Contains HTML image, skip
                pub_date_str = item.find('pubDate').text # Thu, 16 Jan 2026 ...
                
                # Parse Date
                dt = parser.parse(pub_date_str)
                event_date = dt.strftime("%Y-%m-%d")
                time_str = dt.strftime("%H:%M")
                
                # Filter: Only future or today
                # if dt.date() < datetime.now().date(): continue 

                # Translate Title
                title_ko = translate_text(title_en)
                
                # Determine Coin/Country
                # Try to extract coin symbol from title (e.g. "Bitcoin (BTC)...")
                # For now, use Global icon
                country = "🌐"
                
                # Impact Analysis (Simple keyword based)
                impact = "Medium"
                if any(k in title_en.lower() for k in ['halving', 'hard fork', 'listing', 'mainnet', 'release']):
                    impact = "High"

                events.append({
                    "time": time_str,
                    "title": title_ko, # Translated
                    "country": country,
                    "impact": impact,
                    "type": "Crypto",
                    "event_date": event_date
                })
                
            except Exception as e:
                logger.error(f"Error parsing RSS item: {e}")
                continue

        # Sort by date/time
        events.sort(key=lambda x: (x['event_date'], x['time']))
        return events

    except Exception as e:
        logger.error(f"Failed to fetch Coindar RSS: {e}")
        return []

def save_to_db(events, supabase_client):
    """
    Save events to Supabase 'calendar_events' table.
    """
    if not supabase_client or not events:
        return 0
        
    count = 0
    try:
        # Get existing events for relevant dates to minimize overlap queries
        # For simplicity, we use the UNIQUE(title, event_date) constraint and ignore duplicates on insert if possible,
        # but Supabase-py doesn't support 'ON CONFLICT DO NOTHING' easily in one line without RPC.
        # We'll stick to a simple loop check for safety or try bulk insert ignoring errors (if supported).
        
        for event in events:
            # Check if exists
            exists = supabase_client.table('calendar_events')\
                .select('id')\
                .eq('title', event['title'])\
                .eq('event_date', event['event_date'])\
                .execute()
                
            if not exists.data:
                payload = {
                    'title': event['title'],
                    'country': event['country'],
                    'impact': event['impact'],
                    'type': event['type'],
                    'time': event['time'],
                    'event_date': event['event_date']
                }
                supabase_client.table('calendar_events').insert(payload).execute()
                count += 1
                
        logger.info(f"💾 Calendar events saved: {count} new items")
        return count
        
    except Exception as e:
        logger.error(f"❌ Failed to save calendar events: {e}")
        return 0
