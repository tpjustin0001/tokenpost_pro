
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
        Use Grok to extract deep social sentiment from news.
        """
        if not self.client_grok or not news_list:
            return "Grok AI: No sentiment data available."

        news_text = "\n".join([f"- {item['title']} ({item['source']})" for item in news_list])
        
        try:
            response = self.client_grok.chat.completions.create(
                model="grok-beta", # Grok 4.1 (Beta)
                messages=[
                    {"role": "system", "content": "You are Grok, a real-time Social Sentiment Engine (v4.1). Analyze the crypto news headlines. Output a brief, witty, uncensored, and slightly edgy paragraph about the current market 'vibe' and crowd psychology. Be bold."},
                    {"role": "user", "content": f"Headlines:\n{news_text}"}
                ],
                temperature=0.8 # Higher creativity for sentiment intensity
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Grok Sentiment Failed: {e}")
            return "Grok analysis failed."

    def analyze_global_market(self, market_data, news_list=[]):
        cache_key = 'GLOBAL_MARKET_V3'
        cached = self._get_cached_data(cache_key, self.CACHE_TTL_GLOBAL)
        if cached: return cached

        if not self.client_gpt:
            return self._get_mock_global_analysis()

        # Step 1: Get Grok Sentiment
        grok_sentiment = self._get_grok_sentiment(news_list)

        # Step 2: GPT Main Analysis
        system_prompt = f"""
        You are a Macro Crypto Strategist.
        
        INPUT CONTEXT:
        1. Market Data (Technical/Macro)
        2. Social Sentiment (provided by Grok AI): "{grok_sentiment}"
        
        Instructions:
        1. Synthesize the Technical Data with Grok's Sentiment.
        2. Return the result in STRICT, PROFESSIONAL KOREAN.
        
        CRITICAL STYLE GUIDELINES:
        - Glossary: Use "온체인" (not 온인), "이동평균선".
        - Formatting: Leading zeros for decimals.
        - Tone: Professional, authoritative.
  
        JSON Structure (v3.0):
        {{
            "overallScore": float(0-100),
            "marketPhase": "Accumulation | Markup | Distribution | Markdown",
            "summary": "Summary integrating Data & Social Vibe.",
            "macro_factors": [ {{ "name": "...", "impact": "...", "detail": "..." }} ],
            "radar_data": [
                 {{ "label": "Macro", "value": int }},
                 {{ "label": "Technical", "value": int }},
                 {{ "label": "On-Chain", "value": int }},
                 {{ "label": "Sentiment", "value": int }},
                 {{ "label": "Innovation", "value": int }}
            ],
            "sectorAnalysis": [ {{ "name": "...", "signal": "...", "score": int, "insight": "..." }} ],
            "onchain_signals": [ {{ "metric": "...", "signal": "...", "value": "...", "comment": "..." }} ],
            "risks": [], "opportunities": [],
            "recommendation": "...",
            "actionable_insight_summary": "..."
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

# Singleton instance
ai_service = AIService()
