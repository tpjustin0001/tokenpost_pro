
import os
import json
import re
import requests
from datetime import datetime, timedelta
from openai import OpenAI

# xAI SDK for Agent Tools API (replaces deprecated search_parameters)
try:
    from xai_sdk import Client as XAIClient
    from xai_sdk.chat import user
    from xai_sdk.tools import x_search
    XAI_SDK_AVAILABLE = True
except ImportError:
    XAI_SDK_AVAILABLE = False
    print("⚠️ xai_sdk not installed - Grok live search disabled")


class AIService:
    def __init__(self):
        self.xai_key = os.environ.get("XAI_API_KEY")
        self.openai_key = os.environ.get("OPENAI_API_KEY")
        
        self.client_gpt = None
        self.client_grok = None
        
        # 1. Init OpenAI (Main Processor)
        if self.openai_key:
            self.client_gpt = OpenAI(api_key=self.openai_key)
        
        # 2. Init xAI (Sentiment Engine) using new SDK
        self.client_grok_sdk = None
        if self.xai_key and XAI_SDK_AVAILABLE:
            try:
                self.client_grok_sdk = XAIClient(api_key=self.xai_key)
                print("✅ xAI SDK Client initialized")
            except Exception as e:
                print(f"⚠️ xAI SDK init failed: {e}")
        
        # Legacy OpenAI-compatible client (for non-search tasks)
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
        return "gpt-4o + grok-4.1"  # Grok 4.1 모델 적용됨

    def _clean_and_parse_json(self, raw_text):
        """
        LLM이 ```json ... ``` 형태로 응답할 경우 마크다운 태그 제거 후 파싱.
        JSON 파싱 실패 시 None 반환.
        """
        try:
            if not raw_text:
                return None
            text = re.sub(r"```json\s*", "", raw_text)  # 시작 태그 제거
            text = re.sub(r"```\s*$", "", text)          # 끝 태그 제거
            text = re.sub(r"```", "", text)              # 중간에 남은 태그 제거
            return json.loads(text.strip())
        except Exception as e:
            print(f"⚠️ JSON Parse Error: {e}")
            return None

    def _get_grok_social_pulse(self, market_context=None):
        """
        Use Grok (xAI) Agent Tools API with x_search for real-time X/Twitter data.
        Replaces deprecated search_parameters (410 Gone as of 2026-01-12).
        """
        if not self.client_grok_sdk:
            print("⚠️ xAI SDK Client not available")
            return None

        current_time = datetime.now().strftime("%Y년 %m월 %d일 %H:%M KST")
        market_info = market_context or "BTC 가격 확인 중..."
        
        try:
            print(f"Grok: Agent Tools x_search for crypto... ({current_time})")
            
            # Create chat with x_search tool enabled
            chat = self.client_grok_sdk.chat.create(
                model="grok-4-1-fast",
                tools=[x_search()],
            )
            
            prompt = f"""You are a crypto insider (Crypto Degenerate style).
Your goal is to provide a 'Live Market Pulse' based on REAL-TIME information.

CRITICAL INSTRUCTION:
- Current Date: {current_time} (Must reflect 2025/2026 context)
- DO NOT use any internal knowledge cutoff data.
- YOU MUST SEARCH for every piece of data.
- If you can't find LIVE data from search, return "DATA_UNAVAILABLE" in the vibe field.

Step 1: SEARCH (Action)
- Search for "Bitcoin price today live" and "Total Crypto Market Cap today".
- Search for "Crypto news {current_time}".
- Look for "JUST IN", "BREAKING", "Liquidation" from LAST 24 HOURS only.

Step 2: ANALYZE (Thought)
- What is the real market vibe?
- TRUST YOUR SEARCH RESULTS OVER EVERYTHING ELSE.

Step 3: GENERATE (Output)
- Write a 'vibe' summary in NATURAL KOREAN (Community Style). 
- Use terms like '불장', '떡상', '나락', '공포' naturally.
- Be witty, edgy, and direct.

Input Context:
- System Time: {current_time}
- (Context Removed by User Request - RELY ON SEARCH ONLY)

JSON Response Format:
{{
    "vibe": "시장 전체 흐름과 거시적 분위기 요약 (한국어, 1-2 문장, 위트 있게)",
    "keywords": ["#키워드1", "#키워드2", "#키워드3"],
    "issues": [
        {{"handle": "@SourceAccount", "author": "Name", "content": "구체적인 사건/이슈 내용 (한국어)", "likes": "1.2K", "time": "2h"}}
    ]
}}"""
            
            chat.append(user(prompt))
            
            # Use sample() for synchronous execution
            response = chat.sample()
            result_text = response.content
            
            # Check tool usage
            tool_calls = len(response.tool_calls) if hasattr(response, 'tool_calls') and response.tool_calls else 0
            print(f"Grok x_search Complete: {len(result_text) if result_text else 0} chars, {tool_calls} tool calls")
            
            if not result_text:
                print("⚠️ Grok returned empty content")
                return None
            
            # Parse JSON
            parsed = self._clean_and_parse_json(result_text)
            if parsed:
                parsed['sources_used'] = tool_calls
                parsed['timestamp'] = datetime.now().isoformat()
                parsed['model'] = 'grok-4-1-fast (x_search)'
                return parsed
            else:
                print(f"⚠️ Grok JSON parse failed, raw: {result_text[:200]}")
                return None
                
        except Exception as e:
            print(f"❌ Grok Agent Tools Failed: {e}")
            return None

    def _get_openai_sentiment_fallback(self, news_list):
        """Fallback to OpenAI if Grok fails"""
        try:
            print("🔄 Falling back to OpenAI (GPT-4o) for sentiment...")
            news_text = "\n".join([f"- {item.get('title', 'Unknown')} ({item.get('source', 'Unknown')})" for item in news_list[:5]])
            response = self.client_gpt.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a crypto sentiment analyzer. Output a witty, edgy paragraph about market vibe in Korean."},
                    {"role": "user", "content": f"Headlines:\n{news_text}"}
                ],
                temperature=0.8,
                timeout=15  # 15초 타임아웃
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"❌ OpenAI Sentiment Fallback Failed: {e}")
            return "Data analysis failed."

    def _get_grok_sentiment(self, news_list):
        """
        Use Grok (xAI) to analyze sentiment for asset-specific analysis.
        Simpler version than _get_grok_social_pulse.
        """
        if not self.client_grok:
            print("⚠️ xAI Client not initialized (Missing XAI_API_KEY)")
            return "Sentiment data unavailable."

        if not news_list:
            return "No recent news for sentiment analysis."

        news_text = "\n".join([f"- {item.get('title', 'Unknown')}" for item in news_list[:5]])
        
        try:
            response = self.client_grok.chat.completions.create(
                model="grok-4-1-fast",  # fast 모델 (더 빠름)
                messages=[
                    {"role": "system", "content": """You are a crypto sentiment analyst. 
                    Analyze the following news headlines and provide a brief sentiment summary in Korean.
                    Be concise: 1-2 sentences maximum.
                    Format: [Bullish/Bearish/Neutral] - [Reason]"""},
                    {"role": "user", "content": f"Headlines:\n{news_text}"}
                ],
                temperature=0.3,
                timeout=20  # 추론 모델이므로 20초 타임아웃
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"❌ Grok Sentiment Failed: {e}")
            # Fallback to OpenAI
            return self._get_openai_sentiment_fallback(news_list)

    def analyze_global_market(self, market_data, news_list=[], whale_news_list=[]):
        """Grok-only analysis - no GPT needed"""
        cache_key = 'GLOBAL_MARKET_V4'
        cached = self._get_cached_data(cache_key, self.CACHE_TTL_GLOBAL)
        if cached:
            print(f"📦 [CACHE HIT] Returning cached global analysis")
            return cached

        print(f"🔄 [CACHE MISS] Starting fresh global analysis (Grok-only)...")
        
        if not self.client_grok:
            print("❌ No Grok client - returning mock")
            return self._get_mock_global_analysis()

        # Build market context
        market_context = f"BTC: {market_data.get('BTC Price', 'N/A')}, ETH: {market_data.get('ETH Price', 'N/A')}, 시총: {market_data.get('Total Market Cap', 'N/A')}"
        print(f"🚀 Calling Grok with market context: {market_context}")
        
        # Get Grok result (now returns parsed JSON directly)
        grok_result = self._get_grok_social_pulse(market_context)
        
        if not grok_result:
            print("⚠️ Grok failed/deprecated - switching to GPT-4o Fallback")
            if not self.client_gpt:
                return self._get_mock_global_analysis()
                
            # Fallback: Use GPT-4o to generate similar insights from News + Market Data
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M KST")
            news_context = "\n".join([f"- {n.get('title')} ({n.get('source', 'News')})" for n in news_list[:10]])
            
            try:
                response = self.client_gpt.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": f"""
