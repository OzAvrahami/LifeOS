# Issue #1 — Notifications MVP verification

## Current candidate — 2026-09-22

**LifeOS 0.4.0 (7)** is prepared, compiled, and **not installed or owner-accepted**. #1 remains **Open / Verify / P2 — Medium**. Clean starting `main` was `5d93b92` (Xcode 27 correction), one local commit ahead of fetched `origin/main` at `aba01ce`; that checkpoint is preserved. This extends #1, not another issue. Published Latest and last accepted binary remain **v0.3.0 / 0.3.0 (4)**.

### Physical findings and candidate history

- **Build 5:** built/installed, failed native launch (scene creation / SIGTRAP); never accepted.
- **Build 6:** built/installed, successfully survived native startup with the supported UIScene fix. This was a valid startup-compatible candidate, **not a failed build**. During owner acceptance, Task reminder discovery was too indirect and Commitments lacked reminders. It was superseded before final product acceptance, not accepted.
- **Build 7:** incorporates both findings below. Same Notifications MVP / Minor candidate 0.4.0; a changed binary must not reuse build 6. Compilation is not installation, notification delivery, or owner acceptance.

### Implemented product changes

- Today normal/active/completed Task lists, Week/day and week-only Tasks, and Inbox expose a visible details/reminder action. They use the shared `tasks/task-details.tsx` and existing Task reminder editor; start/completion and title/date/status actions remain available. **הזכר לי** keeps exact date/time semantics. Quick Capture remains title/date capture without reminder fields; no Task start-time scheduling was added.
- Commitment editor adds **תזכורת**: none, at start, 5/15/30/60 minutes before, or custom integer **0–1440**. Start-only commitments work. The selected lead is visible before saving; editing adds/changes/clears it.
- Settings adds Commitment reminders (safe default **off**) and a default lead (**15 minutes**). Only interactive creation while this category is enabled preselects the account default; existing and API-created commitments remain null unless explicitly changed. Master/category off preserves intent, unschedules local requests, and re-enable restores eligible future requests.
- A commitment stores a relative lead, not a reminder instant: 12:37 minus 15 minutes is 12:22; moving start to 13:30 reschedules to 13:15. Date moves likewise cancel/recreate. Clearing/deleting cancels. Past calculated times are visibly warned in the editor, retained as intent, and never replaced with “now” or an invented time.
- Local notification time derives from the **displayed device-local commitment date/start time**. Each reconciliation on foreground/restart recomputes after timezone changes. Nonexistent DST wall times are not normalized into invented starts; ambiguous repeated times use JavaScript's earlier occurrence. Provider timezone identity remains #17 scope.
- One central reconciler loads preferences, Tasks and Commitments; failed snapshots do not become empty lists. Task and Commitment requests compete by actual upcoming fire time, with capacity reserved for the enabled Weekly reminder and unrelated requests. Deferred reporting, serialized operations, revision protection, deduplication, logout/account cleanup remain intact.
- Commitment taps resolve `/commitment?id=...` by current identity, then reuse the existing Commitment editor. Changed dates load current data; missing/deleted commitments show an unavailable notice. Content is a generic Hebrew title plus Commitment title; metadata contains only owner/user/kind/ID, never descriptions.

### Schema and compatibility

New forward migration: [`20260922120000_add_commitment_reminders.sql`](../supabase/migrations/20260922120000_add_commitment_reminders.sql), after `20260914120000_add_notification_intent.sql`.

| Table | Added fields / constraints |
| --- | --- |
| `commitments` | Nullable `reminder_minutes_before smallint`, checked 0–1440; partial caller/date/start/ID reminder index |
| `user_settings` | `commitment_reminders_enabled boolean NOT NULL DEFAULT false`; `commitment_default_reminder_minutes smallint NOT NULL DEFAULT 15`, checked 0–1440 |

No IDs, RLS policies, grants, history or existing reminder intent are rewritten. Old clients can omit new fields; old notification preference patches preserve new values. The server never applies account defaults to commitment creation. API create/read/update/clear validates integer range. `GET /commitments?id=...` supports routing; `?reminders=true` pages in batches of 500 with stable date/start/ID ordering, including datasets above 1,000 rows. No opaque Expo identifier is persisted.

