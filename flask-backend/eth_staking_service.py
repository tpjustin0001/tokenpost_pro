#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ETH Staking Intelligence Service
Beaconcha.in API Integration for Validator Queue & Staking Metrics
"""

import os
import requests
import logging
from datetime import datetime
from typing import Dict, Any, Optional

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ETH_STAKING")

# Constants
EPOCH_TIME_SECONDS = 384  # 6.4 minutes per epoch
VALIDATORS_PER_EPOCH_BASE = 4  # Base churn limit
ETH_PER_VALIDATOR = 32  # 32 ETH per validator
ETH_TOTAL_SUPPLY = 120_000_000  # Approximate ETH total supply

# Beaconcha.in API Base URL
BEACONCHAIN_API_BASE = "https://beaconcha.in/api/v1"


class ETHStakingService:
    """Service for fetching and calculating ETH staking metrics"""
    
    def __init__(self):
        self.api_base = BEACONCHAIN_API_BASE
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'TokenPost-PRO/1.0',
            'Accept': 'application/json'
        })
        
        # Optional API Key for higher rate limits
        api_key = os.environ.get("BEACONCHAIN_API_KEY")
        if api_key:
            self.session.headers['apikey'] = api_key
            logger.info("✅ Beaconcha.in API Key configured")
    
    def _make_request(self, endpoint: str, timeout: int = 30) -> Optional[Dict]:
        """Make API request with error handling"""
        try:
            url = f"{self.api_base}{endpoint}"
            response = self.session.get(url, timeout=timeout)
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'OK':
                return data.get('data')
            else:
                logger.warning(f"API returned non-OK status: {data}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Beaconcha.in API Error: {e}")
            return None
    
    def get_validator_queue(self) -> Dict[str, int]:
        """
        Fetch validator entry/exit queue from Beaconcha.in
        Returns: {beaconchain_entering, beaconchain_exiting, validatorscount}
        """
        data = self._make_request("/validators/queue")
        
        if data:
            return {
                'entry_queue': data.get('beaconchain_entering', 0),
                'exit_queue': data.get('beaconchain_exiting', 0),
                'validators_count': data.get('validatorscount', 0)
            }
        
        # Fallback mock data if API fails
        logger.warning("⚠️ Using fallback data for validator queue")
        return {
            'entry_queue': 80000,
            'exit_queue': 150,
            'validators_count': 980000
        }
    
    def get_epoch_stats(self) -> Dict[str, Any]:
        """
        Fetch latest epoch statistics
        Returns active validators count
        """
        data = self._make_request("/epoch/latest")
        
        if data:
            return {
                'active_validators': data.get('validatorscount', 0),
                'epoch': data.get('epoch', 0),
                'finalized': data.get('finalized', False)
            }
        
        return {'active_validators': 980000, 'epoch': 0, 'finalized': True}
    
    def calculate_churn_limit(self, active_validators: int) -> int:
        """
        Calculate the churn limit per epoch based on active validators
        Formula: max(4, active_validators // 65536)
        Note: EIP-7514 caps entry churn at 8, but exit is still based on this formula
        """
        return max(VALIDATORS_PER_EPOCH_BASE, active_validators // 65536)
    
    def calculate_wait_time(self, queue_length: int, churn_limit: int) -> Dict[str, Any]:
        """
        Calculate estimated wait time for queue processing
        Returns: {seconds, minutes, hours, days}
        """
        if queue_length == 0 or churn_limit == 0:
            return {'seconds': 0, 'minutes': 0, 'hours': 0, 'days': 0}
        
        epochs_needed = queue_length / churn_limit
        total_seconds = int(epochs_needed * EPOCH_TIME_SECONDS)
        
        return {
            'seconds': total_seconds,
            'minutes': round(total_seconds / 60, 1),
            'hours': round(total_seconds / 3600, 1),
            'days': round(total_seconds / 86400, 1)
        }
    
    def determine_signal(self, entry_wait_days: float, exit_wait_minutes: float) -> Dict[str, str]:
        """
        Determine trading signal based on queue dynamics
        
        🔴 매도 경보: exit_wait_days > 3 (이탈 급증)
        🟢 강력 홀딩: entry_wait_days > 10 AND exit_wait_minutes < 60
        🟡 중립: 그 외
        """
        exit_wait_days = exit_wait_minutes / 1440  # Convert to days
        
        if exit_wait_days > 3:
            return {
                'signal': 'SELL_ALERT',
                'signal_color': 'red',
                'signal_text': '매도 경보',
                'signal_emoji': '🔴'
            }
        elif entry_wait_days > 10 and exit_wait_minutes < 60:
            return {
                'signal': 'STRONG_HOLD',
                'signal_color': 'green',
                'signal_text': '강력 홀딩',
                'signal_emoji': '🟢'
            }
        else:
            return {
                'signal': 'NEUTRAL',
                'signal_color': 'yellow',
                'signal_text': '중립',
                'signal_emoji': '🟡'
            }
    
    def generate_ai_report(self, metrics: Dict[str, Any]) -> str:
        """
        Generate AI-style report text based on metrics
        """
        exit_queue_eth = metrics['exit_queue'] * ETH_PER_VALIDATOR
        entry_queue_eth = metrics['entry_queue'] * ETH_PER_VALIDATOR
        entry_wait_days = metrics['entry_wait']['days']
        staked_percentage = metrics['staked_percentage']
        
        # Determine pressure status
        pressure_status = "소멸" if exit_queue_eth < 1000 else "증가"
        
        # Determine market insight
        if staked_percentage > 25:
            market_insight = "공급 쇼크 가능성"
        elif staked_percentage > 20:
            market_insight = "안정적 잠금"
        else:
            market_insight = "유동성 충분"
        
        report = (
            f"이더리움 스테이킹 이탈 대기열이 {exit_queue_eth:,} ETH로 급감하며 "
            f"매도 압력이 **{pressure_status}**되었습니다. "
            f"반면 진입 대기열은 {entry_queue_eth:,} ETH로, "
            f"대기 시간만 **{entry_wait_days:.1f}일**에 달합니다. "
            f"현재 총 공급량의 **{staked_percentage:.2f}%**가 잠겨있어 "
            f"**{market_insight}**으로 분석됩니다."
        )
        
        return report
    
    def get_staking_metrics(self) -> Dict[str, Any]:
        """
        Main method: Fetch all metrics and calculate derived values
        """
        logger.info("🔄 Fetching ETH staking metrics...")
        
        # 1. Get queue data
        queue_data = self.get_validator_queue()
        entry_queue = queue_data['entry_queue']
        exit_queue = queue_data['exit_queue']
        
        # 2. Get active validators (from queue data or epoch stats)
        active_validators = queue_data.get('validators_count', 0)
        if active_validators == 0:
            epoch_stats = self.get_epoch_stats()
            active_validators = epoch_stats['active_validators']
        
        # 3. Calculate churn limit
        churn_limit = self.calculate_churn_limit(active_validators)
        
        # 4. Calculate wait times
        entry_wait = self.calculate_wait_time(entry_queue, churn_limit)
        exit_wait = self.calculate_wait_time(exit_queue, churn_limit)
        
        # 5. Calculate staked ETH
        total_staked_eth = active_validators * ETH_PER_VALIDATOR
        staked_percentage = (total_staked_eth / ETH_TOTAL_SUPPLY) * 100
        
        # 6. Determine signal
        signal_data = self.determine_signal(entry_wait['days'], exit_wait['minutes'])
        
        # Build metrics object
        metrics = {
            'entry_queue': entry_queue,
            'exit_queue': exit_queue,
            'entry_queue_eth': entry_queue * ETH_PER_VALIDATOR,
            'exit_queue_eth': exit_queue * ETH_PER_VALIDATOR,
            'entry_wait': entry_wait,
            'exit_wait': exit_wait,
            'entry_wait_days': entry_wait['days'],
            'exit_wait_minutes': exit_wait['minutes'],
            'active_validators': active_validators,
            'churn_limit': churn_limit,
            'total_staked_eth': total_staked_eth,
            'staked_percentage': staked_percentage,
            'staking_apr': 3.5,  # TODO: Fetch from API if available
            **signal_data,
            'timestamp': datetime.now().isoformat()
        }
        
        # 7. Generate AI report
        metrics['ai_report'] = self.generate_ai_report(metrics)
        
        logger.info(f"✅ ETH Staking Metrics: {signal_data['signal_text']} (Entry: {entry_wait['days']:.1f}d, Exit: {exit_wait['minutes']:.1f}m)")
        
        return metrics
    
    def save_to_db(self, metrics: Dict[str, Any], supabase_client) -> bool:
        """
        Save metrics to Supabase eth_staking_metrics table
        """
        if not supabase_client:
            logger.warning("⚠️ Supabase client not available, skipping save")
            return False
        
        try:
            payload = {
                'entry_queue': metrics['entry_queue'],
                'exit_queue': metrics['exit_queue'],
                'entry_wait_seconds': metrics['entry_wait']['seconds'],
                'exit_wait_seconds': metrics['exit_wait']['seconds'],
                'active_validators': metrics['active_validators'],
                'staking_apr': metrics.get('staking_apr', 0),
                'total_staked_eth': metrics['total_staked_eth']
            }
            
            supabase_client.table('eth_staking_metrics').insert(payload).execute()
            logger.info("💾 ETH Staking metrics saved to Supabase")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save ETH staking metrics: {e}")
            return False


# Singleton instance
eth_staking_service = ETHStakingService()
