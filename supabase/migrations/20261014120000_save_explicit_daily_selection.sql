-- Explicit ordered selections are independent of recommendation freshness.
-- Forward-only function replacement: no data rewrite, grant or RLS changes.
create or replace function public.save_daily_flow(p_date date, p_command jsonb) returns jsonb
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
  -- Only generating a recommendation depends on the global context. Selection
  -- writes are protected by the day revision and current selected-task validation.
  if v_action = 'propose' and p_command->>'snapshot' is distinct from v_context->>'snapshot' then
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
    if v_action = 'save-draft' then
      -- Keep the compatible proposal envelope for older clients and existing drafts.
      -- Its snapshot/reasons describe the original suggestion, never save authority.
      v_state := jsonb_set(v_state, '{proposal}',
        coalesce(nullif(v_state->'proposal', 'null'::jsonb), jsonb_build_object(
          'ids', '[]'::jsonb, 'reasons', '{}'::jsonb, 'snapshot', v_context->>'snapshot', 'rule', 'bounded-v1'))
        || jsonb_build_object('ids', to_jsonb(v_ids)));
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
    insert into public.daily_plans(user_id, date, planning_status, planning_step, planning_completed_at, selected_task_ids, flow_state)
      values(v_user, p_date, case when v_action = 'approve' then 'completed' else 'in_progress' end,
        case when v_action = 'approve' then 3 else 1 end,
        case when v_action = 'approve' then now() else null end,
        case when v_action = 'approve' then v_ids else '{}'::uuid[] end, v_state) returning * into v_plan;
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
