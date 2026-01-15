
import os
from supabase import create_client
from dotenv import load_dotenv
import json

load_dotenv('flask-backend/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

supabase = create_client(url, key)

try:
    # Fetch latest markers (news where show_on_chart is true)
    # Note: Column might be 'show_on_chart' or similar in 'news' or 'insights' table?
    # Based on API docs, it's 'news' table (or 'insights' mapped). checking 'news' first or 'research' based on recent work.
    # Actually API docs say Markers are 'news' type.
    
    # Let's check 'news' table
    print("Checking 'news' table for markers...")
    response = supabase.table('news').select('*').eq('show_on_chart', True).order('created_at', desc=True).limit(5).execute()
    
    if not response.data:
        print("No markers found in 'news' table. Checking 'research' table...")
        response = supabase.table('research').select('*').eq('show_on_chart', True).order('created_at', desc=True).limit(5).execute()
        
    for item in response.data:
        print(f"ID: {item['id']} | Title: {item['title'][:30]}... | Time: {item['created_at']} | Coin: {item.get('related_coin')}")

except Exception as e:
    print(f"Error: {e}")
