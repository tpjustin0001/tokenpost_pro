-- ============================================================
-- News & Research Schema
-- ============================================================

-- 1. NEWS TABLE
CREATE TABLE IF NOT EXISTS news (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    source TEXT NOT NULL, -- 'TokenPost', 'Binance', etc.
    url TEXT UNIQUE,      -- deduplication based on URL
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tickers TEXT[] DEFAULT '{}', -- Array of symbols e.g. ['BTC', 'ETH']
    image_url TEXT,
    sentiment TEXT -- 'Positive', 'Negative', 'Neutral'
);

CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_tickers ON news USING GIN (tickers);

-- 2. RESEARCH TABLE
CREATE TABLE IF NOT EXISTS research (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    category TEXT NOT NULL, -- 'KPI', 'BREAKING', 'REPORT'
    is_premium BOOLEAN DEFAULT FALSE,
    author TEXT,
    tags TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_created_at ON research(created_at DESC);

-- 3. WHALE ALERTS TABLE
CREATE TABLE IF NOT EXISTS whale_alerts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    transaction_hash TEXT,
    symbol TEXT NOT NULL,
    amount DECIMAL(24, 8) NOT NULL,
    amount_usd DECIMAL(20, 2),
    from_address TEXT,
    to_address TEXT,
    from_owner TEXT, -- e.g. 'Binance'
    to_owner TEXT,   -- e.g. 'Unknown Wallet'
    transaction_type TEXT, -- 'transfer', 'buy', 'sell'
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whale_timestamp ON whale_alerts(timestamp DESC);

-- 4. MARKET GATE (Signal Traffic Light)
CREATE TABLE IF NOT EXISTS market_gate (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    score INT NOT NULL,
    gate_color TEXT NOT NULL, -- 'GREEN', 'YELLOW', 'RED'
    summary TEXT,
    metrics_json JSONB, -- Store full metrics detail
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_gate_created_at ON market_gate(created_at DESC);

-- 5. ANALYSIS RESULTS (VCP, Screener etc.)
-- Generic table to store heavy calculation results
CREATE TABLE IF NOT EXISTS analysis_results (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    analysis_type TEXT NOT NULL, -- 'VCP', 'SCREENER_BREAKOUT', 'SCREENER_RISK', 'LEAD_LAG'
    data_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_type_created ON analysis_results(analysis_type, created_at DESC);


-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE research ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_gate ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Read Access (Public/Anon)
CREATE POLICY "Allow public read access" ON news FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON research FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON whale_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON market_gate FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON analysis_results FOR SELECT USING (true);

-- Write Access (Service Role Only)
CREATE POLICY "Allow service role insert" ON news FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role insert" ON research FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role insert" ON whale_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role insert" ON market_gate FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role insert" ON analysis_results FOR INSERT WITH CHECK (true);

-- Grants
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 6. CALENDAR EVENTS
CREATE TABLE IF NOT EXISTS calendar_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    country TEXT,
    impact TEXT, -- 'High', 'Medium', 'Low'
    type TEXT,   -- 'Crypto', 'Economy'
    time HH24MI, -- '14:30'
    event_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(title, event_date) -- Prevent duplicates
);

CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_events(event_date);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "Allow service role insert" ON calendar_events FOR INSERT WITH CHECK (true);
