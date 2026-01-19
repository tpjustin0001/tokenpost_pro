-- Create whale_alerts table if it doesn't exist
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

-- Index for sorting
CREATE INDEX IF NOT EXISTS idx_whale_timestamp ON whale_alerts(timestamp DESC);

-- Enable RLS
ALTER TABLE whale_alerts ENABLE ROW LEVEL SECURITY;

-- Grant permissions
CREATE POLICY "Allow public read access" ON whale_alerts FOR SELECT USING (true);
CREATE POLICY "Allow service role insert" ON whale_alerts FOR INSERT WITH CHECK (true);

-- Ensure public access
GRANT SELECT ON whale_alerts TO anon;
GRANT SELECT ON whale_alerts TO authenticated;
GRANT ALL ON whale_alerts TO service_role;
