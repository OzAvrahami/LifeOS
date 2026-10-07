# Issue #5 — Daily Planning verification

## Local handoff — 2026-10-07

[Issue #5](https://github.com/OzAvrahami/LifeOS/issues/5) is implemented locally against `994138608ebb75713ca594f30ad3f5fa94f172d5` on main. No staging, commit, push, remote migration, deployment, native build/install, version change, tag or Release operation has been performed. Schema/API rollout and owner acceptance on a new iPhone binary remain pending; 0.4.1 (8) cannot accept this implementation.

The initial clean checkout was `aba01ce`, six commits behind. Before implementation the owner advanced it to the verified baseline; the later fetch/fast-forward authorization required no further branch/history operation. At the checkpoint, HEAD and the local origin/main reference remain `9941386` (0 ahead / 0 behind). Existing ignored environment/native/cache files were preserved. `npm ci` restored the exact lockfile dependencies after the baseline changed; manifests and lockfile are unchanged.

Read AGENTS, the canonical workflow, GitHub conventions, deployment/product/data specifications, current implementation/tests, #5 and all its comments (zero), and #2/#9 acceptance evidence. Live GitHub readback confirms v0.4.1 is Latest, published 2026-09-23T11:49:34Z, non-draft/non-prerelease, with annotated tag target `9941386`. Current documentation now reflects publication; pre-publication and physical acceptance history is retained.

Only the existing LifeOS Development Project #2 item for #5 was managed: In Progress during implementation, then **Verify** after all software gates passed. Readback confirms item `PVTI_lAHOAgE74M4BhLsqzg3oe8o`, **Open / Verify / P1 — High**, feature/ux/mobile labels, no assignee or milestone, and existing membership preserved. No other repository or Project item changed.

## Implementation and decisions

- Three short steps combine review, intentional selection/capture, and summary/order/confirmation. Today uses **תכנון היום**, **המשך התכנון**, and **סקירת התכנון להיום**. Completed review is read-only until **עריכת התכנון היומי** is chosen. An empty completed plan is distinct from one never started.
- Every acknowledged navigation/selection change is persisted. Fresh reads/remounts restore the saved step and ordered selections. Previous steps remain accessible. Pending and failed saves never claim completion. Retry reuses the exact operation identity/payload; a revision conflict requires explicit reload/review, not overwriting another edit.
- Selection does not mutate a Task. Scheduled Tasks are not automatically selected; removal does not delete or move them. Unfinished review includes overdue planned dates/deadlines and active Tasks selected in the most recent previous plan. Other active work remains available in selection. Actions explicitly select, defer via the established date picker, return to Inbox or complete. There is no rollover.
- Weekly Focus is queried for the captured date and configured week start. It stays a direction, with no inferred related Tasks. Explicit capture opens blank with Inbox default; Save creates an ordinary Task, cancel creates nothing. No Focus link, inferred importance/reminder, or automatic daily selection. The normal/important model is unchanged.
- Today renders selected Tasks separately from remaining dated Tasks and Commitments, retaining detail/start/stop/complete/reopen actions. Active-task handoff still uses the existing Task service. Task mutation caches invalidate daily snapshots alongside existing Today/Week/Inbox caches. Totals use the unique union and only active Tasks' explicit estimates; unknown estimates are disclosed. Commitments remain separate. Day Window is displayed as context with no availability/capacity denominator.
- A planning session captures account/date/timezone/week-start context. Today refreshes its calendar date on foreground and every 30 seconds, while an open session continues writing its explicit original date. Account changes remove the session; requests reject credentials for a different account. Late responses cannot open a replaced entry or write another account/date's cache. Query cancellation and revision comparisons protect mutation responses from stale reads.

Relevant source: [session](../apps/mobile/src/features/planning/daily-planning-session.tsx), [entry and selected Tasks](../apps/mobile/src/features/planning/daily-planning-view.tsx), [commands](../apps/mobile/src/features/planning/daily-planning-command.ts), [queries](../apps/mobile/src/features/planning/daily-planning.queries.ts), [membership/totals](../apps/mobile/src/features/planning/daily-planning-model.ts), [Today](../apps/mobile/src/features/today/today-screen.tsx), [API service](../apps/api/src/features/planning/daily-planning.ts), [migration](../supabase/migrations/20261007120000_add_daily_planning_lifecycle.sql).

## Acceptance coverage

Automated evidence establishes software behavior, not physical acceptance. `UI` below means [Daily Planning component/integration tests](../apps/mobile/__tests__/daily-planning-test.tsx); `DB` means the real [disposable database/Auth/RLS scenarios](../apps/api/scripts/verify-daily-planning.mjs), run by the guarded local harness. The original issue's 21 criteria map as follows:

| Criterion | Implementation / local evidence | Remaining gate |
| --- | --- | --- |
| 1. Obvious Today entry | State-dependent entry in normal, active and partially completed Today; UI tests | iPhone discoverability |
| 2. No state shows Plan today | Null/legacy-only state starts; loading/error are distinct; UI + DB | Physical smoke |
| 3. Start correct date | Explicit account/date RPC, unique owner/date and stable identity; UI + DB | Remote rollout |
| 4. Scheduled Tasks visible | Review of date-planned Tasks; separate Today category; UI | Physical layout |
| 5. Unfinished review | Prior selected/overdue work, explicit select/defer/Inbox/complete; UI + DB | Physical interaction |
| 6. Weekly Focus context | Correct week query, direction copy and independent blank capture; UI | Physical copy/layout |
| 7. Intentional selection | Ordered IDs independent of Task fields; DB compares full Task before/after | Remote rollout |
| 8. Capture without leaving | Existing Quick Capture modal, Save/cancel and stable creation retry; UI + DB | Keyboard/modal iPhone check |
| 9. Leaving preserves progress | Per-action server save, remount with fresh provider and fresh Auth reads; UI + DB | Real app restart |
| 10. Continue planning | In-progress entry and saved step; UI | Physical smoke |
| 11. Restore selections | Server state after remount, no inferred dated membership; UI + DB | Real app restart |
| 12. Previous steps accessible | Persisted back navigation; UI | Physical navigation |
| 13. Final completion | Only explicit step-3 confirmation; duplicate complete retains timestamp; UI + DB | Remote rollout |
| 14. Completed visible | Completed Today entry; deliberately empty plan supported; UI + DB | Physical smoke |
| 15. Review completed plan | GET/review performs no start/reset write; UI + DB | Physical smoke |
| 16. Edit without duplicate | Explicit edit retains ID/selections/last confirmation, requires reconfirmation; UI + DB | Physical smoke |
| 17. No automatic carryover | New date has null state and no selections; candidates require action; UI + DB | Midnight/reopen smoke |
| 18. No eight-hour assumption | Known active estimates + missing-count; Day Window context only; UI + existing Day Window suites | Physical summary |
| 19. Tomorrow independent | Distinct account/date keys and rows, no rollover; UI midnight + DB | Device clock/date behavior |
| 20. Local date/timezone | Existing IANA helpers, captured context, configured Jerusalem midnight test and existing date/timezone regressions | Device timezone change |
| 21. Hebrew RTL/iPhone | Existing design tokens, RTL styles, navigation and capture/date-picker patterns; component tests + iOS JS export | **Physical iPhone verification pending** |

Additional coverage includes two independent users, foreign selection IDs, anonymous denial, invalid lifecycle/duplicate selection constraints, legacy upsert/clear/direct DELETE behavior, lost responses, duplicate submissions, simultaneous edits, completed/moved/cancelled Tasks, missing references, preserved normal/important/deadline/reminder fields, deduplicated durations, and credential-account mismatch. New Task creation supports an optional UUID `Idempotency-Key` used only for retry-safe capture; without it the existing creation contract is unchanged. Same-UUID retries return the existing owned Task without resetting later edits; conflicting payload/foreign ID returns 409. The daily capture draft is locked after submission until retry/cancel so a retry retains the original payload.

## Persistence and rollout compatibility

Forward migration **20261007120000_add_daily_planning_lifecycle.sql** extends the existing DailyPlan rather than replacing it. It adds lifecycle, progress, ordered unique Task IDs (maximum 500), revision and last-command identity/payload. Stable ID, unique caller/date ownership and RLS remain. New references must be caller-owned active Tasks. Existing references may later complete/move/cancel/disappear; the UI discloses this without silently removing unrelated selections. An explicit removal is required.

`save_daily_planning` is a security-invoker RPC with an account/date advisory lock, row lock, revision check and atomic lifecycle/selection writes. Same last command returns its saved result. Older retries after another change conflict safely; they never replay over newer work. Business conflicts use SQLSTATE 55000, consistent with Weekly Planning, rather than asking PostgREST to retry a serialization exception.

Legacy `focusTaskId` still means the single active Task planned for that date; it is not the new selection set. `availableMinutes` retains its legacy meaning. The relaxed data constraint permits intentionally empty in-progress/completed plans. Old-client writes touch only legacy fields. A database DELETE guard clears legacy fields but retains a started/completed plan; clearing a legacy-only row still deletes it. Auth-user cascade cleanup remains supported. Existing 0.4.1 routes and request/response shapes remain available. New routes are `GET/PUT /daily-plans/:date/planning` and `GET /daily-plans/:date/tasks`; all require caller-scoped authentication. No second backend or external-API initiative is included.

Local Supabase was behind the verified source by the already-published `20260922120000` migration. `migration up --local` applied that prerequisite and the new draft migration. The draft RPC was corrected locally during testing before final verification; no remote history or published migration was changed. The existing guarded localhost harness used disposable users with cleanup and real publishable-key JWT clients. No production credentials/data were used. Task snapshots page active/dated work and fetch retained inactive selections in bounded batches to avoid row/URL truncation.

Rollout order: **local DB verification → owner local commit → inspect all remote pending migrations and dry run → explicitly authorized schema application → verify remote history → intentional API push/deployment/source/health verification → authorized mobile candidate preparation → installation and owner acceptance**. Do not push schema-dependent API code before required remote schema exists. Preserve the forward migration during recovery; an old API/client remains compatible with the added columns/guard. If rollout fails, keep the new mobile candidate uninstalled and inspect the actual schema/API state before taking further action.

## Local verification commands and results

Windows commands use `npm.cmd`/`npx.cmd` from the repository root unless noted. No required local check is intentionally skipped.

| Command | Result |
| --- | --- |
| `npm.cmd ci` | Locked dependencies restored; manifests/lockfile unchanged. Existing dependency deprecation/audit notices emitted; no audit fix or dependency update performed. |
| `npx.cmd supabase migration up --local` | Passed; applied local 20260922120000 prerequisite and 20261007120000 draft migration |
| `npm.cmd run test:integration:local --workspace @lifeos/api` | Passed complete real DB/Auth/RLS harness, including Daily/Weekly Planning, Tasks, commitments/reminders (1001-row coverage), notifications and settings |
| `npm.cmd run test:integration:local --workspace @lifeos/api -- --daily` | Passed again after final daily snapshot/retry changes; real two-user/anonymous/legacy/concurrency/capture scenarios |
| `npx.cmd supabase db lint --local --level warning` | Passed; no schema errors |
| `npm.cmd run test --workspace @lifeos/api` | 13 suites / 96 passed / no skips or failures, including allowed-origin capture preflight |
| `npm.cmd run test --workspace @lifeos/mobile -- --silent` | Final run: 48 suites / 334 passed / 1 pre-existing Android-only exclusion / no failures |
| `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/daily-planning-test.tsx __tests__/today-screen-test.tsx __tests__/task-server-flow-test.tsx --silent` | 3 suites / 37 passed / no skips, after final Today category changes |
| `npm.cmd run test --workspace @lifeos/mobile -- --config jest.commitment-android.config.js --silent` | 2 suites / 11 passed / 9 complementary iOS-only exclusions; covers the default run's Android-only exclusion |
| `npm.cmd run typecheck` | API and mobile passed |
| `npm.cmd run lint` | API and mobile passed |
| `npx.cmd --no-install expo export --platform ios --output-dir <temporary-directory>` from apps/mobile | Passed: 1489 modules, one Hermes bundle; CI=1, EXPO_NO_DOTENV=1 and process-only synthetic public placeholders. Output outside repository at `%TEMP%/lifeos-issue5-ios-30781cf5cd6b4b33bd23b50cf544e53c`. This is a JS export, not a native binary or device verification. |
| `git diff --check` | Passed; local documentation link validation passed (79 links), canonical version/build readback is 0.4.1 / 8, manifests/lockfile unchanged |

Initial failures were resolved: a transient missing `tsc` while `npm ci` was replacing dependencies; the real DB conflict path using serialization SQLSTATE (fixed to 55000); a local API startup timeout during concurrent cold checks (subsequent harness passed); one existing 5-second Week test timeout during the initial full cold run (unchanged test passed on rerun); new test selector/fixture errors and React ref/effect lint findings (corrected). No failing assertion or required gate was disabled. Earlier automated evidence is separate from production and physical acceptance.

## Release candidate

| Field | Value |
| --- | --- |
| SemVer impact | **Minor, provisional**: substantial new backwards-compatible Daily Planning workflow |
| Candidate version | **0.5.0 provisional**, not prepared/published |
| Candidate iOS build | **TBD**, must exceed last accepted build 8 and every relevant known candidate; at least 9 only if build-host/artifact inventory confirms no higher candidate |
| Version prepared | **Pending / not authorized in this step**; canonical tracked sources remain 0.4.1 / 8 and dependencies unchanged |
| Native version synchronized | **Pending** on the build Mac; Windows checkout has no installable native acceptance artifact. Preserve ignored native/environment files. |
| Physical build installed | **Pending**; 0.4.1 (8) is the earlier owner-accepted binary |
| Owner accepted exact build | **Pending**; keep #5 open |
| Included issues | #5 and necessary integration, based on `9941386` including completed #2/#9 |

Before any build/install instruction, recheck versions, accepted binary and build-host artifacts; choose a fresh build, obtain preparation authorization, synchronize only canonical tracked/native fields, verify version/footer/config and production prerequisites, and record the exact candidate. This handoff does not ask the owner to build/install now.

## iPhone acceptance checklist — after rollout and pre-device gate

1. Record the exact new installed version/build/source. Ordinary authenticated Today shows Plan today, Continue planning or Review appropriately; Hebrew/RTL labels, scrolling and touch targets remain readable.
2. Review scheduled Tasks, all Commitments and unfinished work. Select an Inbox Task and a dated Task; check distinct categories, unique totals and missing estimates. Scheduling/importance/deadline/reminder must be unchanged.
3. Open ordinary and Focus-inspired capture: blank title, Inbox default, cancel creates nothing; Save creates one ordinary Task without auto-selection or a Focus link. Check keyboard/date picker, defer, return to Inbox and complete.
4. Leave mid-flow, restart/re-authenticate and resume saved selections/order/step. Go backwards. Exercise a failed save/retry and confirm no duplicate plan/Task. Complete an empty plan separately from an untouched date.
5. Confirm, review without restart, deliberately edit the same plan, remove/reorder selections and reconfirm. Change/complete/cancel a selected Task elsewhere and refresh; retained selection and updated state should be understandable.
6. Check configured-timezone midnight and a timezone change while planning, foreground refresh, another date and another account. No data should move between dates/accounts. Day Window remains context, never an eight-hour capacity claim.

Record owner approval against that exact new binary and this scope. Only then may #5 become Done/closed. No older binary, mock, export or local test substitutes for this gate.

## Owner local Git checkpoint

**Ready for owner review and local commit**: full software scope and required local automated gates pass; no local blocker remains. Final Git readback is main at `994138608ebb75713ca594f30ad3f5fa94f172d5`, matching the local origin/main reference (0 ahead / 0 behind). The 37 changed files below are unstaged (25 modified tracked files and 12 new files); no owner changes were overwritten. **Local commit only; do not add a push to this checkpoint.** The next concrete rollout step after the owner commit is linked remote migration inspection and dry run, following [Deployment](DEPLOYMENT.md) and [the canonical order](DEVELOPMENT_WORKFLOW.md#database--api-rollout); schema application requires separate explicit authorization.

```powershell
Set-Location D:\code\LifeOS
$issue5Files = @(
  'CHANGELOG.md'
  'apps/api/__tests__/app.test.ts'
  'apps/api/__tests__/daily-planning.test.ts'
  'apps/api/scripts/verify-daily-planning.mjs'
  'apps/api/scripts/verify-local-tasks.mjs'
  'apps/api/src/features/planning/daily-planning.ts'
  'apps/api/src/features/planning/planning.routes.ts'
  'apps/api/src/features/tasks/task.routes.ts'
  'apps/api/src/features/tasks/task.service.ts'
  'apps/api/src/features/tasks/task.types.ts'
  'apps/api/src/middleware/cors.middleware.ts'
  'apps/mobile/__tests__/auth-infrastructure-test.tsx'
  'apps/mobile/__tests__/daily-planning-test.tsx'
  'apps/mobile/src/features/capture/quick-capture-sheet.tsx'
  'apps/mobile/src/features/planning/daily-planning-command.ts'
  'apps/mobile/src/features/planning/daily-planning-model.ts'
  'apps/mobile/src/features/planning/daily-planning-session.tsx'
  'apps/mobile/src/features/planning/daily-planning-view.tsx'
  'apps/mobile/src/features/planning/daily-planning.api.ts'
  'apps/mobile/src/features/planning/daily-planning.queries.ts'
  'apps/mobile/src/features/tasks/task.queries.ts'
  'apps/mobile/src/features/today/active-state.tsx'
  'apps/mobile/src/features/today/partially-completed-state.tsx'
  'apps/mobile/src/features/today/today-screen.tsx'
  'apps/mobile/src/lib/api/client.ts'
  'docs/DATA_MODEL_V0.1.md'
  'docs/DEPLOYMENT.md'
  'docs/IMPLEMENTATION_STATUS.md'
  'docs/PRODUCT_SPEC_V0.1.md'
  'docs/ROADMAP.md'
  'docs/TODAY_SCREEN_SPEC.md'
  'docs/issue-1-verification.md'
  'docs/issue-5-verification.md'
  'docs/issue-9-decision.md'
  'docs/release-0.4.0-verification.md'
  'docs/release-0.4.1-verification.md'
  'supabase/migrations/20261007120000_add_daily_planning_lifecycle.sql'
)
git add -- $issue5Files
git diff --cached --check
git diff --cached --stat
git commit -m "feat(planning): add durable daily planning flow"
```

No push is included. After the owner makes that local commit, inspect the linked project and run read-only migration planning (`npx supabase migration list --linked`, then `npx supabase db push --linked --dry-run --skip-vault`). Review every pending migration before requesting authorization for real schema application.
