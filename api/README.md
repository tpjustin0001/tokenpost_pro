# TokenPost PRO - Flask Backend

## 로컬 실행

```bash
cd flask-backend
pip install -r requirements.txt
python app.py
```

서버: http://localhost:5001

## API 엔드포인트

| Endpoint | 설명 |
|----------|------|
| `/api/crypto/market-gate` | Market Gate 100점 스코어링 |
| `/api/crypto/lead-lag` | Granger Causality 선행 지표 |
| `/api/crypto/vcp-signals` | VCP 시그널 목록 |

## 배포 옵션 (무료/저가)

### 1. Railway (추천)
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 배포
cd flask-backend
railway login
railway init
railway up
```

### 2. Render
1. https://render.com 접속
2. New → Web Service
3. GitHub 연결 후 flask-backend 폴더 선택
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `gunicorn app:app`

### 3. Fly.io
```bash
flyctl launch
flyctl deploy
```

## Next.js 연동

배포된 Flask API URL을 환경변수로 설정:

```env
NEXT_PUBLIC_FLASK_API_URL=https://your-flask-api.railway.app
```

그 다음 Next.js 컴포넌트에서 호출:

```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/crypto/market-gate`);
```
