# Explicit daily selection correction - 2026-10-14

## Scope and baseline

Owner-authorized correction to #32 and the shared #33 day editor, following the completed read-only audit and clarified product decision. A recommendation is an initial suggestion; saving means choosing these ordered task identities for this date. Recommendation ranking, task scheduling dates, calendar integration and historical plans are unchanged.

Baseline: `main`, HEAD and existing `origin/main` `d2f80a5fb27bb0bf8ba07ba795daac8521950e4f`, 0 ahead / 0 behind, empty index. The owner handoff directory and root `tsconfig.json` remain intentionally untracked. Environments, private configuration, native/generated files and unrelated work are preserved. No fetch, staging, commit, push, production query/mutation, deployment or native build/install was performed in this implementation pass.

## Command and storage contract

- Retain `approve`, `save-draft` and `edit`, ordered `ids`, day `revision`, `operationId`, date and caller identity. `approve` accepts a reviewed explicit selection whether or not a persisted proposal exists. `edit` still requires an approved plan. An empty array is valid.
- Only `propose` requires a matching global context snapshot. Remove both selection-saving blockers: the command/global-context comparison and the persisted-proposal/global-context comparison. Optional legacy snapshot fields remain accepted but have no save authority for selection commands.
- Keep the unique owner/date day-plan identity and `selected_task_ids` as approved membership. Store draft IDs in the existing compatible `flow_state.proposal` envelope, preserving existing proposal metadata and the approved membership/source/summary. A new manual draft receives the same envelope with empty reasons. Existing records are not rewritten by the migration.
- Validate selected IDs in SQL under the existing caller advisory lock and owner RLS: owned open/in-progress tasks, plus completed tasks already belonging to this approved plan. Reject foreign, missing, cancelled, duplicate and malformed IDs; never clone tasks or change their `planned_date`.
- Preserve atomic plan/ledger persistence, exact-command idempotency (including replay after later writes), day-revision conflicts and historical-day restrictions. Every successful new operation changes the plan revision; duplicate operations return the current state without reapplying old selections.
- API exposes only allowlisted public recovery codes: `selection_unavailable` (422), `daily_plan_conflict` (409), and `historical_plan_read_only` (409). Database details are not returned to mobile. Other routes retain their existing error contract.

## User flow

Today adjustment opens the saved ordered selection directly, even if recommendation metadata is old. Direct acceptance and editor approval use the same SQL semantics; approved-plan editing does too. Draft saving preserves order without approving an unapproved day. Recommendation generation is an optional, separate action.

Unrelated background refresh does not replace editor IDs/order or its captured day revision. Save controls show pending state and prevent duplicate submission; save errors and recovery controls remain in a bounded footer rather than below the task library. Unavailable entries remain identifiable until the user explicitly removes them; all other choices keep their order. A genuine conflict loads and displays the latest approved plan and any saved draft while retaining local choices. The owner must explicitly acknowledge that review before a subsequent save can use the newer revision. Refresh failure retains the selection and offers the same refresh again. An uncertain response retries the exact operation identity/payload.

Confirmed save results update the existing Today query; existing Week/day-membership invalidation refreshes related views. No optimistic approval is introduced. Cancel remains an intentional dismissal, not an error-recovery action.

## Forward-only migration and compatibility

New migration: `20261014120000_save_explicit_daily_selection.sql`, after the 14 existing migrations. It replaces only `public.save_daily_flow(date,jsonb)` and preserves its signature, security-invoker mode, search path, grants, RLS, locking and ledger. It performs no data backfill or table rewrite. Historical migrations remain untouched.

The historically owner-reported installed client is **2.0.0 (10)**; current installed metadata was not independently inspected. That client still sends snapshots and the same commands, so selection saves reaching the migrated RPC remain compatible even through the older API. The unchanged RPC error SQLSTATEs preserve the older API's status mapping. The old mobile UI still forces regeneration through some entry actions and closes the editor on real conflicts; the new recovery experience requires a later compatible client. Do not treat the server correction as acceptance of the old client's entire flow.

