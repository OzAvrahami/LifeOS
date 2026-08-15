create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_daily_capacity_minutes integer not null default 360,
  week_start_day smallint not null default 0,
  timezone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_capacity_check
    check (default_daily_capacity_minutes between 0 and 1440),
  constraint user_settings_week_start_day_check
    check (week_start_day between 0 and 6),
  constraint user_settings_timezone_check
    check (
      char_length(timezone) between 1 and 100
      and timezone = btrim(timezone)
      and timezone ~ '^[A-Za-z][A-Za-z0-9._+-]*(/[A-Za-z0-9._+-]+)*$'
    )
);

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

create policy "user_settings_select_own"
on public.user_settings for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "user_settings_insert_own"
on public.user_settings for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "user_settings_update_own"
on public.user_settings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user_settings_delete_own"
on public.user_settings for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.user_settings from anon;
grant select, insert, update, delete on table public.user_settings to authenticated;
