
import os
import sys
from dotenv import load_dotenv

# Load Env
load_dotenv('.env.local')
load_dotenv('flask-backend/.env')

# Add path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.calendar_service import translate_text, get_client

def debug():
    key = os.getenv("OPENAI_API_KEY")
    print(f"Key: {key[:5] if key else 'None'}")
    
    client = get_client()
    print(f"Client: {client}")
    
    text = "SuperRare to Release Habitextures Collection on February 5"
    print(f"Translating: {text}")
    
    res = translate_text(text)
    print(f"Result: {res}")

if __name__ == "__main__":
    debug()
