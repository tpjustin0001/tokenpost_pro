-- Add ETH columns to eth_staking_metrics
ALTER TABLE public.eth_staking_metrics ADD COLUMN IF NOT EXISTS entry_queue_eth NUMERIC;
ALTER TABLE public.eth_staking_metrics ADD COLUMN IF NOT EXISTS exit_queue_eth NUMERIC;
ALTER TABLE public.eth_staking_metrics ADD COLUMN IF NOT EXISTS active_validators NUMERIC;
ALTER TABLE public.eth_staking_metrics ADD COLUMN IF NOT EXISTS entry_wait_days NUMERIC;
ALTER TABLE public.eth_staking_metrics ADD COLUMN IF NOT EXISTS exit_wait_minutes NUMERIC;
ALTER TABLE public.eth_staking_metrics ADD COLUMN IF NOT EXISTS staked_percentage NUMERIC;
ALTER TABLE public.eth_staking_metrics ADD COLUMN IF NOT EXISTS total_staked_eth NUMERIC;
ALTER TABLE public.eth_staking_metrics ADD COLUMN IF NOT EXISTS staking_apr NUMERIC;
ALTER TABLE public.eth_staking_metrics ADD COLUMN IF NOT EXISTS entry_wait_seconds NUMERIC;
ALTER TABLE public.eth_staking_metrics ADD COLUMN IF NOT EXISTS entry_wait_hours NUMERIC;

-- Optional: Clean up duplicates or old data if needed
-- DELETE FROM public.eth_staking_metrics;
