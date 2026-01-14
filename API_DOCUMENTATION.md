# TokenPost PRO API Documentation

## 🔐 External Content Ingestion API

This API allows external systems (scrapers, CMS, partner feeds) to securely push News and Research content into the TokenPost PRO platform.

### **1. Configuration**

- **Base URL:** `https://tokenpost-pro-seven.vercel.app` (Production)
- **Endpoint:** `/api/external/ingest`
- **Method:** `POST`
- **Content-Type:** `application/json`

### **2. Authentication**

Security is handled via a shared secret API Key.

- **Header Name:** `X-API-KEY`
- **Current Key (Dev):** `tokenpost_secure_2025_x9z`
  - *Note: Manage this key in `flask-backend/.env` under `EXTERNAL_API_KEY`.*

---

### **3. Request Payload & Examples**

The API supports three main content types: **News**, **Insights (Research)**, and **News Markers**.

#### **A. News (속보/뉴스)**
General crypto news with sentiment analysis fields.

- **Type:** `news`
- **Key Fields:**
  - `sentiment_score`: Float between -1.0 (Bad) and 1.0 (Good).
  - `show_on_chart`: Set to `true` to display as a marker on the trading chart.

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

- **Type:** `news` (Same as news, but with specific chart fields enabled)
- **Key Fields:**
  - `show_on_chart`: **MUST** be `true`.
  - `related_coin`: Symbol of the coin (e.g., "BTC", "ETH").

```json
{
  "type": "news",
  "data": {
    "title": "SEC Approval Rumors",
    "summary": "Market volatility expected.",
    "sentiment_score": 0.9,
    "show_on_chart": true,
    "related_coin": "BTC",
    "published_at": "2024-01-15T10:30:00Z"
  }
}
```

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

url = "https://tokenpost-pro-seven.vercel.app/api/external/ingest"
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
