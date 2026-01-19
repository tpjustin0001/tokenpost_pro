from dotenv import load_dotenv
load_dotenv('.env')
import os
from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url:
    print("No Supabase URL")
    exit(1)

supabase = create_client(url, key)
res = supabase.table('eth_staking_metrics').select('created_at, entry_queue, exit_queue').limit(10).order('created_at', desc=True).execute()
print(f"Total Rows: {res.count} (approx)")
print("Recent Data:")
for row in res.data:
    print(f"Time: {row['created_at']}, Entry: {row['entry_queue']}, Exit: {row['exit_queue']}")