The new API/mobile must not be released against the old RPC: its global guards would still reject explicit saves. Required order remains disposable migration/persistence verification, owner checkpoint, exact hosted migration-plan review and separately authorized migration/history verification, API deployment and exact-source verification, then separately authorized mobile candidate preparation. No rollout is authorized or performed here.

## Verification - 2026-10-14

| Check | Result |
| --- | --- |
| API: `daily-flow.test.ts`, `daily-selection.test.ts`, `planning.test.ts` | **40 passed** |
| API: `daily-planning.test.ts`, `week-allocation.test.ts` | **13 passed** |
| Mobile: `daily-flow-test.tsx`, `daily-selection-test.tsx`, `v2-today-integration-test.tsx`, `auth-infrastructure-test.tsx`, `week-allocation-test.tsx`, `app-version-footer-test.tsx` | **47 passed**, six suites |
| API/mobile workspace typecheck and lint | **Passed** |
| Node syntax checks for the four changed database harness scripts | **Passed** |
| Canonical version/build consistency | **Passed**, unchanged 2.0.0 (10), root/API/mobile/lockfile versions agree |
| Diff validation, including new files | **Passed** |
| Disposable `--daily-selection` harness | **Passed** against the actual migrated PostgreSQL RPC and real local Auth sessions |
| Disposable `--daily-entry`, `--daily-flow`, `--week-allocation` harnesses | **Passed**, including initialization, saved selections, history and cross-view membership |
| Disposable `verify-daily-flow-privileges.mjs` | **Passed**: table/column/PUBLIC grants, repeat application, owner isolation, denied destructive operations, service-access fixture and rollback preservation |
| Actual new SQL migration execution and readback | **Passed**, transactional local application; stored function body matches migration, security invoker/empty search path and existing execute grants preserved |
| Existing local record/history preservation | **Passed**, before/after fingerprints match for tasks, plans, weeks, users, settings, commitments, operation ledger and migration history |
| Rendered footer/RTL/narrow-screen review and physical iPhone acceptance | **Pending**; component tests do not establish layout/device acceptance |

An expanded mobile run including `week-screen-test.tsx` produced **57 passed / 1 failed**. The unchanged legacy preview quick-capture assertion at line 167 expects `Inbox`, whereas the unchanged capture UI labels that destination `ללא יום`. Neither source nor that test was changed in this correction; it is recorded separately rather than silently repaired. An initial new-test locator incorrectly omitted the selected-row prefix and was corrected; its final suite passes. An earlier command referenced a nonexistent `v2-week-test.tsx`; the subsequent commands use actual test paths.

The new localhost-only `verify-daily-selection.mjs` passed against the actual RPC via the existing isolated-account harness: unchanged acceptance with an old persisted recommendation, all three selection actions after unrelated description/timestamp/historical-summary/empty-week writes, ordered draft resume with a new session, new/empty plans, completed-member eligibility, malformed/deleted/cancelled/foreign task rejection, concurrent day saves, duplicate/lost-response replay, caller isolation and historical restrictions. Invalid task selections leave both the plan unchanged and the attempted operation absent from the ledger. Existing daily-entry/daily-flow expectations were updated to the corrected semantics; both DB reruns and the unchanged `--week-allocation` DB regression pass.

### Docker recovery and local database execution

The initial blocker was a stopped Docker Desktop installation: no Desktop process or Linux engine pipe was present. Starting the existing `C:\Program Files\Docker\Docker\Docker Desktop.exe` with a hidden window restored engine 27.5.1 and the existing LifeOS32 containers. No Docker configuration, reset, replacement environment or volume deletion was used. The verified disposable project is `LifeOS32`, API `http://127.0.0.1:56321`, PostgreSQL `127.0.0.1:56322`, container `supabase_db_LifeOS32`.

