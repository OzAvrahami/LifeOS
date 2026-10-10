# V2 daily proposals and continuation — #32

## Current 2.0.0 device-test preparation - 2026-10-10

The owner-selected **LifeOS 2.0.0 (10)** is now prepared in tracked metadata over `3310f96bbdfd9c8d46816c4a3f8cbea03ddcf42d`. Exact-source Railway deployment and its variable snapshot are verified; all 14 hosted migrations were already verified. **Mac-native synchronization, build/install and exact iPhone acceptance remain pending.** The available records support build 10; current Mac artifacts must still be checked before use. See [deployment evidence, checks and Mac handoff](release-2.0.0-verification.md).

This supersedes earlier proposed 0.6.0/current-0.5.0 and pending-checkpoint/rollout statements only for current preparation status. Dated implementation/acceptance evidence below remains historical and retains its original scope; local web review does not accept a physical binary. No issue state or Project status is advanced by this preparation.

## Owner acceptance and authorized local checkpoint — 2026-10-09

The owner accepted the reviewed local web-preview appearance and reported passing proposal adjustment/cancellation, approval persistence after reload, completion consistency across Today/Week/Tasks, and task reopening with updated Today/counts. This is owner-reported local web evidence only. It supersedes earlier pending-owner notes for these specific checks; it does not establish physical-device, hosted-provider/email/callback, production or full integration acceptance, nor an exhaustive viewport/theme/keyboard matrix. No issue closure or metadata change.

The owner authorized one new local commit over parent `bf02eff` for #33 and subsequent onboarding/Today/visual corrections. See the [reconciled 96-file manifest, evidence freshness and acceptance boundaries](issue-33-verification.md#owner-accepted-local-web-checkpoint--2026-10-09). Earlier staging manifests and checkpoint-pause statements below are historical. Source is unchanged since the recorded tests; only acceptance/checkpoint documentation changed. Versions remain 0.5.0 (9), with proposed V2 0.6.0 (10) unprepared/unauthorized. All production/provider/device and unreported acceptance gates remain pending.

## Today visual correction — 2026-10-09

