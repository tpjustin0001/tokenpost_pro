
import os
import json
import requests
from datetime import datetime
from openai import OpenAI


class AIService:
    def __init__(self):
        self.xai_key = os.environ.get("XAI_API_KEY")
        self.openai_key = os.environ.get("OPENAI_API_KEY")
        
        self.client_gpt = None
        self.client_grok = None
        
        # 1. Init OpenAI (Main Processor)
        if self.openai_key:
            self.client_gpt = OpenAI(api_key=self.openai_key)
        
        # 2. Init xAI (Sentiment Engine)
        if self.xai_key:
            self.client_grok = OpenAI(
                api_key=self.xai_key,
                base_url="https://api.x.ai/v1"
            )

        # In-memory Cache
        self._cache = {}
        self.CACHE_TTL_GLOBAL = 300 # Reduced to 5 mins for "live" feel
        self.CACHE_TTL_ASSET = 300

    def _fetch_real_fear_greed(self):
        """Fetch real Fear & Greed Index from Alternative.me API"""
        try:
            response = requests.get("https://api.alternative.me/fng/?limit=1", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data and 'data' in data and len(data['data']) > 0:
                    fng = data['data'][0]
                    return {
                        'score': int(fng['value']),
                        'label': fng['value_classification'],  # e.g., "Greed", "Extreme Fear"
                        'timestamp': fng['timestamp']
                    }
        except Exception as e:
            print(f"⚠️ Fear & Greed API Error: {e}")
        return None

    @property
    def model(self):
        return "gpt-4o + grok-beta"

    def _get_grok_sentiment(self, news_list):
        """
        Use Grok (xAI) to extract deep social sentiment from news.
        """
        if not self.client_grok or not news_list:
            if not self.client_grok:
                print("⚠️ xAI Client not initialized (Missing XAI_API_KEY)")
            return "Grok AI: No sentiment data available."

        news_text = "\n".join([f"- {item['title']} ({item['source']})" for item in news_list])
        
        try:
            # Using 'grok-beta' as it is the stable endpoint for now
            response = self.client_grok.chat.completions.create(
                model="grok-beta", 
                messages=[
                    {"role": "system", "content": "You are Grok, a real-time Social Sentiment Engine. Analyze the crypto news headlines. Output a brief, witty, uncensored, and slightly edgy paragraph about the current market 'vibe' and crowd psychology. Be bold. Output in KOREAN."},
                    {"role": "user", "content": f"Headlines:\n{news_text}"}
                ],
                temperature=0.9
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"❌ Grok Sentiment Failed: {e}")
            # Fallback to OpenAI if Grok fails key/quota
            return self._get_openai_sentiment_fallback(news_list)

    def _get_openai_sentiment_fallback(self, news_list):
        """Fallback to OpenAI if Grok fails"""
        try:
            print("🔄 Falling back to OpenAI (GPT-4o) for sentiment...")
            news_text = "\n".join([f"- {item['title']} ({item['source']})" for item in news_list])
            response = self.client_gpt.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a crypto sentiment analyzer. Output a witty, edgy paragraph about market vibe in Korean."},
                    {"role": "user", "content": f"Headlines:\n{news_text}"}
                ],
                temperature=0.8
            )
            return response.choices[0].message.content
        except Exception as e:
            return "Data analysis failed."

    def analyze_global_market(self, market_data, news_list=[]):
        cache_key = 'GLOBAL_MARKET_V3'
        cached = self._get_cached_data(cache_key, self.CACHE_TTL_GLOBAL)
        if cached: return cached

        if not self.client_gpt:
            return self._get_mock_global_analysis()

        # Step 1: Get Grok Sentiment
        grok_sentiment = self._get_grok_sentiment(news_list)

        # Step 2: GPT Main Analysis (acting as parsing layer or using Grok directly if possible)
        # Note: We are using GPT-4o to structure the data, but we inject Grok's sentiment.
        # Ideally, we would use Grok for the whole thing if it supported JSON mode reliably.
        
        system_prompt = f"""
        You are a 'Crypto Social Pulse' Analyzer.
        
        INPUT CONTEXT:
        1. Market Data (Technical/Macro)
        2. Social Sentiment (AI Analysis): "{grok_sentiment}"
        
        TASK:
        Generate a "Social Pulse" report in STRICT JSON format.
        The content must be in KOREAN (except for usernames/handles and numbers).
        ALL PRICES MUST BE IN USD (convert if necessary or strictly assume USD for global data).
        
        JSON Structure:
        {{
            "overallScore": int(0-100), // Integrated Market Score
            "marketPhase": "Accumulation | Markup | Distribution | Markdown",
            "summary": "Comprehensive Macro Summary (Korean). Analyze Fed data, unexpected events, and global liquidity.",
            "grok_saying": "A witty, edgy, and insightful one-liner about the market vibe. Be cynical but accurate. IN KOREAN.",
            "atmosphere_score": int(0-100),
            "atmosphere_label": "공포 (Fear) | 중립 (Neutral) | 탐욕 (Greed)",
            "market_keywords": ["#Keyword1", "#Keyword2", "#Keyword3"],
            "top_tweets": [],
            "whale_alerts": [],
            "macro_factors": [
                {{ "name": "Interest Rates", "impact": "Positive/Neutral/Negative", "detail": "Analyze impact of Fed rates..." }},
                {{ "name": "Global Liquidity", "impact": "Positive/Neutral/Negative", "detail": "M2 supply trends..." }},
                {{ "name": "Geopolitical", "impact": "Positive/Neutral/Negative", "detail": "Wars or regulations..." }}
            ],
            "sectorAnalysis": [ 
                {{ "name": "Layer 1", "signal": "bullish/bearish/neutral", "score": int, "insight": "..." }},
                {{ "name": "DeFi", "signal": "...", "score": int, "insight": "..." }},
                {{ "name": "AI", "signal": "...", "score": int, "insight": "..." }},
                {{ "name": "RWA", "signal": "...", "score": int, "insight": "..." }}
            ],
            "onchain_signals": [
                {{ "metric": "Exchange Netflow", "signal": "bullish/bearish/neutral", "value": "Inflow/Outflow High/Low", "comment": "..." }},
                {{ "metric": "Miner Position", "signal": "...", "value": "...", "comment": "..." }}
            ],
            "radar_data": [
                 {{ "label": "Macro", "value": int }},
                 {{ "label": "Technical", "value": int }},
                 {{ "label": "On-Chain", "value": int }},
                 {{ "label": "Sentiment", "value": int }},
                 {{ "label": "Innovation", "value": int }}
            ],
            "risks": ["Risk 1", "Risk 2", "Risk 3"],
            "opportunities": ["Opp 1", "Opp 2", "Opp 3"],
            "recommendation": "Main Strategy (e.g. DCA, Hold, Take Profit)",
            "actionable_insight_summary": "One sentence actionable advice for the user."
        }}
        """

        try:
            response = self.client_gpt.chat.completions.create(
                model="gpt-4o",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Market Data: {str(market_data)}"}
                ]
            )
            
            result_json = response.choices[0].message.content
            parsed_result = json.loads(result_json)
            parsed_result['timestamp'] = datetime.now().isoformat()
            parsed_result['recent_news'] = news_list
            parsed_result['grok_sentiment_raw'] = grok_sentiment # Store raw Grok output if needed
            
            # OVERRIDE with Real Fear & Greed Index from Alternative.me
            real_fng = self._fetch_real_fear_greed()
            if real_fng:
                print(f"✅ Real F&G: {real_fng['score']} ({real_fng['label']})")
                parsed_result['atmosphere_score'] = real_fng['score']
                # Translate label to Korean
                label_map = {
                    'Extreme Fear': '극단적 공포',
                    'Fear': '공포',
                    'Neutral': '중립',
                    'Greed': '탐욕',
                    'Extreme Greed': '극단적 탐욕'
                }
                parsed_result['atmosphere_label'] = label_map.get(real_fng['label'], real_fng['label'])
            
            self._set_cache_data(cache_key, parsed_result)
            return parsed_result

        except Exception as e:
            print(f"Hybrid Analysis Failed: {e}")
            return self._get_mock_global_analysis()

    def analyze_asset(self, symbol, asset_data_summary, news_list=[]):
        cache_key = f'ASSET_{symbol}'
        cached = self._get_cached_data(cache_key, self.CACHE_TTL_ASSET)
        if cached: return cached

        if not self.client_gpt:
            return self._get_mock_asset_analysis(symbol)

        # Step 1: Grok Sentiment
        grok_sentiment = self._get_grok_sentiment(news_list)

        # Step 2: GPT Analysis
        system_prompt = f"""
        Analyze {symbol}.
        
        Social Sentiment (Grok): "{grok_sentiment}"
        
        Return STRICT KOREAN JSON.
        
        JSON Structure:
        {{
            "assetName": "{symbol}",
            "currency": "Use the currency provided in data (USD or KRW)",
            "category": "...",
            "overallScore": float(0-10),
            "summary": "...",
            "detailed_analysis": {{ "market_context": "...", "technical_outlook": "...", "on_chain_verdict": "..." }},
            "radarData": [ {{ "label": "펀더멘탈", "value": int }} ... ],
            "metrics": [], "risks": [], "opportunities": [], "recommendation": "..."
        }}
        """

        try:
            response = self.client_gpt.chat.completions.create(
                model="gpt-4o", # Use GPT for structure
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Data: {str(asset_data_summary)}"}
                ]
            )
            
            result_json = response.choices[0].message.content
            parsed_result = json.loads(result_json)
            parsed_result['timestamp'] = datetime.now().isoformat()
            parsed_result['recent_news'] = news_list
            
            self._set_cache_data(cache_key, parsed_result)
            return parsed_result
        except Exception as e:
            print(f"Asset Analysis Failed: {e}")
            return self._get_mock_asset_analysis(symbol)

    def _get_cached_data(self, key, ttl):
        if key in self._cache:
            entry = self._cache[key]
            age = (datetime.now() - entry['time']).total_seconds()
            if age < ttl:
                return entry['data']
        return None

    def _set_cache_data(self, key, data):
        self._cache[key] = {
            'data': data,
            'time': datetime.now()
        }

    def _get_mock_global_analysis(self):
        return {
            "overallScore": 65,
            "marketPhase": "Accumulation",
            "summary": "AI 서비스 연결이 원활하지 않습니다. 기본 데이터만 제공됩니다. 현재 시장은 주요 지지선 위에서 횡보하며 다음 방향성을 모색하고 있습니다.",
            "macro_factors": [
                {"name": "Interest Rates", "impact": "Neutral", "detail": "금리 정책 불확실성 지속"},
                {"name": "Inflation", "impact": "Negative", "detail": "CPI 데이터 주시 필요"}
            ],
            "radar_data": [
                {"label": "Macro", "value": 60},
                {"label": "Technical", "value": 70},
                {"label": "On-Chain", "value": 65},
                {"label": "Sentiment", "value": 50},
                {"label": "Innovation", "value": 80}
            ],
            "sectorAnalysis": [
                {"name": "DeFi", "signal": "Accumulate", "score": 75, "insight": "TVL 상승 추세 유지"},
                {"name": "GameFi", "signal": "Watch", "score": 60, "insight": "신규 유저 유입 정체"}
            ],
            "onchain_signals": [
                {"metric": "Exchange Inflow", "signal": "Bullish", "value": "Low", "comment": "매도 압력 감소"}
            ],
            "risks": ["규제 불확실성", "거시경제 위축"],
            "opportunities": ["비트코인 반감기", "이더리움 업그레이드"],
            "recommendation": "DCA (분할 매수) 전략 유지",
            "actionable_insight_summary": "단기 변동성에 주의하되 중장기적 관점의 매집 유효",
            "timestamp": datetime.now().isoformat(),
            "recent_news": [],
            
            # OpenAI/Grok Fallback Fields
            "grok_saying": "AI 연결이 지연되고 있습니다. 잠시 후 다시 확인해주세요.",
            "atmosphere_score": 50,
            "atmosphere_label": "중립 (Neutral)",
            "market_keywords": ["#Bitcoin", "#Crypto", "#HODL"],
            "top_tweets": [],
            "whale_alerts": []
        }

    def _get_mock_asset_analysis(self, symbol, error_msg=None):
        return {
            "assetName": symbol,
            "category": "Crypto",
            "overallScore": 5.0,
            "summary": error_msg or "AI 분석을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.",
            "detailed_analysis": {
                "market_context": "데이터 부족",
                "technical_outlook": "데이터 부족",
                "on_chain_verdict": "데이터 부족"
            },
            "radarData": [
                {"label": "펀더멘탈", "value": 50},
                {"label": "모멘텀", "value": 50},
                {"label": "기술적분석", "value": 50},
                {"label": "검색량", "value": 50},
                {"label": "혁신성", "value": 50}
            ],
            "metrics": [],
            "risks": [],
            "opportunities": [],
            "recommendation": "Hold",
            "timestamp": datetime.now().isoformat()
        }

# Singleton instance
ai_service = AIService()
