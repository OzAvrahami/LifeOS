-- V2 keeps the existing daily identity and ordered selection. Proposals are separate.
alter table public.daily_plans add column flow_state jsonb;
alter table public.daily_plans add constraint daily_flow_object check (flow_state is null or jsonb_typeof(flow_state) = 'object');

create table public.daily_flow_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  date date not null,
  command jsonb not null,
  primary key (user_id, operation_id)
);
alter table public.daily_flow_operations enable row level security;
create policy "Own daily flow operations" on public.daily_flow_operations for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.daily_flow_operations from anon;
grant select, insert on public.daily_flow_operations to authenticated;

-- All relevant writes share a caller lock, including changes from older clients.
create function public.lock_daily_flow_owner() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(coalesce(new.user_id, old.user_id)::text || ':daily-flow', 0));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger a_daily_flow_lock before insert or update or delete on public.tasks
for each row execute function public.lock_daily_flow_owner();
create trigger a_daily_flow_lock before insert or update or delete on public.daily_plans
for each row execute function public.lock_daily_flow_owner();
create trigger a_daily_flow_lock before insert or update or delete on public.user_settings
for each row execute function public.lock_daily_flow_owner();

create function public.guard_daily_flow() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    -- Old focus/capacity writes remain compatible; old lifecycle writes cannot undo V2 approval.
    if old.flow_state is not null and new.flow_state is not distinct from old.flow_state
      and (new.planning_status, new.selected_task_ids, new.planning_step) is distinct from
          (old.planning_status, old.selected_task_ids, old.planning_step) then
      raise exception 'Use the current daily planning contract' using errcode = '55000';
    end if;
    if new.flow_state is distinct from old.flow_state then new.planning_revision := old.planning_revision + 1; end if;
  end if;
  return new;
end;
$$;
-- Runs after daily_plans_guard, which still validates selection identity/ownership.
create trigger z_daily_flow_guard before insert or update on public.daily_plans
for each row execute function public.guard_daily_flow();

create function public.daily_flow_context(p_date date) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare v_tasks jsonb; v_history jsonb; v_weeks jsonb; v_plan jsonb; v_timezone text; v_snapshot text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.id), '[]') into v_tasks from public.tasks t where t.user_id = auth.uid();
  select coalesce(jsonb_agg(jsonb_build_object('date', p.date, 'ids', p.selected_task_ids, 'revision', p.planning_revision) order by p.date), '[]')
    into v_history from public.daily_plans p where p.user_id = auth.uid() and p.date < p_date and p.planning_status = 'completed';
  select coalesce(jsonb_agg(jsonb_build_object('id', w.id, 'weekStart', w.week_start) order by w.id), '[]')
    into v_weeks from public.week_plans w where w.user_id = auth.uid();
  select to_jsonb(p) into v_plan from public.daily_plans p where p.user_id = auth.uid() and p.date = p_date;
  select s.timezone into v_timezone from public.user_settings s where s.user_id = auth.uid();
  v_timezone := coalesce(v_timezone, 'Asia/Jerusalem');
  v_snapshot := md5(jsonb_build_array(v_tasks, v_history, v_weeks, v_timezone)::text);
  return jsonb_build_object('plan', v_plan, 'tasks', v_tasks, 'history', v_history, 'weeks', v_weeks,
    'snapshot', v_snapshot, 'today', (now() at time zone v_timezone)::date, 'timezone', v_timezone);
end;
$$;

