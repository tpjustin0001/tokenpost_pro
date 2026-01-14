
import os
import json
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
        self.CACHE_TTL_GLOBAL = 3600
        self.CACHE_TTL_ASSET = 900

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
            # Using 'grok-beta' (or 'grok-2-latest' if beta is deprecated)
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
            print("🔄 Falling back to OpenAI for sentiment...")
            news_text = "\n".join([f"- {item['title']} ({item['source']})" for item in news_list])
            response = self.client_gpt.chat.completions.create(
                model="gpt-4o-mini",
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
        # Note: We are using GPT-4o-mini to structure the data, but we inject Grok's sentiment.
        # Ideally, we would use Grok for the whole thing if it supported JSON mode reliably.
        
        system_prompt = f"""
        You are a 'Crypto Social Pulse' Analyzer.
        
        INPUT CONTEXT:
        1. Market Data (Technical/Macro)
        2. Social Sentiment (AI Analysis): "{grok_sentiment}"
        
        TASK:
        Generate a "Social Pulse" report in STRICT JSON format.
        The content must be in KOREAN (except for usernames/handles and numbers).
        
        JSON Structure:
        {{
            "grok_saying": "A witty, edgy, and insightful one-liner about the market vibe. Be cynical but accurate. IN KOREAN.",
            "atmosphere_score": int(0-100), // 0=Extreme Fear, 100=Extreme Greed
            "atmosphere_label": "공포 (Fear) | 중립 (Neutral) | 탐욕 (Greed)",
            "market_keywords": ["#Keyword1", "#Keyword2", "#Keyword3"],
            "top_tweets": [
                {{ "author": "User Name", "handle": "@handle", "content": "Tweet text...", "time": "2m ago" }},
                {{ "author": "Analyst", "handle": "@analyst", "content": "Analysis...", "time": "15m ago" }},
                {{ "author": "News", "handle": "@news", "content": "Breaking...", "time": "1h ago" }}
            ],
            "whale_alerts": [
                {{ "symbol": "BTC", "type": "매수", "amount": "$120M", "time": "5분 전", "note": "바이낸스 입금" }},
                {{ "symbol": "ETH", "type": "매도", "amount": "$80M", "time": "12분 전", "note": "거래소 출금" }}
            ],
            "sectorAnalysis": [ {{ "name": "...", "signal": "...", "score": int, "insight": "..." }} ],
            "radar_data": [
                 {{ "label": "Macro", "value": int }},
                 {{ "label": "Technical", "value": int }},
                 {{ "label": "On-Chain", "value": int }},
                 {{ "label": "Sentiment", "value": int }},
                 {{ "label": "Innovation", "value": int }}
            ]
        }}
        """

        try:
            response = self.client_gpt.chat.completions.create(
                model="gpt-4o-mini",
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
                model="gpt-4o-mini", # Use GPT for structure
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
