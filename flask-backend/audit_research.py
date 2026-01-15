
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('flask-backend/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

try:
    print("Checking Research Table Data...")
    response = supabase.table('research').select('id', 'title', 'content', 'summary').order('created_at', desc=True).limit(10).execute()
    data = response.data
    
    if not data:
        print("No data found in research table.")
    else:
        for idx, item in enumerate(data):
            c_len = len(item.get('content') or "")
            s_len = len(item.get('summary') or "")
            print(f"[{idx+1}] ID: {item['id']} | Title: {item['title'][:20]}...")
            print(f"    - Content Length: {c_len} chars")
            print(f"    - Summary Length: {s_len} chars")
            if c_len == 0 and s_len > 0:
                print("    ⚠️ CONTENT IS EMPTY BUT SUMMARY EXISTS")
            elif c_len == 0 and s_len == 0:
                print("    ❌ BOTH EMPTY")

except Exception as e:
    print(f"Error: {e}")
