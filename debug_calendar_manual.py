
import os
import sys
from dotenv import load_dotenv

# Load env manually
try:
    with open('.env.local', 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            if '=' in line:
                k, v = line.split('=', 1)
                os.environ[k] = v.strip('"').strip("'")
except Exception as e:
    print(f"⚠️ Failed to load .env.local: {e}")

# Add flask-backend to path
sys.path.append(os.path.join(os.getcwd(), 'flask-backend'))

from services import calendar_service
from supabase import create_client

def debug_calendar():
    print("🚀 Starting Calendar Debug...")
    
    # 1. Init Supabase
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print(f"❌ Missing Supabase Credentials. Env keys found: {list(os.environ.keys())}")
        return

    supabase = create_client(url, key)
    print("✅ Supabase Connected")

    # 2. Fetch Events
    print("📡 Fetching from RSS...")
    events = calendar_service.fetch_investing_calendar()
    print(f"🔎 Fetched {len(events)} events")
    
    for e in events:
        print(f" - {e['event_date']} {e['time']} | {e['country']} | {e['title']}")

    # 3. Save to DB
    if events:
        print("💾 Saving to DB...")
        count = calendar_service.save_to_db(events, supabase)
        print(f"✅ Saved {count} new events")
    else:
        print("⚠️ No events to save")

if __name__ == "__main__":
    debug_calendar()
