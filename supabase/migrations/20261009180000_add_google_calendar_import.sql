-- Forward only. Provider credentials are never exposed through product tables.
create schema if not exists lifeos_private;
revoke all on schema lifeos_private from public, anon, authenticated;
create table lifeos_private.google_calendar_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"status":"disconnected","revision":0,"calendars":[]}'::jsonb
);
alter table lifeos_private.google_calendar_state enable row level security;
create unique index google_attempt_state_idx on lifeos_private.google_calendar_state ((data #>> '{attempt,stateHash}'));

alter table public.commitments add column location text;
alter table public.commitments add constraint commitments_location_check check (location is null or (location = btrim(location) and char_length(location) between 1 and 2000));
alter table public.commitments add column calendar_source jsonb;
alter table public.commitments add column provider_visible boolean not null default true;
alter table public.commitments add column end_date date;
update public.commitments set end_date = date;
alter table public.commitments alter column end_date set not null;
alter table public.commitments alter column start_time drop not null;
alter table public.commitments drop constraint commitments_time_range_check;
alter table public.commitments add constraint commitments_time_range_check check (
  (calendar_source is null and start_time is not null and (end_time is null or end_time > start_time))
  or (calendar_source is not null and calendar_source ->> 'provider' = 'google' and end_date >= date)
);
create unique index commitments_google_identity_idx on public.commitments
  (user_id, (calendar_source ->> 'accountId'), (calendar_source ->> 'calendarId'), (calendar_source ->> 'eventId'))
  where calendar_source is not null;

create function public.guard_commitment_provider() returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    if (tg_op <> 'INSERT' and old.calendar_source is not null) or
       (tg_op <> 'DELETE' and (new.calendar_source is not null or not new.provider_visible)) then
      raise exception 'Imported commitments are read only' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  if new.calendar_source is null then new.end_date := new.date; end if;
  return new;
end $$;
create trigger commitments_provider_guard before insert or update or delete on public.commitments
  for each row execute function public.guard_commitment_provider();

-- A verified API caller chooses user_id; only the server credential can invoke.
-- Every state transition/import serializes on the same per-user row.
create function public.google_calendar_command(p_user_id uuid, p_action text, p_payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s jsonb; a jsonb; c jsonb; e jsonb; uid uuid := p_user_id;
  revision integer; choices jsonb; rows jsonb; imported integer := 0;
begin
  if p_action = 'consume' then
    select user_id into uid from lifeos_private.google_calendar_state where data #>> '{attempt,stateHash}' = p_payload ->> 'stateHash';
  end if;
  if uid is null then raise exception 'Invalid integration attempt' using errcode = '22023'; end if;
  insert into lifeos_private.google_calendar_state(user_id) values(uid) on conflict do nothing;
  select data into s from lifeos_private.google_calendar_state where user_id = uid for update;
  revision := (s ->> 'revision')::integer;
  a := s -> 'attempt';
  if p_action = 'read' then return s; end if;
  if p_action = 'finish' and s#>>'{completed,id}' = p_payload->>'id' and s#>>'{completed,proofHash}' = p_payload->>'proofHash' and s#>>'{completed,receiptHash}' = p_payload->>'receiptHash' then return s; end if;
  if p_action = 'begin' then
    s := s || jsonb_build_object('attempt', p_payload || jsonb_build_object('stage','started'));
  elsif p_action in ('consume','pending','finish') then
    if a is null or (a ->> 'expiresAt')::timestamptz <= now() then raise exception 'Expired integration attempt' using errcode = '22023'; end if;
    if p_action = 'consume' then
      if a ->> 'stage' is distinct from 'started' or a ->> 'stateHash' is distinct from p_payload ->> 'stateHash' then raise exception 'Used integration attempt' using errcode = '22023'; end if;
      s := jsonb_set(s, '{attempt,stage}', '"claimed"');
    elsif p_action = 'pending' then
      if a ->> 'stage' is distinct from 'claimed' or a ->> 'id' is distinct from p_payload ->> 'id' then raise exception 'Invalid integration attempt' using errcode = '22023'; end if;
      s := jsonb_set(s, '{attempt}', a || p_payload || '{"stage":"pending"}');
    else
      if a ->> 'receiptHash' is distinct from p_payload ->> 'receiptHash' or a ->> 'id' is distinct from p_payload ->> 'id' or a ->> 'proofHash' is distinct from p_payload ->> 'proofHash' or a ->> 'stage' is distinct from 'pending' then raise exception 'Invalid integration completion' using errcode = '22023'; end if;
      if s ->> 'status' <> 'disconnected' and s ->> 'accountId' is distinct from a ->> 'accountId' then raise exception 'Disconnect before changing Google account' using errcode = '22023'; end if;
      update public.commitments set provider_visible = false where user_id = uid and calendar_source is not null;
      s := jsonb_build_object('status','connected','revision',revision+1,'calendars','[]'::jsonb,
        'accountId',a->>'accountId','email',a->>'email','credential',a->>'credential',
        'completed',jsonb_build_object('id',a->>'id','proofHash',a->>'proofHash','receiptHash',a->>'receiptHash'));
    end if;
  elsif p_action = 'cancel' then
    if a ->> 'id' = p_payload ->> 'id' then s := s - 'attempt'; end if;
  elsif p_action = 'disconnect' then
    update public.commitments set provider_visible = false where user_id = uid and calendar_source is not null;
    s := jsonb_build_object('status','disconnected','revision',revision+1,'calendars','[]'::jsonb);
  elsif p_action in ('catalog','select','claim','apply','fail') then
    if revision is distinct from (p_payload ->> 'revision')::integer or s ->> 'status' = 'disconnected' then raise exception 'Stale calendar state' using errcode = '40001'; end if;
    if p_action = 'catalog' then
      select coalesce(jsonb_agg(item || jsonb_build_object('selected', exists(
        select 1 from jsonb_array_elements(s->'calendars') old where old->>'id'=item->>'id' and (old->>'selected')::boolean
      ) and item->>'accessRole' in ('reader','writer','owner'))), '[]') into choices from jsonb_array_elements(p_payload->'calendars') item;
      s := s || jsonb_build_object('calendars',choices,'revision',revision+1);
      s := s - 'lock';
      update public.commitments set provider_visible=false where user_id=uid and calendar_source is not null and not exists (
        select 1 from jsonb_array_elements(choices) item where item->>'id'=calendar_source->>'calendarId' and (item->>'selected')::boolean
      );
    elsif p_action = 'select' then
      if jsonb_typeof(p_payload->'ids') <> 'array' then raise exception 'Invalid calendars' using errcode='22023'; end if;
      if exists(select 1 from jsonb_array_elements_text(p_payload->'ids') chosen where not exists(
        select 1 from jsonb_array_elements(s->'calendars') item where item->>'id'=chosen and item->>'accessRole' in ('reader','writer','owner')
      )) then raise exception 'Calendar permission required' using errcode='22023'; end if;
      select coalesce(jsonb_agg(item || jsonb_build_object('selected',(p_payload->'ids') ? (item->>'id'))),'[]') into choices from jsonb_array_elements(s->'calendars') item;
      s := (s - 'lock') || jsonb_build_object('calendars',choices,'revision',revision+1);
      update public.commitments set provider_visible=false where user_id=uid and calendar_source is not null and not ((p_payload->'ids') ? (calendar_source->>'calendarId'));
    elsif p_action = 'claim' then
      if s->>'status'='reconnect_required' or ((s#>>'{lock,expiresAt}')::timestamptz > now()) then raise exception 'Import unavailable or busy' using errcode='40001'; end if;
      s := s || jsonb_build_object('lock',p_payload->'lock');
    elsif p_action = 'fail' then
      if s#>>'{lock,id}' is distinct from p_payload->>'lockId' then raise exception 'Stale import' using errcode='40001'; end if;
      s := (s - 'lock') || jsonb_build_object('status',p_payload->>'status');
      if p_payload->>'status'='reconnect_required' then s := s - 'credential'; end if;
    else
      if s#>>'{lock,id}' is distinct from p_payload->>'lockId' or (s#>>'{lock,expiresAt}')::timestamptz <= now() then raise exception 'Stale import' using errcode='40001'; end if;
      -- Hide the old bounded snapshot only after EVERY selected calendar/page succeeded.
      update public.commitments set provider_visible=false where user_id=uid and calendar_source->>'accountId'=s->>'accountId'
        and date <= (p_payload->>'dateTo')::date and end_date >= (p_payload->>'dateFrom')::date;
      rows := p_payload->'events';
      for e in select * from jsonb_array_elements(rows) loop
        if not exists(select 1 from jsonb_array_elements(s->'calendars') item where item->>'id'=e#>>'{source,calendarId}' and (item->>'selected')::boolean) or e#>>'{source,accountId}' <> s->>'accountId' then raise exception 'Unselected calendar' using errcode='22023'; end if;
        insert into public.commitments(user_id,title,description,location,date,end_date,start_time,end_time,calendar_source,provider_visible)
        values(uid,e->>'title',e->>'description',e->>'location',(e->>'date')::date,(e->>'endDate')::date,(e->>'startTime')::time,(e->>'endTime')::time,e->'source',true)
        on conflict (user_id,(calendar_source->>'accountId'),(calendar_source->>'calendarId'),(calendar_source->>'eventId')) where calendar_source is not null
        do update set title=excluded.title,description=excluded.description,location=excluded.location,date=excluded.date,end_date=excluded.end_date,
          start_time=excluded.start_time,end_time=excluded.end_time,calendar_source=excluded.calendar_source,provider_visible=true;
        imported := imported+1;
      end loop;
      s := (s - 'lock') || jsonb_build_object('status','connected','lastSyncAt',now(),'imported',imported);
    end if;
  else raise exception 'Invalid integration command' using errcode='22023';
  end if;
  update lifeos_private.google_calendar_state set data=s where user_id=uid;
  return s || jsonb_build_object('userId',uid);
end $$;
revoke all on function public.google_calendar_command(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.google_calendar_command(uuid,text,jsonb) to service_role;
revoke all on function public.guard_commitment_provider() from public, anon, authenticated;