### Current automated and native verification

| Command/check | New result for build 7 |
| --- | --- |
| Focused mobile notification/footer/entry-point command below | **8 suites / 57 passed**, no skips/failures |
| `npm run test --workspace @lifeos/mobile` | **47 suites / 310 passed / 1 existing Android-only skip**, no failures |
| `npm run test --workspace @lifeos/api` | **11 suites / 86 passed**, no skips/failures |
| `TZ=America/New_York npm run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/commitment-notifications-test.ts` | **1 suite / 8 passed**, including local DST gap/fall-back construction |
| `npm run test:integration:local --workspace @lifeos/api` with OrbStack Docker on PATH | **13 PASS groups**, real disposable PostgreSQL/Auth/caller/anonymous RLS; includes lead/default constraints, old-client preservation, update/clear/start-only fields and 1,001-row pagination |
| `npm run typecheck`; `npm run lint` | API/mobile passed |
| Production Expo config | **0.4.0 (7)**; scene support true; native Railway HTTPS endpoint matches; public Supabase config present |
| `npx --no-install expo export --platform ios --output-dir /tmp/lifeos7-ios-export` from mobile | Passed, one Hermes bundle; production mode, dotenv disabled and process-only non-service placeholders |
| `npx --no-install expo-modules-autolinking verify --platform ios` from mobile | Passed; no duplicates |
| Signed Xcode 27 Release compile below | **BUILD SUCCEEDED**; compile only, no device installation/launch |

```bash
npm run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/notifications-test.ts __tests__/notification-ui-test.tsx __tests__/notification-provider-test.tsx __tests__/notification-web-test.tsx __tests__/app-version-footer-test.tsx __tests__/commitment-notifications-test.ts __tests__/commitment-reminder-ui-test.tsx __tests__/task-reminder-discovery-test.tsx
# From apps/mobile/ios; compile only:
NODE_ENV=production xcodebuild -workspace LifeOS.xcworkspace -scheme LifeOS -configuration Release -destination 'generic/platform=iOS' -derivedDataPath /tmp/lifeos7-release build
```

The existing local stack was started and pending migrations applied **locally only**, without database reset. The harness creates/cleans disposable Auth users. No remote migration, production data access/mutation, API deployment or new physical-device verification occurred. Mocked notification/DST tests establish calculations and boundary behavior, not actual iOS delivery. Earlier online Expo patch advisories below remain separate; dependency versions were deliberately unchanged and the online dependency check was not repeated for this feature extension.

### Native preservation and rollout gate

Expo **57.0.23**, build-properties **57.0.20**, Notifications **57.0.12**, React Native **0.86.2** and all dependency resolutions are unchanged. `ios.enableSceneSupport=true`, generated `EXExpoAppSceneDelegate` / factory-provider setup, signing, entitlements and Pods are preserved. No prebuild, pod installation or regeneration was needed. Native metadata was backed up outside the repository before changing only plist `CFBundleVersion` and both `CURRENT_PROJECT_VERSION` values **6 → 7**; semantic values remain **0.4.0**. Native/environment files remain ignored and environment contents unchanged.

