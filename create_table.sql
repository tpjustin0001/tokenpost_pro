-- 1. Grok용 뉴스/이슈 데이터 테이블
CREATE TABLE IF NOT EXISTS public.global_market_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    data JSONB, 
    model_used TEXT, 
    is_latest BOOLEAN DEFAULT FALSE 
);
CREATE INDEX IF NOT EXISTS idx_global_market_snapshots_is_latest ON public.global_market_snapshots(is_latest);

-- 2. GPT용 심층 분석(Deep Analysis) 테이블
CREATE TABLE IF NOT EXISTS public.global_deep_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    data JSONB, 
    model_used TEXT, 
    is_latest BOOLEAN DEFAULT FALSE 
);
CREATE INDEX IF NOT EXISTS idx_global_deep_analysis_is_latest ON public.global_deep_analysis(is_latest);

-- 3. Market Gate (신호등) 테이블 (MISSING!)
CREATE TABLE IF NOT EXISTS public.market_gate (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    gate_color TEXT,
    score INTEGER,
    summary TEXT,
    metrics_json JSONB
);

-- 4. VCP 결과 테이블 (확인용)
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    analysis_type TEXT, -- 'VCP' or others
    data_json JSONB
);

-- 데이터 확인
SELECT 'Market Gate' as type, created_at, gate_color FROM public.market_gate ORDER BY created_at DESC LIMIT 1;
