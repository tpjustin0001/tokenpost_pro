-- ============================================================
-- ETH Staking Metrics Table
-- For storing validator queue and staking data from Beaconcha.in
-- ============================================================

-- Create the table
CREATE TABLE IF NOT EXISTS eth_staking_metrics (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entry_queue INT NOT NULL,
    exit_queue INT NOT NULL,
    entry_wait_seconds INT NOT NULL,
    exit_wait_seconds INT NOT NULL,
    active_validators INT NOT NULL,
    staking_apr DECIMAL(5, 2) NOT NULL DEFAULT 0,
    total_staked_eth DECIMAL(18, 2) NOT NULL,
    signal_status TEXT, -- 'SELL_ALERT', 'STRONG_HOLD', 'NEUTRAL'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE eth_staking_metrics IS 'ETH staking validator queue metrics collected from Beaconcha.in API every 10 minutes';
COMMENT ON COLUMN eth_staking_metrics.entry_queue IS '진입 대기열 검증자 수';
COMMENT ON COLUMN eth_staking_metrics.exit_queue IS '이탈 대기열 검증자 수';
COMMENT ON COLUMN eth_staking_metrics.entry_wait_seconds IS '진입 예상 대기 시간(초)';
COMMENT ON COLUMN eth_staking_metrics.exit_wait_seconds IS '이탈 예상 대기 시간(초)';
COMMENT ON COLUMN eth_staking_metrics.active_validators IS '활성 검증자 수';
COMMENT ON COLUMN eth_staking_metrics.staking_apr IS '연간 수익률(%)';
COMMENT ON COLUMN eth_staking_metrics.total_staked_eth IS '총 스테이킹 ETH';

-- Index for time-series queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_eth_staking_created_at 
ON eth_staking_metrics(created_at DESC);

-- Enable Row Level Security
ALTER TABLE eth_staking_metrics ENABLE ROW LEVEL SECURITY;

-- Public read access policy
DROP POLICY IF EXISTS "Allow public read access" ON eth_staking_metrics;
CREATE POLICY "Allow public read access" 
ON eth_staking_metrics 
FOR SELECT 
USING (true);

-- Service role write access (for backend scheduler)
DROP POLICY IF EXISTS "Allow service role insert" ON eth_staking_metrics;
CREATE POLICY "Allow service role insert" 
ON eth_staking_metrics 
FOR INSERT 
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON eth_staking_metrics TO anon;
GRANT SELECT ON eth_staking_metrics TO authenticated;
GRANT ALL ON eth_staking_metrics TO service_role;

-- ============================================================
-- Verification Query (run after creating table)
-- ============================================================
-- SELECT * FROM eth_staking_metrics ORDER BY created_at DESC LIMIT 10;