Applied the new migration directly to that container using the established disposable `psql --single-transaction` workflow, `ON_ERROR_STOP=1`, and bounded lock/statement timeouts. The existing disposable history contains 12 entries through `20261009150000`; later local objects had been validated/applied directly in earlier work. History was not edited or repaired, and its fingerprint remains unchanged. This is local function-execution evidence, not a claim that a migration runner recorded the new migration or that hosted history changed.

Readback also found pre-existing local ledger privilege drift: authenticated TRUNCATE/REFERENCES/TRIGGER remained enabled. Applied the already-reviewed `20261010120000_restrict_daily_flow_operation_privileges.sql` only to this disposable database as the missing verification prerequisite. Effective authenticated table and column access is now SELECT/INSERT only; anon has none. Owner RLS remains enabled. Existing service-role ACL entries and RPC execute grants are unchanged. This disposable database's service-role defaults differ from hosted access; the rollback-scoped privilege harness explicitly supplies the established service-access fixture and proves the migration preserves it. No hosted verification or change is implied.

The first selection run found a harness defect: physical task deletion using the authenticated caller was denied with SQLSTATE 42501, as intended. The test now asserts that denial and removes only its own generated task through the existing localhost SQL helper, constrained by both task and generated owner IDs. It then tests selection of that missing identity. No production grant or application behavior was broadened. The complete rerun passes. Node syntax checks for both adjusted harness files and API lint were rerun and pass; earlier API/mobile/typecheck evidence remains applicable because their implementation did not change during this continuation.

Exact successful harness commands (run sequentially against the already prepared local database):

```powershell
Set-Location -LiteralPath 'D:\code\LifeOS'
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
$env:LIFEOS_INTEGRATION_SUPABASE_PROJECT_ID = 'LifeOS32'
node apps/api/scripts/verify-local-tasks.mjs --daily-selection
node apps/api/scripts/verify-local-tasks.mjs --daily-entry
node apps/api/scripts/verify-local-tasks.mjs --daily-flow
node apps/api/scripts/verify-local-tasks.mjs --week-allocation
node apps/api/scripts/verify-daily-flow-privileges.mjs
```

The harness enforces localhost and matching disposable project identity, creates/deletes only its own test accounts, pins the tracked API tsconfig and never resets the database. The untracked root tsconfig is not a prerequisite. Do not run these scenarios against hosted Supabase.

## Release candidate

| Field | Value |
| --- | --- |
| SemVer impact | **Patch**, correction of existing explicit-selection behavior |
| Candidate version | **Proposed 2.0.1**, not prepared or published |
| Candidate iOS build | **Proposed 11**, above current tracked/historically installed 10; recheck relevant Mac artifacts before future authorization |
| Version prepared | **No**, canonical tracked version/build remain 2.0.0 (10) |
| Native version synchronized | **No**, outside this pass |
| Physical build installed | **Pending** for this correction; 2.0.0 (10) predates it |
| Owner accepted exact build | **Pending** for this correction |
| Included issues/source | #32 selection contract and shared #33 editor, over `d2f80a5` |

No device-installation instructions are issued. Historical build/acceptance evidence in [the 2.0.0 record](release-2.0.0-verification.md) remains historical and scoped.

## Tracking and checkpoint

Only #32's existing Project #2 Status was moved Verify to **In Progress** and read back; the issue remains Open. #33 and unrelated metadata/items were not changed. No issue/comment/Release was created or closed.

The implementation is ready for owner review and a scoped local checkpoint: **the required disposable SQL/persistence gate now passes**. The unrelated legacy preview assertion above remains a known test failure; rendered footer/RTL/narrow-screen and physical-device acceptance remain pending. No Project status was advanced during this verification continuation. This is not deployment authorization or production acceptance: the new migration still requires the separately authorized hosted plan/application and API rollout sequence above. Index and HEAD are unchanged; no owner Git write authorization is consumed.
