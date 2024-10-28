create table if not exists public.kv_store (
  key text primary key,
  value text not null,
  expires_at timestamp with time zone not null
);

-- Add index for expires_at to help with cleanup
create index if not exists kv_store_expires_at_idx on public.kv_store(expires_at);

-- Add cleanup function
create or replace function cleanup_expired_kv_store() returns void as $$
begin
  delete from public.kv_store where expires_at < now();
end;
$$ language plpgsql;

-- Create a scheduled job to cleanup expired locks
select cron.schedule(
  'cleanup-kv-store',
  '*/5 * * * *', -- Run every 5 minutes
  $$select cleanup_expired_kv_store()$$
);
