# V2 Week and task experience — #33

## Current 2.0.0 device-test preparation - 2026-10-10

The owner-selected **LifeOS 2.0.0 (10)** is now prepared in tracked metadata over `3310f96bbdfd9c8d46816c4a3f8cbea03ddcf42d`. Exact-source Railway deployment and its variable snapshot are verified; all 14 hosted migrations were already verified. **Mac-native synchronization, build/install and exact iPhone acceptance remain pending.** The available records support build 10; current Mac artifacts must still be checked before use. See [deployment evidence, checks and Mac handoff](release-2.0.0-verification.md).

This supersedes earlier proposed 0.6.0/current-0.5.0 and pending-checkpoint/rollout statements only for current preparation status. Dated implementation/acceptance evidence below remains historical and retains its original scope; local web review does not accept a physical binary. No issue state or Project status is advanced by this preparation.

## Owner-accepted local web checkpoint — 2026-10-09

The owner accepted the reviewed **local web-preview screen appearance** and reported these manual checks passing:

- Proposal adjustment and cancellation.
- Approval persistence after reload.
- Task completion consistency across Today, Week and Tasks.
- Reopening a task updates Today and its counts.

This is owner-reported evidence from the isolated local preview, not independent browser observation or pixel comparison. It supersedes the earlier pending owner appearance/checkpoint pause only for this reviewed scope. No particular viewport/theme matrix, every screen/state, keyboard/accessibility matrix, physical-device binary, hosted-provider/email/callback, production rollout or full integration acceptance is implied. Existing local Auth/confirmation-sidecar tests remain separate automated evidence. Unreported acceptance gates remain pending; no issue is closed or Project metadata changed.

The owner explicitly authorized **one new local commit** for pending #33 and the subsequent V2 onboarding/Today/visual corrections, with message `feat: complete V2 weekly planning and refine onboarding and Today`. Its parent is the existing checkpoint `bf02eff3f6ec2ee51e0a5e0891e3e3729f846f08` on main; the existing checkpoint is not amended. Before staging, the index was empty and the existing origin/main relationship was 1 ahead / 0 behind. No fetch was performed. The commit carrying this section is the reconciled checkpoint; its hash and post-commit validation are reported in the owner handoff.

### Reconciled scope and verification freshness

The actual tree contains **96 included files: 53 tracked modifications and 43 new files**, listed below. This replaces the old 44-file staging manifest for this checkpoint. Scope includes Week allocation/selected day, task list/details/capture, canonical membership/order/cache ownership, title/description/idempotent capture, onboarding account state, first-entry Today proposals, shared V2 visual corrections, all associated tests/local harnesses and the three verification records/CHANGELOG.

Required API files and the forward-only `20261009150000_add_week_allocation.sql` migration are included. The migration depends on the existing #32 daily-proposal migration already in the parent. Bundled Heebo fonts and Lucide assets include their licenses and provenance. There are **no dependency manifest or lockfile changes** to include; runtime helpers use existing dependencies. The owner handoff is not a runtime asset dependency. Root `tsconfig.json` remains untracked and unnecessary for the application; existing verifier/preview launchers pin the tracked API configuration.

Source/test/migration content was not edited during checkpoint preparation. Baseline hashes and source timestamps reconcile with the recorded final visual and earlier #33/onboarding checks: the final visual run passed **49/49 tests across five focused suites**, mobile typecheck and lint; prior API, task/control, Auth/onboarding and disposable DB/RLS results remain as recorded below and in the linked records. No source change after those checks justified another test run, broad suite or build. The first staged validation exposed one trailing space in the bundled upstream `OFL.txt`; it was removed without changing license wording. Fresh working/staged diff validation and the exact manifest/content review are the checkpoint checks.

Preserved outside this commit: all seven files under `design-reference/LifeOS-V2-Handoff/`, root `tsconfig.json`, environments and ignored native/generated files. No unrelated tracked modification was identified in the reconciled diff. No environment, credentials, generated build output, dependency directory or owner handoff is included. After this checkpoint the expected remaining visible tree consists only of the handoff directory and root config; index empty, 2 ahead / 0 behind the **existing** origin/main ref.

