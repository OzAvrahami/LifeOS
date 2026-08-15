create table public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  start_time time without time zone not null,
  end_time time without time zone,
  life_area text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commitments_title_check check (
    title = btrim(title) and char_length(title) between 1 and 500
  ),
  constraint commitments_time_range_check check (
    end_time is null or end_time > start_time
  ),
  constraint commitments_life_area_check check (
    life_area is null or life_area in ('work', 'family', 'home', 'health', 'personal', 'projects')
  )
);

create index commitments_user_date_start_time_idx
  on public.commitments (user_id, date, start_time);

create trigger commitments_set_updated_at
before update on public.commitments
for each row execute function public.set_updated_at();

alter table public.commitments enable row level security;

create policy "commitments_select_own"
on public.commitments for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "commitments_insert_own"
on public.commitments for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "commitments_update_own"
on public.commitments for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "commitments_delete_own"
on public.commitments for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.commitments from anon;
grant select, insert, update, delete on table public.commitments to authenticated;
