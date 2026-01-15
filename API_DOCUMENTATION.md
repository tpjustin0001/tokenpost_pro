# TokenPost PRO API Documentation

## 🔐 External Content Ingestion API

This API allows external systems (scrapers, CMS, partner feeds) to securely push News and Research content into the TokenPost PRO platform.

### **1. Configuration**

- **Base URL:** `https://pro.tokenpost.kr` (Production)
- **Endpoint:** `/api/external/ingest`
- **Method:** `POST`
- **Content-Type:** `application/json` 또는 `multipart/form-data`

### **2. Authentication**

Security is handled via a shared secret API Key.

- **Header Name:** `X-API-KEY`
- **Current Key (Dev):** `tokenpost_secure_2025_x9z`
  - *Note: Manage this key in `flask-backend/.env` under `EXTERNAL_API_KEY`.*

---

### **3. Request Payload & Examples**

> [!TIP]
> **Make.com 연동 시**: JSON 생성이 어렵다면 `multipart/form-data`를 사용하세요. 배열 필드(예: `tags`)는 `tags[]` 키를 여러 번 사용하여 전송할 수 있습니다.

The API supports three main content types: **News**, **Insights (Research)**, and **News Markers**.

#### **A. News (속보/뉴스)**
General crypto news with sentiment analysis fields.

- **Type:** `news`
- **Key Fields:**
  - `sentiment_score`: Float between -1.0 (Bad) and 1.0 (Good).
  - `show_on_chart`: Set to `true` to display as a marker on the trading chart.

### Response (Success)
```json
{
  "success": true,
  "id": 123,
  "data": {
    "id": 123,
    "title": "Crypto Market Report",
    "summary": "...",
    "category": "MARKER",
    "show_on_chart": true
  },
  "message": "Marker stored successfully"
}
```
```json
{
  "type": "news",
  "data": {
    "title": "Bitcoin Surpasses $100k",
    "summary": "Institutional inflows drive the price to new all-time highs.",
    "content": "Full article content goes here...",
    "category": "Market",
    "source": "Bloomberg",
    "published_at": "2024-01-15T09:00:00Z",
    "image_url": "https://example.com/image.jpg",
    "sentiment_score": 0.8,
    "related_coin": "BTC"
  }
}
```

**Form Data 예시 (Make.com)**:
```bash
curl -X POST "https://tokenpostpro-production.up.railway.app/api/external/ingest" \
  -H "X-API-KEY: YOUR_EXTERNAL_API_KEY" \
  -F "type=news" \
  -F "title=비트코인 10만달러 돌파" \
  -F "summary=역사적인 순간" \
  -F "show_on_chart=true" \
  -F "related_coin=BTC" \
  -F "image_url=https://example.com/btc_chart.jpg"
```

> [!NOTE]
> **Image Upload**: 직접 파일 업로드는 지원하지 않으며, **호스팅된 이미지 URL**을 `image_url` 필드에 문자열로 전달해야 합니다. Make.com 등을 사용할 때 이미지 링크를 넣어주세요.

#### **B. Insights (리서치/인사이트)**
In-depth reports and analysis with tags.

- **Type:** `research`
- **Key Fields:**
  - `tags`: Array of strings for categorization (displayed in list).
  - `is_premium`: Boolean to mark as PRO content.

```json
{
  "type": "research",
  "data": {
    "title": "2025 Web3 Gaming Outlook",
    "summary": "Analysis of the shift from P2E to Play-and-Earn.",
    "content": "Detailed report content...",
    "type": "REPORT",
    "author": "TokenPost Research",
    "tags": ["GameFi", "Web3", "Outlook"],
    "is_premium": true,
    "thumbnail_url": "https://example.com/report_cover.jpg"
  }
}
```

#### **C. News Markers (뉴스 마커)**
Short news items specifically designed to appear on price charts.

- **Endpoint:** `/api/external/ingest` (Same as News)
- **Method:** `POST`
- **Type:** `news`
- **Key Fields:**
  - `show_on_chart`: **Must be `true`**
  - `related_coin`: Symbol of the coin (e.g., "BTC").
  - `sentiment_score`: Score for coloring.

```json
{
  "data": {
    "title": "SEC Approval Rumors",
    "summary": "Market volatility expected.",
    "sentiment_score": 0.9,
    "related_coin": "BTC",
    "published_at": "2024-01-15T10:30:00Z"
  }
}
```
> **Date Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`) 권장. (예: `2024-01-15T10:30:00Z`)

---

### **4. Field Reference**

| Field | Type | Description |
|-------|------|-------------|
| **Common** | | |
| `title` | String | Headline of the content. |
| `summary` | String | Brief description or subtitle. |
| `content` | String | Full text content. |
| `image_url` / `thumbnail_url` | String | URL for the main image. |
| `published_at` | ISO 8601 | Publication timestamp. |
| **News Specific** | | |
| `sentiment_score` | Float | `-1.0` (악재) to `1.0` (호재). `0` is Neutral. |
| `source` | String | Origin of the news (e.g., "Coindesk"). |
| `show_on_chart` | Boolean | If `true`, appears as a marker on the chart. |
| `related_coin` | String | Ticker symbol for chart mapping (e.g., "BTC"). |
| **Insight Specific** | | |
| `tags` | Array | List of tags, e.g., `["DeFi", "L2"]`. |
| `is_premium` | Boolean | If `true`, restricted to PRO members. |
| `type` | String | `REPORT`, `ANALYSIS`, `ON-CHAIN`, `KPI`, `BREAKING`. |

---

### **5. Python Example**

```python
import requests

url = "https://pro.tokenpost.kr/api/external/ingest"
headers = {
    "Content-Type": "application/json",
    "X-API-KEY": "tokenpost_secure_2025_x9z"
}

# Example: Ingesting an Insight
payload = {
    "type": "research",
    "data": {
        "title": "Ethereum L2 Ecosystem Growth",
        "summary": "TVL across Arbitrum and Optimism reaches new highs.",
        "content": "Deep dive into on-chain metrics...",
        "tags": ["Ethereum", "Layer2", "TVL"],
        "is_premium": True,
        "author": "TokenPost Analyst"
    }
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```
