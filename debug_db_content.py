import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load env from flask-backend .env
backend_env_path = os.path.join(os.getcwd(), 'flask-backend', '.env')
load_dotenv(backend_env_path)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("❌ Error: SUPABASE_URL or SUPABASE_KEY not found")
    sys.exit(1)

supabase = create_client(url, key)

print("--- Checking 'news' table (Top 5) ---")
try:
    res = supabase.table("news").select("*").order("published_at", desc=True).limit(5).execute()
    for item in res.data:
        print(f"[{item['id']}] {item['published_at']} - {item['title']} (Source: {item['source']})")
except Exception as e:
    print(f"Error checking news: {e}")

print("\n--- Checking 'research' table (Top 5) ---")
try:
    res = supabase.table("research").select("*").order("created_at", desc=True).limit(5).execute()
    for item in res.data:
        print(f"[{item['id']}] {item['created_at']} - {item['title']} (Type: {item.get('category')})")
except Exception as e:
    print(f"Error checking research: {e}")
