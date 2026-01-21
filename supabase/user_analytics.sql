-- =====================================================
-- User Analytics Table for TokenPost PRO
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create the user_analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    event_type TEXT NOT NULL,
    page_path TEXT NOT NULL,
    user_email TEXT,
    user_id TEXT,
    session_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT
);

-- Add comments for documentation
COMMENT ON TABLE user_analytics IS 'Tracks user behavior: page views, clicks, time spent';
COMMENT ON COLUMN user_analytics.event_type IS 'page_view | click | scroll | time_spent | action';
COMMENT ON COLUMN user_analytics.session_id IS 'Browser session identifier';
COMMENT ON COLUMN user_analytics.metadata IS 'Additional event-specific data (JSON)';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_user_email ON user_analytics(user_email);
CREATE INDEX IF NOT EXISTS idx_analytics_page_path ON user_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON user_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON user_analytics(session_id);

-- Enable Row Level Security (optional - can be disabled for open inserts)
-- ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for tracking without auth)
-- CREATE POLICY "Allow anonymous inserts" ON user_analytics
--     FOR INSERT WITH CHECK (true);

-- Policy: Allow authenticated reads for admin dashboard
-- CREATE POLICY "Allow authenticated reads" ON user_analytics
--     FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- Example Queries for Admin Dashboard
-- =====================================================

-- Daily page views (last 7 days)
-- SELECT 
--     DATE(created_at) as date,
--     COUNT(*) as views
-- FROM user_analytics
-- WHERE event_type = 'page_view'
--   AND created_at > NOW() - INTERVAL '7 days'
-- GROUP BY DATE(created_at)
-- ORDER BY date DESC;

-- Top pages by views
-- SELECT 
--     page_path,
--     COUNT(*) as views
-- FROM user_analytics
-- WHERE event_type = 'page_view'
-- GROUP BY page_path
-- ORDER BY views DESC
-- LIMIT 10;

-- User activity summary
-- SELECT 
--     user_email,
--     COUNT(*) as total_events,
--     COUNT(DISTINCT session_id) as sessions,
--     MAX(created_at) as last_active
-- FROM user_analytics
-- WHERE user_email IS NOT NULL
-- GROUP BY user_email
-- ORDER BY total_events DESC;
