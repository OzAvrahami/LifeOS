# Issue #5 — Daily Planning verification

## Mac candidate preparation — 2026-10-07

**Candidate: LifeOS 0.5.0 (9); not built, installed or accepted.** #5 remains **Open / Verify /
P1 — High**, with physical acceptance pending. This checkpoint prepares metadata and current
records only; runtime source, tests, migration and dependency resolutions are unchanged.

### Completed implementation and rollout checkpoint

- Implementation **439d9dc3f9bdc07550d716e0faeb7d6a0bc0c5ee** was committed/pushed by the owner.
  This Mac began on clean main at that exact SHA. Authorized `git fetch --no-tags origin main`
  confirmed origin/main and HEAD match (0 ahead / 0 behind); no fast-forward, reset or branch
  switch was necessary. The historical Windows local-only checkpoint below is complete.
- **Owner-reported schema evidence:** migration
  `20261007120000_add_daily_planning_lifecycle.sql` was applied to LifeOS Supabase project
  `vcizpdzqbctjksnivnzt`; the subsequent migration list showed all **10** local/remote migrations
  aligned. The command emitted a catalog-cache timeout warning but exited successfully, and
  migration history confirmed the new migration. This preparation did not query/reapply remote
  migrations or claim independent catalog verification.
- **Independently re-read on the Mac:** GitHub commit status **LifeOS - @lifeos/api** is success
  for that exact implementation SHA at **2026-10-07T06:49:31Z**. A fresh public health GET
  returned HTTP 200 and `{"service":"lifeos-api","status":"ok"}`. This is recorded deployment
  plus public health evidence, not direct inspection of Railway's active deployment, a
  commit-specific health response, authenticated writes, or production RLS verification.

### Build-number inventory and native preservation

The owner identifies **0.4.1 (8)** as the last accepted binary. Read-only `devicectl device info
apps --bundle-id il.co.ozavrahami.lifeos` independently found installed **0.4.1 (8)**, without
launching or replacing it. Existing app.json and ignored native Info.plist/Debug/Release metadata
also read 0.4.1 / 8 before preparation.

Inspected `apps/mobile/ios`, LifeOS Xcode DerivedData products, Xcode Archives and relevant
LifeOS temporary artifacts. Known cached products under
`~/Library/Developer/Xcode/DerivedData/LifeOS-heuqkzhdehxkbwbworgfquxenphg/Build/Products/`:

| Artifact | Version/build |
| --- | --- |
| Release-iphoneos/LifeOS.app | 0.4.1 (8) |
| Release-iphonesimulator/LifeOS.app | 0.4.0 (5) |
| Debug-iphoneos/LifeOS.app | 0.1.0 (1) |

No higher relevant prepared/built candidate or archive was found. Therefore **9** is the next
unused build supported by available evidence; cached products alone were not treated as
installed evidence. Local metadata backups/inventory and JS export are outside Git at
`/var/folders/7y/m8g0drvs6v91ldyccz3cx9d00000gn/T/lifeos-issue5-candidate-_pot7lm_/`.

Prepared 0.5.0 in root/API/mobile package manifests and exactly four lockfile values (root
version and packages root/API/mobile versions), plus Expo version/build 0.5.0 / "9". Parsed
comparisons verify no dependency/resolution changes. The documented targeted synchronization
changed only Info.plist version/build and Debug/Release MARKETING_VERSION/CURRENT_PROJECT_VERSION.
Parsed native comparisons confirm every other property preserved. All **24** other snapshotted
native/environment files are unchanged, including signing, provisioning configuration,
entitlements, AppDelegate/UIScene support and environment configuration. Native files remain
ignored; no prebuild, regeneration, Pod installation/update or force-add occurred.

### Pre-device checks on this Mac