**Release candidate:** the combined V2 work remains proposed **0.6.0 (10)**, unprepared and unauthorized. Current configured and previously accepted binary remain **0.5.0 (9)**; that binary does not accept this new implementation. This authorization covers local staging and one commit only: no push, production schema application, deployment, version change, build/install, tag/publication or issue closure.

### Exact included files

```text
CHANGELOG.md
apps/api/__tests__/week-allocation.test.ts
apps/api/scripts/review-daily-flow.mjs
apps/api/scripts/verify-daily-entry.mjs
apps/api/scripts/verify-local-auth.mjs
apps/api/scripts/verify-local-tasks.mjs
apps/api/scripts/verify-week-allocation.mjs
apps/api/src/features/planning/daily-flow.ts
apps/api/src/features/planning/planning.routes.ts
apps/api/src/features/planning/week-allocation.ts
apps/api/src/features/tasks/task.service.ts
apps/api/src/features/tasks/task.validation.ts
apps/mobile/__tests__/auth-ui-test.tsx
apps/mobile/__tests__/daily-planning-test.tsx
apps/mobile/__tests__/task-date-capture-test.tsx
apps/mobile/__tests__/task-date-web-test.tsx
apps/mobile/__tests__/task-query-cache-test.tsx
apps/mobile/__tests__/task-server-flow-test.tsx
apps/mobile/__tests__/v2-auth-lifecycle-test.tsx
apps/mobile/__tests__/v2-task-experience-test.tsx
apps/mobile/__tests__/v2-today-integration-test.tsx
apps/mobile/__tests__/week-allocation-test.tsx
apps/mobile/__tests__/week-navigation-test.tsx
apps/mobile/assets/fonts/Heebo-650.ttf
apps/mobile/assets/fonts/Heebo-700.ttf
apps/mobile/assets/fonts/Heebo-750.ttf
apps/mobile/assets/fonts/Heebo-800.ttf
apps/mobile/assets/fonts/Heebo-Regular.ttf
apps/mobile/assets/fonts/OFL.txt
apps/mobile/assets/fonts/README.md
apps/mobile/assets/icons/lucide/Calendar.png
apps/mobile/assets/icons/lucide/Calendar.svg
apps/mobile/assets/icons/lucide/CalendarDays.png
apps/mobile/assets/icons/lucide/CalendarDays.svg
apps/mobile/assets/icons/lucide/Check.png
apps/mobile/assets/icons/lucide/Check.svg
apps/mobile/assets/icons/lucide/LICENSE
apps/mobile/assets/icons/lucide/ListTodo.png
apps/mobile/assets/icons/lucide/ListTodo.svg
apps/mobile/assets/icons/lucide/Plus.png
apps/mobile/assets/icons/lucide/Plus.svg
apps/mobile/assets/icons/lucide/README.md
apps/mobile/assets/icons/lucide/Sparkles.png
apps/mobile/assets/icons/lucide/Sparkles.svg
apps/mobile/assets/icons/lucide/Sun.png
apps/mobile/assets/icons/lucide/Sun.svg
apps/mobile/assets/icons/lucide/User.png
apps/mobile/assets/icons/lucide/User.svg
apps/mobile/src/app/_layout.tsx
apps/mobile/src/app/auth/confirmed.tsx
apps/mobile/src/app/auth/invalid.tsx
apps/mobile/src/app/inbox.tsx
apps/mobile/src/app/index.tsx
apps/mobile/src/app/sign-in.tsx
apps/mobile/src/components/bottom-navigation.tsx
apps/mobile/src/components/mobile-shell.tsx
apps/mobile/src/components/v2-icon.tsx
apps/mobile/src/components/v2.tsx
apps/mobile/src/features/auth/auth-gate.ts
apps/mobile/src/features/auth/auth-provider.tsx
apps/mobile/src/features/auth/auth.components.tsx
apps/mobile/src/features/auth/auth.types.ts
apps/mobile/src/features/auth/onboarding-screen.tsx
apps/mobile/src/features/auth/onboarding-state.ts
apps/mobile/src/features/capture/quick-capture-sheet.tsx
apps/mobile/src/features/commitments/commitment-date-time-fields.native.tsx
apps/mobile/src/features/commitments/commitment-date-time-fields.web.tsx
apps/mobile/src/features/notifications/task-reminder-editor.tsx
apps/mobile/src/features/planning/daily-flow-card.tsx
apps/mobile/src/features/planning/daily-flow.api.ts
apps/mobile/src/features/planning/daily-flow.queries.ts
apps/mobile/src/features/planning/daily-planning-session.tsx
apps/mobile/src/features/planning/week-allocation.api.ts
apps/mobile/src/features/tasks/task-capture.types.ts
apps/mobile/src/features/tasks/task-content.ts
apps/mobile/src/features/tasks/task-date-control.native.tsx
apps/mobile/src/features/tasks/task-date-control.web.tsx
apps/mobile/src/features/tasks/task-date-selection.tsx
apps/mobile/src/features/tasks/task-detail-screen.tsx
apps/mobile/src/features/tasks/task-details.tsx
apps/mobile/src/features/tasks/task.api.ts
apps/mobile/src/features/tasks/task.queries.ts
apps/mobile/src/features/tasks/task.types.ts
apps/mobile/src/features/tasks/use-task-capture.ts
apps/mobile/src/features/tasks/v2-task-list.tsx
apps/mobile/src/features/today/v2-today-screen.tsx
apps/mobile/src/features/week/server-week-screen.tsx
apps/mobile/src/features/week/v2-week-day.tsx
apps/mobile/src/features/week/week-allocation-editor.tsx
apps/mobile/src/features/week/week-navigation.tsx
apps/mobile/src/theme/tokens.ts
apps/mobile/src/theme/v2-fonts.ts
docs/issue-32-verification.md
docs/issue-33-verification.md
docs/v2-milestone-1-verification.md
supabase/migrations/20261009150000_add_week_allocation.sql
```

