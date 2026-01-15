import requests
from bs4 import BeautifulSoup
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def fetch_investing_calendar():
    """
    Investing.com 한국어 경제 캘린더 크롤링
    """
    url = "https://kr.investing.com/economic-calendar/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find('table', {'id': 'economicCalendarData'})
        
        if not table:
            logger.warning("Calendar table not found in response")
            return []

        events = []
        rows = table.find_all('tr', {'class': 'js-event-item'})

        for row in rows:
            try:
                # 시간
                time_cell = row.find('td', {'class': 'time'})
                time = time_cell.text.strip() if time_cell else ""
                
                # 통화/국가
                currency_cell = row.find('td', {'class': 'flagCur'})
                country_text = currency_cell.text.strip() if currency_cell else ""
                # 국기 -> 이모지로 변환하는 로직 필요하지만 일단 텍스트나 간단 매핑
                
                # 중요도 (별 개수 or Bull 아이콘)
                sentiment_cell = row.find('td', {'class': 'sentiment'})
                impact = "Low"
                if sentiment_cell:
                    bulls = sentiment_cell.find_all('i', {'class': 'grayFullBullishIcon'})
                    if len(bulls) >= 3:
                        impact = "High"
                    elif len(bulls) == 2:
                        impact = "Medium"

                # 이벤트명
                event_cell = row.find('td', {'class': 'event'})
                title = event_cell.text.strip() if event_cell else ""

                if not title:
                    continue
                    
                # 국가 이모지 매핑
                country_emoji = "🌍"
                if "USD" in country_text: country_emoji = "🇺🇸"
                elif "KRW" in country_text: country_emoji = "🇰🇷"
                elif "EUR" in country_text: country_emoji = "🇪🇺"
                elif "CNY" in country_text: country_emoji = "🇨🇳"
                elif "JPY" in country_text: country_emoji = "🇯🇵"
                elif "GBP" in country_text: country_emoji = "🇬🇧"

                events.append({
                    "time": time,
                    "title": title,
                    "country": country_emoji,
                    "impact": impact,
                    "type": "Economic",
                    "event_date": datetime.now().strftime("%Y-%m-%d") # 오늘 날짜라 가정
                })

            except Exception as e:
                logger.error(f"Error parsing row: {e}")
                continue

        return events

    except Exception as e:
        logger.error(f"Failed to fetch calendar: {e}")
        return []
