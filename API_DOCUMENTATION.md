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

### **3. Request Payload**

#### **Type: News (`type: "news"`)**

```json
{
  "type": "news",
  "data": {
    "title": "Bitcoin Surpasses $100k",
    "summary": "Institutional inflows drive the price to new all-time highs.",
    "category": "Market",
    "source": "Bloomberg",
    "image_url": "https://example.com/image.jpg"
  }
}
```

**Fields:**
- `title` (Required): Headline of the news.
- `summary` (Required): Brief description or subtitle.
- `category` (Optional): e.g., "Market", "Regulatory", "Tech".
- `source` (Optional): Origin of the news.
- `image_url` (Optional): URL for the thumbnail.

#### **Type: Research (`type: "research"`)**

```json
{
  "type": "research",
  "data": {
    "title": "2025 Web3 Gaming Outlook",
    "summary": "Analysis of the shift from P2E to Play-and-Earn.",
    "type": "REPORT",
    "author": "TokenPost Research",
    "tags": ["GameFi", "Web3"],
    "isPro": true
  }
}
```

**Fields:**
- `type` (Inside data): "REPORT", "ANALYSIS", "ON-CHAIN".
- `isPro` (Boolean): Whether this is premium content.

---

### **4. Usage Examples**

#### **cURL**
```bash
curl -X POST https://tokenpost-pro-seven.vercel.app/api/external/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: tokenpost_secure_2025_x9z" \
  -d '{
    "type": "news",
    "data": {
      "title": "API Integration Successful",
      "summary": "External content system is now live.",
      "category": "Tech"
    }
  }'
```

#### **Python**
```python
import requests

url = "https://tokenpost-pro-seven.vercel.app/api/external/ingest"
headers = {
    "Content-Type": "application/json",
    "X-API-KEY": "tokenpost_secure_2025_x9z"
}
payload = {
    "type": "news",
    "data": {
        "title": "Automated Market Update",
        "summary": "Bot-generated insight.",
        "category": "AI"
    }
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

### **5. Response**

**Success (200 OK)**
```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Content encrypted and stored securely"
}
```

**Error (401 Unauthorized)**
```json
{
  "error": "Unauthorized: Invalid API Key"
}
```
