
import os
from supabase import create_client
from dotenv import load_dotenv

# Load env
load_dotenv(".env.local")  # Try current dir first
load_dotenv("../.env.local") # Try parent dir

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Supabase credentials not found.")
    exit(1)

supabase = create_client(url, key)

email = "yoojei88@gmail.com"

print(f"Checking user: {email}...")

try:
    # 1. Check if user exists in 'users' table (or 'profiles' depending entirely on schema)
    # Based on previous context, we likely have a users table saving auth info
    response = supabase.table("users").select("*").eq("email", email).execute()
    
    if response.data:
        user = response.data[0]
        print(f"✅ User Found:")
        print(f"- ID: {user.get('id')}")
        print(f"- Email: {user.get('email')}")
        print(f"- Subscription: {user.get('subscription_tier') or user.get('subscription_status')}")
        print(f"- Role: {user.get('role')}")
        print(f"- Created At: {user.get('created_at')}")
    else:
        print("❌ User NOT found in public.users table.")
        
        # Check auth.users (if possible via service role, but likely restricted with anon key)
        # Usually checking public table is enough for app logic issues.

except Exception as e:
    print(f"Error querying DB: {e}")
