
import os
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('flask-backend/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Missing credentials")
    exit(1)

supabase = create_client(url, key)

try:
    # Try to fetch one row with * to see keys
    print("Fetching one row to inspect keys...")
    response = supabase.table('research').select('*').limit(1).execute()
    if response.data:
        print("Keys found:", list(response.data[0].keys()))
    else:
        print("No data found, cannot inspect keys via generic select.")

except Exception as e:
    print(f"Error: {e}")
