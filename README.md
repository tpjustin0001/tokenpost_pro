# 🚀 TokenPost PRO

**크립토 전문가를 위한 올인원 투자 인텔리전스 터미널**

TokenPost PRO는 암호화폐 시장 분석, 실시간 뉴스, AI 기반 인사이트를 제공하는 프리미엄 대시보드입니다.

---

## 📌 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프론트엔드** | Next.js 16 (React 19, TypeScript) |
| **백엔드** | Flask (Python 3.9+) |
| **데이터베이스** | Supabase (PostgreSQL) |
| **차트** | Lightweight Charts (TradingView) |
| **스타일** | CSS Modules + Glassmorphism |
| **아이콘** | Lucide React |

---

## 🏗️ 프로젝트 구조

```
tokenpost-pro/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── page.tsx            # 메인 대시보드
│   │   ├── admin/              # 관리자 패널 (CMS)
│   │   ├── calendar/           # 경제 캘린더
│   │   ├── news/               # 뉴스 피드
│   │   ├── research/           # 리서치 리포트
│   │   ├── data/               # 데이터 분석
│   │   ├── analysis/           # 기술적 분석
│   │   ├── asset/[symbol]/     # 개별 자산 상세
│   │   └── global-analysis/    # 글로벌 X-Ray
│   │
│   ├── components/             # UI 컴포넌트 (50개+)
│   │   ├── TradingChart.tsx    # 메인 캔들스틱 차트
│   │   ├── NewsFeed.tsx        # 실시간 뉴스 (Supabase 연동)
│   │   ├── ResearchIntel.tsx   # 리서치 인텔리전스 (Supabase 연동)
│   │   ├── AIXRay.tsx          # AI 자산 분석
│   │   ├── GlobalXRay.tsx      # 글로벌 시장 분석
│   │   ├── MarketGate.tsx      # 시장 진입 신호
│   │   ├── LeadLagAnalysis.tsx # 선행/후행 지표 분석
│   │   ├── Mindshare.tsx       # 소셜 센티먼트
│   │   ├── EventTicker.tsx     # 오늘의 일정 배너
│   │   ├── KimchiPremium.tsx   # 김치 프리미엄
│   │   └── ...
│   │
│   ├── services/               # API 클라이언트
│   │   └── flaskApi.ts         # Flask 백엔드 연동
│   │
│   ├── lib/                    # 유틸리티
│   │   └── supabase.ts         # Supabase 클라이언트
│   │
│   └── context/                # React Context
│       └── XRayContext.tsx     # X-Ray 모드 상태
│
├── flask-backend/              # Python 백엔드
│   ├── app.py                  # Flask 앱 진입점
│   ├── requirements.txt        # Python 의존성
│   └── crypto_market/          # 분석 엔진
│       ├── market_gate.py      # 시장 게이트 로직
│       ├── lead_lag/           # 선행 지표 분석
│       └── vcp_backtest/       # VCP 백테스트
│
├── next.config.ts              # Next.js 설정 (API 프록시)
├── supabase_schema.sql         # 데이터베이스 스키마
└── DEPLOYMENT.md               # 배포 가이드
```

---

## 🎯 주요 기능

### 1. 메인 대시보드 (`/`)
- **트레이딩 차트**: BTC 캔들스틱 + 뉴스 마커
- **메트릭스 바**: BTC/ETH 가격, 총 시가총액, 24h 변동률
- **오늘의 일정 배너**: 주요 경제 이벤트 스크롤 표시
- **위젯 그리드**: Mindshare, 김치 프리미엄, 토큰 언락 등

### 2. 뉴스 & 리서치
- **뉴스 피드**: Supabase에서 실시간 데이터 로드
- **리서치 인텔리전스**: PRO 리포트/분석 (Supabase 연동)
- **실시간 업데이트**: Postgres 변경사항 자동 구독

### 3. AI X-Ray 분석
- **자산 X-Ray**: 개별 코인에 대한 AI 기반 기술적 분석
- **글로벌 X-Ray**: 전체 시장 건강도 레이더 차트
- **Generative Insight**: 타이프라이터 효과로 AI 분석 표시

### 4. 데이터 분석
- **Market Gate**: 진입/관망 신호 시스템
- **Lead-Lag Analysis**: 선행 지표 (M2, DXY, NASDAQ) 상관관계
- **VCP Scanner**: 변동성 수축 패턴 탐지 (백테스트)

### 5. 관리자 패널 (`/admin`)
- **뉴스 발행**: Supabase `news` 테이블에 직접 저장
- **리서치 발행**: Supabase `research` 테이블에 직접 저장
- **시스템 모니터링**: 백엔드 상태 확인

### 6. 경제 캘린더 (`/calendar`)
- 주요 경제 지표 발표 일정
- 암호화폐 이벤트 (컨퍼런스, 토큰 언락)
- 한글 로컬라이제이션 완료

---

## 🔧 개발 환경 설정

### 1. 프론트엔드 실행

```bash
cd tokenpost-pro
npm install
npm run dev
```
→ `http://localhost:3000`

### 2. 백엔드 실행

```bash
cd flask-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
→ `http://localhost:5001`

### 3. 환경 변수 설정

`.env.local` 파일 생성:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
BACKEND_URL=http://127.0.0.1:5001
```

---

## 📦 데이터베이스 스키마

### news 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | bigint | Primary Key |
| title | text | 뉴스 제목 |
| summary | text | 요약 |
| category | text | 카테고리 |
| source | text | 출처 |
| sentiment_score | float | 감성 점수 (-1 ~ 1) |
| related_coin | text | 관련 코인 (BTC, ETH 등) |
| show_on_chart | boolean | 차트 마커 표시 여부 |
| published_at | timestamp | 발행일 |

### research 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | bigint | Primary Key |
| title | text | 리포트 제목 |
| summary | text | 요약 |
| content | text | 본문 |
| author | text | 작성자 |
| is_premium | boolean | PRO 전용 여부 |
| tags | text[] | 태그 배열 |
| created_at | timestamp | 생성일 |

---

## 🚀 배포

자세한 배포 방법은 [DEPLOYMENT.md](./DEPLOYMENT.md) 참조.

| 서비스 | 플랫폼 | 상태 |
|--------|--------|------|
| 프론트엔드 | Vercel | 배포 대기 |
| 백엔드 | Render | 배포 대기 |
| 데이터베이스 | Supabase | ✅ 연동 완료 |

---

## 📝 최근 업데이트

- **2026-01-12**: Admin & Dashboard Supabase 연동, Calendar 한글화, EventTicker 추가
- **2026-01-10**: AI X-Ray Generative Insight 추가
- **2026-01-08**: BubbleChart 가시성 개선, 색상 시스템 통일

---

## 📄 라이선스

Private - TokenPost Korea
