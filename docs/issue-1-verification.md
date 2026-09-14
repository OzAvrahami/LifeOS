# Issue #1 — Notifications MVP verification

## Scope and baseline

Issue: [#1 — Feature: Notifications MVP](https://github.com/OzAvrahami/LifeOS/issues/1). Implementation date: 2026-09-14. Baseline: `main`, `7313672dfd64ebb5884655ae9d881757b9a57d3d` (`docs(release): record v0.3.0 publication`), equal to `origin/main` after the explicitly authorized fetch. The worktree was clean. Existing ignored API/mobile environment files were inventoried and preserved. No implementation of another issue is included.

The approved first slice provides local iOS permission management, notification Settings, explicit Task reminders, one recurring Weekly Planning reminder, persistence, reconciliation and tap routing. Start-of-day summaries, missed-task reminders, end-of-day summaries and smart suggestions are deferred; they have no active controls or automatic behavior. Remote push, tokens, APNs backend, Firebase, OneSignal, analytics, Google Calendar and automatic reminder timing remain out of scope.

## Product behavior

- All three notification preferences default off. Saving an enabled master preference or saving an active Task reminder requests permission contextually, after server persistence. Opening the app/Settings does not prompt. Only alert permission is requested; sound and badge are off. Allowed, not-requested, blocked and unsupported-platform states are explicit. Blocked permission exposes Hebrew guidance and iOS Settings; it never erases preferences or Task reminders. Re-enabling permission is picked up on resume.
- Settings stores master, task category, weekly category, weekday and exact local `HH:mm`. Turning a preference off unschedules relevant LifeOS requests on the device, retaining all reminder configuration. Weekly enablement requires an explicit weekday and time. No notification time is invented.
- Existing Task creation is Quick Capture; it remains lightweight. After capture, Inbox actions and Week/day Task details expose **הזכר לי** for set/edit/clear. The task API also supports an explicit reminder at creation. Notification taps reuse the same Task detail component through an authenticated `/task?id=...` route, including Inbox or completed tasks. Missing/cancelled/invalid IDs show an unavailable message; no replacement task is created.
- The reminder editor uses the existing date and precise time controls. The date picker is labelled as a reminder date rather than a planning date. iOS wheel changes remain drafts until confirmation; cancellation, unmount and clearing discard stale callbacks. Web notification time inputs use a 60-second step, preserving the existing 900-second commitment default. There is no automatic duration or planned/due-date conversion.
- Local date/time selection is converted once with local `Date` construction to an ISO timestamp representing an explicit instant. Reopening uses local date/time getters. Exact minutes survive same-timezone save/reopen. Past, missing and invalid values are rejected before saving and by the API. Nonexistent DST local times are rejected; an ambiguous repeated local time uses JavaScript's earlier occurrence. Changing device timezone changes the displayed local equivalent of a Task instant, not its stored instant. Editing unrelated fields of a historical/past reminder remains possible.
- Task completion/cancellation/deletion unschedules reminders while retaining persisted intent/history. Reopening schedules only an eligible future reminder. Planned date, due date, title/description and progress retain their independent meanings. A task without explicit `reminderAt` never schedules a reminder.

## Storage and API

Forward migration: [`20260914120000_add_notification_intent.sql`](../supabase/migrations/20260914120000_add_notification_intent.sql).

| Existing table | Added fields |
| --- | --- |
| `tasks` | Nullable finite `reminder_at timestamptz`, exposed as `reminderAt` |
| `user_settings` | `notifications_enabled`, `task_reminders_enabled`, `weekly_planning_reminder_enabled` (default false); nullable `weekly_planning_reminder_weekday` (0–6, Sunday=0), `weekly_planning_reminder_time` (exact minute, less than 24:00) |

Weekly enablement requires weekday/time. Existing rows and old clients retain safe defaults. The response groups preferences under `notifications`. `PATCH /settings` accepts that complete five-field preference group and an initial IANA timezone used only when creating an absent settings row. It preserves existing timezone, week-start, Day Window and capacity. Existing `PUT /settings` preserves notification columns. Future categories can extend this same group with forward-compatible defaults; no parallel settings system was created.

Task create/update supports setting or clearing explicit future timestamps. Unrelated updates never rewrite reminders. `GET /tasks?id=...` reuses caller-scoped list access for detail routing. `GET /tasks?reminders=true` returns active reminder-bearing tasks, paging in batches of 500 beyond PostgREST's response limit before local reconciliation. A failed fetch is never treated as an empty snapshot.

No opaque Expo IDs enter shared storage. Existing RLS, ownership, IDs and history are preserved. All local integration fixtures belong to disposable Auth users and are cleaned by the existing guarded harness.

## Device architecture

The `features/notifications` module separates permission/service, desired-state reconciliation, routing, provider, context and UI. iOS platform module resolution imports Expo Notifications; Web/Android support intent configuration without claiming notification delivery in this first iOS slice.

`NotificationProvider` reconciles authenticated bootstrap, session changes, foreground/resume and successful Task/Settings cache changes. Snapshot requests capture the initiating session token. Device operations are serialized; a revision invalidates older snapshots. Network waits do not block logout cleanup. Scheduling identifiers encode owner, item and intended time locally; discovery uses the LifeOS ownership marker. Existing matching requests are retained, obsolete/duplicate requests cancelled and missing future requests scheduled. Partial native failures remain retryable through fresh discovery, with a visible Settings sync error. Previous-user scheduled and delivered LifeOS notifications are removed on logout/account switch. Unrelated notifications are preserved.

The application limits pending requests to 64 including unrelated requests, reserves the weekly reminder first, then prioritizes the earliest Task instants. Overflow remains persisted, is disclosed in Settings and is reconsidered at reconciliation. The app does not claim unscheduled overflow is queued by iOS.

Weekly reminders use Expo's repeating weekday/hour/minute trigger. The persisted Sunday=0 convention converts to Expo Sunday=1. Matching installed 57.0.12 types and `ios/ExpoNotifications/Notifications/TriggerRecords.swift` confirm `UNCalendarNotificationTrigger` with weekday/hour/minute and no fixed timezone. iOS owns local wall-clock/DST matching. No Weekly Plan needs to exist; tapping navigates to Week without starting or mutating a plan. See [Expo SDK 57 notification documentation](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/).

Task notification content contains a generic Hebrew title and the real Task title; data contains only ownership/routing identifiers. Foreground display deliberately permits banner/list for the active account, without sound/badge. Background and cold-start responses share a deduplicating router; a later weekly occurrence can navigate again. Listeners and handlers are cleaned on unmount, and foreign-account taps are ignored.

Reminder intent/preferences are account state. Each signed-in iPhone reconciles independently. There is no remote delivery or cancellation on a device that has not synced a change. iOS can deliver already scheduled requests while LifeOS is closed; force-closing does not run new reconciliation. Offline edits elsewhere, logout on another device and device capacity cannot be solved by this local-only MVP. System Focus/permission settings may affect presentation. Physical timezone/DST and closed-app delivery checks remain pending.

## Native dependency and preparation

Added **`expo-notifications` 57.0.12**, pinned to the version in installed Expo 57.0.14's bundled compatibility manifest; added transitive `expo-application` 57.0.3 and `badgin` 1.2.3. All pre-existing locked dependency versions/resolutions are preserved. The initially selected 57.0.18 required duplicate native `expo-constants`; that intermediate installation was replaced. Final iOS autolinking verification reports no duplicates.

No notification config plugin was added: the installed plugin adds an APNs entitlement, while this slice uses local alerts, no custom sounds, no remote background mode and no push registration. Native modules require normal CocoaPods synchronization on the existing Mac project before a later authorized binary build. No prebuild/regeneration, bundle identifier, signing, native settings or production configuration changed.

**Native preparation limitation:** this Windows checkout has no `apps/mobile/ios`, CocoaPods or Xcode. The documented Mac checkout is not accessible in this session. No ignored iOS file was changed or fabricated; native version synchronization and Pods validation remain explicit external gates. This record is not an instruction to build/install before those gates and schema/API rollout are complete.

## Automated verification

All commands below exited 0 unless explicitly identified as an advisory failure. Run from the repository root unless a different directory is specified. Mocks and exports establish software behavior, not real notification delivery or physical wheel layout.

| Command | Final result |
| --- | --- |
| `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/notifications-test.ts __tests__/notification-ui-test.tsx __tests__/notification-provider-test.tsx __tests__/notification-web-test.tsx __tests__/app-version-footer-test.tsx` | 5 suites, 36 tests passed on prepared 0.4.0; includes 30 new notification tests and 6 footer regressions |
| `npm.cmd run test --workspace @lifeos/mobile` | 44 suites passed; 289 passed, 1 existing Android-only test excluded in the default iOS run; no new skips |
| `npm.cmd run test --workspace @lifeos/mobile -- --config jest.commitment-android.config.js` | 2 suites, 11 passed; 9 existing iOS-only exclusions; verifies the complementary Android confirmation path |
| `npm.cmd run test --workspace @lifeos/mobile -- --config jest.task-date-android.config.js` | 1 suite, 3 tests passed |
| `npm.cmd run test --workspace @lifeos/api` | 10 suites, 83 tests passed, no skips |
| `npx.cmd supabase migration up --local` | Passed; applied pending local baseline migrations 20260906120000/20260913120000 and new 20260914120000 without reset or remote access |
| `npm.cmd run test:integration:local --workspace @lifeos/api` | All 12 PASS groups, including new notification API/PostgreSQL/Auth/RLS checks and 1,001-row reminder pagination; disposable users cleaned |
| `npm.cmd run typecheck` | API and mobile passed, including prepared metadata |
| `npm.cmd run lint` | API and mobile passed |
| `npx.cmd expo-modules-autolinking verify --platform ios` (mobile directory) | `Everything is fine!`; duplicate native dependency resolved |
| Production `npx.cmd expo config --type public --json` (mobile directory) | Reports version `0.4.0`, iOS build `5`, unchanged bundle `il.co.ozavrahami.lifeos` |
| iOS export below | Passed: 1 Hermes bundle (1,478 modules), 49 assets, metadata; no native compilation/install |
| Canonical version/lock audit | All first-party versions 0.4.0, app build 5; all pre-existing third-party versions/resolved URLs/integrities unchanged |
| `git diff --check` | Passed; Windows LF/CRLF conversion notices are not whitespace errors |

The first focused runs found test-fixture mistakes (Task planning uses `plannedDate`; API mutation mock takes an object) and Jest dynamic-import incompatibility, all corrected without weakening assertions. React compiler lint findings in the new provider were fixed using effect-owned refs and asynchronous service completion. The initial local harness expected the old Settings shape; it now asserts the added safe-default preference group alongside every existing field. No unresolved software test failure remains. Full-suite output still includes Expo's mock-environment/native-module warnings and an asynchronous React `act` warning; these were not suppressed or used as evidence of real device behavior.

**Additional dependency advisory:** online `npx.cmd expo install --check` exited 1, recommending newer patch versions for the existing Expo/RN/tooling stack and Notifications 57.0.18. Installed Expo 57.0.14's bundled manifest specifies Notifications `~57.0.12`; pinning 57.0.12 avoids changing existing native dependency versions. The mobile-directory offline manifest check (`$env:EXPO_OFFLINE='1'; npx.cmd expo install --check`) exited 0, with Expo's standard offline-reliability notice. This is an explicitly recorded online update advisory, not a claim that the online check passed. No validation exclusions or global settings were added.

Production export used process-only non-service placeholders, preserving environment files:

```powershell
# From apps/mobile; process scope only, not persisted configuration.
$env:NODE_ENV='production'
$env:EXPO_NO_DOTENV='1'
$env:EXPO_PUBLIC_API_URL='https://example.invalid'
$env:EXPO_PUBLIC_SUPABASE_URL='https://example.invalid'
$env:EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY='export-check'
npx.cmd expo export --platform ios --output-dir "$env:TEMP\lifeos040-ios-export"
```

The config check also used process-only `NODE_ENV=production` and `EXPO_NO_DOTENV=1`, reading back only version/build/bundle/plugins. No simulator, physical device, live browser interaction or production persistence was exercised; Web evidence is jsdom interaction testing. Issue Forms/workflow files were not modified.

## Release candidate

| Field | Value |
| --- | --- |
| SemVer impact | Minor: explicit user-facing notifications capability |
| Candidate version | LifeOS 0.4.0 |
| Candidate iOS build | 5; previous accepted binary is 0.3.0 (4), no later candidate found in accessible evidence |
| Version prepared | Yes, 2026-09-14: root/API/mobile manifests, exactly four lockfile product version values, app.json version/build; production config/footer/export verified |
| Native version synchronized | Pending: existing ignored Mac iOS project unavailable here |
| Physical build installed | Pending; build/install explicitly prohibited in this task |
| Owner accepted exact build | Pending |
| Included issues | #1 first slice, uncommitted work on baseline `7313672dfd64ebb5884655ae9d881757b9a57d3d` |

**Candidate: LifeOS 0.4.0 (5); not installed/accepted.** Published release and last accepted binary remain v0.3.0 / 0.3.0 (4).

## Owner acceptance — pending

- [ ] On a later authorized 0.4.0 (5) iPhone candidate, verify normal authenticated launch without an unsolicited prompt; inspect all Settings permission states, contextual request, denied guidance, iOS Settings and resume reconciliation.
- [ ] Use an isolated test account to set 09:10, 09:25 and 09:17 reminders; edit, cancel draft, clear, save/reopen, preserve title/date/deadline and verify narrow-screen Hebrew RTL/safe areas.
- [ ] Verify actual foreground, background and closed-app delivery; tap to the real Task. Complete/cancel/clear/reschedule and confirm old pending reminders disappear. Test a missing task and an already-completed task safely.
- [ ] Disable/re-enable master/tasks/weekly without erasing intent; verify one future request after repeated saves/restarts/resume and safe blocked/offline recovery.
- [ ] Verify Sunday/Saturday and exact weekly time, changing weekly configuration, no existing plan, Week tap, device timezone change and DST boundary behavior.
- [ ] Switch accounts/logout and verify previous-account pending/delivered LifeOS notifications disappear; unrelated notifications remain. Confirm independent multi-device semantics.
- [ ] Record exact installed version/build and owner acceptance; only then consider Done/closing. No device acceptance box is complete from mocks, jsdom or export.

## Rollout and manual Git checkpoint

Final GitHub readback: **Open / Verify / P2 — Medium**, existing item `PVTI_lAHOAgE74M4BhLsqzg3oDwc`; feature/mobile labels, empty assignees, no milestone and membership preserved. [Verified handoff comment](https://github.com/OzAvrahami/LifeOS/issues/1#issuecomment-5664472014). The issue body reflects the approved first slice and truthful Release / Build gate; physical acceptance remains unchecked. Verify is justified by completed software/automated scope with the explicit external gates documented above, not native or production acceptance.

After review, the owner controls staging and a local commit. **Hold the deployment-triggering push.** Follow [the canonical schema order](DEVELOPMENT_WORKFLOW.md#database--api-rollout): inspect every linked pending migration and dry run, explicitly authorize schema application, verify remote history, then authorize API push/deployment and verify the compatible API. Migration `20260914120000` has not been applied remotely in this task. Earlier local baseline migrations 20260906120000 and 20260913120000 were applied only to the local stack before this gate; this is not evidence of remote pending history.

Complete native version/Pods preparation on the existing Mac project and validate preserved settings before any separately authorized iPhone build. No staging, commit, push, remote migration, deployment, native build/install, tag, release publication or issue closure occurred. Suggested future manual commit: `feat(notifications): add explicit local task and weekly reminders`.

## Git review inventory

Final source HEAD remains `7313672dfd64ebb5884655ae9d881757b9a57d3d` on `main`, equal to the fetched `origin/main`. No staged changes. All listed modifications belong to #1; there was no pre-existing owner work. Existing ignored environment files were not edited; native iOS files are absent. This is ready for local owner review/commit, with push/build held for the documented external gates.

`git status --short --untracked-files=all`:

```text
 M CHANGELOG.md
 M apps/api/__tests__/tasks.test.ts
 M apps/api/package.json
 M apps/api/scripts/verify-local-tasks.mjs
 M apps/api/src/features/settings/settings.routes.ts
 M apps/api/src/features/settings/settings.service.ts
 M apps/api/src/features/settings/settings.types.ts
 M apps/api/src/features/tasks/task.service.ts
 M apps/api/src/features/tasks/task.types.ts
 M apps/api/src/features/tasks/task.validation.ts
 M apps/mobile/app.json
 M apps/mobile/package.json
 M apps/mobile/src/app/_layout.tsx
 M apps/mobile/src/app/settings/index.tsx
 M apps/mobile/src/features/commitments/commitment-date-time-fields.native.tsx
 M apps/mobile/src/features/commitments/commitment-date-time-fields.web.tsx
 M apps/mobile/src/features/inbox/inbox-item-action-sheet.tsx
 M apps/mobile/src/features/inbox/inbox-screen.tsx
 M apps/mobile/src/features/settings/settings-screen.tsx
 M apps/mobile/src/features/settings/settings.api.ts
 M apps/mobile/src/features/settings/settings.types.ts
 M apps/mobile/src/features/tasks/task-date-control.native.tsx
 M apps/mobile/src/features/tasks/task-date-control.types.ts
 M apps/mobile/src/features/tasks/task-date-control.web.tsx
 M apps/mobile/src/features/tasks/task-date-selection.tsx
 M apps/mobile/src/features/tasks/task.api.ts
 M apps/mobile/src/features/tasks/task.queries.ts
 M apps/mobile/src/features/tasks/task.types.ts
 M apps/mobile/src/features/week/week-task-details.tsx
 M docs/DEPLOYMENT.md
 M docs/IMPLEMENTATION_STATUS.md
 M docs/ROADMAP.md
 M package-lock.json
 M package.json
?? apps/api/__tests__/notification-settings.test.ts
?? apps/api/scripts/verify-notifications.mjs
?? apps/api/src/features/settings/notification-preferences.ts
?? apps/mobile/__tests__/notification-provider-test.tsx
?? apps/mobile/__tests__/notification-ui-test.tsx
?? apps/mobile/__tests__/notification-web-test.tsx
?? apps/mobile/__tests__/notifications-test.ts
?? apps/mobile/src/app/settings/notifications.tsx
?? apps/mobile/src/app/task.tsx
?? apps/mobile/src/features/notifications/notification-context.ts
?? apps/mobile/src/features/notifications/notification-module.ios.ts
?? apps/mobile/src/features/notifications/notification-module.ts
?? apps/mobile/src/features/notifications/notification-provider.tsx
?? apps/mobile/src/features/notifications/notification-reconciler.ts
?? apps/mobile/src/features/notifications/notification-routing.ts
?? apps/mobile/src/features/notifications/notification-settings-screen.tsx
?? apps/mobile/src/features/notifications/notification.service.ts
?? apps/mobile/src/features/notifications/notification.types.ts
?? apps/mobile/src/features/notifications/reminder-time.ts
?? apps/mobile/src/features/notifications/task-reminder-editor.tsx
?? apps/mobile/src/features/tasks/task-detail-screen.tsx
?? docs/issue-1-verification.md
?? supabase/migrations/20260914120000_add_notification_intent.sql
```

`git diff --stat` covers tracked modifications only; the 23 new files above are untracked and must also be reviewed. No staging was used to include them in the statistic.
