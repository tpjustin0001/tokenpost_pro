from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import atexit
import logging
from datetime import datetime
import os
import json
from concurrent.futures import ThreadPoolExecutor

# Services
from market_provider import market_data_service
from news_service import news_service
from ai_service import ai_service
from eth_staking_service import eth_staking_service
from crypto_market.market_gate import run_market_gate_sync
from crypto_market.patterns.vcp import find_vcp_candidates
from crypto_market.screener import screener_service
from services import calendar_service

# Supabase
from supabase import create_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SCHEDULER")

class SchedulerService:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.supabase = None
        
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if url and key:
            try:
                self.supabase = create_client(url, key)
                logger.info("✅ Supabase Client Initialized for Scheduler")
            except Exception as e:
                logger.error(f"❌ Failed to init Supabase: {e}")

    def start(self):
        if not self.scheduler.running:
            # 1. ETH Staking (Every 10 mins)
            self.scheduler.add_job(self.update_eth_staking, IntervalTrigger(minutes=10), id='eth', replace_existing=True)
            
            # 2. Grok Market Pulse (Every 1 hour)
            self.scheduler.add_job(self.update_market_analysis, IntervalTrigger(hours=1), id='grok_pulse', replace_existing=True)
            
            # 3. GPT Deep Analysis (Every 4 hours) - NEW
            self.scheduler.add_job(self.update_deep_analysis, IntervalTrigger(hours=4), id='gpt_deep', replace_existing=True)

            # 4. News Feed (Every 15 mins)
            self.scheduler.add_job(self.update_news_feed, IntervalTrigger(minutes=15), id='news', replace_existing=True)
            
            # 5. Whale Alerts (Every 5 mins)
            self.scheduler.add_job(self.run_whale_monitor, IntervalTrigger(minutes=5), id='whale', replace_existing=True)

            # 6. Market Gate (Every 1 hour)
            self.scheduler.add_job(self.run_market_gate, IntervalTrigger(hours=1), id='gate', replace_existing=True)

            # 7. VCP Scan (Every 4 hours)
            self.scheduler.add_job(self.run_vcp_scan, IntervalTrigger(hours=4), id='vcp', replace_existing=True)

            # 8. Screener Scan (Every 1 hour)
            self.scheduler.add_job(self.run_screeners, IntervalTrigger(hours=1), id='screener', replace_existing=True)

            # 9. Calendar Events (Every 12 hours)
            self.scheduler.add_job(self.update_calendar_events, IntervalTrigger(hours=12), id='calendar', replace_existing=True)
            
            self.scheduler.start()
            logger.info("🚀 Scheduler started with all jobs.")
            atexit.register(lambda: self.scheduler.shutdown())

    def update_eth_staking(self):
        logger.info("⏰ Running ETH Staking Job...")
        try:
            metrics = eth_staking_service.get_staking_metrics()
            # Saving logic handled inside service or skipped here if service does it
        except Exception as e:
            logger.error(f"❌ ETH Job Failed: {e}")
    
    def run_screeners(self):
        logger.info("⏰ Running Crypto Screener Scan...")
        try:
            # 1. Breakout
            breakout = screener_service.run_breakout_scan()
            if self.supabase and breakout:
                self.supabase.table('analysis_results').insert({
                    'analysis_type': 'SCREENER_BREAKOUT',
                    'data_json': breakout,
                    'created_at': datetime.now().isoformat()
                }).execute()
                logger.info("✅ Screener Breakout Saved")

            # 2. Performance
            perf = screener_service.run_price_performance_scan()
            if self.supabase and perf:
                self.supabase.table('analysis_results').insert({
                    'analysis_type': 'SCREENER_PERFORMANCE',
                    'data_json': perf,
                    'created_at': datetime.now().isoformat()
                }).execute()
                logger.info("✅ Screener Performance Saved")

            # 3. Risk
            risk = screener_service.run_risk_scan()
            if self.supabase and risk:
                self.supabase.table('analysis_results').insert({
                    'analysis_type': 'SCREENER_RISK',
                    'data_json': risk,
                    'created_at': datetime.now().isoformat()
                }).execute()
                logger.info("✅ Screener Risk Saved")
        except Exception as e:
            logger.error(f"❌ Screener Job Failed: {e}")

    def update_market_analysis(self):
        """Grok Global Market Pulse"""
        logger.info("⏰ Running Grok Market Pulse...")
        try:
            # Reuse logic similar to app.py
            global_metrics = market_data_service.get_global_metrics()
            btc_data = market_data_service.get_asset_data('BTC')
            eth_data = market_data_service.get_asset_data('ETH')
            
            data_summary = {
                "Total Market Cap": f"${global_metrics.get('total_market_cap', 0):,.0f}",
                "BTC Dominance": f"{global_metrics.get('btc_dominance', 0):.1f}%",
                "BTC Price": f"${btc_data.get('current_price', 0):,.0f}",
                "ETH Price": f"${eth_data.get('current_price', 0):,.0f}",
                "Market Cap Change": f"{global_metrics.get('market_cap_change_24h', 0):.2f}%"
            }
            
            # Call Grok
            result = ai_service.analyze_global_market(data_summary, [])
            
            if self.supabase and result:
                self.supabase.table('global_market_snapshots').update({'is_latest': False}).eq('is_latest', True).execute()
                self.supabase.table('global_market_snapshots').insert({
                    'data': result,
                    'model_used': 'grok-4.1-fast (scheduler)',
                    'is_latest': True
                }).execute()
                logger.info("✅ Grok Pulse Saved")
        except Exception as e:
            logger.error(f"❌ Grok Pulse Failed: {e}")

    def update_deep_analysis(self):
        """GPT Deep Market Analysis"""
        logger.info("⏰ Running GPT Deep Analysis...")
        try:
            # Same data headers
            global_metrics = market_data_service.get_global_metrics()
            btc_data = market_data_service.get_asset_data('BTC')
            eth_data = market_data_service.get_asset_data('ETH')
            
            data_summary = {
                "Total Market Cap": f"${global_metrics.get('total_market_cap', 0):,.0f}",
                "BTC Dominance": f"{global_metrics.get('btc_dominance', 0):.1f}%",
                "BTC Price": f"${btc_data.get('current_price', 0):,.0f}",
                "ETH Price": f"${eth_data.get('current_price', 0):,.0f}",
                "Market Cap Change": f"{global_metrics.get('market_cap_change_24h', 0):.2f}%"
            }
            
            # Call GPT
            result = ai_service.analyze_global_deep_market(data_summary)
            
            if self.supabase and result:
                self.supabase.table('global_deep_analysis').update({'is_latest': False}).eq('is_latest', True).execute()
                self.supabase.table('global_deep_analysis').insert({
                    'data': result,
                    'model_used': 'gpt-4o (scheduler)',
                    'is_latest': True
                }).execute()
                logger.info("✅ GPT Deep Analysis Saved")
        except Exception as e:
            logger.error(f"❌ GPT Analysis Failed: {e}")

    def update_news_feed(self):
        logger.info("⏰ Running News Feed Update...")
        try:
            news_service.fetch_and_store_news(self.supabase)
        except Exception as e:
            logger.error(f"❌ News Job Failed: {e}")

    def run_whale_monitor(self):
        logger.info("⏰ Running Whale Monitor...")
        # Placeholder for whale monitor logic
        pass

    def run_market_gate(self):
        logger.info("⏰ Running Market Gate...")
        try:
            result = run_market_gate_sync()
            
            data = {}
            if hasattr(result, 'gate'): # Is Dataclass
                from dataclasses import asdict
                data = asdict(result)
                # Map gate -> gate_color
                data['gate_color'] = data['gate']
                # Summary from reasons
                data['summary'] = ", ".join(data['reasons'])
            elif isinstance(result, dict):
                data = result
            else:
                logger.error(f"Unknown Market Gate Result: {type(result)}")
                return

            if self.supabase and data:
                self.supabase.table('market_gate').insert({
                    'gate_color': data.get('gate_color'),
                    'score': data.get('score'),
                    'summary': data.get('summary'),
                    'metrics_json': data.get('metrics'),
                    'created_at': datetime.now().isoformat()
                }).execute()
                logger.info("✅ Market Gate Saved")
        except Exception as e:
            logger.error(f"❌ Market Gate Failed: {e}")

    def run_vcp_scan(self):
        logger.info("⏰ Running VCP Scan...")
        try:
            # Get Top 50 symbols for scan
            listings = market_data_service.get_crypto_listings(limit=50)
            symbols = [item['symbol'] for item in listings]
            
            candidates = find_vcp_candidates(symbols)
             
            if self.supabase:
                self.supabase.table('analysis_results').insert({
                    'analysis_type': 'VCP',
                    'data_json': candidates, 
                    'created_at': datetime.now().isoformat()
                }).execute()
                logger.info(f"✅ VCP Scan Saved: {len(candidates)} found")
        except Exception as e:
            logger.error(f"❌ VCP Scan Failed: {e}")

    def update_calendar_events(self):
        logger.info("⏰ Running Calendar Update...")
        try:
            events = calendar_service.fetch_investing_calendar()
            if events:
                count = calendar_service.save_to_db(events, self.supabase)
                logger.info(f"✅ Calendar Update Complete: {count} saved")
            else:
                logger.info("⚠️ No events found to save")
        except Exception as e:
            logger.error(f"❌ Calendar Job Failed: {e}")

scheduler_service = SchedulerService()
