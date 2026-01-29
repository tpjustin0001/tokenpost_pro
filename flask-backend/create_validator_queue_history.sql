-- Create table for Validator Queue History
create table public.validator_queue_history (
  date date not null,
  entry_queue bigint null,
  exit_queue bigint null,
  apr double precision null,
  created_at timestamp with time zone not null default now(),
  constraint validator_queue_history_pkey primary key (date)
);

-- Enable RLS just in case (optional, depending on your policy)
alter table public.validator_queue_history enable row level security;

-- Allow read access to everyone (since it's public data)
create policy "Enable read access for all users" on public.validator_queue_history
  for select using (true);

-- Allow write access only to service role (backend)
-- (Supabase service role bypasses RLS, so explicit policy might not be needed if only backend writes)