You are a crypto market analyst replacing a social listening AI.
Analyze the provided market data and news headlines to generate a 'Social Pulse' report.

Input Data:
- Time: {current_time}
- Market: {market_context}
- Top Headlines:
{news_context}

Your Task:
1. Synthesize the overall market vibe (Bullish/Bearish/Neutral) and write a witty, insightful summary paragraph (Korean).
2. Extract 3-5 trending keywords.
3. Identify 3 major topics based on the news.

For the 'issues' array (Top Influencers section):
- Do NOT make up fake users like "GPT Analyst".
- Instead, use the provided News Sources as the "Author".
- Handle: "@" + Source Name (e.g., "@CoinDesk", "@TokenPost").
- Content: The actual headline or a short summary of it (Korean).
- Likes: Generate a realistic random number between 100-5000 (e.g., "1.2K", "340").
- Time: "1h", "2h", etc.

Return strict JSON:
{{
    "vibe": "Summary paragraph here...",
    "keywords": ["#Key1", "#Key2", ...],
    "fear_greed": 50, // Assessment 0-100 based on news sentiment
    "issues": [
        {{"handle": "@Source1", "author": "Source Name", "content": "Actual news headline...", "likes": "1.2K", "time": "1h"}},
        {{"handle": "@Source2", "author": "Source Name", "content": "Actual news headline...", "likes": "850", "time": "2h"}}
    ]
}}
"""},
                        {"role": "user", "content": "Generate Social Pulse analysis."}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7
                )
                grok_result = json.loads(response.choices[0].message.content)
                print("✅ GPT-4o Fallback Successful")
                
            except Exception as e:
                print(f"❌ GPT Fallback Failed: {e}")
                return self._get_mock_global_analysis()

        # Transform result to our expected format
        result = {
            "grok_saying": f"(Live AI) {grok_result.get('vibe', '시장 분석 중...')}",
            "market_keywords": grok_result.get("keywords", []),
            "atmosphere_score": grok_result.get("fear_greed", 50),
            "atmosphere_label": "중립",
            "top_influencers": grok_result.get("issues", []),  # issues = top_influencers
            "sources_used": grok_result.get("sources_used", 0),
            "timestamp": grok_result.get("timestamp", datetime.now().isoformat()),
            "market_data": market_data
        }
        
        # Get real Fear & Greed from Alternative.me
        real_fng = self._fetch_real_fear_greed()
        if real_fng:
            print(f"Real F&G: {real_fng['score']} ({real_fng['label']})")
            result['atmosphere_score'] = real_fng['score']
            label_map = {
                'Extreme Fear': '극단적 공포',
                'Fear': '공포',
                'Neutral': '중립',
                'Greed': '탐욕',
                'Extreme Greed': '극단적 탐욕'
            }
            result['atmosphere_label'] = label_map.get(real_fng['label'], real_fng['label'])
        
        self._set_cache_data(cache_key, result)
        print(f"Global analysis complete: {len(result.get('top_influencers', []))} issues")

        return result
    
    def analyze_global_deep_market(self, market_data):
        """
        GPT-4o ONLY: Deep Global Market Analysis (Radar, Macro, Sectors)
        Used for the 'GlobalXRay' modal. Separate from Grok's social pulse.
        """
        cache_key = 'GLOBAL_DEEP_ANALYSIS'
        cached = self._get_cached_data(cache_key, 3600)  # Cache for 1 hour
        if cached:
            print("📦 [CACHE HIT] Deep Analysis")
            return cached

        if not self.client_gpt:
            print("⚠️ GPT-4o Client not initialized")
            return None

        current_time = datetime.now().strftime("%Y-%m-%d %H:%M KST")
        
        # Real Fear & Greed for context
        fng = self._fetch_real_fear_greed()
        fng_str = f"{fng['score']} ({fng['label']})" if fng else "Unknown"

        try:
            print("🧠 GPT-4o: Starting Deep Global Analysis...")
            response = self.client_gpt.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": f"""
