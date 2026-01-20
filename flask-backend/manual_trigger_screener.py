
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scheduler_service import scheduler_service

if __name__ == "__main__":
    print("[START] Triggering Screener Scan Manually...")
    try:
        scheduler_service.run_screeners()
        print("[OK] Screener Scan Complete and Saved to Supabase.")
    except Exception as e:
        print(f"[ERROR] Error running screener: {e}")
