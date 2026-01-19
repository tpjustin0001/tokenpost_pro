import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

def check_db():
    print("🔎 Checking DB Data...")
    if not url or not key:
        print("Error: SUPABASE_URL or SUPABASE_KEY not found in env")
        return

    supabase: Client = create_client(url, key)
    
    res = supabase.table('calendar_events').select('title').limit(5).execute()
    for item in res.data:
        print(f"📄 {item['title']}")

if __name__ == "__main__":
    check_db()