You are a Chief Crypto Market Strategist.
Create a DEEP, PROFESSIONAL market analysis JSON based on the provided data.

Target Audience: Institutional Investors & Pro Traders.
Language: Korean (Natural, Professional).

Current Time: {current_time}
Market Data: {str(market_data)}
Fear & Greed: {fng_str}

REQUIRED JSON STRUCTURE (Must match exactly):
{{
    "overallScore": 0,  // Calculate 0-100 based on data
    "marketPhase": "Unknown", // Determine phase (Accumulation, Markup, Distribution, Markdown)
    "summary": "Write a fresh, data-driven summary (Live AI)...",
    "radar_data": [
        {{"label": "Macro", "value": 0}}, // 0-100
        {{"label": "Technical", "value": 0}}, // 0-100
        {{"label": "On-chain", "value": 0}}, // 0-100
        {{"label": "Sentiment", "value": 0}}, // 0-100
        {{"label": "Innovation", "value": 0}} // 0-100
    ],
    "macro_factors": [
        {{"name": "Interest Rates", "impact": "Neutral/Positive/Negative", "detail": "Analyze based on current rates..."}},
        {{"name": "Inflation", "impact": "Neutral/Positive/Negative", "detail": "Analyze CPI/PPI..."}},
        {{"name": "Regulation", "impact": "Neutral/Positive/Negative", "detail": "Analyze recent regulatory news..."}}
    ],
    "sectorAnalysis": [
        {{"name": "DeFi", "signal": "bullish/bearish/neutral", "score": 0, "insight": "Analysis..."}},
        {{"name": "GameFi", "signal": "bullish/bearish/neutral", "score": 0, "insight": "Analysis..."}},
        {{"name": "Layer2", "signal": "bullish/bearish/neutral", "score": 0, "insight": "Analysis..."}},
        {{"name": "RWA", "signal": "bullish/bearish/neutral", "score": 0, "insight": "Analysis..."}}
    ],
    "onchain_signals": [
        {{"metric": "Exchange Inflow", "signal": "High/Low", "value": "High/Low", "comment": "Implication..."}},
        {{"metric": "Whale Accumulation", "signal": "Weak/Strong", "value": "Weak/Strong", "comment": "Implication..."}}
    ],
    "risks": ["Risk 1", "Risk 2", "Risk 3"],
    "opportunities": ["Opp 1", "Opp 2", "Opp 3"],
    "recommendation": "Strategic advice based on data",
    "actionable_insight_summary": "One line summary"
}}
"""},
                    {"role": "user", "content": "Generate the deep market analysis report now."}
                ],
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content
            parsed = json.loads(result_text)
            parsed['timestamp'] = datetime.now().isoformat()
            
            self._set_cache_data(cache_key, parsed)
            print("GPT-4o Deep Analysis Complete")
            return parsed

        except Exception as e:
            print(f"❌ Deep Analysis Failed: {e}")
            return None

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
                ],
                timeout=20  # 20초 타임아웃
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
            "overallScore": 50,
            "marketPhase": "Neutral",
            "summary": "(Demo Data) AI 서비스 연결이 원활하지 않습니다. 기본 데이터만 제공됩니다.",
            "macro_factors": [
                {"name": "Interest Rates", "impact": "Neutral", "detail": "금리 정책 불확실성 지속"},
                {"name": "Inflation", "impact": "Negative", "detail": "CPI 데이터 주시 필요"}
            ],
            "radar_data": [
                {"label": "Macro", "value": 50},
                {"label": "Technical", "value": 50},
                {"label": "On-Chain", "value": 50},
                {"label": "Sentiment", "value": 50},
                {"label": "Innovation", "value": 50}
            ],
            "sectorAnalysis": [
                {"name": "DeFi", "signal": "Neutral", "score": 50, "insight": "데이터 확인 필요"},
                {"name": "GameFi", "signal": "Neutral", "score": 50, "insight": "데이터 확인 필요"}
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
