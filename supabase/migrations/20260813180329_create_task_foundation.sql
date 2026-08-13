create table public.week_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint week_plans_user_week_start_key unique (user_id, week_start),
  constraint week_plans_id_user_id_key unique (id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open',
  estimated_minutes integer,
  priority text not null default 'normal',
  due_date date,
  planned_date date,
  week_plan_id uuid,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint tasks_title_check check (char_length(btrim(title)) between 1 and 500),
  constraint tasks_status_check check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  constraint tasks_priority_check check (priority in ('normal', 'important')),
  constraint tasks_estimated_minutes_check check (
    estimated_minutes is null or estimated_minutes >= 0
  ),
  constraint tasks_position_check check (position >= 0),
  constraint tasks_single_planning_target_check check (
    planned_date is null or week_plan_id is null
  ),
  constraint tasks_completed_at_check check (
    (status = 'completed') = (completed_at is not null)
  ),
  constraint tasks_week_plan_owner_fkey foreign key (week_plan_id, user_id)
    references public.week_plans (id, user_id)
    on delete set null (week_plan_id)
);

create index tasks_user_status_idx on public.tasks (user_id, status);
create index tasks_user_planned_date_position_idx
  on public.tasks (user_id, planned_date, position)
  where planned_date is not null;
create index tasks_user_week_plan_position_idx
  on public.tasks (user_id, week_plan_id, position)
  where week_plan_id is not null;
create index tasks_user_inbox_position_idx
  on public.tasks (user_id, position)
  where status = 'open' and planned_date is null and week_plan_id is null;
create unique index tasks_one_in_progress_per_user_idx
  on public.tasks (user_id)
  where status = 'in_progress';

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger week_plans_set_updated_at
before update on public.week_plans
for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

alter table public.week_plans enable row level security;
alter table public.tasks enable row level security;

create policy "week_plans_select_own"
on public.week_plans for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "week_plans_insert_own"
on public.week_plans for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "week_plans_update_own"
on public.week_plans for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "week_plans_delete_own"
on public.week_plans for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "tasks_select_own"
on public.tasks for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "tasks_insert_own"
on public.tasks for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "tasks_update_own"
on public.tasks for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "tasks_delete_own"
on public.tasks for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.week_plans to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;

create function public.start_task(p_task_id uuid)
returns setof public.tasks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  selected_task public.tasks%rowtype;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(caller_id::text, 0)
  );

  select *
  into selected_task
  from public.tasks
  where id = p_task_id and user_id = caller_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'task_not_found';
  end if;

  if selected_task.status not in ('open', 'in_progress') then
    raise exception using errcode = 'P0001', message = 'task_not_open';
  end if;

  update public.tasks
  set status = 'open', completed_at = null
  where user_id = caller_id
    and status = 'in_progress'
    and id <> p_task_id;

  update public.tasks
  set status = 'in_progress', completed_at = null
  where id = p_task_id and user_id = caller_id
  returning * into selected_task;

  return next selected_task;
  return;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.start_task(uuid) from public;
grant execute on function public.start_task(uuid) to authenticated;
