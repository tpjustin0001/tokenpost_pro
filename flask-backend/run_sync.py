
import os
import sys
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime

# Load Env
load_dotenv('.env.local')
load_dotenv('flask-backend/.env')

# Add path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.calendar_service import fetch_investing_calendar

def run_sync():
    print("🚀 Starting Local Calendar Sync (Manual Mode)...")
    
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        print(f"🔑 OpenAI Key loaded: {openai_key[:5]}...")
    else:
        print("❌ OpenAI Key NOT loaded")
    
    # 1. Setup Supabase
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    if not url or not key:
        print("❌ Supabase credentials missing locally.")
        return

    supabase = create_client(url, key)
    
    # 2. Fetch Data
    print("📡 Fetching data from Coindar RSS (with AI Translation)...")
    events = fetch_investing_calendar()
    print(f"✅ Fetched {len(events)} events.")
    
    if not events:
        return

    # 3. Save to Supabase
    # Collect all unique dates
    dates = set(e['event_date'] for e in events)
    
    for d in dates:
        print(f"🧹 Clearing data for {d}...")
        supabase.table('calendar_events').delete().eq('event_date', d).execute()
    
    # Insert
    res = supabase.table('calendar_events').insert(events).execute()
    print("✅ Sync Complete!")
    # print(res.data)

if __name__ == "__main__":
    run_sync()