| Check / command | Result |
| --- | --- |
| `npm run typecheck` | API and mobile passed |
| `npm run lint` | API and mobile passed |
| `npm run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/app-version-footer-test.tsx __tests__/auth-infrastructure-test.tsx --silent` | **2 suites / 14 passed / 0 failed / 0 skipped** |
| `CI=1 NODE_ENV=production EXPO_NO_DOTENV=1 npx --no-install expo export --platform ios --output-dir <private-temporary-directory>/ios-export` from apps/mobile | Passed, **1489 modules / one Hermes bundle**; process-only synthetic public configuration placeholders; no native build, device execution or acceptance |
| Effective Expo config and shared Settings/More footer | 0.5.0 / 9, expected bundle ID and scene support; footer retains binary-derived build and honest development/Web/missing-build fallbacks |
| Production-mode public configuration check | Documented Railway HTTPS endpoint matches; Supabase HTTPS project matches vcizpdzqbctjksnivnzt; public key present, value not disclosed; no local/LAN override selected |
| Release auth route inspection | Ordinary session-gated product; preview/auth-dev routes require `__DEV__`; no authenticated launch/write performed |
| `xcodebuild -list -workspace apps/mobile/ios/LifeOS.xcworkspace` | Existing workspace and LifeOS scheme available; listing only, no compilation |
| Toolchain | Node 26.3.0 / npm 11.16.0 / Xcode 27.0 (27A266a) / CocoaPods 1.17.0; configured native Node executable exists |
| Native dependencies/signing | Podfile.lock equals Pods/Manifest.lock; existing automatic Personal Team and Apple Development identity available; bundle ID il.co.ozavrahami.lifeos retained |
| Native plist/project validation and comparison | Passed, only six authorized version/build values changed |
| JSON version-field/dependency preservation, environment/native hashes, UTF-8, local Markdown links, `git diff --check` | Passed; 10 changed tracked files decode as UTF-8; 58 local links/anchors valid |

The npm upgrade notice is informational; no dependency update was performed. Reused still-valid
implementation evidence from the committed source: API **13 suites / 96 passed**, mobile
**48 suites / 334 passed / 1 pre-existing Android-only exclusion**, complementary Android
**2 suites / 11 passed / 9 iOS-only exclusions**, and the complete real disposable DB/Auth/RLS
harness including its final Daily Planning rerun. These were not repeated or relabelled as new
Mac test runs because runtime source/tests and dependency resolutions are unchanged.

### Remaining gates and next owner checkpoint

**Preparation is ready for the owner Git checkpoint; build 9 is not yet a signed artifact.**
The cached build-8 provisioning profile expired **2026-09-29T08:37:48Z**. The later authorized
native build must renew provisioning under the existing Personal Team and verify signing/device
trust. This step did not renew profiles or prove future installability. Do not uninstall or
re-pair the existing app merely to prepare the candidate.

After reviewing the tracked metadata/documentation and ignored native diff, the owner commits
those tracked files. A subsequent push is a separate owner action and may trigger Railway;
required schema is already owner-confirmed. Native build/install and the physical checklist
below follow that checkpoint under separate authorization. Record the resulting source and exact
installed **0.5.0 (9)** before acceptance. No new build, install, migration, deployment, tag,
Release publication or Issue closure occurred here. GitHub metadata is unchanged.


## Historical implementation handoff — 2026-10-07