create function public.save_daily_flow(p_date date, p_command jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid := auth.uid(); v_plan public.daily_plans; v_context jsonb; v_state jsonb;
  v_action text := p_command->>'action'; v_operation uuid := (p_command->>'operationId')::uuid;
  v_revision integer := (p_command->>'revision')::integer; v_previous public.daily_flow_operations;
  v_ids uuid[]; v_approved boolean;
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_date is null or v_operation is null or v_revision is null or v_revision < 0
    or v_action is null or v_action not in ('propose', 'save-draft', 'approve', 'edit', 'discard', 'summarize') then
    raise exception 'Invalid daily flow command' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':daily-flow', 0));
  select * into v_previous from public.daily_flow_operations where user_id = v_user and operation_id = v_operation;
  if found then
    if v_previous.date <> p_date or v_previous.command is distinct from p_command then
      raise exception 'Operation identity reused' using errcode = '55000';
    end if;
    -- Return current state, never resurrect an old operation's snapshot.
    return public.daily_flow_context(p_date);
  end if;
  v_context := public.daily_flow_context(p_date);
  select * into v_plan from public.daily_plans where user_id = v_user and date = p_date for update;
  if coalesce(v_plan.planning_revision, 0) <> v_revision then
    raise exception 'Plan changed; review again' using errcode = '55000';
  end if;
  if p_date < (v_context->>'today')::date and v_action <> 'summarize' then
    raise exception 'Historical plans cannot be rewritten' using errcode = '55000';
  end if;
  if v_action not in ('discard', 'summarize') and p_command->>'snapshot' is distinct from v_context->>'snapshot' then
    raise exception 'Tasks or date context changed; review again' using errcode = '55000';
  end if;
  v_approved := coalesce(v_plan.planning_status = 'completed', false);
  v_state := coalesce(v_plan.flow_state, jsonb_build_object('proposal', null, 'source', case when v_approved then 'legacy' else null end, 'summary', null));
  if v_action = 'propose' then
    if jsonb_typeof(p_command->'proposal') <> 'object' or p_command->'proposal' is null then
      raise exception 'Missing proposal' using errcode = '22023';
    end if;
    v_state := jsonb_set(v_state, '{proposal}', p_command->'proposal');
  elsif v_action in ('approve', 'edit', 'save-draft') then
    if jsonb_typeof(p_command->'ids') <> 'array' or p_command->'ids' is null then
      raise exception 'Missing selection' using errcode = '22023';
    end if;
    select coalesce(array_agg(id::uuid order by ord), '{}') into v_ids from jsonb_array_elements_text(p_command->'ids') with ordinality a(id, ord);
    if cardinality(v_ids) > 500 or cardinality(v_ids) <> (select count(distinct id) from unnest(v_ids) id)
      or exists (select 1 from unnest(v_ids) s(id) where not exists (
        select 1 from public.tasks t where t.id = s.id and t.user_id = v_user and t.status <> 'cancelled'
          and (t.status in ('open', 'in_progress') or (v_approved and t.id = any(v_plan.selected_task_ids)))
      )) then raise exception 'Invalid selection' using errcode = '23514'; end if;
    if v_action = 'edit' and not v_approved then raise exception 'Approve the plan first' using errcode = '55000'; end if;
    if v_action in ('approve', 'save-draft') and (v_state->'proposal' is null or v_state->'proposal' = 'null'::jsonb) then
      raise exception 'Review a proposal first' using errcode = '55000';
    end if;
    if v_action in ('approve', 'save-draft') and v_state->'proposal'->>'snapshot' is distinct from v_context->>'snapshot' then
      raise exception 'Proposal is stale' using errcode = '55000';
    end if;
    if v_action = 'save-draft' then
      v_state := jsonb_set(v_state, '{proposal,ids}', to_jsonb(v_ids));
    else
      v_state := jsonb_set(v_state, '{proposal}', 'null');
      if v_action = 'approve' and not v_approved then
        if p_command->>'source' is null or p_command->>'source' not in ('daily', 'weekly') then raise exception 'Invalid approval source' using errcode = '22023'; end if;
        v_state := jsonb_set(v_state, '{source}', to_jsonb(p_command->>'source'));
      end if;
    end if;
  elsif v_action = 'discard' then
    v_state := jsonb_set(v_state, '{proposal}', 'null');
  else
    if not v_approved or p_date > (v_context->>'today')::date then raise exception 'No day to summarize' using errcode = '55000'; end if;
    if p_command->'note' is null or jsonb_typeof(p_command->'note') <> 'string' or length(p_command->>'note') > 1000 then raise exception 'Invalid summary' using errcode = '22023'; end if;
    v_state := jsonb_set(v_state, '{summary}', jsonb_build_object('note', p_command->>'note', 'savedAt', now()));
  end if;
  v_state := jsonb_set(v_state, '{operationId}', to_jsonb(v_operation));
  if v_plan.id is null then
    insert into public.daily_plans(user_id, date, planning_status, planning_step, flow_state)
      values(v_user, p_date, 'in_progress', 1, v_state) returning * into v_plan;
  else
    update public.daily_plans set flow_state = v_state,
      planning_status = case when v_action in ('approve', 'edit') then 'completed' when planning_status = 'not_started' then 'in_progress' else planning_status end,
      planning_step = case when v_action in ('approve', 'edit') then 3 when planning_status = 'not_started' then 1 else planning_step end,
      planning_completed_at = case when v_action in ('approve', 'edit') then coalesce(planning_completed_at, now()) else planning_completed_at end,
      selected_task_ids = case when v_action in ('approve', 'edit') then v_ids else selected_task_ids end
      where id = v_plan.id;
  end if;
  insert into public.daily_flow_operations values(v_user, v_operation, p_date, p_command);
  return public.daily_flow_context(p_date);
end;
$$;
revoke all on function public.lock_daily_flow_owner(), public.guard_daily_flow(), public.daily_flow_context(date), public.save_daily_flow(date, jsonb) from public, anon;
grant execute on function public.daily_flow_context(date), public.save_daily_flow(date, jsonb) to authenticated;

-- Explicit single-task placement changes intentionally edit current/future V2 plans.
-- Completion/status changes never move membership; historical references remain intact.
create function public.sync_explicit_task_placement() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare v_today date; v_timezone text;
begin
  if tg_op = 'UPDATE' and (new.planned_date, new.week_plan_id) is not distinct from (old.planned_date, old.week_plan_id) then return new; end if;
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
create trigger tasks_explicit_placement after insert or update of planned_date, week_plan_id on public.tasks
for each row execute function public.sync_explicit_task_placement();
revoke all on function public.sync_explicit_task_placement() from public, anon;
