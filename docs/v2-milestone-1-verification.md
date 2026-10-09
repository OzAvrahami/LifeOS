# LifeOS V2 milestone 1 - issues #29 and #30

## Scope and baseline

Implementation baseline: `9b775df50b563f518464810ddf5e646b2087b67e`, main, following the owner-authorized no-tags fetch and clean fast-forward. The pre-existing untracked `design-reference/LifeOS-V2-Handoff/` is preserved. No implementation from the issue-creation instructions is repeated.

Read the owner handoff, including the account addendum. The prototype remains an in-memory reference, not a provider or planning contract. Browser/Computer Use review is blocked despite explicit owner authorization: the supported browser flow returns `Browser is not available: edge`; Windows Computer Use returned `Computer Use was not approved to use Microsoft Edge`. No alternate automation bypass was used. The prototype has been source-inspected, but rendered visual/interaction/RTL/narrow-screen/keyboard review remains pending.

## Reuse/change map

| Surface | Exact existing source | Reuse / bounded change |
| --- | --- | --- |
| Navigation | `apps/mobile/src/app/_layout.tsx`, `src/components/mobile-shell.tsx`, `src/components/bottom-navigation.tsx` | Keep Expo Router guards, stack and existing destinations; add V2 chrome and a Calendar route backed by existing local commitments. More remains reachable through the header. |
| Native theme | `apps/mobile/src/theme/tokens.ts` | Preserve the single existing token vocabulary and Assistant fonts. Add reference-derived light/dark palettes and persisted device system/light/dark preference via `theme-provider.tsx`; shared `components/v2.tsx` primitives. |
| Today | `apps/mobile/src/features/today/today-screen.tsx`, `today-task-summary.ts` | Retain historical development state previews; production index uses `v2-today-screen.tsx`. Preserve real data and command APIs; remove task-duration/capacity framing from the V2 Today presentation. |
| Tasks | `apps/mobile/src/features/tasks/task.queries.ts`, `task.api.ts`, `task-details.tsx`, `task-detail-screen.tsx` | Reuse account-scoped caches, existing completion/start/stop/reopen commands and detail editor. One identity across daily selection and dated tasks. |
| DailyPlan | `apps/mobile/src/features/planning/daily-planning.queries.ts`, `daily-planning-command.ts`, `daily-planning-session.tsx`, `daily-planning-view.tsx`, `planning.queries.ts` | Reuse durable draft/revision/approval and retry lifecycle plus explicit legacy focus selection. No ranking, recommendation reasons or next-day algorithm (#32). |
| Capture | `apps/mobile/src/features/capture/quick-capture-sheet.tsx`, `src/features/tasks/use-task-capture.ts` | Reuse title-only capture and existing save/cancel semantics; no mandatory duration or task slot. |
| Week | `apps/mobile/src/features/week/server-week-screen.tsx`, `week-day-view.tsx`, `weekly-planning-session.tsx` | Keep working week/day navigation and task/commitment editing. Full V2 Week migration and shared weekly approval remain #33/#32. |
| Calendar | `apps/mobile/src/features/commitments/commitment.queries.ts`, `commitment-editor.tsx`, `commitment-detail-screen.tsx` | Reuse actual LifeOS commitments and original times. Calendar entry links to Week for other dates. Explicitly unavailable Google/Apple connections; no provider icons or invented events. |
| Settings | `apps/mobile/src/features/settings/settings-screen.tsx`, `settings.components.tsx`, `account-screen.tsx`, `more-screen.tsx` | Preserve current preference and account paths; add actual appearance choice/account reset access. Full Settings migration remains #34. |
| Notifications | `apps/mobile/src/features/notifications/notification-provider.tsx`, `notification-reconciler.ts` | Preserve ownership-scoped scheduling, cleanup and existing preferences. No new categories or provider reminders. |
| Authentication | `apps/mobile/src/lib/supabase/client.ts`, `src/features/auth/auth-provider.tsx`, `auth-callback.ts`, `auth-callback-screen.tsx`, `auth-gate.ts`, `session-query-cache.tsx`, existing account screens | Extend the existing Supabase client/session system. Retain accounts, storage key and API ownership. Fix callback credential requirements, recovery lifecycle, provider-aligned validation and account actions. |
| Verification | `apps/mobile/__tests__/daily-planning-test.tsx`, `auth-ui-test.tsx`, `auth-infrastructure-test.tsx`, `task-query-cache-test.tsx`, `notification-provider-test.tsx` | Preserve lifecycle/ownership regression evidence; add meaningful V2 presentation, callback and session persistence tests. |

Paths abbreviated as `src/` in the table are relative to `apps/mobile/`.

## Legacy reconciliation and interfaces

#6 remains an unresolved capacity investigation; removing the V2 Today hours presentation is not a fix or acceptance of its calculation requirements. Preserve stored capacity/day-window values and APIs. #14's optional task hours/templates conflict with the current no-task-slot direction and require a later explicit product decision; neither implement nor close them here. Preserve #2/#5/#9 historical acceptance, explicit task importance and separate Weekly Focus semantics.

No new schema/API contract was needed for the original #29/#30 milestone. Existing authenticated requests, IDs, history, reminders and event times are reused. Google remains #17 (full bidirectional scope); Apple #31. The subsequent #32 implementation now shares this working tree and adds proposal ranking, next-day continuation and the joint weekly persistence contract; its API and migration are mandatory in the combined checkpoint. See [the #32 record](issue-32-verification.md). Full Week migration remains #33.

## Provider contract and limits

Local `supabase/config.toml` declares minimum password length 6, no character-class requirements and email confirmations disabled. This is local configuration, not proof of hosted configuration. The existing UI's minimum-eight and fixed-60-minute claims are unsupported and must not be carried forward. The hosted provider is authoritative for password acceptance; hosted configuration, redirect allowlist, email delivery and real callback acceptance remain external gates unless independently verified.

Official references reviewed: [password security](https://supabase.com/docs/guides/auth/password-security), [password authentication](https://supabase.com/docs/guides/auth/passwords), [React Native sessions](https://supabase.com/docs/guides/auth/quickstarts/react-native). Verify installed SDK bytes as well as documentation when implementing callbacks/storage.

## Release candidate

| Field | Value |
| --- | --- |
| SemVer impact | Minor: substantial compatible visual/account capability; both issues may share one future candidate |
| Proposed future candidate | 0.6.0 (10), compatible Minor grouping; not prepared or authorized |
| Candidate inventory gate | Recheck the owner's native artifacts before preparation; exceed every relevant known build |
| Version prepared | No; existing baseline remains 0.5.0 (9) |
| Native version synchronized | No; native files preserved |
| Physical build installed | Pending for this implementation |
| Owner accepted exact build | Pending; 0.5.0 (9) predates this implementation |
| Included issues | #29 and #30 in this record; the combined local checkpoint also includes #32 and its existing shared Week/day contract, not full #33 implementation |

No production mutation, provider configuration change, deployment, native build/install, tag or release is authorized. Complete the canonical pre-device gate in a later authorized task before requesting installation.

## Verification

Exact completed command results are recorded below. Mocks, source assertions and JavaScript exports do not establish rendered appearance, live provider behavior or physical acceptance.

| Executed check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Passed for API and mobile |
| `npm.cmd run lint` | Passed for API and mobile; no final warnings/errors |
| `npm.cmd test --workspace @lifeos/mobile -- --silent --json --outputFile=$env:TEMP/lifeos-v2-mobile-tests-final.json` | 53 suites passed; 366 passed, 0 failed, 1 platform-specific skipped test |
| `npm.cmd test --workspace @lifeos/mobile -- --config jest.task-date-android.config.js --silent` | 1 Android suite, 3 tests passed; covers the Android-only case skipped in the default platform run |
| `npm.cmd test --workspace @lifeos/api` | 13 suites, 96 tests passed |
| From `apps/mobile`: `npx.cmd expo export --platform ios --output-dir $env:TEMP/lifeos-v2-ios-js-final --max-workers 2` | Passed; 1,501 modules, Hermes JavaScript bundle; no native binary |
| From `apps/mobile`: `npx.cmd expo export --platform web --output-dir $env:TEMP/lifeos-v2-web-js-final --max-workers 2` | Passed; 1,122 modules; no deployment |
| `Invoke-WebRequest -UseBasicParsing http://localhost:8081/welcome` | HTTP 200; not rendered/interaction evidence |
| Preview launch follow-up: root `npm.cmd run web -- --port 8082`, then fetch `/welcome` and its script URL | Passed: workspace `src/app` selected, 1,209 modules bundled from `expo-router/entry.js`; page and JavaScript bundle HTTP 200. Port 8081 was occupied; no existing server was stopped. Rendering remains pending. |
| `git diff --check` | Passed |
| Existing dependency lock entries compared with HEAD | Preserved exactly; only the mobile SecureStore dependency and its new package entry added |
| Version/config review | All first-party versions remain 0.5.0; configured iOS build remains 9; existing footer contract preserved |

New tests exercise native storage migration/restart, Unicode size boundaries, failed writes, stale-plaintext logout protection, recovery-session isolation and restart, unproven/ambiguous/used callbacks, provider-authoritative validation, known internal return destinations, theme persistence, and real-query-hook Today actions/loading/error/retry/draft identity/event times/account change. Existing capture, task mutation/cache, planning, settings, notification and keyboard tests remain regression evidence. The API suite uses controlled adapters and includes ownership rejection; no production database was used.

Intermediate runs caught obsolete navigation/callback expectations, a missing mocked recovery-storage adapter and a capture-settings fixture that omitted query data. These were corrected without removing behavior assertions. Typecheck also caught stale generated route types and an SDK return type narrower than the installed runtime result; final checks pass. The mock-backed auth and native storage cases remain separate from hosted-provider and physical-device gates.

## Reviewable implementation

- Shared native V2 palette, typography, cards, buttons, notices, task rows and navigation. System/light/dark appearance persists through Settings. Hebrew RTL and LTR credential inputs are retained, with scrollable keyboard-aware forms and accessible password visibility controls.
- Today reads real account/timezone-scoped Tasks, existing daily planning state and LifeOS Commitments. Draft selections remain explicitly unapproved. Completion/reopen, start/stop, details, focus selection and capture reuse current commands. Stored estimates/capacity, priorities, reminders, history and event times are preserved. Center capture defaults to Inbox; the Today action explicitly targets Today.
- Calendar remains a tab showing today's actual LifeOS commitments, with access to Week for other dates. Provider availability is stated honestly. Existing Week, Inbox, planning sessions and detail editors remain reachable; their full visual migration belongs to later slices.
- Account access covers optional-name registration, verification waiting/resend, confirmation/onboarding, neutral recovery requests, SDK callbacks, reset/success/invalid links, account details/reset requests and confirmed logout. Returning sign-in bypasses onboarding and retains known internal destinations.
- Callbacks require a supported route and exactly one complete credential mechanism. Cached login alone is never callback evidence. Missing, duplicate, mixed and unsupported callback parameters are rejected. Web credential parameters are removed on success/error. Invalid links preserve unrelated valid sessions.
- Sign-in, immediate registration and callback success wait until the route guard observes the authenticated account. A delayed auth-state event is covered by a regression test; SDK return timing alone cannot prematurely redirect past confirmation/onboarding.
- Recovery restrictions persist across restart/token refresh using a credential-free account/sign-in-bound marker. Password updates require that matching recovery context. A logout retry after a successful update does not resubmit the password.
- Native sessions migrate the existing Supabase AsyncStorage key to SecureStore. Unicode-safe chunks and an atomic manifest preserve the previous durable value on write failure. Logout tombstones prevent stale plaintext resurrection; cleanup is retried on reads. Web retains the existing browser-storage contract. See [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) for platform limits/persistence. Adapter tests do not prove physical Keychain/Keystore behavior.
- Task, Commitment, settings and legacy-plan queries/mutations carry the account that initiated them through the existing token-account guard. Product drafts/editors remount on account changes. Existing query-cache clearing and notification ownership remain in place. Logout is local to this device; server data is retained.
- A provider-authenticated session survives API transport failure; product queries show their own retry states. Explicit API identity rejection/mismatch is not treated as successful login.

## Remaining acceptance gates

1. Render and interact with the prototype and implementation. Compare Today/auth, light/dark/system, 320/390 px widths, large text, mixed-direction content, keyboard, loading/error/empty states, capture and navigation. Fix observed mismatches. Source review is not visual acceptance.
2. Read the hosted password policy, email-confirmation setting, SMTP/template behavior and redirect allowlist. Verify real registration, email delivery, existing/unknown email responses, resend/rate limits, recovery/update, expired/used links and configured callbacks/app links. No live settings or test-account/password mutations were performed in this task.
3. Complete the canonical pre-device gate in a later authorized task. Accepted 0.5.0 (9) predates this work. Both native directories are absent in this Windows checkout; none were generated. SecureStore adds a native dependency/plugin. Recheck the owner's Mac artifacts, prepare/synchronize an authorized higher candidate, then verify existing-session migration, restart/refresh/expiry, recovery restart, logout/account switching, native storage failures, notifications, RTL and keyboard on that exact binary. No native build/install instructions are authorized yet.
4. The original #29/#30 slice introduced no schema. Its API tests use mocks/fakes and static migration assertions. The combined checkpoint now includes #32's API/schema changes and separate disposable-database/RLS evidence in [the #32 record](issue-32-verification.md). Hosted rollout, provider configuration, deployment and publication remain pending.

## Tracking

Readback: [#29](https://github.com/OzAvrahami/LifeOS/issues/29) and [#30](https://github.com/OzAvrahami/LifeOS/issues/30) are both **Open / In Progress** in [Project #2](https://github.com/users/OzAvrahami/projects/2). Priorities remain unset. Labels, assignees, milestones, membership and relationships are preserved. Foundations and initial regression checks preceded account work; #29 remains #30's prerequisite and has not been falsely closed. No issue was created or closed and no unrelated metadata was changed.

## Local preview

Start the development preview from the repository root using the workspace shortcut:

```powershell
Set-Location D:\code\LifeOS
npm.cmd run web -- --port 8082
```

Open `http://localhost:8082/welcome` for account access, or `/` with an existing valid account for real Today data. Running bare `npx expo start` at the repository root selects Expo's default `AppEntry.js` and fails to resolve `../../App`; the shortcut selects `apps/mobile` and its `expo-router/entry`. Stop a wrongly rooted server with Ctrl+C before reusing its port. The untracked root `tsconfig.json` observed after the failed launch is preserved and excluded from the checkpoint.

The existing ignored `.env` selects the configured Supabase/API endpoints; do not replace it or print its values. Development-only `/?preview=1` is an explicitly labeled fixture preview, never provider/data evidence. More > Settings > Appearance changes the persisted theme; More > Account offers details/reset/logout. Open the local `design-reference/LifeOS-V2-Handoff/prototype.html` directly in the authorized browser for comparison.

## Owner-managed checkpoint

Reconciled on **2026-10-09** against the actual working tree, index, saved verification logs and #29/#30/#32 issue bodies (all open, no comments). HEAD remains `9b775df50b563f518464810ddf5e646b2087b67e` on `main`, 0 ahead / 0 behind the existing `origin/main` ref; no new fetch was performed. The index is empty.

Use the [combined checkpoint manifest and owner commands](issue-32-verification.md#combined-owner-managed-checkpoint--2026-10-09): **98 explicit files**, comprising 71 tracked modifications and 27 new implementation/documentation files. The former mobile-only checkpoint is superseded because #32 overlaps this source and requires eight API files and `supabase/migrations/20261009120000_add_daily_proposals.sql`. The inventory below remains historical evidence for the original milestone, not the current combined staging list.

Current source timestamps are covered by the later #32 checks, including its focused mobile rerun and refreshed API/database checks. No additional source change or uncovered targeted check was identified; broad suites were not repeated. This reconciliation edits only the two verification records. `git diff --check` passes; untracked checkpoint files were also checked without staging. Protected handoff/environment/root-config hashes match the saved baseline. Ignored native directories remain absent.

Ready for the owner-managed local implementation checkpoint, with no identified local checkpoint blocker. Visual, hosted-provider, full integration and exact physical-device acceptance remain pending. Versions remain 0.5.0 (configured iOS build 9); proposed 0.6.0 (10) is still unprepared and unauthorized. No staging, commit, push, version change, schema application, build or deployment was performed. Hold deployment-triggering pushes until the authorized schema/API rollout sequence is completed.

## Changed-file inventory

Tracked modifications (65) and new implementation/documentation files (16), excluding the owner handoff directory and preserved untracked root `tsconfig.json`:

```text
M  CHANGELOG.md
M  apps/mobile/__tests__/auth-ui-test.tsx
M  apps/mobile/__tests__/commitment-reminder-ui-test.tsx
M  apps/mobile/__tests__/core-local-flow-test.tsx
M  apps/mobile/__tests__/daily-planning-test.tsx
M  apps/mobile/__tests__/inbox-screen-test.tsx
M  apps/mobile/__tests__/planning-query-cache-test.tsx
M  apps/mobile/__tests__/settings-product-integration-test.tsx
M  apps/mobile/__tests__/settings-screens-test.tsx
M  apps/mobile/__tests__/task-date-capture-test.tsx
M  apps/mobile/__tests__/task-server-flow-test.tsx
M  apps/mobile/__tests__/today-screen-test.tsx
M  apps/mobile/__tests__/week-navigation-test.tsx
M  apps/mobile/__tests__/week-screen-test.tsx
M  apps/mobile/__tests__/weekly-planning-lifecycle-test.tsx
M  apps/mobile/app.json
M  apps/mobile/package.json
M  apps/mobile/src/app/_layout.tsx
M  apps/mobile/src/app/account.tsx
M  apps/mobile/src/app/auth/callback.tsx
M  apps/mobile/src/app/commitment.tsx
M  apps/mobile/src/app/inbox.tsx
M  apps/mobile/src/app/index.tsx
M  apps/mobile/src/app/more.tsx
M  apps/mobile/src/app/settings/_layout.tsx
M  apps/mobile/src/app/sign-in.tsx
M  apps/mobile/src/app/sign-up.tsx
M  apps/mobile/src/app/task.tsx
M  apps/mobile/src/app/week.tsx
M  apps/mobile/src/app/welcome.tsx
M  apps/mobile/src/components/bottom-navigation.tsx
M  apps/mobile/src/components/mobile-shell.tsx
M  apps/mobile/src/features/auth/auth-api.ts
M  apps/mobile/src/features/auth/auth-callback-screen.tsx
M  apps/mobile/src/features/auth/auth-callback.ts
M  apps/mobile/src/features/auth/auth-errors.ts
M  apps/mobile/src/features/auth/auth-loading-screen.tsx
M  apps/mobile/src/features/auth/auth-provider.tsx
M  apps/mobile/src/features/auth/auth-validation.ts
M  apps/mobile/src/features/auth/auth.components.tsx
M  apps/mobile/src/features/auth/auth.types.ts
M  apps/mobile/src/features/auth/forgot-password-screen.tsx
M  apps/mobile/src/features/auth/reset-password-screen.tsx
M  apps/mobile/src/features/auth/sign-in-screen.tsx
M  apps/mobile/src/features/auth/sign-up-screen.tsx
M  apps/mobile/src/features/auth/verify-email-screen.tsx
M  apps/mobile/src/features/auth/welcome-screen.tsx
M  apps/mobile/src/features/capture/quick-capture-sheet.tsx
M  apps/mobile/src/features/commitments/commitment.api.ts
M  apps/mobile/src/features/commitments/commitment.queries.ts
M  apps/mobile/src/features/planning/daily-planning-view.tsx
M  apps/mobile/src/features/planning/planning.api.ts
M  apps/mobile/src/features/planning/planning.queries.ts
M  apps/mobile/src/features/settings/account-screen.tsx
M  apps/mobile/src/features/settings/more-screen.tsx
M  apps/mobile/src/features/settings/settings-screen.tsx
M  apps/mobile/src/features/settings/settings.api.ts
M  apps/mobile/src/features/settings/settings.components.tsx
M  apps/mobile/src/features/settings/settings.queries.ts
M  apps/mobile/src/features/tasks/task.api.ts
M  apps/mobile/src/features/tasks/task.queries.ts
M  apps/mobile/src/features/tasks/use-task-capture.ts
M  apps/mobile/src/lib/supabase/client.ts
M  package-lock.json
M  package.json
?? apps/mobile/__tests__/secure-session-storage-test.ts
?? apps/mobile/__tests__/v2-auth-lifecycle-test.tsx
?? apps/mobile/__tests__/v2-foundation-test.tsx
?? apps/mobile/__tests__/v2-theme-test.tsx
?? apps/mobile/__tests__/v2-today-integration-test.tsx
?? apps/mobile/src/app/auth/confirmed.tsx
?? apps/mobile/src/app/auth/invalid.tsx
?? apps/mobile/src/app/calendar.tsx
?? apps/mobile/src/components/v2.tsx
?? apps/mobile/src/features/auth/auth-destination.ts
?? apps/mobile/src/features/auth/recovery-state.ts
?? apps/mobile/src/features/settings/appearance-setting.tsx
?? apps/mobile/src/features/today/v2-today-screen.tsx
?? apps/mobile/src/lib/supabase/session-storage.ts
?? apps/mobile/src/theme/theme-provider.tsx
?? docs/v2-milestone-1-verification.md
```
