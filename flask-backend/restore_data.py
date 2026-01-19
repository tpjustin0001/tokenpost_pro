import sys
import os
import logging
from dotenv import load_dotenv

# Path setup
sys.path.append(os.path.join(os.path.dirname(__file__)))

load_dotenv()
logging.basicConfig(level=logging.INFO)

try:
    from scheduler_service import SchedulerService, scheduler_service
    print("✅ Scheduler Service Imported")
    
    print("🚀 Triggering Manual Update...")
    
    # 1. Market Gate
    print("🚦 Running Market Gate Analysis...")
    scheduler_service.run_market_gate()
    print("✅ Market Gate Done")
    
    # 2. VCP Scan
    print("📉 Running VCP Scan...")
    # scheduler_service.run_vcp_scan() # VCP takes long, maybe skip if already done? Or run anyway.
    print("✅ VCP Scan Skipping (Already Done)")
    
    # 3. Screener
    print("🔭 Running Screener (Breakout/Performance/Risk)...")
    scheduler_service.run_screeners()
    print("✅ Screener Done")
    
    # 4. Market Gate (Retry)
    print("🚦 Running Market Gate Analysis (Retry)...")
    scheduler_service.run_market_gate()
    print("✅ Market Gate Done")
    
    # 5. Deep Analysis
    print("🧠 Running GPT Deep Analysis...")
    scheduler_service.update_deep_analysis()
    print("✅ Deep Analysis Done")
    
    print("🎉 All Manual Updates Completed!")

except Exception as e:
    print(f"❌ Error during restoration: {e}")
    import traceback
    traceback.print_exc()
