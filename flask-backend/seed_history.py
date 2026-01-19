import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Env vars missing")
    exit(1)

supabase = create_client(url, key)

def seed():
    with open('historical_data.json', 'r') as f:
        data = json.load(f)

    print(f"Processing {len(data)} records...")
    
    # DELETE existing data
    try:
        print("Clearing existing data...")
        supabase.table('eth_staking_metrics').delete().neq('entry_queue', -1).execute() 
    except Exception as e:
        print(f"Error clearing data: {e}")
        
    records = []
    
    for item in data:
        # Item keys: date, validators, entry_queue, ...
        # Our DB columns: entry_queue (count), exit_queue (count), entry_queue_eth, exit_queue_eth, active_validators, created_at
             
        entry_queue_eth = item.get('entry_queue', 0)
        exit_queue_eth = item.get('exit_queue', 0)
        
        # Calculate counts
        entry_queue_count = int(entry_queue_eth / 32)
        exit_queue_count = int(exit_queue_eth / 32)
        
        active_validators = item.get('validators', 0)
        
        # Date is YYYY-MM-DD. Set time to 12:00 UTC
        created_at = f"{item['date']}T12:00:00+00:00"
        
        records.append({
            'entry_queue': entry_queue_count,
            'exit_queue': exit_queue_count,
            'entry_queue_eth': entry_queue_eth,
            'exit_queue_eth': exit_queue_eth,
            'active_validators': active_validators,
            'staking_apr': item.get('apr') or 3.5, 
            'total_staked_eth': item.get('staked_amount', active_validators * 32),
            'staked_percentage': item.get('staked_percent', 0),
            'created_at': created_at,
            'entry_wait_days': item.get('entry_wait', 0),
            'entry_wait_seconds': int(item.get('entry_wait', 0) * 86400), # Not null constraint
            'exit_wait_minutes': (item.get('exit_wait') or 0) * 1440,
            'exit_wait_seconds': int((item.get('exit_wait') or 0) * 86400) # Not null constraint
        })
        
    # Batch insert
    batch_size = 100
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        try:
            supabase.table('eth_staking_metrics').insert(batch).execute()
            print(f"Inserted batch {i} - {i+len(batch)}")
        except Exception as e:
            print(f"Error inserting batch {i}: {e}")

if __name__ == "__main__":
    seed()
