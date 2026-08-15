-- LifeOS product data is accessed with the authenticated caller JWT. Relation
-- grants permit an operation, while the existing RLS policies continue to
-- restrict every operation to rows owned by that caller.

revoke all privileges on table public.tasks from anon, authenticated;
revoke all privileges on table public.week_plans from anon, authenticated;
revoke all privileges on table public.daily_plans from anon, authenticated;
revoke all privileges on table public.weekly_focuses from anon, authenticated;
revoke all privileges on table public.commitments from anon, authenticated;
revoke all privileges on table public.user_settings from anon, authenticated;

-- Authenticated users receive only the operations exercised by the API and
-- its SECURITY INVOKER RPCs. Task cancellation is an UPDATE, not a DELETE.
grant select, insert, update on table public.tasks to authenticated;
grant select, insert, update on table public.week_plans to authenticated;
grant select, insert, update, delete on table public.daily_plans to authenticated;
grant select, insert, delete on table public.weekly_focuses to authenticated;
grant select, insert, update, delete on table public.commitments to authenticated;
grant select, insert, update on table public.user_settings to authenticated;

-- service_role is Supabase-managed administrative state. This migration does
-- not revoke, grant, or otherwise normalize its object privileges.

-- Trigger execution does not require callers to execute the trigger function
-- directly. Revoking PUBLIC is required because PostgreSQL functions grant
-- EXECUTE to PUBLIC by default; authenticated application RPCs are then
-- granted explicitly below. Supabase administrative roles are not named.
revoke all privileges on function public.set_updated_at() from public, anon, authenticated;
revoke all privileges on function public.start_task(uuid) from public, anon, authenticated;
revoke all privileges on function public.replace_weekly_focuses(date, text[]) from public, anon, authenticated;

grant execute on function public.start_task(uuid) to authenticated;
grant execute on function public.replace_weekly_focuses(date, text[]) to authenticated;
