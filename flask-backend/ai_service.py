
import os
import json
from datetime import datetime
from openai import OpenAI

class AIService:
    def __init__(self):
        self.api_key = os.environ.get("OPENAI_API_KEY")
        self.client = None
        
        # In-memory Cache
        # Structure: { 'key': {'data': dict, 'timestamp': datetime} }
        self._cache = {}
        self.CACHE_TTL_GLOBAL = 3600  # 1 hour
        self.CACHE_TTL_ASSET = 900    # 15 minutes
        
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            print("⚠️ WARNING: OPENAI_API_KEY not found. AI features will use mock data.")

    def _get_cached_data(self, key, ttl_seconds):
        """Retrieve data from cache if valid"""
        if key in self._cache:
            cached = self._cache[key]
            age = (datetime.now() - cached['timestamp']).total_seconds()
            if age < ttl_seconds:
                return cached['data']
        return None

    def _set_cache_data(self, key, data):
        """Store data in cache"""
        self._cache[key] = {
            'data': data,
            'timestamp': datetime.now()
        }

    def _get_mock_global_analysis(self):
        """Fallback mock data for global analysis"""
        return {
            'overallScore': 0,
            'marketPhase': 'AI 연결 실패',
            'summary': '⚠️ AI 분석 서버에 연결할 수 없거나 API 키가 유효하지 않습니다. .env 설정을 확인해주세요.',
            'marketHealth': [
                {'label': '펀더멘탈', 'value': 50},
                {'label': '기술적', 'value': 50},
                {'label': '온체인', 'value': 50},
                {'label': '센티멘트', 'value': 50},
                {'label': '혁신성', 'value': 50}
            ],
            'sectorAnalysis': [],
            'keyMetrics': [],
            'risks': ['AI Service Unavailable'],
            'opportunities': [],
            'recommendation': '시스템 관리자에게 문의하세요.',
            'timestamp': datetime.now().isoformat()
        }

    def _get_mock_asset_analysis(self, symbol, error_message=None):
        """Fallback mock data for asset analysis"""
        if not error_message:
            error_message = f'⚠️ {symbol}에 대한 AI 분석을 생성할 수 없습니다. (API Key Error or Quota Exceeded)'
            
        return {
            'assetName': symbol,
            'category': 'Example',
            'overallScore': 0,
            'summary': error_message,
            'detailed_analysis': {
                'market_context': '데이터 없음',
                'technical_outlook': '데이터 없음',
                'on_chain_verdict': '데이터 없음'
            },
            'radarData': [
                {'label': '펀더멘탈', 'value': 0},
                {'label': '기술적', 'value': 0},
                {'label': '온체인', 'value': 0},
                {'label': '센티멘트', 'value': 0},
                {'label': '혁신성', 'value': 0}
            ],
            'metrics': [],
            'risks': [],
            'opportunities': [],
            'recommendation': 'N/A',
            'timestamp': datetime.now().isoformat()
        }

    def analyze_global_market(self, market_data, news_list=[]):
        """
        Analyze the global crypto market using GPT-4o-mini.
        Cache Key: 'GLOBAL_MARKET'
        """
        cache_key = 'GLOBAL_MARKET'
        
        cached = self._get_cached_data(cache_key, self.CACHE_TTL_GLOBAL)
        if cached:
            return cached

        if not self.client:
            return self._get_mock_global_analysis()

        # Format News
        news_text = "No recent news found."
        if news_list:
            news_text = "\n".join([f"- [{item['source']}] {item['title']}" for item in news_list])

        system_prompt = f"""
        You are a seasoned Macro Crypto Strategist (Tier 1 Institutional Analyst). 
        Analyze the global crypto market structure based on the provided data and news.
        
        Recent Global News Headlines (English):
        {news_text}
        
        Instructions:
        1. Synthesize market data with global news sentiment.
        2. Provide a strategic outlook (Bullish/Neutral/Bearish) with clear reasoning.
        3. Return the result in STRICT, PROFESSIONAL KOREAN (Economist Tone).
        
        CRITICAL STYLE GUIDELINES:
        - Glossary: Use "온체인" (not 온인), "이동평균선" (not 이동 평균), "상승세" (not 상상세).
        - Formatting: Always add leading zero for decimals (e.g., "0.86%" not ".86%").
        - Tone: Professional, authoritative, macro-focused.
 
        JSON Structure (v3.0):
        {{
            "overallScore": float(0-100),
            "marketPhase": "Accumulation (매집) | Markup (상승) | Distribution (분산) | Markdown (하락)",
            "summary": "High-level market summary (2-3 sentences). Mention KEY NEWS & MACRO IMPACT.",
            "macro_factors": [
                {{ "name": "e.g. Fed Policy / Inflation / ETF Flows", "impact": "Positive | Negative | Neutral", "detail": "Brief explanation" }},
                {{ "name": "Global Liquidity", "impact": "...", "detail": "..." }}
            ],
            "radar_data": [
                {{ "label": "Macro", "value": int(0-100) }},
                {{ "label": "Technical", "value": int(0-100) }},
                {{ "label": "On-Chain", "value": int(0-100) }},
                {{ "label": "Sentiment", "value": int(0-100) }},
                {{ "label": "Innovation", "value": int(0-100) }}
            ],
            "sectorAnalysis": [
                {{ "name": "e.g. AI / RWA / Meme / L1", "signal": "bullish | bearish | neutral", "score": int(0-100), "insight": "Why?" }}
            ],
            "onchain_signals": [
                {{ "metric": "e.g. Exchange Net Flow", "signal": "bullish | bearish", "value": "Low Inflow", "comment": "Whales accumulating" }},
                {{ "metric": "MVRV Ratio", "signal": "...", "value": "1.8", "comment": "Undervalued zone" }}
            ],
            "risks": ["Specific Risk 1", "Specific Risk 2"],
            "opportunities": ["Specific Opp 1", "Specific Opp 2"],
            "recommendation": "Aggressive Long | Conservative Buy | Hold (Cash) | Short",
            "actionable_insight_summary": "One sentence direct strategy advice."
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Global Market Data:\n{str(market_data)}"}
                ],
                temperature=0.2
            )
            
            result_json = response.choices[0].message.content
            parsed_result = json.loads(result_json)
            parsed_result['timestamp'] = datetime.now().isoformat()
            
            # Attach news to result for Frontend
            parsed_result['recent_news'] = news_list
            
            self._set_cache_data(cache_key, parsed_result)
            return parsed_result

        except Exception as e:
            print(f"AI Global Analysis Failed: {e}")
            return self._get_mock_global_analysis()

    def analyze_asset(self, symbol, asset_data_summary, news_list=[]):
        """
        Analyze a specific asset using GPT-4o-mini.
        Cache Key: 'ASSET_{SYMBOL}'
        """
        cache_key = f'ASSET_{symbol}'
        
        # 1. Check Cache (Skip if news is critical? No, cache news too effectively)
        # Simplification: We cache the *result* which includes news insights.
        # But if news updates, we might want fresh data. 
        # For now, keep 15m cache.
        cached = self._get_cached_data(cache_key, self.CACHE_TTL_ASSET)
        if cached:
            return cached

        if not self.client:
            return self._get_mock_asset_analysis(symbol)

        # Format News for Prompt
        news_text = "No recent news found."
        if news_list:
            news_text = "\n".join([f"- [{item['source']}] {item['title']}" for item in news_list])

        system_prompt = f"""
        You are an expert crypto analyst. Analyze {symbol} based on market data AND recent news.
        
        Recent News Headlines (Global/English):
        {news_text}
        
        Instructions:
        1. Read the English news headlines to understand global sentiment.
        2. Synthesize this with technical data.
        3. Return the final analysis in STRICT, PROFESSIONAL KOREAN.
        
        CRITICAL STYLE GUIDELINES:
        - Glossary: Use "온체인" (not 온인), "이동평균선" (not 이동 평균), "상승세" (not 상상세).
        - Formatting: Always add leading zero for decimals (e.g., "0.86%" not ".86%").
        - Tone: Professional, objective, financial analyst tone.
        
        JSON Structure:
        {{
            "assetName": "{symbol}",
            "category": "Determine likely category (L1, L2, DeFi, AI, Meme, etc.)",
            "overallScore": float(0-10),
            "summary": "1-2 sentence summary. MENTION BIG NEWS IF ANY.",
            "detailed_analysis": {{
                "market_context": "Explain the price action and NEWS IMPACT.",
                "technical_outlook": "...",
                "on_chain_verdict": "..."
            }},
            "radarData": [
                {{"label": "펀더멘탈", "value": int(0-100)}},
                {{"label": "기술적", "value": int(0-100)}},
                {{"label": "온체인", "value": int(0-100)}},
                {{"label": "센티멘트", "value": int(0-100)}},
                {{"label": "혁신성", "value": int(0-100)}}
            ],
            "metrics": [
                {{"label": "Metric Name", "value": "...", "signal": "bullish"|"neutral"|"bearish", "comment": "..."}}
            ],
            "risks": ["...", "..."],
            "opportunities": ["...", "..."],
            "recommendation": "Strong Buy | Buy | Hold | Neutral | Sell"
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Asset Data for {symbol}:\n{str(asset_data_summary)}"}
                ],
                temperature=0.2 # Minimized for consistency
            )
            
            result_json = response.choices[0].message.content
            parsed_result = json.loads(result_json)
            parsed_result['timestamp'] = datetime.now().isoformat()
            
            # Attach the raw news list to the result so frontend can display it
            parsed_result['recent_news'] = news_list
            
            # Save to Cache
            self._set_cache_data(cache_key, parsed_result)
            
            return parsed_result

        except Exception as e:
            print(f"AI Asset Analysis Failed: {e}")
            return self._get_mock_asset_analysis(symbol)

# Singleton instance
ai_service = AIService()
