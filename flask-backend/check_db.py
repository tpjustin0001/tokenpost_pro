
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

def check_db():
    print("🔎 Checking DB Data...")
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    supabase = create_client(url, key)
    
    res = supabase.table('calendar_events').select('title').limit(5).execute()
    for item in res.data:
        print(f"📄 {item['title']}")

if __name__ == "__main__":
    check_db()