[Current GitHub handoff](https://github.com/OzAvrahami/LifeOS/issues/1#issuecomment-5774740359) read back as Open / Verify / P2 — Medium; original issue metadata and all Project items are unchanged. Local link/anchor validation and `git diff --check` pass; environment hashes and native backup comparisons confirm preservation.

**Production stop:** migration `20260922120000` has not been applied remotely. Prior build-6 rollout evidence concerns the older schema/API only. After owner review: local Git checkpoint → inspect all pending remote migrations → dry run → explicitly authorized schema application → remote history verification → API push/deployment success → authorized build/install **0.4.0 (7)** → owner acceptance. Do not install the new candidate against the older API/schema. No publication is authorized.

### Build-7 review inventory

All paths below belong to this extension. The old Week Task Details file moves to the shared Tasks feature; Git currently shows its unstaged deletion and new destination separately. No files are staged. Ignored native build-number changes are separate from this tracked/new-file inventory.

```text
CHANGELOG.md
apps/api/__tests__/commitments.test.ts
apps/api/__tests__/notification-settings.test.ts
apps/api/scripts/verify-commitment-reminders.mjs
apps/api/scripts/verify-local-tasks.mjs
apps/api/scripts/verify-notifications.mjs
apps/api/src/features/commitments/commitment.service.ts
apps/api/src/features/commitments/commitment.types.ts
apps/api/src/features/commitments/commitment.validation.ts
apps/api/src/features/settings/notification-preferences.ts
apps/api/src/features/settings/settings.service.ts
apps/api/src/features/settings/settings.types.ts
apps/mobile/__tests__/commitment-keyboard-test.tsx
apps/mobile/__tests__/commitment-keyboard-web-test.tsx
apps/mobile/__tests__/commitment-notifications-test.ts
apps/mobile/__tests__/commitment-reminder-ui-test.tsx
apps/mobile/__tests__/commitment-time-picker-test.tsx
apps/mobile/__tests__/notification-provider-test.tsx
apps/mobile/__tests__/notification-ui-test.tsx
apps/mobile/__tests__/task-reminder-discovery-test.tsx
apps/mobile/app.json
apps/mobile/src/app/_layout.tsx
apps/mobile/src/app/commitment.tsx
apps/mobile/src/features/commitments/commitment-detail-screen.tsx
apps/mobile/src/features/commitments/commitment-editor.tsx
apps/mobile/src/features/commitments/commitment.api.ts
apps/mobile/src/features/commitments/commitment.queries.ts
apps/mobile/src/features/commitments/commitment.types.ts
apps/mobile/src/features/inbox/inbox-item-action-sheet.tsx
apps/mobile/src/features/inbox/inbox-screen.tsx
apps/mobile/src/features/notifications/commitment-reminder-time.ts
apps/mobile/src/features/notifications/notification-provider.tsx
apps/mobile/src/features/notifications/notification-reconciler.ts
apps/mobile/src/features/notifications/notification-routing.ts
apps/mobile/src/features/notifications/notification-settings-screen.tsx
apps/mobile/src/features/notifications/notification.types.ts
apps/mobile/src/features/notifications/reminder-lead-picker.tsx
apps/mobile/src/features/settings/settings.api.ts
apps/mobile/src/features/tasks/task-detail-screen.tsx
apps/mobile/src/features/tasks/task-details-button.tsx
apps/mobile/src/features/tasks/task-details.tsx
apps/mobile/src/features/today/active-state.tsx
apps/mobile/src/features/today/partially-completed-state.tsx
apps/mobile/src/features/today/today-screen.tsx
apps/mobile/src/features/today/today.components.tsx
apps/mobile/src/features/week/server-week-screen.tsx
apps/mobile/src/features/week/week-task-details.tsx
apps/mobile/src/features/week/week.components.tsx
docs/DEPLOYMENT.md
docs/IMPLEMENTATION_STATUS.md
docs/ROADMAP.md
docs/issue-1-verification.md
supabase/migrations/20260922120000_add_commitment_reminders.sql
```

## Xcode 27 launch correction — 2026-09-22

**Historical build-6 checkpoint:** the following describes its original preparation/verification. It was subsequently committed as `5d93b92` and superseded by build 7 after the owner findings above. Then-current/uncommitted/pending statements are retained as historical evidence, not current instructions.

Current candidate: **LifeOS 0.4.0 (6)**. Issue #1 remains **Open / Verify / P2 — Medium**; notification acceptance is pending. Source baseline: `aba01cefa4997843cd8fa687a4792971c1d946fc`, clean `main` equal to `origin/main` after the authorized fetch. The compatibility changes are uncommitted. [Current GitHub handoff](https://github.com/OzAvrahami/LifeOS/issues/1#issuecomment-5773875628) was read back with Open / Verify / P2, original labels/assignees/milestone/membership and all other Project items unchanged.

**Failed physical candidate — owner-reported:** 0.4.0 (5) built and installed successfully on an iPhone 17 Pro Max using Xcode 27, but terminated immediately at launch. The reported console sequence was process startup, UNUserNotificationCenter initialization, SpringBoard scene-creation failure, then native SIGTRAP before normal React/Expo UI startup. Build 5 failed launch acceptance and was **never owner-accepted**. Build 6 identifies a changed binary; the repository policy forbids reusing build 5. The last accepted binary remains 0.3.0 (4).

The evidence matches [Expo's Xcode 27 / iOS 27 UIScene issue](https://github.com/expo/expo/issues/46664). UIKit requires the scene lifecycle with the new SDK; the previous native project had no scene manifest and created its window from AppDelegate. Notification-center initialization is not itself evidence of a Notifications defect. Older SDK/OS combinations and JavaScript tests/exports do not exercise this new native requirement; the upstream failure also occurs on iOS 27 simulators, so simulator success on another environment cannot establish physical compatibility.

### Supported dependency and native changes

- Installed the minimum documented SDK 57 fix through Expo tooling: `expo` **57.0.14 → 57.0.23**, added `expo-build-properties` **57.0.20**, and enabled `ios.enableSceneSupport`. React **19.2.3**, React Native **0.86.2**, Notifications **57.0.12**, product version **0.4.0**, bundle identifier and existing explicit plugins are retained. The lockfile includes required Expo tooling/transitive resolutions, including ExpoModulesCore **57.0.18**, asset **57.0.18**, constants **57.0.19**, file-system **57.0.7**, font **57.0.4** and autolinking **57.0.13**; it is not a claim that every old transitive resolution stayed fixed. No SDK 58 or unrelated direct dependency upgrade.
- Complete native backup: `/tmp/lifeos-ios-before-scene-support-dwd1lc5w/ios`. The first prebuild invocation used this CLI's default regeneration; the entire original project was restored from that backup before rerunning the supported **`--no-clean`** path. The discarded generated attempt is separately retained under `/tmp/lifeos1-scene-initial-generated-ios`.
- Reconciliation ran **from `apps/mobile`**, with `CI=1 npx --no-install expo prebuild --platform ios --no-clean --no-install --skip-dependency-update react,react-native`. Generated Info.plist now declares `UIApplicationSceneManifest` / `EXExpoAppSceneDelegate`; AppDelegate conforms to `ExpoReactNativeFactoryProvider` and no longer creates/starts the legacy window. No custom SceneDelegate was written.
- Readback verifies plist **0.4.0 / 6** and both Debug/Release `MARKETING_VERSION=0.4.0`, `CURRENT_PROJECT_VERSION=6`. Original signing team, automatic signing, bundle ID, provisioning settings, schemes, icons and permissions are preserved. Expo build-properties added its standard precompiled-module/privacy/static-link properties.
- Expo's implicit notifications prebuild plugin added `aps-environment` even without an explicit plugin entry. The original entitlements were restored exactly after checking that this was the only semantic difference. Local notifications need no APNs entitlement, custom sounds or remote background mode. Future prebuilds must repeat this entitlement review; do not restore the old AppDelegate/Info.plist over the scene fix.
- Initial `pod install` exposed stale local podspec locks. Targeted `pod update Expo ExpoModulesCore ExpoModulesWorklets ExpoFileSystem ExpoFont ExpoAsset EXConstants --no-repo-update` succeeded: **110 pods / 111 Podfile dependencies**. Podfile.lock equals Pods/Manifest.lock. ExpoNotifications **57.0.12** and React-Core **0.86.2** remain linked; iOS autolinking reports no duplicates. Native files stay ignored.

### Historical build-6 verification

| Check | Result on this Mac |
| --- | --- |
| `npm run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/notifications-test.ts __tests__/notification-provider-test.tsx __tests__/notification-ui-test.tsx __tests__/notification-web-test.tsx __tests__/app-version-footer-test.tsx` | **5 suites / 36 tests passed**, no skips/failures |
| `npm run test --workspace @lifeos/mobile` | **44 suites / 289 passed / 1 existing Android-only skip**, no failures |
| `npm run test --workspace @lifeos/api` | **10 suites / 83 passed**, no skips/failures |
| `npm run typecheck`; `npm run lint` | API/mobile passed |
| Production Expo config evaluation | **0.4.0 (6)**, scene opt-in and all prior explicit plugins retained |
| `npx --no-install expo-modules-autolinking verify --platform ios` and `resolve --platform ios --json` (mobile directory) | Passed; one ExpoNotifications 57.0.12 module, no duplicates |
| `npx --no-install expo export --platform ios --output-dir /tmp/lifeos1-scene-ios-export` (mobile directory, production / dotenv disabled / process-only placeholder API and public Supabase values) | Passed: one Hermes bundle; no environment files changed |
| `CI=1 npx --no-install expo install --check` (mobile directory) | **Advisory failure**: recommends Expo 57.0.24, build-properties 57.0.21, dev-client 57.0.19, linking 57.0.10, notifications 57.0.20, router 57.0.22, splash-screen 57.0.9, React Native 0.86.3, eslint-config-expo 57.0.2, jest-expo 57.0.5. No exclusions hide it; minimum supported scene patch retained to limit scope. |
| `git diff --check`; modified-document local links/anchors; version/environment preservation checks | Passed; 40 local links checked, zero missing paths/anchors; product versions unchanged, environment hashes unchanged |
| Xcode 27.0 (27A266a), iPhoneOS 27.0 signed Release | **BUILD SUCCEEDED**; built plist 0.4.0 / 6, scene manifest/classes, production API bundle and code signature verified; no APNs entitlement |
| Physical install / launch with `xcrun devicectl` | **Passed installation and launch** on the connected physical iPhone running iOS 27.0; installed metadata reads 0.4.0 / 6. Same LifeOS process (PID 19850) observed at 22 and 63 seconds after launch. |

Release compilation ran from `apps/mobile/ios`:

```bash
NODE_ENV=production xcodebuild -workspace LifeOS.xcworkspace -scheme LifeOS -configuration Release -destination 'generic/platform=iOS' -derivedDataPath /tmp/lifeos1-scene-release build
```

The signed artifact at `/tmp/lifeos1-scene-release/Build/Products/Release-iphoneos/LifeOS.app` was installed with `xcrun devicectl device install app --device <connected-device> <artifact>`, then launched with `xcrun devicectl device process launch --device <connected-device> il.co.ozavrahami.lifeos`. Filtered device process and installed-app readbacks confirmed continued process existence and version/build. This independently observed startup survival does **not** establish visible UI quality, standalone disconnected operation, actual notification delivery or owner acceptance. No visual device inspection, user-data mutation or notification acceptance scenario was performed. At that checkpoint, owner notification acceptance remained pending. Build 6 was subsequently superseded; the current checklist applies to build 7 after rollout.

No API/schema code changed, so the previously passing 12-group disposable database run below was not repeated. Dependency installation also reported 21 npm audit findings (15 moderate, 6 high); no broad audit-fix operation was performed. Passing software checks are not physical notification acceptance.

**Read-only rollout evidence, 2026-09-22:** linked remote migration history includes `20260914120000`; GitHub's `LifeOS - @lifeos/api` status for `aba01cefa4997843cd8fa687a4792971c1d946fc` is success (updated 2026-09-14T20:45:07Z). Live GET `/health` returned the actual contract `{ "service": "lifeos-api", "status": "ok" }`. This is migration history plus historical GitHub deployment status/live health, not direct Railway active-deployment inspection or proof of writes/RLS/notification delivery. No migration was applied or production data mutated here. Production native configuration matches the documented Railway HTTPS endpoint, public Supabase configuration is present, and Release routes use normal server/authentication behavior. No preview or local API override is selected.

The sections explicitly labelled historical below preserve the original Windows implementation evidence. Their then-pending native/rollout statements do not override this correction.

## Scope and baseline — historical implementation, 2026-09-14

Issue: [#1 — Feature: Notifications MVP](https://github.com/OzAvrahami/LifeOS/issues/1). Implementation date: 2026-09-14. Baseline: `main`, `7313672dfd64ebb5884655ae9d881757b9a57d3d` (`docs(release): record v0.3.0 publication`), equal to `origin/main` after the explicitly authorized fetch. The worktree was clean. Existing ignored API/mobile environment files were inventoried and preserved. No implementation of another issue is included.

The approved first slice provides local iOS permission management, notification Settings, explicit Task reminders, one recurring Weekly Planning reminder, persistence, reconciliation and tap routing. Start-of-day summaries, missed-task reminders, end-of-day summaries and smart suggestions are deferred; they have no active controls or automatic behavior. Remote push, tokens, APNs backend, Firebase, OneSignal, analytics, Google Calendar and automatic reminder timing remain out of scope.

## Product behavior — historical first slice, 2026-09-14

- All three notification preferences default off. Saving an enabled master preference or saving an active Task reminder requests permission contextually, after server persistence. Opening the app/Settings does not prompt. Only alert permission is requested; sound and badge are off. Allowed, not-requested, blocked and unsupported-platform states are explicit. Blocked permission exposes Hebrew guidance and iOS Settings; it never erases preferences or Task reminders. Re-enabling permission is picked up on resume.
- Settings stores master, task category, weekly category, weekday and exact local `HH:mm`. Turning a preference off unschedules relevant LifeOS requests on the device, retaining all reminder configuration. Weekly enablement requires an explicit weekday and time. No notification time is invented.
- Existing Task creation is Quick Capture; it remains lightweight. After capture, Inbox actions and Week/day Task details expose **הזכר לי** for set/edit/clear. The task API also supports an explicit reminder at creation. Notification taps reuse the same Task detail component through an authenticated `/task?id=...` route, including Inbox or completed tasks. Missing/cancelled/invalid IDs show an unavailable message; no replacement task is created.
- The reminder editor uses the existing date and precise time controls. The date picker is labelled as a reminder date rather than a planning date. iOS wheel changes remain drafts until confirmation; cancellation, unmount and clearing discard stale callbacks. Web notification time inputs use a 60-second step, preserving the existing 900-second commitment default. There is no automatic duration or planned/due-date conversion.
- Local date/time selection is converted once with local `Date` construction to an ISO timestamp representing an explicit instant. Reopening uses local date/time getters. Exact minutes survive same-timezone save/reopen. Past, missing and invalid values are rejected before saving and by the API. Nonexistent DST local times are rejected; an ambiguous repeated local time uses JavaScript's earlier occurrence. Changing device timezone changes the displayed local equivalent of a Task instant, not its stored instant. Editing unrelated fields of a historical/past reminder remains possible.
- Task completion/cancellation/deletion unschedules reminders while retaining persisted intent/history. Reopening schedules only an eligible future reminder. Planned date, due date, title/description and progress retain their independent meanings. A task without explicit `reminderAt` never schedules a reminder.

## Storage and API — historical first slice, 2026-09-14

Forward migration: [`20260914120000_add_notification_intent.sql`](../supabase/migrations/20260914120000_add_notification_intent.sql).

| Existing table | Added fields |
| --- | --- |
| `tasks` | Nullable finite `reminder_at timestamptz`, exposed as `reminderAt` |
| `user_settings` | `notifications_enabled`, `task_reminders_enabled`, `weekly_planning_reminder_enabled` (default false); nullable `weekly_planning_reminder_weekday` (0–6, Sunday=0), `weekly_planning_reminder_time` (exact minute, less than 24:00) |

Weekly enablement requires weekday/time. Existing rows and old clients retain safe defaults. The response groups preferences under `notifications`. `PATCH /settings` accepts that complete five-field preference group and an initial IANA timezone used only when creating an absent settings row. It preserves existing timezone, week-start, Day Window and capacity. Existing `PUT /settings` preserves notification columns. Future categories can extend this same group with forward-compatible defaults; no parallel settings system was created.

Task create/update supports setting or clearing explicit future timestamps. Unrelated updates never rewrite reminders. `GET /tasks?id=...` reuses caller-scoped list access for detail routing. `GET /tasks?reminders=true` returns active reminder-bearing tasks, paging in batches of 500 beyond PostgREST's response limit before local reconciliation. A failed fetch is never treated as an empty snapshot.

No opaque Expo IDs enter shared storage. Existing RLS, ownership, IDs and history are preserved. All local integration fixtures belong to disposable Auth users and are cleaned by the existing guarded harness.

## Device architecture — historical first slice, 2026-09-14

The `features/notifications` module separates permission/service, desired-state reconciliation, routing, provider, context and UI. iOS platform module resolution imports Expo Notifications; Web/Android support intent configuration without claiming notification delivery in this first iOS slice.

`NotificationProvider` reconciles authenticated bootstrap, session changes, foreground/resume and successful Task/Settings cache changes. Snapshot requests capture the initiating session token. Device operations are serialized; a revision invalidates older snapshots. Network waits do not block logout cleanup. Scheduling identifiers encode owner, item and intended time locally; discovery uses the LifeOS ownership marker. Existing matching requests are retained, obsolete/duplicate requests cancelled and missing future requests scheduled. Partial native failures remain retryable through fresh discovery, with a visible Settings sync error. Previous-user scheduled and delivered LifeOS notifications are removed on logout/account switch. Unrelated notifications are preserved.

The application limits pending requests to 64 including unrelated requests, reserves the weekly reminder first, then prioritizes the earliest Task instants. Overflow remains persisted, is disclosed in Settings and is reconsidered at reconciliation. The app does not claim unscheduled overflow is queued by iOS.

Weekly reminders use Expo's repeating weekday/hour/minute trigger. The persisted Sunday=0 convention converts to Expo Sunday=1. Matching installed 57.0.12 types and `ios/ExpoNotifications/Notifications/TriggerRecords.swift` confirm `UNCalendarNotificationTrigger` with weekday/hour/minute and no fixed timezone. iOS owns local wall-clock/DST matching. No Weekly Plan needs to exist; tapping navigates to Week without starting or mutating a plan. See [Expo SDK 57 notification documentation](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/).

Task notification content contains a generic Hebrew title and the real Task title; data contains only ownership/routing identifiers. Foreground display deliberately permits banner/list for the active account, without sound/badge. Background and cold-start responses share a deduplicating router; a later weekly occurrence can navigate again. Listeners and handlers are cleaned on unmount, and foreign-account taps are ignored.

Reminder intent/preferences are account state. Each signed-in iPhone reconciles independently. There is no remote delivery or cancellation on a device that has not synced a change. iOS can deliver already scheduled requests while LifeOS is closed; force-closing does not run new reconciliation. Offline edits elsewhere, logout on another device and device capacity cannot be solved by this local-only MVP. System Focus/permission settings may affect presentation. Physical timezone/DST and closed-app delivery checks remain pending.

## Native dependency and preparation — historical, 2026-09-14

Added **`expo-notifications` 57.0.12**, pinned to the version in installed Expo 57.0.14's bundled compatibility manifest; added transitive `expo-application` 57.0.3 and `badgin` 1.2.3. All pre-existing locked dependency versions/resolutions are preserved. The initially selected 57.0.18 required duplicate native `expo-constants`; that intermediate installation was replaced. Final iOS autolinking verification reports no duplicates.

No notification config plugin was added: the installed plugin adds an APNs entitlement, while this slice uses local alerts, no custom sounds, no remote background mode and no push registration. Native modules require normal CocoaPods synchronization on the existing Mac project before a later authorized binary build. No prebuild/regeneration, bundle identifier, signing, native settings or production configuration changed.

**Native preparation limitation:** this Windows checkout has no `apps/mobile/ios`, CocoaPods or Xcode. The documented Mac checkout is not accessible in this session. No ignored iOS file was changed or fabricated; native version synchronization and Pods validation remain explicit external gates. This record is not an instruction to build/install before those gates and schema/API rollout are complete.

## Automated verification — historical, 2026-09-14

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
| SemVer impact | Minor: same Notifications MVP candidate, expanded within #1 |
| Candidate version | LifeOS 0.4.0 |
| Candidate iOS build | **7**; supersedes startup-compatible but unaccepted build 6 |
| Version prepared | Yes: root/API/mobile/lock semantic 0.4.0 retained; app.json build 7 |
| Native version synchronized | Yes: ignored plist and Debug/Release **0.4.0 / 7**, scene/signing/Pods preserved |
| Physical build installed | **Pending for build 7**; build 5 failed launch; build 6 launched successfully but was superseded |
| Owner accepted exact build | **Pending; no 0.4.0 candidate has been owner-accepted** |
| Included issues | #1 Notifications MVP; `aba01ce` + preserved `5d93b92` scene checkpoint + this extension |

## Owner acceptance — pending

Only after the new migration/API rollout, use disposable records in an approved account on **LifeOS 0.4.0 (7)**:

- [ ] Confirm visible 0.4.0 (7), normal authenticated standalone launch, no unsolicited prompt; verify allowed/not-requested/denied guidance, contextual permission and iOS Settings/resume.
- [ ] Today, Week/day, week-only and Inbox Task actions reach the shared details / **הזכר לי**. Set 09:17, edit/cancel/clear/save/reopen; preserve title/planned date/deadline/status/start/completion. Quick Capture remains lightweight.
- [ ] Settings Commitment category initially off; enable and inspect default 15, each preset/custom 0–1440. New creation uses the enabled default; existing commitments do not gain reminders. Save/reopen start-only and end-time commitments, change/remove the lead.
- [ ] Verify real delivery at start minus lead. Move start/date (including midnight boundary) and confirm old schedules disappear; clear/delete cancels. A past computed reminder warns without silently changing the lead or scheduling now.
- [ ] Test foreground/background/closed-app delivery and taps for Tasks, Commitments and Weekly. Commitment taps open the same editor with the latest date; deleted/stale records are safe.
- [ ] Disable/re-enable master and each category without losing intent. Repeat saves/foreground/restart, recover offline/denied permission, and verify no duplicates. Task complete/cancel/reopen retains existing rules.
- [ ] Weekly weekday/exact-time changes and Week routing work without a plan. Change device timezone and inspect recalculated local Commitment schedules; separately check DST-sensitive cases and Task instant semantics. Check Hebrew RTL, keyboard, touch and scrolling.
- [ ] Logout/account switch removes prior-account LifeOS pending/delivered requests while unrelated requests remain. Capacity overflow lists deferred reminders and prioritizes nearest Task/Commitment times together; each device reconciles independently.
- [ ] Record exact installed build and explicit owner approval. Compilation/mocks/exports do not complete acceptance or authorize Done/closure.

## Rollout and manual Git checkpoint — historical, 2026-09-14

Final GitHub readback: **Open / Verify / P2 — Medium**, existing item `PVTI_lAHOAgE74M4BhLsqzg3oDwc`; feature/mobile labels, empty assignees, no milestone and membership preserved. [Verified handoff comment](https://github.com/OzAvrahami/LifeOS/issues/1#issuecomment-5664472014). The issue body reflects the approved first slice and truthful Release / Build gate; physical acceptance remains unchecked. Verify is justified by completed software/automated scope with the explicit external gates documented above, not native or production acceptance.

After review, the owner controls staging and a local commit. **Hold the deployment-triggering push.** Follow [the canonical schema order](DEVELOPMENT_WORKFLOW.md#database--api-rollout): inspect every linked pending migration and dry run, explicitly authorize schema application, verify remote history, then authorize API push/deployment and verify the compatible API. Migration `20260914120000` has not been applied remotely in this task. Earlier local baseline migrations 20260906120000 and 20260913120000 were applied only to the local stack before this gate; this is not evidence of remote pending history.

Complete native version/Pods preparation on the existing Mac project and validate preserved settings before any separately authorized iPhone build. No staging, commit, push, remote migration, deployment, native build/install, tag, release publication or issue closure occurred. Suggested future manual commit: `feat(notifications): add explicit local task and weekly reminders`.

## Git review inventory — historical, 2026-09-14

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
