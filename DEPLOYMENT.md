# 🚀 TokenPost PRO 배포 가이드

TokenPost PRO는 **Next.js (프론트엔드)**와 **Flask (백엔드)**가 결합된 하이브리드 애플리케이션입니다.
실제 서비스 운영을 위해 두 부분을 각각 배포하고 연결해야 합니다.

---

## 🏗️ 1. 아키텍처 개요

- **Frontend (Next.js)**: Vercel에 배포합니다. (가장 쉽고 빠름)
- **Backend (Flask)**: Render, Railway, 또는 AWS EC2에 배포합니다.
- **연동**: Next.js가 `/api/python/*`으로 들어오는 요청을 백엔드 서버 URL로 프록시(Proxy)합니다.

---

## 📱 2. 프론트엔드 배포 (Vercel)

1. **GitHub 저장소 푸시**: 프로젝트를 GitHub에 업로드합니다.
2. **Vercel 접속**: [Vercel Dashboard](https://vercel.com)에 로그인합니다.
3. **새 프로젝트 생성**: 'Add New Project' > GitHub 저장소 선택.
4. **환경 변수 (Environment Variables) 설정**:
   - `BACKEND_URL`: 백엔드가 배포된 주소 (예: `https://tokenpost-backend.onrender.com`)
   - *아직 백엔드 주소가 없다면 비워두고 나중에 설정해도 됩니다.*
5. **Deploy 클릭**: 배포가 완료되면 프론트엔드 도메인(예: `tokenpost-pro.vercel.app`)이 생성됩니다.

---

## ⚙️ 3. 백엔드 배포 (Render 추천)

**Render.com**은 무료로 파이썬 웹 서버를 호스팅할 수 있어 추천합니다.

1. **Render 접속**: [Render Dashboard](https://render.com)에 로그인.
2. **New Web Service 생성**: GitHub 저장소 연결.
3. **설정 입력**:
   - **Root Directory**: `flask-backend` ( 중요! 백엔드 코드가 여기 있습니다)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
4. **환경 변수 설정**:
   - `PYTHON_VERSION`: `3.9.0` (권장)
   - `FLASK_ENV`: `production`
   - 필요한 경우 API 키 (예: `UPBIT_ACCESS_KEY` 등)
5. **Deploy**: 배포가 완료되면 `https://xxx.onrender.com` 주소가 나옵니다.

---

## 🔗 4. 최종 연결

1. Render에서 받은 **백엔드 URL**을 복사합니다.
2. Vercel 프로젝트 설정 > Settings > Environment Variables로 이동합니다.
3. `BACKEND_URL` 키를 추가하고 백엔드 URL을 값으로 넣습니다. (마지막 `/` 제외)
   - 예: `https://tokenpost-backend.onrender.com`
4. **Vercel 재배포 (Redeploy)**: 설정을 적용하려면 Deployment 탭에서 최신 버전을 Redeploy 해야 합니다.

---

## 📦 5. 폴더 구조 참고 (배포 시)

```
tokenpost-pro/
├── src/                # Next.js 소스
├── public/             # 정적 파일
├── next.config.ts      # Proxy 설정 (BACKEND_URL 참조)
├── package.json        
└── flask-backend/      # 백엔드 루트
    ├── app.py          # Flask 실행 파일
    ├── requirements.txt # 의존성 목록
    └── crypto_market/  # 분석 엔진
```

## ✅ 체크리스트

- [ ] 백엔드(Render)가 정상적으로 켜져 있고 `Health Check` (`/`)가 200 OK를 반환하는가?
- [ ] 프론트엔드(Vercel) 환경 변수에 `BACKEND_URL`이 정확히 설정되었는가?
- [ ] 프론트엔드에서 `/data` 페이지 접속 시 백엔드 데이터를 잘 받아오는가?
