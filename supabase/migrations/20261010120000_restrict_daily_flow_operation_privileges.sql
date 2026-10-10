-- Correct inherited/default table ACLs left by the original #32 migration.
-- save_daily_flow is SECURITY INVOKER: retries SELECT, new commands INSERT.
-- Only this ledger's client grants change; service-role grants and owner RLS stay intact.
revoke all privileges on table public.daily_flow_operations from public, anon, authenticated;
revoke all privileges (user_id, operation_id, date, command)
  on table public.daily_flow_operations from public, anon, authenticated;
grant select, insert on table public.daily_flow_operations to authenticated;

-- Fail closed if an unexpected inherited grant would leave this correction incomplete.
do $$
begin
  if exists (
    select 1 from unnest(array['UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']) p
    where has_table_privilege('authenticated', 'public.daily_flow_operations', p)
  ) or exists (
    select 1 from pg_attribute a
    cross join unnest(array['UPDATE', 'REFERENCES']) p
    where a.attrelid = 'public.daily_flow_operations'::regclass
      and a.attnum > 0 and not a.attisdropped
      and has_column_privilege('authenticated', a.attrelid, a.attnum, p)
  ) then
    raise exception 'Unexpected inherited daily_flow_operations client privilege';
  end if;
end;
$$;
