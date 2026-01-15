
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('flask-backend/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

supabase = create_client(url, key)

try:
    # Delete ID 11 (Malformed ID)
    response = supabase.table('news').delete().eq('id', 11).execute()
    print(f"Deleted ID 11: {response.data}")
except Exception as e:
    print(e)