**Historical pre-commit snapshot, superseded by the completed checkpoint and preparation above.** [Issue #5](https://github.com/OzAvrahami/LifeOS/issues/5) was implemented locally against `994138608ebb75713ca594f30ad3f5fa94f172d5` on main. No staging, commit, push, remote migration, deployment, native build/install, version change, tag or Release operation has been performed. Schema/API rollout and owner acceptance on a new iPhone binary remain pending; 0.4.1 (8) cannot accept this implementation.

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
| 3. Start correct date | Explicit account/date RPC, unique owner/date and stable identity; UI + DB | Authenticated iPhone/API verification |
| 4. Scheduled Tasks visible | Review of date-planned Tasks; separate Today category; UI | Physical layout |
| 5. Unfinished review | Prior selected/overdue work, explicit select/defer/Inbox/complete; UI + DB | Physical interaction |
| 6. Weekly Focus context | Correct week query, direction copy and independent blank capture; UI | Physical copy/layout |
| 7. Intentional selection | Ordered IDs independent of Task fields; DB compares full Task before/after | Authenticated iPhone/API verification |
| 8. Capture without leaving | Existing Quick Capture modal, Save/cancel and stable creation retry; UI + DB | Keyboard/modal iPhone check |
| 9. Leaving preserves progress | Per-action server save, remount with fresh provider and fresh Auth reads; UI + DB | Real app restart |
| 10. Continue planning | In-progress entry and saved step; UI | Physical smoke |
| 11. Restore selections | Server state after remount, no inferred dated membership; UI + DB | Real app restart |
| 12. Previous steps accessible | Persisted back navigation; UI | Physical navigation |
| 13. Final completion | Only explicit step-3 confirmation; duplicate complete retains timestamp; UI + DB | Authenticated iPhone/API verification |
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
| SemVer impact | **Minor**: substantial backwards-compatible Daily Planning workflow |
| Candidate version | **0.5.0**, internal candidate, unpublished |
| Candidate iOS build | **9**; installed metadata, native source and relevant artifacts top out at 8; no higher candidate/archive found |
| Version prepared | **Yes, 2026-10-07 on the Mac**: Expo and three first-party manifests synchronized; exactly four lockfile version fields updated, resolutions preserved |
| Native version synchronized | **Yes**: existing ignored Info.plist and Debug/Release project fields read back 0.5.0 / 9; unrelated native/environment state preserved |
| Physical build installed | **Pending**; independently read installed 0.4.1 (8), not evidence for #5 |
| Owner accepted exact build | **Pending**; keep #5 Open / Verify |
| Included issues | #5 on implementation `439d9dc3f9bdc07550d716e0faeb7d6a0bc0c5ee`, retaining previously accepted features including #2/#9 |

**Candidate: LifeOS 0.5.0 (9); not built, installed or accepted.** Release impact Yes / Minor.
CHANGELOG is updated under Unreleased; product/native version preparation is complete locally.
No tag or Release is published, and physical acceptance remains mandatory. The next owner Git
checkpoint covers metadata/documentation only; no runtime/test/dependency-resolution changes
were made. Future native build/install requires separate authorization and renewed provisioning.

## iPhone acceptance checklist — after rollout and pre-device gate

1. Record the exact new installed version/build/source. Ordinary authenticated Today shows Plan today, Continue planning or Review appropriately; Hebrew/RTL labels, scrolling and touch targets remain readable.
2. Review scheduled Tasks, all Commitments and unfinished work. Select an Inbox Task and a dated Task; check distinct categories, unique totals and missing estimates. Scheduling/importance/deadline/reminder must be unchanged.
3. Open ordinary and Focus-inspired capture: blank title, Inbox default, cancel creates nothing; Save creates one ordinary Task without auto-selection or a Focus link. Check keyboard/date picker, defer, return to Inbox and complete.
4. Leave mid-flow, restart/re-authenticate and resume saved selections/order/step. Go backwards. Exercise a failed save/retry and confirm no duplicate plan/Task. Complete an empty plan separately from an untouched date.
5. Confirm, review without restart, deliberately edit the same plan, remove/reorder selections and reconfirm. Change/complete/cancel a selected Task elsewhere and refresh; retained selection and updated state should be understandable.
6. Check configured-timezone midnight and a timezone change while planning, foreground refresh, another date and another account. No data should move between dates/accounts. Day Window remains context, never an eight-hour capacity claim.

Record owner approval against that exact new binary and this scope. Only then may #5 become Done/closed. No older binary, mock, export or local test substitutes for this gate.

## Historical local Git checkpoint — completed as 439d9dc

**Historical instructions, already completed by the owner; do not repeat this staging/commit or the rollout commands below.** Implementation was committed and pushed as `439d9dc3f9bdc07550d716e0faeb7d6a0bc0c5ee`; subsequent schema/deployment evidence is recorded above. At the original handoff, **ready for owner review and local commit** meant full software scope and required local automated gates pass; no local blocker remains. Final Git readback is main at `994138608ebb75713ca594f30ad3f5fa94f172d5`, matching the local origin/main reference (0 ahead / 0 behind). The 37 changed files below are unstaged (25 modified tracked files and 12 new files); no owner changes were overwritten. **Local commit only; do not add a push to this checkpoint.** The next concrete rollout step after the owner commit is linked remote migration inspection and dry run, following [Deployment](DEPLOYMENT.md) and [the canonical order](DEVELOPMENT_WORKFLOW.md#database--api-rollout); schema application requires separate explicit authorization.

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
