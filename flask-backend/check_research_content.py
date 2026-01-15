
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('flask-backend/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Supabase Config Missing")
    exit()

supabase = create_client(url, key)

# Fetch latest research
try:
    response = supabase.table('research').select('*').order('created_at', desc=True).limit(5).execute()
    data = response.data
    
    print(f"Fetched {len(data)} items.")
    for item in data:
        content_len = len(item.get('content') or "")
        print(f"ID: {item['id']} | Title: {item['title']} | Content Length: {content_len}")
        if content_len > 0:
            print(f"Sample Content: {item['content'][:50]}...")
        else:
            print("No Content")
        print("-" * 20)
except Exception as e:
    print(e)
