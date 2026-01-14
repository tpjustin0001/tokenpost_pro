import os
import json
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from supabase import create_client, Client
from market_provider import market_data_service
from news_service import news_service
from ai_service import ai_service

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SCHEDULER")

class SchedulerService:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.supabase: Client = None
        
        # Init Supabase
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if url and key:
            self.supabase = create_client(url, key)
            logger.info("✅ Supabase Client Initialized")
        else:
            logger.warning("⚠️ SUPABASE_URL or SUPABASE_KEY missing. DB features disabled.")

    def update_market_analysis(self):
        """
        Job: Fetch Data -> Analyze(Grok) -> Save(Supabase)
        """
        logger.info(f"🔄 Starting Scheduled Job: Global Market Analysis ({datetime.now()})")
        
        try:
            # 1. Fetch Data
            market_data = market_data_service.get_global_metrics()
            
            # 2. Fetch News (Bitcoin + Crypto General)
            news_btc = news_service.get_crypto_news("BTC", name="Bitcoin")
            # Enhance: specific macro query could be added to news_service, but this is okay for now
            
            # 3. AI Analysis
            result = ai_service.analyze_global_market(market_data, news_list=news_btc)
            
            # 4. Save to DB
            if self.supabase:
                payload = {
                    "data": result,
                    "model_used": ai_service.model,
                    "created_at": datetime.now().isoformat(),
                    "is_latest": True
                }
                
                # Option A: Insert new row (Historical log)
                data, count = self.supabase.table("global_market_snapshots").insert(payload).execute()
                logger.info("✅ Successfully saved analysis to Supabase.")
                
            else:
                logger.info("ℹ️ Skipping DB Save (No Supabase Creds). Analysis Result: OK")
                
        except Exception as e:
            logger.error(f"❌ Scheduler Job Failed: {e}")

    def start(self):
        """Start the scheduler"""
        # Run immediately on startup (in a separate thread usually, or just once)
        # Note: In production with multiple workers (gunicorn), this might run multiple times.
        # Ideally, use a dedicated worker. For 'Hobby Plan', we accept slight redundancy or use a lock.
        # For simplicity: Add job interval=60 min.
        
        self.scheduler.add_job(self.update_market_analysis, 'interval', minutes=60, id='global_analysis_job')
        self.scheduler.start()
        logger.info("⏰ Scheduler Started (Interval: 60m)")

# Singleton
scheduler_service = SchedulerService()
