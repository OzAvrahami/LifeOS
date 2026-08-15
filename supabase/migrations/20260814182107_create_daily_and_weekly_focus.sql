create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  focus_task_id uuid references public.tasks(id) on delete set null,
  available_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_plans_user_date_key unique (user_id, date),
  constraint daily_plans_available_minutes_check
    check (available_minutes is null or available_minutes between 0 and 1440),
  constraint daily_plans_have_data_check
    check (focus_task_id is not null or available_minutes is not null)
);

create trigger daily_plans_set_updated_at
before update on public.daily_plans
for each row execute function public.set_updated_at();

alter table public.daily_plans enable row level security;

create policy "Users can select their own daily plans"
on public.daily_plans for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can insert their own daily plans"
on public.daily_plans for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    focus_task_id is null
    or exists (
      select 1
      from public.tasks
      where tasks.id = daily_plans.focus_task_id
        and tasks.user_id = (select auth.uid())
        and tasks.planned_date = daily_plans.date
        and tasks.status in ('open', 'in_progress')
    )
  )
);

create policy "Users can update their own daily plans"
on public.daily_plans for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    focus_task_id is null
    or exists (
      select 1
      from public.tasks
      where tasks.id = daily_plans.focus_task_id
        and tasks.user_id = (select auth.uid())
        and tasks.planned_date = daily_plans.date
        and tasks.status in ('open', 'in_progress')
    )
  )
);

create policy "Users can delete their own daily plans"
on public.daily_plans for delete
to authenticated
using (user_id = (select auth.uid()));

create table public.weekly_focuses (
  id uuid primary key default gen_random_uuid(),
  week_plan_id uuid not null references public.week_plans(id) on delete cascade,
  title text not null,
  position smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_focuses_week_position_key unique (week_plan_id, position),
  constraint weekly_focuses_week_title_key unique (week_plan_id, title),
  constraint weekly_focuses_title_check
    check (char_length(btrim(title)) between 1 and 200),
  constraint weekly_focuses_position_check check (position between 0 and 2)
);

create trigger weekly_focuses_set_updated_at
before update on public.weekly_focuses
for each row execute function public.set_updated_at();

alter table public.weekly_focuses enable row level security;

create policy "Users can select their own weekly focuses"
on public.weekly_focuses for select
to authenticated
using (
  exists (
    select 1
    from public.week_plans
    where week_plans.id = weekly_focuses.week_plan_id
      and week_plans.user_id = (select auth.uid())
  )
);

create policy "Users can insert their own weekly focuses"
on public.weekly_focuses for insert
to authenticated
with check (
  exists (
    select 1
    from public.week_plans
    where week_plans.id = weekly_focuses.week_plan_id
      and week_plans.user_id = (select auth.uid())
  )
);

create policy "Users can update their own weekly focuses"
on public.weekly_focuses for update
to authenticated
using (
  exists (
    select 1
    from public.week_plans
    where week_plans.id = weekly_focuses.week_plan_id
      and week_plans.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.week_plans
    where week_plans.id = weekly_focuses.week_plan_id
      and week_plans.user_id = (select auth.uid())
  )
);

create policy "Users can delete their own weekly focuses"
on public.weekly_focuses for delete
to authenticated
using (
  exists (
    select 1
    from public.week_plans
    where week_plans.id = weekly_focuses.week_plan_id
      and week_plans.user_id = (select auth.uid())
  )
);

create or replace function public.replace_weekly_focuses(
  p_week_start date,
  p_titles text[]
)
returns setof public.weekly_focuses
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_week_plan_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if cardinality(p_titles) > 3 then
    raise exception 'A week can have at most three focuses' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from unnest(p_titles) as title
    where title is null or char_length(btrim(title)) not between 1 and 200
  ) then
    raise exception 'Invalid weekly focus title' using errcode = 'P0001';
  end if;

  if (
    select count(*) <> count(distinct btrim(title))
    from unnest(p_titles) as title
  ) then
    raise exception 'Weekly focus titles must be unique' using errcode = 'P0001';
  end if;

  insert into public.week_plans (user_id, week_start)
  values (v_user_id, p_week_start)
  on conflict (user_id, week_start)
  do update set week_start = excluded.week_start
  returning id into v_week_plan_id;

  delete from public.weekly_focuses
  where week_plan_id = v_week_plan_id;

  insert into public.weekly_focuses (week_plan_id, title, position)
  select v_week_plan_id, btrim(title), (ordinality - 1)::smallint
  from unnest(p_titles) with ordinality as focus(title, ordinality);

  return query
  select *
  from public.weekly_focuses
  where week_plan_id = v_week_plan_id
  order by position;
end;
$$;

revoke all on table public.daily_plans from anon;
revoke all on table public.weekly_focuses from anon;
grant select, insert, update, delete on table public.daily_plans to authenticated;
grant select, insert, update, delete on table public.weekly_focuses to authenticated;

revoke all on function public.replace_weekly_focuses(date, text[]) from public;
grant execute on function public.replace_weekly_focuses(date, text[]) to authenticated;
