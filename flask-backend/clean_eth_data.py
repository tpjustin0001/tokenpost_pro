from dotenv import load_dotenv
load_dotenv('.env')
import os
from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

# Count outliers
res = supabase.table('eth_staking_metrics').select('*', count='exact').gt('entry_queue', 200000).execute()
print(f"Found {res.count} outliers > 200,000")

if res.count > 0:
    del_res = supabase.table('eth_staking_metrics').delete().gt('entry_queue', 200000).execute()
    print(f"Delete Response Data Length: {len(del_res.data) if del_res.data else 0}")
    
    # Check again
    res2 = supabase.table('eth_staking_metrics').select('*', count='exact').gt('entry_queue', 200000).execute()
    print(f"Remaining Outliers: {res2.count}")
else:
    print("No outliers found.")
