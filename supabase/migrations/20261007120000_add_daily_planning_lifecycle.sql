-- Daily selection is independent of task placement and legacy Daily Focus.
alter table public.daily_plans
  add column planning_status text not null default 'not_started',
  add column planning_step integer not null default 0,
  add column planning_completed_at timestamptz,
  add column selected_task_ids uuid[] not null default '{}',
  add column planning_revision integer not null default 0,
  add column planning_operation_id uuid,
  add column planning_operation jsonb,
  drop constraint daily_plans_have_data_check,
  add constraint daily_plans_have_data_check check (
    focus_task_id is not null or available_minutes is not null or planning_status <> 'not_started'
  ),
  add constraint daily_plans_lifecycle_check check (
    (planning_status = 'not_started' and planning_step = 0 and planning_completed_at is null and cardinality(selected_task_ids) = 0)
    or (planning_status = 'in_progress' and planning_step between 1 and 3)
    or (planning_status = 'completed' and planning_step = 3 and planning_completed_at is not null)
  ),
  add constraint daily_plans_selection_size_check check (cardinality(selected_task_ids) <= 500),
  add constraint daily_plans_revision_check check (planning_revision >= 0);

-- Validate changed references, not a stale legacy focus when an unrelated field changes.
-- Ownership is also enforced here for direct caller-scoped table access.
create function public.guard_daily_planning()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_previous uuid[] := '{}';
begin
  if tg_op = 'DELETE' then
    if pg_trigger_depth() > 1 then return old; end if; -- allow auth-user cascade cleanup
    if old.planning_status <> 'not_started' then
      -- A pre-upgrade API clears both legacy fields by deleting the row.
      -- Keep the same planning owner, selections and lifecycle during rolling upgrades.
      update public.daily_plans set focus_task_id = null, available_minutes = null where id = old.id;
      return null;
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' then
    if new.user_id <> old.user_id or new.date <> old.date or new.id <> old.id then
      raise exception 'Daily plan identity is immutable' using errcode = '23514';
    end if;
    v_previous := old.selected_task_ids;
  end if;
  if array_position(new.selected_task_ids, null) is not null
    or cardinality(new.selected_task_ids) <> (select count(distinct id) from unnest(new.selected_task_ids) id)
    or exists (
      select 1 from unnest(new.selected_task_ids) as selected(task_id)
      where not (selected.task_id = any(v_previous)) and not exists (
        select 1 from public.tasks t where t.id = selected.task_id and t.user_id = new.user_id and t.status in ('open', 'in_progress')
      )
    ) then
    raise exception 'Invalid daily selection' using errcode = '23514';
  end if;
  if new.focus_task_id is not null and (tg_op = 'INSERT' or new.focus_task_id is distinct from old.focus_task_id)
    and not exists (select 1 from public.tasks t where t.id = new.focus_task_id and t.user_id = new.user_id
      and t.planned_date = new.date and t.status in ('open', 'in_progress')) then
    raise exception 'Invalid Daily Focus' using errcode = '23514';
  end if;
  if tg_op = 'INSERT' then
    new.planning_revision := case when new.planning_status = 'not_started' then 0 else 1 end;
  elsif (new.planning_status, new.planning_step, new.planning_completed_at, new.selected_task_ids)
    is distinct from (old.planning_status, old.planning_step, old.planning_completed_at, old.selected_task_ids) then
    new.planning_revision := old.planning_revision + 1;
  else
    new.planning_revision := old.planning_revision;
  end if;
  return new;
end;
$$;
create trigger daily_plans_guard before insert or update or delete on public.daily_plans
for each row execute function public.guard_daily_planning();
revoke all on function public.guard_daily_planning() from public, anon;

drop policy "Users can insert their own daily plans" on public.daily_plans;
drop policy "Users can update their own daily plans" on public.daily_plans;
create policy "Users can insert their own daily plans" on public.daily_plans for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "Users can update their own daily plans" on public.daily_plans for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.save_daily_planning(
  p_date date, p_action text, p_revision integer, p_operation_id uuid,
  p_step integer default null, p_selected_task_ids uuid[] default null
)
returns public.daily_plans language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_plan public.daily_plans;
  v_operation jsonb := jsonb_build_object('action', p_action, 'revision', p_revision, 'step', p_step, 'selectedTaskIds', p_selected_task_ids);
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_date is null or p_action is null or p_action not in ('start', 'save', 'complete', 'edit')
    or p_revision is null or p_revision < 0 or p_operation_id is null then
    raise exception 'Invalid daily planning input' using errcode = '22023';
  end if;
  if p_action = 'save' then
    if p_step is null or p_step not between 1 and 3 or p_selected_task_ids is null then
      raise exception 'Invalid daily planning save' using errcode = '22023';
    end if;
  elsif p_step is not null or p_selected_task_ids is not null then
    raise exception 'Unexpected daily planning fields' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':' || p_date::text, 0));
  if p_action = 'start' and p_revision = 0 then
    insert into public.daily_plans(user_id, date, planning_status, planning_step, planning_operation_id, planning_operation)
    values (v_user, p_date, 'in_progress', 1, p_operation_id, v_operation)
    on conflict (user_id, date) do nothing;
  end if;
  select * into v_plan from public.daily_plans where user_id = v_user and date = p_date for update;
  if not found then raise exception 'Start planning first' using errcode = '55000'; end if;
  if v_plan.planning_operation_id = p_operation_id then
    if v_plan.planning_operation is distinct from v_operation then
      raise exception 'Operation identity reused' using errcode = '55000';
    end if;
    return v_plan;
  end if;
  if v_plan.planning_revision <> p_revision then
    raise exception 'Daily plan changed; reload before editing' using errcode = '55000';
  end if;
  if p_action = 'start' then
    if v_plan.planning_status = 'not_started' then
      update public.daily_plans set planning_status = 'in_progress', planning_step = 1 where id = v_plan.id;
    end if;
  elsif p_action = 'edit' then
    if v_plan.planning_status <> 'completed' then raise exception 'Review completed plan before editing' using errcode = '55000'; end if;
    -- Preserve the last confirmation timestamp and all selections while editing.
    update public.daily_plans set planning_status = 'in_progress', planning_step = 2 where id = v_plan.id;
  elsif p_action = 'save' then
    if v_plan.planning_status <> 'in_progress' or p_step > v_plan.planning_step + 1 then
      raise exception 'Invalid planning transition' using errcode = '55000';
    end if;
    update public.daily_plans set planning_step = p_step, selected_task_ids = p_selected_task_ids where id = v_plan.id;
  else
    if v_plan.planning_status <> 'in_progress' or v_plan.planning_step <> 3 then
      raise exception 'Review the plan before confirming' using errcode = '55000';
    end if;
    update public.daily_plans set planning_status = 'completed', planning_completed_at = now() where id = v_plan.id;
  end if;
  update public.daily_plans set planning_operation_id = p_operation_id, planning_operation = v_operation
  where id = v_plan.id returning * into v_plan;
  return v_plan;
end;
$$;
revoke all on function public.save_daily_planning(date, text, integer, uuid, integer, uuid[]) from public, anon;
grant execute on function public.save_daily_planning(date, text, integer, uuid, integer, uuid[]) to authenticated;
