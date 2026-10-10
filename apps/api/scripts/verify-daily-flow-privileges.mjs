// Disposable-only, rollback-scoped regression for the #32 operation-ledger ACL correction.
// No hosted URL/key is accepted. Existing owner records and ACLs survive the transaction.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import console from 'node:console';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const root = resolve(import.meta.dirname, '../../..');
const workdir = process.env.LIFEOS_INTEGRATION_SUPABASE_WORKDIR;
assert.ok(workdir, 'Explicit disposable workdir required');
const project = /^project_id\s*=\s*"([^"]+)"/m.exec(readFileSync(resolve(workdir, 'supabase/config.toml'), 'utf8'))?.[1];
assert.equal(project, 'LifeOS32', 'Only the existing LifeOS32 disposable project is allowed');
assert.equal(process.env.LIFEOS_INTEGRATION_SUPABASE_PROJECT_ID, project);
const migration = readFileSync(resolve(root, 'supabase/migrations/20261010120000_restrict_daily_flow_operation_privileges.sql'), 'utf8');
const dockerArgs = ['exec', '-i', 'supabase_db_LifeOS32', 'psql', '-X', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q', '-At'];
const options = { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] };
const preservationSql = `select jsonb_build_object(
  'acl', (select relacl::text from pg_class where oid='public.daily_flow_operations'::regclass),
  'ledger', (select md5(coalesce(string_agg(d::text,'' order by user_id,operation_id),'')) from public.daily_flow_operations d),
  'plans', (select md5(coalesce(string_agg(d::text,'' order by id),'')) from public.daily_plans d),
  'users', (select md5(coalesce(string_agg(id::text,'' order by id),'')) from auth.users)
);`;
const sql = `
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
-- Save a digest of existing records and service access before injecting excess grants.
create temp table ledger_before as select
  md5(coalesce(string_agg(d::text, '' order by user_id, operation_id), '')) as digest
  from public.daily_flow_operations d;
-- Match the reviewed hosted service ACL; the disposable project's defaults differ.
-- This fixture-only grant is rolled back with the rest of the simulation.
grant all on public.daily_flow_operations to service_role;
create temp table ledger_service_before as select p,
  has_table_privilege('service_role', 'public.daily_flow_operations', p) as allowed
  from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) p;
-- Reproduce hosted defaults, plus PUBLIC and column-specific bypasses absent on hosted.
grant all on public.daily_flow_operations to authenticated;
grant update, delete, truncate, references, trigger on public.daily_flow_operations to public;
grant update(command), references(user_id) on public.daily_flow_operations to authenticated, anon, public;
${migration}
${migration}
do $$ begin
  if exists (select 1 from unnest(array['anon','authenticated']) r
    cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) p
    where has_table_privilege(r, 'public.daily_flow_operations', p)
      is distinct from (r = 'authenticated' and p in ('SELECT','INSERT')))
    or exists (select 1 from pg_attribute a cross join unnest(array['anon','authenticated']) r
      cross join unnest(array['SELECT','INSERT','UPDATE','REFERENCES']) p
      where a.attrelid = 'public.daily_flow_operations'::regclass and a.attnum > 0 and not a.attisdropped
      and has_column_privilege(r, a.attrelid, a.attnum, p)
        is distinct from (r = 'authenticated' and p in ('SELECT','INSERT')))
    then raise exception 'Client table/column privileges differ from SELECT/INSERT contract'; end if;
  if exists (select 1 from ledger_service_before where allowed is distinct from
    has_table_privilege('service_role', 'public.daily_flow_operations', p))
    then raise exception 'Service-role privileges changed'; end if;
  if not (select relrowsecurity from pg_class where oid = 'public.daily_flow_operations'::regclass)
    then raise exception 'Owner RLS disabled'; end if;
  if (select digest from ledger_before) is distinct from
    (select md5(coalesce(string_agg(d::text, '' order by user_id, operation_id), '')) from public.daily_flow_operations d)
    then raise exception 'Existing ledger records changed'; end if;
end $$;

-- All fixture users, plans, operations and attempted DDL are rolled back, even on failure.
select set_config('lifeos.test_owner', gen_random_uuid()::text, true);
select set_config('lifeos.test_other', gen_random_uuid()::text, true);
insert into auth.users(id) values
  (current_setting('lifeos.test_owner')::uuid), (current_setting('lifeos.test_other')::uuid);
create schema lifeos_ledger_acl_test;
grant usage, create on schema lifeos_ledger_acl_test to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('lifeos.test_owner'), true);
do $$
declare
  day date := (public.daily_flow_context(current_date)->>'today')::date;
  command jsonb := jsonb_build_object('action','discard','operationId',gen_random_uuid(),'revision',0);
  first_result jsonb;
  statement text;
begin
  first_result := public.save_daily_flow(day, command);
  if public.save_daily_flow(day, command) is distinct from first_result
    then raise exception 'Retry changed the returned plan'; end if;
  if (select count(*) from public.daily_flow_operations) <> 1
    then raise exception 'RPC retry did not retain one owner ledger operation'; end if;
  begin
    perform public.save_daily_flow(day, command || '{"revision":1}'::jsonb);
    raise exception 'Reused operation identity accepted';
  exception when sqlstate '55000' then null; end;
  begin
    insert into public.daily_flow_operations values(current_setting('lifeos.test_other')::uuid, gen_random_uuid(), day, '{}');
    raise exception 'Cross-account insertion accepted';
  exception when insufficient_privilege then null; end;
  foreach statement in array array[
    'update public.daily_flow_operations set command = ''{}''',
    'delete from public.daily_flow_operations',
    'truncate public.daily_flow_operations',
    'create table lifeos_ledger_acl_test.denied_reference (u uuid, o uuid, foreign key(u,o) references public.daily_flow_operations(user_id,operation_id))',
    'create trigger denied_ledger_trigger before update on public.daily_flow_operations for each row execute function pg_catalog.suppress_redundant_updates_trigger()'
  ] loop
    begin
      execute statement;
      raise exception 'Forbidden ledger operation succeeded: %', split_part(statement, ' ', 1);
    exception when insufficient_privilege then null; end;
  end loop;
end $$;
select set_config('request.jwt.claim.sub', current_setting('lifeos.test_other'), true);
do $$ begin
  if exists (select 1 from public.daily_flow_operations) then raise exception 'Cross-account read'; end if;
  insert into public.daily_flow_operations values(auth.uid(), gen_random_uuid(), current_date, '{}');
  if (select count(*) from public.daily_flow_operations) <> 1 then raise exception 'Own insert/read failed'; end if;
end $$;
set local role anon;
do $$ begin
  begin
    perform 1 from public.daily_flow_operations;
    raise exception 'Anonymous read accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.daily_flow_operations values(current_setting('lifeos.test_other')::uuid, gen_random_uuid(), current_date, '{}');
    raise exception 'Anonymous insert accepted';
  exception when insufficient_privilege then null; end;
end $$;
set local role service_role;
do $$ declare op uuid := gen_random_uuid(); begin
  insert into public.daily_flow_operations values(current_setting('lifeos.test_owner')::uuid, op, current_date, '{}');
  update public.daily_flow_operations set command = '{"service":"updated"}' where operation_id = op;
  if not exists(select 1 from public.daily_flow_operations where operation_id=op and command->>'service'='updated')
    then raise exception 'Service-role read/update failed'; end if;
  delete from public.daily_flow_operations where operation_id = op;
  if found is false then raise exception 'Service-role delete failed'; end if;
end $$;
rollback;
`;

try {
  const before = execFileSync('docker', dockerArgs, { ...options, input: preservationSql });
  execFileSync('docker', dockerArgs, { ...options, input: sql });
  const after = execFileSync('docker', dockerArgs, { ...options, input: preservationSql });
  assert.equal(after, before, 'Disposable users/plans/ledger/ACLs must survive the rollback unchanged');
  console.log('PASS: corrected table/column/PUBLIC grants; repeat application; RPC retry/identity; owner isolation; denied UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER; service access; rollback preservation.');
} catch (error) {
  // psql receives only fixture SQL, never credentials or product rows. Emit just its error line.
  console.error(String(error.stderr || '').split(/\r?\n/).filter(line => line.startsWith('ERROR:')).join('\n') || 'Disposable privilege verification failed');
  process.exitCode = 1;
}
