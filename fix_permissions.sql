-- Enable RLS on tables (good practice, but we need policies)
ALTER TABLE public.market_gate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous SELECT (Read) access
-- This fixes the issue where Frontend (Anon Key) returns empty data despite DB having rows.

CREATE POLICY "Allow Public Select Market Gate"
ON public.market_gate
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow Public Select Analysis Results"
ON public.analysis_results
FOR SELECT
TO anon, authenticated
USING (true);

-- Explicitly grant SELECT permission to anon role (just in case)
GRANT SELECT ON public.market_gate TO anon;
GRANT SELECT ON public.analysis_results TO anon;
GRANT SELECT ON public.market_gate TO authenticated;
GRANT SELECT ON public.analysis_results TO authenticated;
