import os
import sys
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scheduler_service import scheduler_service

if __name__ == "__main__":
    print("🚀 Starting manual Validator Queue Sync...")
    try:
        scheduler_service.sync_validator_queue_history()
        print("✅ Sync completed successfully.")
    except Exception as e:
        print(f"❌ Sync failed: {e}")
