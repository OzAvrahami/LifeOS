-- Existing focus/task-only owner rows are NOT evidence of a completed planning session.
-- Absence and an existing not_started owner row both mean no session has started.
alter table public.week_plans
  add column planning_status text not null default 'not_started',
  add column planning_step smallint not null default 0,
  add column planning_completed_at timestamptz,
  add constraint week_plans_lifecycle_check check (
    (planning_status = 'not_started' and planning_step = 0 and planning_completed_at is null)
    or (planning_status = 'in_progress' and planning_step between 1 and 4 and planning_completed_at is null)
    or (planning_status = 'completed' and planning_step = 4 and planning_completed_at is not null)
  );

-- Serialize retries and concurrent progress/focus edits on the existing user/week owner.
-- The legacy replace_weekly_focuses RPC acquires the same row lock via its upsert.
create function public.save_weekly_planning(
  p_week_start date,
  p_action text,
  p_step integer default null,
  p_advance boolean default false,
  p_titles text[] default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan public.week_plans;
  v_focuses jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_week_start is null or p_action is null or p_action not in ('start', 'save', 'complete')
    or p_advance is null then
    raise exception 'Invalid weekly planning operation' using errcode = '22023';
  end if;
  if p_action = 'save' then
    if p_step is null or p_step not between 1 and 4 or (p_titles is not null and p_step <> 3) then
      raise exception 'Invalid weekly planning step' using errcode = '22023';
    end if;
  elsif p_step is not null or p_titles is not null or p_advance then
    raise exception 'Unexpected weekly planning fields' using errcode = '22023';
  end if;

  if p_action = 'start' then
    insert into public.week_plans (user_id, week_start)
    values (v_user_id, p_week_start)
    on conflict (user_id, week_start) do nothing;
  end if;

  select * into v_plan from public.week_plans
  where user_id = v_user_id and week_start = p_week_start for update;
  if not found then
    raise exception 'Start weekly planning first' using errcode = '55000';
  end if;

  if p_action = 'start' and v_plan.planning_status = 'not_started' then
    update public.week_plans set planning_status = 'in_progress', planning_step = 1
    where id = v_plan.id returning * into v_plan;
  elsif p_action = 'save' then
    if v_plan.planning_status = 'not_started' or p_step > v_plan.planning_step then
      raise exception 'Complete preceding planning steps first' using errcode = '55000';
    end if;
    if p_titles is not null then
      perform public.replace_weekly_focuses(p_week_start, p_titles);
    end if;
    -- Earlier-step saves/retries never rewind progress; completed edits stay completed.
    update public.week_plans
    set planning_step = greatest(planning_step, least(4, p_step + case when p_advance then 1 else 0 end))
    where id = v_plan.id returning * into v_plan;
  elsif p_action = 'complete' and v_plan.planning_status <> 'completed' then
    if v_plan.planning_status <> 'in_progress' or v_plan.planning_step <> 4 then
      raise exception 'Complete preceding planning steps first' using errcode = '55000';
    end if;
    update public.week_plans
    set planning_status = 'completed', planning_completed_at = now()
    where id = v_plan.id returning * into v_plan;
  end if;

  select coalesce(jsonb_agg(to_jsonb(f) order by f.position), '[]'::jsonb) into v_focuses
  from public.weekly_focuses f where f.week_plan_id = v_plan.id;
  return jsonb_build_object('week_plan', to_jsonb(v_plan), 'focuses', v_focuses);
end;
$$;

revoke all on function public.save_weekly_planning(date, text, integer, boolean, text[]) from public, anon;
grant execute on function public.save_weekly_planning(date, text, integer, boolean, text[]) to authenticated;
