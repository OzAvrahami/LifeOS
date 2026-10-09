-- #33: atomic explicit Week allocation over the existing ordered DailyPlan rows.
-- No task cloning, task date/status edits, event writes or historical rewrites.
create table public.week_allocation_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  week_start date not null,
  command jsonb not null,
  primary key (user_id, operation_id)
);
alter table public.week_allocation_operations enable row level security;
create policy "Own week allocation operations" on public.week_allocation_operations
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.week_allocation_operations from anon, authenticated;
grant select, insert on public.week_allocation_operations to authenticated;

create function public.save_week_allocation(p_week_start date, p_command jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid := auth.uid(); v_operation uuid := (p_command->>'operationId')::uuid;
  v_previous public.week_allocation_operations; v_day jsonb; v_date date;
  v_context jsonb; v_plan public.daily_plans; v_ids uuid[]; v_state jsonb;
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_week_start is null or v_operation is null or jsonb_typeof(p_command->'days') is distinct from 'array'
    or jsonb_array_length(p_command->'days') not between 1 and 7 then
    raise exception 'Invalid allocation' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':daily-flow', 0));
  select * into v_previous from public.week_allocation_operations where user_id = v_user and operation_id = v_operation;
  if found then
    if v_previous.week_start <> p_week_start or v_previous.command is distinct from p_command then
      raise exception 'Operation identity reused' using errcode = '55000';
    end if;
    return;
  end if;
  if (select count(distinct d->>'date') from jsonb_array_elements(p_command->'days') d)
    <> jsonb_array_length(p_command->'days') then raise exception 'Duplicate dates' using errcode = '22023'; end if;
  -- Validate every reviewed snapshot before any write changes the history of a later day.
  for v_day in select value from jsonb_array_elements(p_command->'days') loop
    v_date := (v_day->>'date')::date;
    if v_date is null or v_date < p_week_start or v_date > p_week_start + 6 then
      raise exception 'Invalid allocation date' using errcode = '22023';
    end if;
    v_context := public.daily_flow_context(v_date);
    if v_date < (v_context->>'today')::date then raise exception 'Historical day' using errcode = '55000'; end if;
    select * into v_plan from public.daily_plans where user_id = v_user and date = v_date for update;
    if (v_day->>'revision')::integer is distinct from coalesce(v_plan.planning_revision, 0)
      or v_day->>'snapshot' is distinct from v_context->>'snapshot' then
      raise exception 'Allocation changed; review again' using errcode = '55000';
    end if;
    if jsonb_typeof(v_day->'ids') is distinct from 'array' then raise exception 'Missing selection' using errcode = '22023'; end if;
    select coalesce(array_agg(id::uuid order by ord), '{}') into v_ids
      from jsonb_array_elements_text(v_day->'ids') with ordinality a(id, ord);
    if cardinality(v_ids) > 500 or cardinality(v_ids) <> (select count(distinct id) from unnest(v_ids) id)
      or exists (select 1 from unnest(v_ids) s(id) where not exists (
        select 1 from public.tasks t where t.id = s.id and t.user_id = v_user and t.status <> 'cancelled'
          and (t.status in ('open', 'in_progress') or
            (v_plan.planning_status = 'completed' and t.id = any(v_plan.selected_task_ids)))
      )) then raise exception 'Invalid selection' using errcode = '23514'; end if;
  end loop;
  for v_day in select value from jsonb_array_elements(p_command->'days') order by value->>'date' loop
    v_date := (v_day->>'date')::date;
    select * into v_plan from public.daily_plans where user_id = v_user and date = v_date;
    select coalesce(array_agg(id::uuid order by ord), '{}') into v_ids
      from jsonb_array_elements_text(v_day->'ids') with ordinality a(id, ord);
    v_state := coalesce(v_plan.flow_state, jsonb_build_object('source',
      case when v_plan.planning_status = 'completed' then 'legacy' else 'weekly' end, 'summary', null));
    v_state := v_state || jsonb_build_object('proposal', null, 'operationId', v_operation,
      'source', coalesce(nullif(v_state->>'source', ''), 'weekly'));
    if v_plan.id is null then
      insert into public.daily_plans(user_id, date, planning_status, planning_step,
        planning_completed_at, selected_task_ids, flow_state)
        values(v_user, v_date, 'completed', 3, now(), v_ids, v_state);
    else
      update public.daily_plans set planning_status = 'completed', planning_step = 3,
        planning_completed_at = coalesce(planning_completed_at, now()), selected_task_ids = v_ids,
        flow_state = v_state where id = v_plan.id;
    end if;
  end loop;
  insert into public.week_allocation_operations values(v_user, v_operation, p_week_start, p_command);
end;
$$;
revoke all on function public.save_week_allocation(date, jsonb) from public, anon;
grant execute on function public.save_week_allocation(date, jsonb) to authenticated;

-- The existing trigger fires only for INSERT or explicitly supplied placement
-- columns. A same-value manual placement is still intentional: approved IDs can
-- differ from the Task date after a Week allocation. Other edits never fire it.
create or replace function public.sync_explicit_task_placement() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare v_today date; v_timezone text;
begin
  select timezone into v_timezone from public.user_settings where user_id = new.user_id;
  v_today := (now() at time zone coalesce(v_timezone, 'Asia/Jerusalem'))::date;
  if tg_op = 'UPDATE' then
    update public.daily_plans set selected_task_ids = array_remove(selected_task_ids, new.id),
      flow_state = case when flow_state is null then null else flow_state || jsonb_build_object('placementUpdate', new.updated_at, 'proposal', null) end
      where user_id = new.user_id and date >= v_today and date is distinct from new.planned_date
        and planning_status = 'completed' and new.id = any(selected_task_ids);
  end if;
  if new.planned_date >= v_today and new.status in ('open', 'in_progress') then
    update public.daily_plans set selected_task_ids = array_append(selected_task_ids, new.id),
      flow_state = case when flow_state is null then null else flow_state || jsonb_build_object('placementUpdate', new.updated_at, 'proposal', null) end
      where user_id = new.user_id and date = new.planned_date
        and planning_status = 'completed' and not new.id = any(selected_task_ids);
  end if;
  return new;
end;
$$;