## Today/shared V2 visual correction — 2026-10-09

See the [current reference mapping, font audit and checks](v2-milestone-1-verification.md#today-visual-correction--2026-10-09). Shared V2 text, brand/profile control, cards/buttons and navigation now follow actual prototype values and Heebo/Lucide assets. The pre-existing uncommitted #33 Week, task list/details/capture and identity/order/approval implementation is preserved. Allocation, task/query, API and schema logic did not change.

Final mobile typecheck/lint pass; the focused Today/daily-flow/foundation/Week-navigation/task-experience group passes **49/49**. Added mocked viewport/theme cases preserve long Hebrew content and navigation/capture; they do not prove rendered wrapping, keyboard or fidelity. Supported browsers remain unavailable, so screenshots at 440 by 956 and 320 by 956 are requested for comparison. Shared changes also need Week/tasks/capture visual review. Owner/provider/integration/device gates remain pending. #33 stays open with its existing Verify status; no metadata change.

**Release candidate remains proposed 0.6.0 (10), unprepared/unauthorized; current/accepted 0.5.0 (9) unchanged.** HEAD `bf02eff`, index empty, protected work preserved. No staging, commit, push, migration, production change or build. Earlier checkpoint manifests omit these corrections and are not current staging lists. Preview/startup/manual route are in the linked record.

## Owner review corrections take precedence — 2026-10-09

The owner paused further feature work and checkpoint preparation to correct onboarding/Today. The #33 implementation is preserved. The **44-file manifest below is now historical and incomplete for the current tree; do not execute it as a combined checkpoint**. No new checkpoint is prepared in this correction pass.

Today now initializes only its first eligible persisted proposal, retains manual/approved state on re-entry, and presents proposal versus approved/empty/loading/error states separately. Native onboarding, explicit per-account completion and truthful calendar availability were corrected. See the full [findings, exact checks, local email-confirmation evidence and preview recheck route](v2-milestone-1-verification.md#owner-review-corrections--2026-10-09) and [#32 integration details](issue-32-verification.md#owner-review-corrections--2026-10-09).

The disposable `--week-allocation` regression passed again, alongside `--daily-flow` and the new `--daily-entry`. The mobile Week/navigation/task/foundation group passed 44/44; subsequently changed Today/daily-flow/auth paths passed the final 38/38 group. Explicit task identity/order, approved membership, empty days, cancellation/retry, stale/concurrent edits, account isolation and descriptions remain covered. #33 remains open in Verify; its metadata was not changed. Visual/owner, provider/full integration and physical-device acceptance remain pending.

**Release candidate remains proposed 0.6.0 (10), unprepared and unauthorized.** Current 0.5.0/build 9 and accepted binary are unchanged; no new migration, deployment, native build/install or version change occurred for these corrections. HEAD remains `bf02eff`, index empty, owner work preserved.

## Baseline and checkpoint readiness

Implementation and local verification: 2026-10-09. Baseline/main HEAD: `bf02eff3f6ec2ee51e0a5e0891e3e3729f846f08`, the owner-completed combined #29/#30/#32 checkpoint. Existing `origin/main` relationship remains **1 ahead / 0 behind**; no fetch, pull or branch change. The index is empty. The earlier #33 checkpoint assessment below predates the owner-review corrections above and is no longer the current staging scope.

Read AGENTS.md, DEVELOPMENT_WORKFLOW, github-development-standard, tracker #28 and #33/#32/#16 including comments, both prior verification records, the handoff documents and relevant prototype screen/interaction source. Octocode localSearch rejected its input schema twice; focused `rg` and exact file reads supplied the source evidence instead.

Preserved the seven owner handoff files and root `tsconfig.json`, ignored environment/native boundaries, manifests, lockfile and Git index. Their protected SHA256 inventory matches the initial inventory in `%TEMP%/lifeos-33-protected.json`. No native directories were created. Existing ignored dependency/generated directories remain ignored; preview/tool caches are not checkpoint content.

The root untracked `tsconfig.json` is not an application dependency. Both tracked workspace TypeScript configurations resolved with a read guard that would throw on access to the root config (API: 38 source files; mobile: 223). Workspace typecheck/tests use their own config. API scripts launched from the repository root previously allowed tsx to discover the untracked config; the disposable verifier and isolated review launcher now pin `TSX_TSCONFIG_PATH` to tracked `apps/api/tsconfig.json`. Preserve the root file and exclude it from staging.

## Implementation and persisted contract

| Surface | Behavior |
| --- | --- |
| Week/selected day | Shared V2 cards, native theme and navigation; seven actual days, approved/empty state, ordered task rows, completion counts, exact local event times/source and explicit task/event actions. Previous/next/current week/day and return navigation remain. No duration totals or fictional calendar-gap allocation. |
| Weekly review | Explicit day assignment, moving/removal and ordering, followed by review and one confirmation. Existing approved days stay active until save. Cancel before submission writes nothing. Past days cannot be rewritten. Empty approved days are valid. Existing per-day system proposals remain available via #32 review/approval; opening Week does not generate or accept adjustments. |
| Atomic persistence | PUT `/week-plans/:weekStart/allocation` validates every reviewed day revision and caller task/context snapshot before any day is saved. It updates the same DailyPlan rows/ordered IDs, retaining source, summary, focus/capacity and completion timestamp. A caller-scoped immutable operation ledger makes duplicate/late retries safe; stale or concurrent edits reject the whole batch for reload/review. |
| Identity/placement | Approved membership is separate from `Task.plannedDate`; weekly allocation does not clone tasks or rewrite task metadata. Explicit task placement edits current/future approved membership through #32's trigger, including selecting the same stored date/no-day value after allocation. Historical IDs remain. Completion/reopen resolves current canonical task state across views. |
| Task list | Production `/inbox` now uses the V2 task list. Open/no-day/completed filters, accurate counts, real current/future approved membership and completion/start/stop/details/capture. Uses the complete caller snapshot; general task API reads page beyond PostgREST's row limit. Legacy fixture Inbox remains development-only. |
| Details/#16 | Selectable title and multiline description, explicit title/description editing and cancellation, day/tomorrow/no-day/week/custom date, status actions, explicit reminder editing and delete confirmation. Approved membership and stored date are labelled separately. Unedited description is omitted from title-only patches, preserving a concurrently changed description. |
| Capture/#16 | Only title required; optional multiline description. Trim title, length 1–500; preserve meaningful description whitespace/newlines, maximum 10,000; whitespace-only becomes null. Stable creation UUID is sent as Idempotency-Key, not persisted as a second identity. An uncertain save locks the original request for retry; cancel before submission writes nothing. Today/tomorrow/no-day/week/custom date are explicit. |
| Account/UI state | Account-keyed screens/editors/queries; ignore late mutation results after account changes. Loading, retryable errors, empty lists/days, keyboard avoidance, scrolling, RTL text and shared light/dark controls. Reminder save returns to details. Component/jsdom/native-picker mocks are evidence of behavior, not rendered acceptance. |
| Calendar and boundaries | Calendar navigation is retained. LifeOS commitments keep exact dates/times and editing; Google/Apple remain explicitly unavailable (#17/#31). No task-to-event conversion, hours/required duration, automatic importance/deadline/reminder changes, new Focus relationship or #14 templates. Existing Focus actions remain under the explicitly labelled existing-focus section. |

The new forward-only migration is `supabase/migrations/20261009150000_add_week_allocation.sql`. It depends on the checkpoint's `20261009120000_add_daily_proposals.sql` and existing lifecycle migrations. Authenticated callers have select/insert only on their own Week ledger; update/delete and anonymous access are denied. API/schema files are mandatory checkpoint scope, not optional UI companions.

## Automated evidence

No repository-wide test suite, export or native build was run. Focused failures encountered during development were resolved: obsolete pre-V2 labels, new capture payload expectations, a test awaiting settings/query start, an overly broad mock reset that reset Expo font mocks, and the reminder return regression. No unresolved required local automated failure remains.

| Check | Result and boundary |
| --- | --- |
| `npm.cmd run typecheck` | Both workspaces pass. |
| `npm.cmd run lint` | Both workspaces pass. |
| API changed paths | 29 tests / 5 suites pass: `week-allocation.test.ts`, `daily-flow.test.ts`, `tasks.test.ts`. |
| Mobile core | 84 tests / 8 suites pass: Week allocation/navigation, V2 task experience, task server/date capture, daily planning/flow and V2 Today integration. |
| Additional controls/cache | Six suites pass, 29 tests plus one intentional platform skip: task-query-cache, notification-ui, commitment-web-fields, commitment-time-picker, task-date-web and task-date-native. The V2 task-experience suite subsequently passes separately (7/7), after fixing test-only mock isolation. |
| Final detail regression | 47/47 pass across V2 task experience, Week navigation, task server flow and notification UI after adding approved-membership details and restoring reminder return behavior. |
| Android date/picker checks | Task-date config: 3/3 pass. Commitment Android config: 11 pass, 9 iOS-only skips; the default native run covers the iOS counterparts. These use mocked native pickers, not devices. |
| Disposable database | LifeOS32, API 56321 / DB 56322; verifier API 3199. Full harness: 16 PASS groups, exit 0. After final ledger/placement/pagination refinements, `--week-allocation` and `--daily-flow` each pass with exit 0. New migration initially applied with local migration-up; final permission/function refinements were applied only to this same disposable DB and the copied migration was synchronized. |
| Database scenarios | Atomic ordered allocation, approved edits/empty days, concurrent identical retry, late retry after newer edits, stale task snapshot/whole-batch rollback, competing commands, same-date/no-day placement, history preservation, current completion after a fresh auth session, caller/anonymous RLS, append-only ledger, exact description semantics and 1001-task pagination/order/isolation. |
| Git validation | `git diff --check` passes; all new checkpoint files also checked without staging. Empty index and protected hashes verified. |

Exact core commands (from the repository root unless noted):

```powershell
Set-Location -LiteralPath 'D:\code\LifeOS'
npm.cmd run typecheck
npm.cmd run lint
Push-Location -LiteralPath 'apps/api'
node --import tsx --test __tests__/week-allocation.test.ts __tests__/daily-flow.test.ts __tests__/tasks.test.ts
Pop-Location
npm.cmd test --workspace @lifeos/mobile -- --runTestsByPath __tests__/week-allocation-test.tsx __tests__/v2-task-experience-test.tsx __tests__/task-server-flow-test.tsx __tests__/daily-planning-test.tsx __tests__/week-navigation-test.tsx __tests__/task-date-capture-test.tsx __tests__/daily-flow-test.tsx __tests__/v2-today-integration-test.tsx
npm.cmd test --workspace @lifeos/mobile -- --runTestsByPath __tests__/task-query-cache-test.tsx __tests__/notification-ui-test.tsx __tests__/commitment-web-fields-test.tsx __tests__/commitment-time-picker-test.tsx __tests__/task-date-web-test.tsx __tests__/task-date-native-test.tsx
npm.cmd test --workspace @lifeos/mobile -- --runTestsByPath __tests__/v2-task-experience-test.tsx __tests__/week-navigation-test.tsx __tests__/task-server-flow-test.tsx __tests__/notification-ui-test.tsx
npm.cmd test --workspace @lifeos/mobile -- --config jest.task-date-android.config.js
npm.cmd test --workspace @lifeos/mobile -- --config jest.commitment-android.config.js
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
node apps/api/scripts/verify-local-tasks.mjs
# Targeted checks used after the final SQL refinement:
node apps/api/scripts/verify-local-tasks.mjs --week-allocation
node apps/api/scripts/verify-local-tasks.mjs --daily-flow
```

These commands document evidence and targeted reruns, not a request to repeat every test before a documentation-only checkpoint. The harness derives and verifies the database container project from the selected local workdir; it must remain disposable. Logs are outside Git under `%TEMP%/lifeos-33-*.log` and corresponding Jest JSON files.

## Isolated preview and pending visual acceptance

The existing isolated review utility was started successfully: API `http://127.0.0.1:3197`, Metro `http://localhost:8083`, local Supabase LifeOS32. It uses the real application routes and local data; no application fixtures were introduced. Supported browser discovery returned no browsers. Opening the prototype with Edge returned **`Browser is not available: edge`**; opening the running preview with the in-app browser returned **`Browser is not available: iab`**. No alternate automation was used. Startup/HTTP availability is not rendered evidence. The two review processes created by this task were identified and stopped after the blocked attempt; use the commands below to start fresh processes with the final source. The disposable database was left intact.

Rendered comparison with `design-reference/LifeOS-V2-Handoff/prototype.html`, actual light/dark/system appearance, narrow screens, Hebrew RTL, touch, keyboard/focus/scroll behavior and reload/navigation acceptance remain **pending**. Provider, production integration and physical-device acceptance remain **pending** separately.

To start review, use the already-established disposable workdir (Docker running; never substitute the linked production project). If these ports are occupied, reuse a known review session or stop its own terminal with Ctrl+C; do not terminate an unknown listener. In two PowerShell terminals:

```powershell
# Terminal 1: isolated API
Set-Location -LiteralPath 'D:\code\LifeOS'
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
if (!(Test-Path -LiteralPath (Join-Path $env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR 'supabase/config.toml'))) {
    throw 'The disposable LifeOS32 project must be prepared first; do not use production.'
}
node apps/api/scripts/review-daily-flow.mjs api
```

```powershell
# Terminal 2: web preview, with environment supplied by the isolated launcher
Set-Location -LiteralPath 'D:\code\LifeOS'
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
node apps/api/scripts/review-daily-flow.mjs web
```

Open `http://localhost:8083` and use a dedicated local review account. The helper enforces project_id LifeOS32 and localhost endpoints, disables mobile dotenv loading, and never prints keys. The final migration must exist in that disposable DB; it does on this machine. On another checkout, prepare an isolated local stack/migration copy before running these commands. Do not use `?preview=1` for acceptance; that intentionally selects legacy fixture screens.

Short manual route:

1. Sign in locally → Tasks. Capture a title-only task, then one with Hebrew/English multiline text. Cancel another capture and confirm no row. Try no-day/tomorrow/custom-day destinations and validation boundaries.
2. Open details; edit only title, preserve description, then explicitly edit/clear description. Exercise cancel, start/stop/complete/reopen, date and reminder actions. Verify return, keyboard and scrolling. Confirm approved-plan dates are distinct from the stored task date.
3. Week → weekly allocation. Move/order tasks across two days, leave one empty, cancel once, then review/approve. Open each selected day and Today; compare IDs, order, completion and counts. Refresh/restart and repeat. Choose the original stored date/no-day from details after a Week move.
4. In a second local session edit a reviewed task/day. Saving the stale review must reject the whole allocation and require a new review. Test an uncertain-response retry without duplication. Switch accounts during pending work; no old task/draft should appear.
5. Open a saved #32 proposal and adjust/cancel before approval; the approved plan must remain. Skip the optional summary. Check Calendar tab, exact event times/source, event detail/return and unavailable provider states; no task becomes an event.
6. Repeat all migrated screens in light/dark/system mode, narrow width, Hebrew RTL and with the keyboard open. Compare the actual rendered reference. Record observations/screenshots and the exact environment before claiming acceptance.

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
| Included issues/source | #33 Week/tasks/capture and subsequent onboarding/Today corrections, committed in `c3c120b` and included in `3310f96`; #16 contract reuse is not separate acceptance |

**Candidate: LifeOS 2.0.0 (10); tracked metadata prepared, not built, installed or accepted.** [Current release record](release-2.0.0-verification.md) separates completed API/schema/configuration evidence from pending authenticated hosted OAuth, native synchronization/signing, physical delivery and full integration acceptance. No new implementation, production-data mutation, Git write, tag or publication is authorized by this preparation. #17 remains Open / In Progress with outbound/background phases unfinished.

## Rollout and tracking boundary

Only #33's existing Project #2 Status was changed: Backlog → In Progress → **Verify**, with each write read back. Labels (`ux`, `mobile`, `api`, `enhancement`), unset priority, empty assignees, unset milestone and membership were preserved; #33 is OPEN. Other issue metadata/items remain untouched. Full local software implementation and passing automated gates justify Verify while owner/external acceptance remains pending. No #32 provider/device claim or closure is implied.

Hold deployment-triggering pushes. Required future order: owner local checkpoint → inspect **all** remote pending migrations → dry run → explicitly authorized schema application/history verification → authorized API push/deployment verification → mobile candidate gate. Neither the earlier #32 migration nor the new #33 migration was applied to production in this task. Existing remote refs were read without fetching.

## Historical owner-managed checkpoint — superseded scope

The explicit manifest and commands below recorded the earlier #33-only scope and are retained as history. They are incomplete after the owner-review corrections; do not run them for the current tree. Keep the owner handoff directory, root tsconfig, environments, native files and ignored generated data outside any future checkpoint. The owner paused checkpoint preparation.

There are **44 included paths**: 32 tracked modifications and 12 new files. This manifest includes the API/schema and verification files. At handoff, the only pre-existing untracked exclusions are the seven handoff files and root `tsconfig.json`.

Stage and review (owner only; not executed by the agent):

```powershell
Set-Location -LiteralPath 'D:\code\LifeOS'
$checkpointBase = 'bf02eff3f6ec2ee51e0a5e0891e3e3729f846f08'
if ((git branch --show-current) -ne 'main') { throw 'Unexpected branch; stop and reconcile.' }
if ((git rev-parse HEAD) -ne $checkpointBase) { throw 'HEAD changed; review the new baseline first.' }
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { throw 'Preserve the existing index; reconcile it before staging.' }

$checkpointFiles = @(
    'apps/api/__tests__/week-allocation.test.ts'
    'apps/api/scripts/review-daily-flow.mjs'
    'apps/api/scripts/verify-local-tasks.mjs'
    'apps/api/scripts/verify-week-allocation.mjs'
    'apps/api/src/features/planning/planning.routes.ts'
    'apps/api/src/features/planning/week-allocation.ts'
    'apps/api/src/features/tasks/task.service.ts'
    'apps/api/src/features/tasks/task.validation.ts'
    'apps/mobile/__tests__/daily-planning-test.tsx'
    'apps/mobile/__tests__/task-date-capture-test.tsx'
    'apps/mobile/__tests__/task-date-web-test.tsx'
    'apps/mobile/__tests__/task-query-cache-test.tsx'
    'apps/mobile/__tests__/task-server-flow-test.tsx'
    'apps/mobile/__tests__/v2-task-experience-test.tsx'
    'apps/mobile/__tests__/week-allocation-test.tsx'
    'apps/mobile/__tests__/week-navigation-test.tsx'
    'apps/mobile/src/app/inbox.tsx'
    'apps/mobile/src/features/capture/quick-capture-sheet.tsx'
    'apps/mobile/src/features/commitments/commitment-date-time-fields.native.tsx'
    'apps/mobile/src/features/commitments/commitment-date-time-fields.web.tsx'
    'apps/mobile/src/features/notifications/task-reminder-editor.tsx'
    'apps/mobile/src/features/planning/daily-flow.queries.ts'
    'apps/mobile/src/features/planning/daily-planning-session.tsx'
    'apps/mobile/src/features/planning/week-allocation.api.ts'
    'apps/mobile/src/features/tasks/task.api.ts'
    'apps/mobile/src/features/tasks/task.queries.ts'
    'apps/mobile/src/features/tasks/task.types.ts'
    'apps/mobile/src/features/tasks/task-capture.types.ts'
    'apps/mobile/src/features/tasks/task-content.ts'
    'apps/mobile/src/features/tasks/task-date-control.native.tsx'
    'apps/mobile/src/features/tasks/task-date-control.web.tsx'
    'apps/mobile/src/features/tasks/task-date-selection.tsx'
    'apps/mobile/src/features/tasks/task-details.tsx'
    'apps/mobile/src/features/tasks/task-detail-screen.tsx'
    'apps/mobile/src/features/tasks/use-task-capture.ts'
    'apps/mobile/src/features/tasks/v2-task-list.tsx'
    'apps/mobile/src/features/week/server-week-screen.tsx'
    'apps/mobile/src/features/week/v2-week-day.tsx'
    'apps/mobile/src/features/week/week-allocation-editor.tsx'
    'apps/mobile/src/features/week/week-navigation.tsx'
    'CHANGELOG.md'
    'docs/issue-32-verification.md'
    'docs/issue-33-verification.md'
    'supabase/migrations/20261009150000_add_week_allocation.sql'
)
git diff --check
if ($LASTEXITCODE -ne 0) { throw 'Working-tree whitespace check failed.' }
git add -- $checkpointFiles
if ($LASTEXITCODE -ne 0) { throw 'Explicit staging failed.' }

$stagedFiles = @(git diff --cached --name-only)
if (Compare-Object ($checkpointFiles | Sort-Object) ($stagedFiles | Sort-Object)) {
    throw 'The index differs from the reviewed manifest; stop without resetting unrelated work.'
}
git diff --cached --stat
git --no-pager diff --cached -- $checkpointFiles
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'Staged diff validation failed.' }
git diff --exit-code -- $checkpointFiles
if ($LASTEXITCODE -ne 0) { throw 'Included files changed after staging; review those changes first.' }
git status --short --branch --untracked-files=all
```

After reviewing that staged diff, make **one local commit** (no push):

```powershell
git commit -m "feat: complete V2 week planning and task experience"
if ($LASTEXITCODE -ne 0) { throw 'Commit failed; inspect the result before retrying.' }
```

Verify the result in the same PowerShell session:

```powershell
git log -1 --format=fuller
git show --stat --oneline HEAD
git show --format= --name-status HEAD
git show --format= --check HEAD
if ($LASTEXITCODE -ne 0) { throw 'Committed diff validation failed.' }
if ((git rev-parse 'HEAD^') -ne $checkpointBase) { throw 'Unexpected parent; reconcile before further Git actions.' }
$committedFiles = @(git diff-tree --no-commit-id --name-only -r HEAD)
if (Compare-Object ($checkpointFiles | Sort-Object) ($committedFiles | Sort-Object)) {
    throw 'Committed paths differ from the manifest.'
}
git diff HEAD --exit-code -- $checkpointFiles
if ($LASTEXITCODE -ne 0) { throw 'Included paths have remaining changes.' }
git diff --cached --exit-code
if ($LASTEXITCODE -ne 0) { throw 'Index is not empty after the commit.' }
git status --short --branch --untracked-files=all
git diff --stat
git ls-files --others --exclude-standard
git ls-files --others --ignored --exclude-standard --directory
git rev-list --left-right --count HEAD...origin/main
```

With no concurrent work, expect main **2 ahead / 0 behind** the unchanged existing origin/main, an empty index, no remaining tracked changes and the preserved owner handoff/root-config files still untracked. Do not clean them or force-add ignored paths.