Owner rejection prompted the focused [reference-to-native correction and evidence](v2-milestone-1-verification.md#today-visual-correction--2026-10-09). Today/shared V2 now use Heebo and actual Lucide geometry, the profile control, greeting, sparkle/pill summary, ranked task cards, approval and navigation dimensions. Counts, reasons and LifeOS events remain truthful. Initialization, persistence, stale/conflict/retry handling, approval, canonical identity and ownership logic are unchanged.

Final mobile typecheck/lint pass; the Today/daily-flow/foundation/Week-navigation/task-experience group passes **49/49**. Added mocked 440/320-width light/dark long-Hebrew component cases preserve content/actions, not rendered layout. DB suites were not unnecessarily rerun. Supported browsers remain unavailable (`Browser is not available: edge` / `Browser is not available: iab`); rendered comparison, font rasterization, wrapping/keyboard and owner/provider/integration/device acceptance remain pending. Preview http://localhost:8083; startup and screenshot review route are in the linked record. #32 remains open in its existing Verify status, with no metadata write.

**Release candidate remains proposed 0.6.0 (10), unprepared/unauthorized; current/accepted 0.5.0 (9) unchanged.** No version, schema, API, production or Git mutation for this correction. Earlier tree/checkpoint inventories are historical. Owner checkpoint `bf02eff` and pre-existing work remain intact.

## Owner review corrections — 2026-10-09

After owner review, Today now opens into a coherent first proposal, approved plan, deliberate empty day, fresh empty account, loading or retryable error state. The date/greeting/profile are real. Removed the extra first-generation/discovery button, duplicated task-list actions and stacked task/calendar empty sections. Proposal titles/order/selection reasons are shown directly with one adjustment action and one approval. Approved progress counts resolve canonical current task state; optional summary/system-adjustment actions are secondary. Calendar events retain their own times and navigation. The native theme, Hebrew/RTL and #33 task identities/actions are reused.

New authenticated POST `/daily-plans/:date/initialize` reuses the existing #32 context, proposal rules, revision/snapshot checks, SQL transaction and operation ledger. It creates only the first eligible proposal. It writes nothing for zero eligible tasks or historical dates, and never regenerates an existing V2 state (including a discarded proposal), saved manual draft or approved plan. Concurrent first entries derive the same operation identity from date/revision/snapshot; retries return current persisted state. A concurrent manual edit wins through the existing revision guard. Stale saved proposals are shown with an explicit refresh/review action, not overwritten on entry. Empty approved days stay approved. Initialization changes neither task dates/importance/deadlines/reminders nor historical rows. No migration was added for this fix.

Final available evidence:

- New `verify-daily-entry.mjs` through `verify-local-tasks.mjs --daily-entry`: passes against disposable LifeOS32. Empty/future-only entry writes no plan, eligible tasks initialize immediately, three concurrent entries create revision 1 once, reload/new-session preserves edited and empty drafts, stale task changes preserve the draft and reject obsolete approval, approved weekly days remain intact, next-day proposals reference the same unfinished IDs/origin dates without modifying history, approved empty days remain, account B sees no A state.
- Existing disposable `--daily-flow` and `--week-allocation` regressions both pass. #32/#33 membership, ordering, approval, completion, retry, stale/concurrent edit, ownership/RLS, descriptions and historical guards are retained. Only synthetic test accounts are created/cleaned; no local reset or production mutation.
- API `daily-flow.test.ts` + `week-allocation.test.ts`: 11/11. Final mobile Today/daily-flow/auth-lifecycle/infrastructure run: 38/38. Separate auth UI: 23/23. The Week/task/foundation regression group also passed (44/44, including overlapping Today/daily-flow checks). Both workspace typechecks/lints pass. Exact commands and evidence boundaries are in [milestone owner-review corrections](v2-milestone-1-verification.md#owner-review-corrections--2026-10-09).

The same correction pass restored native onboarding and explicit per-account completion, and proved why local signup skipped email verification: running local Auth auto-confirmation is true and actual signup returned a confirmed session. A temporary confirmation-required local Auth sidecar passed the actual email/verification/application-callback path. Existing local/hosted provider configuration was not changed; hosted acceptance remains pending. The current local redirect allow-list does not cover preview:8083, so the sidecar's callback result is not a claim about that existing configuration.

HEAD remains owner checkpoint `bf02eff`; index empty, main 1 ahead / 0 behind existing origin/main, no fetch. Pre-existing #33 implementation and protected owner files remain. #32 Status changed Verify → In Progress → Verify with write readbacks; it remains open. #29/#30 remain In Progress and #33 Verify. Owner/visual/provider/integration/device acceptance remains pending. Supported browsers returned `Browser is not available: edge` / `iab`; current preview http://localhost:8083 serves the corrected development bundle, not a rendered acceptance claim. No further checkpoint preparation is included.

**Release candidate update:** corrections stay within proposed 0.6.0 (10), still unprepared/unauthorized and subject to a fresh artifact inventory. Versions remain 0.5.0 (configured build 9); no accepted binary contains these changes. Prior release and production schema/API gates below remain pending.

## Follow-up integration evidence — 2026-10-09

The owner completed the combined #29/#30/#32 checkpoint as `bf02eff3f6ec2ee51e0a5e0891e3e3729f846f08` on main, without push or production rollout. The older baseline/checkpoint instructions below are retained as historical evidence, not instructions to repeat that commit.

#33 now extends the same ordered DailyPlan contract with atomic Week allocation and a durable operation ledger in `20261009150000_add_week_allocation.sql`. All reviewed days are validated before any write; approved row identity/provenance, summaries, focus/capacity and historical references remain intact. The extension also makes an explicit same-value task placement update membership: selecting the already-stored date or no-day value must still move/remove a task allocated through a plan. Title, description and status-only edits do not invoke placement changes.

The disposable LifeOS32 database passed the full 16-group local harness with #33, followed by focused Week allocation/RLS/pagination checks and the #32 daily-flow regression after the final placement-trigger refinement. The mobile core run passed 84 tests, with later changed-control/detail checks recorded in [#33 verification](issue-33-verification.md). These are local software checks, not production/provider, rendered visual or physical-device acceptance. #32 remains open and its Project metadata was not changed during #33.

## Scope and baseline

Local implementation on `main`, HEAD `9b775df50b563f518464810ddf5e646b2087b67e`. Existing refs showed 0 ahead / 0 behind `origin/main`; no fetch or other Git mutation was performed. The existing milestone-1 implementation, untracked handoff and root `tsconfig.json`, ignored environment files and native/generated boundaries were inventoried before editing. A hash inventory was saved outside the repository at `%TEMP%/lifeos-32-baseline.json`.

Read the repository workflow, tracker #28, #29/#30/#32/#33 and their comments, #18/#6/#14 boundaries, the milestone-1 evidence and local design handoff. Octocode local search rejected its input schema; research continued through focused `rg` and exact source reads. Inspected the prototype's proposal/adjust/Today/summary source. Supported browser discovery returned no surfaces; opening Edge returned **`Browser is not available: edge`**. No alternate browser automation was used. Rendered prototype/implementation interaction, RTL, narrow-screen, appearance and keyboard acceptance remain pending.

Reused the working native V2 components/theme, account-scoped API requests and cache boundary, existing task identity/status commands, DailyPlan row/selection/revision/ownership guards and Week navigation. #29/#30 remain open with their earlier provider/device/visual gates. No prerequisite issue was closed. The account infrastructure was not modified in this task.

## Source and shared contract for #33

| Concern | Source / behavior |
| --- | --- |
| Existing plan | `supabase/migrations/20261007120000_add_daily_planning_lifecycle.sql`; preserve the existing `(user_id, date)` row, `selected_task_ids` order, revision, focus and capacity fields |
| Extension | `supabase/migrations/20261009120000_add_daily_proposals.sql`; `flow_state` stores a separate proposal, approval source and optional summary; `daily_flow_operations` remembers caller operation identities |
| Rules/API | `apps/api/src/features/planning/daily-flow.ts`, `planning.routes.ts`; authenticated GET/PUT `/daily-plans/:date/flow`, GET `/week-plans/:weekStart/days` |
| Native flow | `apps/mobile/src/features/planning/daily-flow.api.ts`, `daily-flow.queries.ts`, `daily-flow-card.tsx`; V2 components, scoped fetching, review/adjust/order/save/retry/summary |
| Shared display | `approvedDayTasks` in `daily-flow.api.ts`, consumed by `features/today/v2-today-screen.tsx` and `features/week/server-week-screen.tsx` |
| Discovery | `features/planning/plan-task-library.tsx`, reached from planning and `features/inbox/inbox-screen.tsx`; complete caller task snapshot including old dates, future work and week-only tasks |
| Existing mutations | `features/tasks/task.queries.ts` invalidates daily/weekly snapshots after task changes; original API task commands and ownership checks remain authoritative |

The contract is **one ordered list of stable task IDs per approved day**. A task may be referenced by different historical days without cloning it. An approved empty list is a real plan. A proposal is a separate persisted review document; generating, adjusting or discarding it does not replace the approved list. `save-draft` persists the review without approval. `approve` accepts the reviewed list; `edit` intentionally changes an already-approved list while leaving approval in force. `summarize` writes only an optional note/timestamp, never completion or tomorrow's membership.

On the first proposal for a pre-V2 in-progress day, eligible saved manual draft selections retain their order without being treated as approved. Completed, cancelled, missing or subsequently future-deferred work is excluded from that new proposal; the underlying legacy draft is not rewritten before approval. Subsequent explicit proposal regeneration follows bounded-v1; saved proposal drafts otherwise resume unchanged.

`source: daily | weekly | legacy` records initial approval provenance. The Week selected-day flow approves through exactly the same endpoint with `source: weekly`. Later daily adjustments preserve that provenance and the existing approval until accepted. Legacy completed DailyPlans are read as approved; legacy weekly *focus-wizard completion* is not fabricated into seven approved days. Whole-week allocation/batch-review UX and the complete #33 screen migration remain separate. #33 can persist each reviewed date through this contract; cross-day batch atomicity is not promised by these per-day operations.

Today and Week use the approved list exclusively when approval exists, including a zero-task list; unrelated dated tasks cannot silently repopulate it. Before approval, existing explicitly dated work remains usable. Both approved views resolve the same current task rows, so completion/reopening has one meaning. Cancelled or physically absent tasks are omitted from actionable counts while the stored historical IDs remain. Counts describe current task status, not reconstructed historical completion-at-midnight snapshots.

Explicit single-task capture/date placement into an approved day appends its identity once, including a day approved by the legacy client. Explicit rescheduling removes its membership from other current/future approved days and appends it to an approved destination where applicable. These are intentional user task commands, not proposal side effects. This updates the former selection-independent-of-placement behavior for explicit current/future moves; legacy clients must reload a changed revision. Historical selections, completion timestamps, priority, deadlines, reminders, estimates, focus/capacity and calendar records are not rewritten by proposal approval. Task status changes retain plan membership. #18 still owns bulk replanning, active-work decisions, pending commitments and external-event coordination.

Older clients can still read selections and edit legacy focus/capacity. Once a plan has `flow_state`, the database rejects legacy lifecycle writes that would replace that V2 selection without the current contract. Old pre-V2 plans retain their earlier lifecycle behavior. This compatibility boundary must be included in rollout review; it is not silent success for unsupported old writes.

## Deterministic proposal rule: bounded-v1

The proposal uses the complete caller task snapshot, approved earlier daily references and week placement. The database RPC aggregates without PostgREST's list-row truncation. No LLM, calendar-gap inference, task duration requirement or fabricated explanation is used.

1. Exclude completed/cancelled/missing work, tasks explicitly dated after the target, and tasks assigned to a future week. Retain the existing approved day's IDs and order; never automatically remove or reorder them.
2. Rank remaining eligible tasks by: explicit target date; due/overdue date; unfinished earlier plan/date; explicit `important` priority; remaining open backlog.
3. Break ties by earliest due date, latest earlier origin, explicit importance, existing position, creation time and stable ID. Reversing input order produces the same result.
4. Suggest up to **five total selections**, filling only unused places after retained approval, and at most **two additions with an earlier origin**. A larger existing approved plan stays intact with no additions. The limits bound review effort and prevent mass rollover; they make no workload/capacity claim. Users can explicitly select more, up to the existing 500-ID persistence limit.
5. Each new suggested ID stores the rule that selected it and its latest prior approved origin, falling back to an earlier explicit task date. Reasons say “scheduled for this date,” “due date reached,” “unfinished earlier planning,” “marked important,” or “open task in list order.” Origin is shown as an exact date, including after several missed days. Manually added IDs are labeled as user choices, not invented recommendations.

The saved proposal includes a snapshot digest over caller task data, prior approved references, week identities and timezone. Plan revision plus snapshot are checked atomically when applying. A task change, future deferral, deletion/completion, historical-context change or timezone change makes an old proposal stale. The user must refresh/review, rather than overwriting later work. Changing calendar events does not invalidate this rule because it does not rank by calendar availability; the review separately shows actual LifeOS events and exact times.

Operations use a stable UUID on retry. The caller-scoped ledger validates the exact command/date and returns current state for delayed retries, preventing an old response from resurrecting old selections. Relevant task/plan/settings writes share an owner lock; deadlock/serialization conflicts become retry/review conflicts. All product access remains caller-JWT/RLS scoped. No operation creates tasks or calendar events as an approval side effect.

## Native next-day design

Today follows the account timezone and refreshes its day on foreground entry and the existing 30-second clock tick. The review is keyed by account/date, preventing a prior account/day draft from being applied to another one. The server also rejects plan changes to a historical date, including an approval that crosses local midnight.

The V2 green proposal card reads “יום חדש, בחירה חדשה” before approval. Review shows ordered selections, truthful origin/reason captions, actual local event times, remove/add and accessible up/down controls. Missing/cancelled selections require explicit removal; zero tasks has its own confirmation label. Approved weekly days instead read “שינויים מוצעים לתוכנית” with “קבלת השינויים המוצעים”; the existing plan stays visible and approved. Close/cancel writes nothing further; “שמירת טיוטה להמשך” persists a resumable selection.

Optional summary shows current completion counts and an optional note. “דילוג וחזרה ליום” does not write or gate tomorrow. The next entry considers eligible work across all earlier dates, not only yesterday. Unselected work stays open and appears in “כל המשימות,” including work excluded by the old Inbox filter. No automatic all-task carryover, completion, task cloning, task hours or external authorization controls were added. Calendar remains a tab.

The summary deliberately does not add the prototype's fictional per-task tomorrow actions: the ordinary proposal/manual-selection contract supplies tomorrow's actual decision. A future summary preference model would require its own explicit contract.

## Verification

Automated/component evidence is distinct from rendered and physical acceptance. Final command results are recorded in the handoff; local logs live under `%TEMP%/lifeos-32-*`.

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | API and mobile passed |
| `npm.cmd run lint` | API and mobile passed |
| `npm.cmd test --workspace @lifeos/api` | 14 suites, 103 tests passed |
| `npm.cmd test --workspace @lifeos/mobile -- --silent --json --outputFile=$env:TEMP/lifeos-32-mobile-final.json` | 54 suites, 375 tests passed, 1 existing Android-only skip |
| `npm.cmd test --workspace @lifeos/mobile -- --runTestsByPath __tests__/daily-flow-test.tsx __tests__/v2-today-integration-test.tsx __tests__/week-navigation-test.tsx --silent` | Final rerun after adding actual calendar context and the cache isolation check: 3 suites, 32 tests passed |
| `npm.cmd test --workspace @lifeos/mobile -- --config jest.task-date-android.config.js --silent` | 1 suite, 3 tests passed, covering the default-run platform skip |
| Disposable local migration + complete `test:integration:local` | 15 PASS groups, real PostgreSQL/Auth/caller/anonymous RLS on **LifeOS32**, API port 56321 / database 56322; all migrations applied from scratch |
| Isolated review seeding | Executed against a fresh disposable account: 7 task / 3 plan readback passed; test account cleaned up |
| From `apps/mobile`: `npx.cmd expo export --platform ios --output-dir $env:TEMP/lifeos-32-ios-js-final --max-workers 2` | Passed; Hermes JavaScript export, no native build |
| Isolated preview `/welcome`, its Expo Router script and API `/health` | HTTP 200 for all three; bundle contains localhost API/auth URLs. Not rendered acceptance |
| `git diff --check` | Passed |

New cases cover deterministic ranking/bounds, missed days and origin dates, future deferrals, missing/cancelled/completed tasks, empty approval, ordered draft resume, cancellation, failed-save retry identity, existing weekly approval, explicit edits, late retries, stale/concurrent commands, owner isolation, account/date changes, local midnight/DST/year boundaries, real database timezone changes, task completion across views, placement changes preserving completion/history, and unchanged real event times. Existing capture, tasks, notifications, account/session/callback/recovery and planning tests remain regression evidence.

Intermediate checks found two old screen mocks that did not supply the new API queries, causing duplicate error/retry controls; mocks were extended without removing behavior assertions. The complete DB harness initially timed out before API startup on Windows; its bounded readiness window was extended with request timeouts and optional diagnostics, and the complete run then passed. The harness now resolves the repository-pinned Supabase CLI even from an alternate disposable workdir. The seed utility was corrected to use an authenticated local caller for product tables instead of assuming service-role relation privileges; no grants were broadened.

## Release candidate

| Field | Value |
| --- | --- |
| SemVer decision | Owner-selected Major **2.0.0** for combined V2; supersedes the unprepared 0.6.0 proposal |
| Candidate version | **2.0.0**, unreleased internal device-test candidate |
| Candidate iOS build | **10**, prepared against configured/accepted 9 and available records; confirm unused on the build Mac |
| Version prepared | **Yes**, tracked root/API/mobile/lockfile and Expo metadata, 2026-10-10 |
| Native version synchronized | **Pending**; no native project exists in this Windows checkout; see the preserving Mac handoff |
| Physical build installed | **Pending**; no build/install performed |
| Owner accepted exact build | **Pending**; accepted 0.5.0 (9) predates V2; local web evidence does not accept this candidate |
| Included issues/source | #32 daily planning within combined #29/#30/#33/#34 and partial #17 source at `3310f96` |

**Candidate: LifeOS 2.0.0 (10); tracked metadata prepared, not built, installed or accepted.** [Current release record](release-2.0.0-verification.md) separates completed API/schema/configuration evidence from pending authenticated hosted OAuth, native synchronization/signing, physical delivery and full integration acceptance. No new implementation, production-data mutation, Git write, tag or publication is authorized by this preparation. #17 remains Open / In Progress with outbound/background phases unfinished.

## Local review preview and isolated next-day scenario

The existing `%TEMP%/lifeos-32-disposable` workdir is a separate **LifeOS32** stack, containing copies of this checkout's config/migrations with ports 56320–56329. The owner's existing LifeOS database was not reset. To reproduce on another machine, create a *new* temporary workdir, copy only `supabase/config.toml` and `supabase/migrations`, set `project_id = "LifeOS32"`, replace configured 54320–54329 ports with 56320–56329, and start it with the repository CLI:

```powershell
Set-Location D:\code\LifeOS
$reviewRoot = Join-Path $env:TEMP 'lifeos-32-disposable'
if (!(Test-Path -LiteralPath $reviewRoot)) {
  New-Item -ItemType Directory -Path "$reviewRoot/supabase" | Out-Null
  Copy-Item -LiteralPath supabase/migrations -Destination "$reviewRoot/supabase/migrations" -Recurse
  $reviewConfig = (Get-Content supabase/config.toml -Raw).Replace('project_id = "LifeOS"', 'project_id = "LifeOS32"')
  foreach ($reviewPort in 54320..54329) { $reviewConfig = $reviewConfig.Replace([string]$reviewPort, [string]($reviewPort + 2000)) }
  [System.IO.File]::WriteAllText("$reviewRoot/supabase/config.toml", $reviewConfig, [System.Text.UTF8Encoding]::new($false))
}
npx.cmd supabase start --workdir $reviewRoot -x studio,pgadmin-schema-diff,imgproxy,storage-api,realtime,logflare,vector,supavisor,edge-runtime
```

Do not reset an existing owner's stack or reuse these fixture commands against a hosted project. This helper rejects a different project ID/non-local URL and does not modify `.env` files.

Terminal A, local API:

```powershell
Set-Location D:\code\LifeOS
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
node apps/api/scripts/review-daily-flow.mjs api
```

Terminal B, isolated Expo Web:

```powershell
Set-Location D:\code\LifeOS
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
node apps/api/scripts/review-daily-flow.mjs web
```

Open **http://localhost:8083/welcome**. API is **http://127.0.0.1:3197**. These processes supply local configuration only to their children; the web process disables dotenv loading. Register a **fresh** account such as `v2-review-unique@example.test`, choosing a password accepted by the local provider. This is real disposable local Supabase Auth, not demo authentication. Complete onboarding without connecting a calendar.

Terminal C, seed that exact fresh test account:

```powershell
Set-Location D:\code\LifeOS
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
node apps/api/scripts/review-daily-flow.mjs seed v2-review-unique@example.test
```

The helper creates seven clearly labeled review tasks, approved references from five/two days ago, an approved weekly day tomorrow and an actual local 09:17–10:43 event. It refuses an account with existing tasks, daily/weekly plans or commitments. It obtains a local caller session internally for RLS; it does not change a password or print credentials.

1. Reload Today and open the proposal. Expect the due unfinished task, recent unfinished task and new important task. Verify exact older dates/reasons. Completed and explicitly future-deferred work must not be suggested; the additional older task remains open in “כל המשימות.” The event keeps its exact times.
2. Adjust order, save a draft, reload, resume, then cancel once. Confirm no approval occurred. Reopen and approve. Complete one task; compare Today, Week selected day and task details after reload.
3. Skip summary. Historical fixtures already simulate missed days, so no machine-clock change is needed to exercise next-day entry. Return on a later real day to verify the physical/date transition separately.
4. Open tomorrow in Week. Its one seeded selection is already approved. Open proposed changes, then cancel/discard; verify the original remains approved. Accept adjustments separately or use explicit editing. Try an empty plan and reload.
5. Open two browser tabs on one plan. Save an edit in one, then submit the other's older review; expect refresh/review rather than overwrite. Test offline save/retry and narrow/light/dark/RTL/keyboard behavior manually; these are not claimed as rendered passes.

For a normal preview using the owner's existing environment, the milestone-1 command remains `npm.cmd run web -- --port 8082`. It does **not** route to this isolated API automatically; #32 needs the new migration/API before real hosted use.

## Tracking, remaining gates and checkpoint

[#32](https://github.com/OzAvrahami/LifeOS/issues/32) moved Backlog → In Progress → **Verify** in [Project #2](https://github.com/users/OzAvrahami/projects/2), with each write read back. It remains **Open**, priority unset. Verify records the completed local software scope and passing automated gates, not integrated acceptance. #29/#30 remain In Progress; #33 remains Backlog. No labels, membership, relationships, assignees, milestones, unrelated issues or prerequisite states were changed. Full integrated acceptance remains pending: Google #17, applicable Apple #31, complete Week #33 integration/owner review, rendered reference comparison, future authorized migration/API rollout and exact physical-device candidate acceptance. #6/#14 remain documented legacy conflicts; no capacity/templates/task-hours implementation or closure is claimed.

The result is suitable for a **local combined implementation checkpoint**, not a deployment/release/acceptance checkpoint. #32 changes overlap the uncommitted milestone-1 source; a path-only commit cannot isolate #32. Use the reconciled 98-file manifest and explicit owner commands below; the earlier directory-level staging instructions are superseded.

Hold deployment-triggering pushes. The next rollout task must inspect all remote pending migrations/dry-run, obtain explicit schema authorization, verify applied history, and only then perform an authorized API push/deployment. No push command is supplied.

## Combined owner-managed checkpoint — 2026-10-09

Reconciled both verification records with the actual files and read #29/#30/#32 and all comments (all three open, no comments). This is a review of the existing combined implementation; no #33 work was started and no project/issue metadata was changed.

**Ready for a local implementation checkpoint; no identified local checkpoint blocker.** HEAD is `9b775df50b563f518464810ddf5e646b2087b67e` on `main`, with 0 ahead / 0 behind the existing `origin/main` ref. No fetch was performed. The index is empty. Include **98 files: 71 tracked modifications and 27 new files**. There are 35 individual untracked files overall: these 27 plus seven owner handoff files and root `tsconfig.json`. The earlier count of 29 untracked status entries grouped the handoff directory into one entry.

The manifest below is the exact combined scope. It supersedes both previous directory-level staging snippets. All eight API paths and the forward-only migration are required: `DailyFlowService` calls `daily_flow_context` and `save_daily_flow`, supplied by `20261009120000_add_daily_proposals.sql`. The existing Week/day bridge is #32's shared contract, not completion or commencement of full #33 scope. Unchanged `apps/api/package.json` and previously committed migrations are already in HEAD and need no staging.

Only the two verification records changed during this reconciliation. All implementation files, the index, handoff, root config and environment files were preserved. Protected hashes still match `%TEMP%/lifeos-32-baseline.json`; the disposable migration copy matches the current migration. Native directories remain absent. Exclude `design-reference/LifeOS-V2-Handoff/`, root `tsconfig.json`, environment files and all ignored/generated/native files.

Verification freshness was checked against saved logs and file modification times (supporting evidence, not an immutable tested-source snapshot):

- Full mobile evidence: 54 suites, 375 passed, zero failures, one Android-only skip; Android-specific evidence: 1 suite / 3 passed.
- The mobile query change at 06:35:27 UTC follows the full run; the focused daily-flow/Today/Week rerun ended at 06:36:23 UTC with 3 suites / 32 passed. Root typecheck/lint and the iOS JavaScript export also completed after the last mobile source change.
- The latest API source/test files are timestamped 06:43:10 UTC. Refreshed API typecheck/lint and API tests completed afterward; API results are 14 suites / 103 passed, zero failures/skips. These later API checks supplement the earlier root checks.
- The latest migration and database verification edits are timestamped 06:39:02 UTC. The full disposable local harness ended at 06:45:08 UTC with 15 PASS groups, after the final API changes. Local database/RLS evidence is not hosted integration acceptance.
- No source file is newer than its relevant final verification evidence. No additional targeted rerun or broad suite was warranted. No tests, exports or builds were rerun for this documentation-only reconciliation.
- Fresh `git diff --check` and read-only whitespace checks of the 27 untracked included files pass. The owner must validate the actual staged diff again.

Visual/reference interaction, hosted authentication/provider/email/app-link behavior, Google #17 / applicable Apple #31 / full Week #33 integration, hosted schema/API rollout and physical-device acceptance all remain pending. Current versions stay **0.5.0**, configured iOS build **9**; proposed future **0.6.0 (10)** remains unprepared/unauthorized and requires a fresh artifact inventory. Accepted 0.5.0 (9) predates this implementation.

The following commands are for the owner only; none was executed by Codex. Run the blocks in the same PowerShell session. Review the staged diff before running the separate commit block.

### Exact included paths, staging and review

```powershell
Set-Location D:\code\LifeOS
$checkpointBase = '9b775df50b563f518464810ddf5e646b2087b67e'
$checkpointFiles = @(
    'apps/api/__tests__/daily-flow.test.ts'
    'apps/api/__tests__/daily-planning.test.ts'
    'apps/api/scripts/review-daily-flow.mjs'
    'apps/api/scripts/verify-daily-flow.mjs'
    'apps/api/scripts/verify-daily-planning.mjs'
    'apps/api/scripts/verify-local-tasks.mjs'
    'apps/api/src/features/planning/daily-flow.ts'
    'apps/api/src/features/planning/planning.routes.ts'
    'apps/mobile/__tests__/auth-ui-test.tsx'
    'apps/mobile/__tests__/commitment-reminder-ui-test.tsx'
    'apps/mobile/__tests__/core-local-flow-test.tsx'
    'apps/mobile/__tests__/daily-flow-test.tsx'
    'apps/mobile/__tests__/daily-planning-test.tsx'
    'apps/mobile/__tests__/inbox-screen-test.tsx'
    'apps/mobile/__tests__/planning-query-cache-test.tsx'
    'apps/mobile/__tests__/secure-session-storage-test.ts'
    'apps/mobile/__tests__/settings-product-integration-test.tsx'
    'apps/mobile/__tests__/settings-screens-test.tsx'
    'apps/mobile/__tests__/task-date-capture-test.tsx'
    'apps/mobile/__tests__/task-server-flow-test.tsx'
    'apps/mobile/__tests__/today-screen-test.tsx'
    'apps/mobile/__tests__/v2-auth-lifecycle-test.tsx'
    'apps/mobile/__tests__/v2-foundation-test.tsx'
    'apps/mobile/__tests__/v2-theme-test.tsx'
    'apps/mobile/__tests__/v2-today-integration-test.tsx'
    'apps/mobile/__tests__/weekly-planning-lifecycle-test.tsx'
    'apps/mobile/__tests__/week-navigation-test.tsx'
    'apps/mobile/__tests__/week-screen-test.tsx'
    'apps/mobile/app.json'
    'apps/mobile/package.json'
    'apps/mobile/src/app/_layout.tsx'
    'apps/mobile/src/app/account.tsx'
    'apps/mobile/src/app/auth/callback.tsx'
    'apps/mobile/src/app/auth/confirmed.tsx'
    'apps/mobile/src/app/auth/invalid.tsx'
    'apps/mobile/src/app/calendar.tsx'
    'apps/mobile/src/app/commitment.tsx'
    'apps/mobile/src/app/inbox.tsx'
    'apps/mobile/src/app/index.tsx'
    'apps/mobile/src/app/more.tsx'
    'apps/mobile/src/app/settings/_layout.tsx'
    'apps/mobile/src/app/sign-in.tsx'
    'apps/mobile/src/app/sign-up.tsx'
    'apps/mobile/src/app/task.tsx'
    'apps/mobile/src/app/week.tsx'
    'apps/mobile/src/app/welcome.tsx'
    'apps/mobile/src/components/bottom-navigation.tsx'
    'apps/mobile/src/components/mobile-shell.tsx'
    'apps/mobile/src/components/v2.tsx'
    'apps/mobile/src/features/auth/auth.components.tsx'
    'apps/mobile/src/features/auth/auth.types.ts'
    'apps/mobile/src/features/auth/auth-api.ts'
    'apps/mobile/src/features/auth/auth-callback.ts'
    'apps/mobile/src/features/auth/auth-callback-screen.tsx'
    'apps/mobile/src/features/auth/auth-destination.ts'
    'apps/mobile/src/features/auth/auth-errors.ts'
    'apps/mobile/src/features/auth/auth-loading-screen.tsx'
    'apps/mobile/src/features/auth/auth-provider.tsx'
    'apps/mobile/src/features/auth/auth-validation.ts'
    'apps/mobile/src/features/auth/forgot-password-screen.tsx'
    'apps/mobile/src/features/auth/recovery-state.ts'
    'apps/mobile/src/features/auth/reset-password-screen.tsx'
    'apps/mobile/src/features/auth/sign-in-screen.tsx'
    'apps/mobile/src/features/auth/sign-up-screen.tsx'
    'apps/mobile/src/features/auth/verify-email-screen.tsx'
    'apps/mobile/src/features/auth/welcome-screen.tsx'
    'apps/mobile/src/features/capture/quick-capture-sheet.tsx'
    'apps/mobile/src/features/commitments/commitment.api.ts'
    'apps/mobile/src/features/commitments/commitment.queries.ts'
    'apps/mobile/src/features/inbox/inbox-screen.tsx'
    'apps/mobile/src/features/planning/daily-flow.api.ts'
    'apps/mobile/src/features/planning/daily-flow.queries.ts'
    'apps/mobile/src/features/planning/daily-flow-card.tsx'
    'apps/mobile/src/features/planning/daily-planning-view.tsx'
    'apps/mobile/src/features/planning/planning.api.ts'
    'apps/mobile/src/features/planning/planning.queries.ts'
    'apps/mobile/src/features/planning/plan-task-library.tsx'
    'apps/mobile/src/features/settings/account-screen.tsx'
    'apps/mobile/src/features/settings/appearance-setting.tsx'
    'apps/mobile/src/features/settings/more-screen.tsx'
    'apps/mobile/src/features/settings/settings.api.ts'
    'apps/mobile/src/features/settings/settings.components.tsx'
    'apps/mobile/src/features/settings/settings.queries.ts'
    'apps/mobile/src/features/settings/settings-screen.tsx'
    'apps/mobile/src/features/tasks/task.api.ts'
    'apps/mobile/src/features/tasks/task.queries.ts'
    'apps/mobile/src/features/tasks/use-task-capture.ts'
    'apps/mobile/src/features/today/v2-today-screen.tsx'
    'apps/mobile/src/features/week/server-week-screen.tsx'
    'apps/mobile/src/lib/supabase/client.ts'
    'apps/mobile/src/lib/supabase/session-storage.ts'
    'apps/mobile/src/theme/theme-provider.tsx'
    'CHANGELOG.md'
    'docs/issue-32-verification.md'
    'docs/v2-milestone-1-verification.md'
    'package.json'
    'package-lock.json'
    'supabase/migrations/20261009120000_add_daily_proposals.sql'
)

if ((git rev-parse HEAD) -ne $checkpointBase) { throw 'HEAD changed; reconcile before staging.' }
if ((git branch --show-current) -ne 'main') { throw 'Branch changed; reconcile before staging.' }
if (@(git diff --cached --name-only).Count -ne 0) { throw 'Index is no longer empty; preserve and review existing staged work.' }
git diff --check
if ($LASTEXITCODE -ne 0) { throw 'Working-tree diff validation failed.' }

git add -- $checkpointFiles
if ($LASTEXITCODE -ne 0) { throw 'Staging failed; inspect the index before continuing.' }

$checkpointStaged = @(git diff --cached --name-only)
if (Compare-Object ($checkpointFiles | Sort-Object) ($checkpointStaged | Sort-Object)) {
    throw 'Staged paths do not match the reviewed 98-file manifest.'
}
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'Staged diff validation failed.' }
git diff --cached --stat
git diff --cached --name-status
git --no-pager diff --cached
git status --short --untracked-files=all
```

### One local commit

```powershell
# Run after reviewing the staged diff above, in the same PowerShell session.
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'Staged diff validation failed.' }
git commit -m "feat: implement V2 foundations, account flows and daily planning"
if ($LASTEXITCODE -ne 0) { throw 'Commit failed; inspect Git status.' }
```

### Verify the commit and preserved working tree

```powershell
git log -1 --format=fuller
git show --stat --oneline HEAD
git diff-tree --no-commit-id --name-status -r HEAD
git show --format= --check HEAD
if ($LASTEXITCODE -ne 0) { throw 'Committed diff validation failed.' }
if ((git rev-parse 'HEAD^') -ne $checkpointBase) { throw 'Unexpected commit parent.' }
$checkpointCommitted = @(git diff-tree --no-commit-id --name-only -r HEAD)
if (Compare-Object ($checkpointFiles | Sort-Object) ($checkpointCommitted | Sort-Object)) {
    throw 'Committed paths differ from the reviewed manifest.'
}
git diff HEAD --exit-code -- $checkpointFiles
if ($LASTEXITCODE -ne 0) { throw 'Checkpoint files have remaining changes.' }
git diff --cached --exit-code
if ($LASTEXITCODE -ne 0) { throw 'Index is not empty after the commit.' }
git status --short --branch --untracked-files=all
git diff --stat
git ls-files --others --exclude-standard
git ls-files --others --ignored --exclude-standard --directory
git rev-list --left-right --count HEAD...origin/main
```

With no concurrent edits, expect the new commit to have the stated baseline as its parent and exactly the 98 manifest paths; the index and included paths should be clean. The seven untracked handoff files and root `tsconfig.json` remain, along with the existing ignored environment/generated files. The local branch should be 1 ahead / 0 behind the unchanged remote-tracking ref. Do not clean those remaining files.

No push, version change, production migration, deployment, build/install, publication, issue closure or #33 implementation is part of this checkpoint. Hold deployment-triggering pushes; the later authorized rollout must inspect every pending remote migration, dry-run and apply authorized schema, verify history, then deploy/verify the API before preparing a physical mobile candidate.

## Changed-file inventory for the original #32 implementation

Compared with the preserved milestone-1 baseline, these 22 files changed or were added. The previous milestone inventory remains in its own verification record.

Final combined Git state: **71 tracked modifications, 27 untracked implementation/documentation files**, plus the preserved untracked handoff directory and root `tsconfig.json` (29 untracked status entries total). Nothing is staged. HEAD and existing-ref relationship remain unchanged. Protected handoff/environment/root-config hashes match the initial inventory; native directories remain absent and were not generated.

```text
CHANGELOG.md
apps/api/__tests__/daily-flow.test.ts
apps/api/__tests__/daily-planning.test.ts
apps/api/scripts/review-daily-flow.mjs
apps/api/scripts/verify-daily-flow.mjs
apps/api/scripts/verify-daily-planning.mjs
apps/api/scripts/verify-local-tasks.mjs
apps/api/src/features/planning/daily-flow.ts
apps/api/src/features/planning/planning.routes.ts
apps/mobile/__tests__/daily-flow-test.tsx
apps/mobile/__tests__/v2-today-integration-test.tsx
apps/mobile/__tests__/week-navigation-test.tsx
apps/mobile/src/features/inbox/inbox-screen.tsx
apps/mobile/src/features/planning/daily-flow-card.tsx
apps/mobile/src/features/planning/daily-flow.api.ts
apps/mobile/src/features/planning/daily-flow.queries.ts
apps/mobile/src/features/planning/plan-task-library.tsx
apps/mobile/src/features/tasks/task.queries.ts
apps/mobile/src/features/today/v2-today-screen.tsx
apps/mobile/src/features/week/server-week-screen.tsx
docs/issue-32-verification.md
supabase/migrations/20261009120000_add_daily_proposals.sql
```
