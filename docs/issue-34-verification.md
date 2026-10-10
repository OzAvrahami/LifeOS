# V2 Settings and notification controls — #34 / #26 / #27

## Current 2.0.0 device-test preparation - 2026-10-10

The owner-selected **LifeOS 2.0.0 (10)** is now prepared in tracked metadata over `3310f96bbdfd9c8d46816c4a3f8cbea03ddcf42d`. Exact-source Railway deployment and its variable snapshot are verified; all 14 hosted migrations were already verified. **Mac-native synchronization, build/install and exact iPhone acceptance remain pending.** The available records support build 10; current Mac artifacts must still be checked before use. See [deployment evidence, checks and Mac handoff](release-2.0.0-verification.md).

This supersedes earlier proposed 0.6.0/current-0.5.0 and pending-checkpoint/rollout statements only for current preparation status. Dated implementation/acceptance evidence below remains historical and retains its original scope; local web review does not accept a physical binary. No issue state or Project status is advanced by this preparation.

## Owner visual acceptance and checkpoint preparation — 2026-10-09

The owner accepted the **appearance of the reviewed Settings screens in the local web preview**. This is owner-reported visual acceptance only. It does not attest to additional manual functional checks, a complete viewport/theme/accessibility matrix, restart/account-switch behavior, notification permissions or delivery, hosted Auth/email/callback, calendar providers, production rollout or physical-device acceptance. The agent's earlier browser-access limitation remains an accurate record of independent verification. Earlier pending visual-review statements are superseded only for the screens the owner reviewed.

Checkpoint preparation inspected actual HEAD `c3c120babd8f32fb8c5b756ae99e7e42ccf3bdb3`, branch `main`, an empty index and the existing `origin/main` ref `9b775df50b563f518464810ddf5e646b2087b67e` (2 ahead / 0 behind; no fetch). The actual scope still matches the **55-file manifest below: 24 tracked modifications and 31 new files**. Required account-bound API client changes, the disposable local verification script, native appearance config, tests and licensed icon assets are included. No new application API/schema migration, dependency, font or version changes are required for this slice.

Only this record and the matching CHANGELOG acceptance note changed during checkpoint preparation. Source/config/test content was reconciled with the preceding implementation and recorded final checks; no concrete change justified repeating tests. The recorded 49/49 changed-component, 73/73 overlapping regression, 35/35 shared-control and final 12/12 notification UI results, typecheck/lint, and local persistence/RLS evidence retain their original scope. Fresh working-tree diff and new-text whitespace validation passed. No source, index or protected-file content was modified by checkpoint preparation.

Ready for an **owner-managed partial #34 local checkpoint** with #26/#27; no local checkpoint blocker identified. Provider-dependent scope and unreported functional/device acceptance remain pending. Statuses and issue states are unchanged by this preparation (#26/#27 Verify; #34 In Progress; all open). Suggested commit: `feat: refine V2 settings and notification preferences`, as one new child of the baseline, without amending it. No staging/commit was executed. After the owner runs the guarded commands, expected relationship to the unchanged existing origin/main is 3 ahead / 0 behind, with an empty index and only the seven handoff files plus root tsconfig remaining untracked.

## Scope and baseline — 2026-10-09

Implemented against `c3c120babd8f32fb8c5b756ae99e7e42ccf3bdb3` on `main`, 2 ahead / 0 behind the existing `origin/main`. The index was empty. Initial visible owner work comprised seven files in `design-reference/LifeOS-V2-Handoff/` and root `tsconfig.json`. No fetch, branch/history operation, staging or commit was performed.

Read the repository workflow/GitHub standard, tracker #28, #34/#26/#27 and comments, account/provider contracts #30/#17/#31, current V2 verification records, product decisions, implementation plan, Auth addendum and actual prototype source. Octocode discovery returned an input-validation error; focused local searches and source reads supplied the evidence instead. Expo overview/UI/design-system/data-fetching guidance was applied. No new native UI dependency was needed: the existing React Native V2 foundation supplies the approved geometry and accessible controls.

The preceding owner's local Today/Week/task appearance and four interaction acceptances remain scoped to that prior review. They do **not** accept these new Settings screens or any provider/device behavior.

## Implementation

- The accepted profile entry retains `/more`, which redirects to `/settings`. The overview follows account, calendar connections, notifications and appearance hierarchy. Existing account details, password reset, confirmed logout and date/time preferences remain accessible. Settings contains no task editing/capture or weekly-planning workflow action.
- Account access uses the existing #30 flows. Calendar authorization is separate. Google and Apple pages state that connection, calendar selection, disconnect and synchronization are unavailable. No fictional identity, calendar, event or successful connection is shown. Real local LifeOS commitments remain available through existing Calendar navigation.
- Four explicit switches expose master LifeOS, task, commitment and weekly-planning reminder states. Whole-row activation controls the same visible switch. Native checked/disabled semantics and web ARIA state are explicit. Web Space and Enter activate once; repeat Space and disabled controls cannot toggle.
- Commitment lead time and weekly weekday/time appear only after intentional expansion. Only one detail category opens at a time. Master/category off closes details without erasing values. Save remains explicit, retains exact minutes, and uses the existing account PATCH and notification reconciliation contract. Failed saves retain drafts for retry; cancellation discards them deliberately. A cache refresh cannot erase an unsaved draft. The server retains its existing complete-preference write semantics; no new cross-device revision protocol is claimed.
- Notification writes carry the expected account identity. Switching account remounts the form and ignores an old save acknowledgement. Permission refresh on foreground is independent of successful API loading; account-specific reconciliation notices reset on account change. Opening Settings does not request OS permission. Denied permission offers the existing iPhone Settings action; master-off preserves category choices and explains that notifications are off.
- Sound/vibration pages expose supported behavior honestly. Existing iOS requests/scheduled notifications/foreground handler use no sound; LifeOS has no independent vibration control. These are informational rows, not fake operational switches. iOS can open system settings; web/other unsupported delivery platforms explain the limitation. Scheduling algorithms, limits, ownership cleanup and reminder times are unchanged.
- Appearance uses the existing device-local `lifeos.appearance` preference, intentionally shared across account switches; notification/date preferences remain account-scoped. Storage failures preserve the previous mode. System changes update the theme when system is selected. `app.json` now uses `userInterfaceStyle: automatic` instead of the old native light lock. The installed Expo iOS plugin maps this to `UIUserInterfaceStyle: Automatic`, verified in memory only. Existing native checkouts/binaries have **not** been synchronized or tested. Android system appearance still requires its platform setup (`expo-system-ui` is not installed); no Android native acceptance is claimed. See [Expo appearance configuration](https://docs.expo.dev/develop/user-interface/color-themes/).
- No application API/schema, package dependency/lock, product version or build-number changes. A narrow disposable local verifier was added for real preference persistence and account isolation; it does not reset/migrate the DB and deletes only accounts it creates.

## Reference mapping and visual boundary

Values were extracted from the actual prototype, including later CSS overrides, not from a remembered screenshot. Bundled Hebrew-capable Heebo and the accepted V2 theme remain unchanged. Ten additional Lucide SVG/PNG pairs use the embedded reference's icon geometry and existing license/provenance.

| Reference | Native mapping |
| --- | --- |
| Content inset | 19 horizontal / 16 top / 22 bottom; 14 horizontal at widths <=375 |
| Back control | 32 circle, 17 arrow, 9 gap, 25 bottom space; accessible target >=44 |
| Heading | Existing Heebo 800 title 29 / 36.25, narrow 26, right-aligned RTL |
| Group heading/card | 18 top / 11 bottom spacing; surface border 1, radius 17 |
| Provider/preference row | Min height 76, padding 14, gap 12; narrow padding 12 / gap 8 |
| Icon and copy | Icon box 36 (narrow 30), radius 11, glyph 20; title Heebo 650 14 / 21.7; detail 11 / 17.6, top 3 |
| Appearance selector | Min height 40, max width 122 (narrow 103), radius 9, padding 6; font 12 (narrow 11) |
| Notification switch | 42 x 26 track, radius 20, 20 knob, 3 inset; row min 59, padding 15 |

Fictional prototype categories/statuses were replaced with real existing categories and availability. Account/date subpages retain useful existing behavior; sound/vibration limitations and explicit Save are deliberate truthful differences. Decorative phone frame/status bar/flow notes are not application UI.

Supported-browser discovery returned no browsers/apps. Opening the reference in Edge returned **`Browser is not available: edge`**; opening the preview in the in-app browser returned **`Browser is not available: iab`**. Consequently the agent did not independently establish rendered comparison, pixel fidelity, keyboard focus appearance or actual narrow-screen scrolling. Mocked 440/320-width/theme and DOM interaction tests are structural/behavioral evidence only. The subsequent owner visual acceptance is recorded above; it does not establish an unreported viewport/theme/accessibility matrix.

## #26 criterion evidence

| Criterion | Evidence / remaining gate |
| --- | --- |
| Obvious control for all four categories, not text-only state | Four visible track/knob switches; UI tests assert switch role and checked state |
| Whole-row synchronization | One accessible Pressable owns label and visual track; native interaction and web Space/Enter checks pass |
| Existing persistence/reconciliation | UI save/retry tests, real local fresh-session persistence/RLS check, existing notification/commitment scheduler regressions |
| Denied/master-off clarity | All four permission states tested without an automatic prompt; categories disabled but retained under master-off; resume permission refresh works even with API offline |
| Accessibility | Explicit checked/disabled state, ARIA, label and >=44 target; DOM focus/keyboard checks pass; screen-reader/device review pending |
| Physical-iPhone Hebrew RTL | **Pending** on a new candidate containing this implementation |

## #27 criterion evidence

| Criterion | Evidence / remaining gate |
| --- | --- |
| Main screen shows all category states | Master then three category switches, without permanent weekday/time controls |
| Intentional weekly/commitment details | Initially absent; explicit expansion only; common hierarchy and one open category |
| Disabled categories hide irrelevant settings | Category/master off closes details; saved weekday/time/lead retained |
| Hiding/reopening preserves values | UI collapse/reopen and remount checks; real local master-off/re-enable/fresh-session readback retains exact 09:17 and custom 37-minute lead |
| Scheduling unchanged | Existing reconciliation suites pass; no scheduler/driver edits |
| Physical-iPhone RTL/small-screen scrolling | **Pending**; mocked wrapping/RTL checks are not physical evidence |

## Checks and results

All commands run from `D:\code\LifeOS` unless noted. No broad suite, export or native build was run.

1. Changed Settings/notification group: **49/49 tests, 8 suites passed**:

```powershell
npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/notification-provider-test.tsx __tests__/notification-ui-test.tsx __tests__/notification-web-test.tsx __tests__/v2-settings-surfaces-test.tsx __tests__/settings-screens-test.tsx __tests__/settings-api-test.ts __tests__/commitment-reminder-ui-test.tsx __tests__/v2-theme-test.tsx
```

2. Relevant scheduler/cache and accepted shared V2 regressions: **73/73 tests, 9 suites passed** (overlaps the first group; do not add the counts):

```powershell
npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/v2-settings-surfaces-test.tsx __tests__/notification-ui-test.tsx __tests__/notifications-test.ts __tests__/commitment-notifications-test.ts __tests__/settings-query-cache-test.tsx __tests__/v2-foundation-test.tsx __tests__/v2-today-integration-test.tsx __tests__/v2-task-experience-test.tsx __tests__/week-allocation-test.tsx
```

3. After the final shared settings-radio/icon changes, the affected Settings/notification/commitment/theme group passed **35/35 tests across 4 suites**. An existing Expo Go Android remote-push warning appears in the native mock suite; it is not a test failure or delivery evidence. Initial test-helper/mock failures were corrected. The DOM check exposed missing web ARIA state/Space activation; both were fixed and the test passed. A lint failure in effect-based notice clearing was corrected to account-bound state reset.
4. `npm.cmd run typecheck --workspace @lifeos/mobile` and `npm.cmd run lint --workspace @lifeos/mobile`: passed. The new local verifier passes targeted ESLint from `apps/api`: `node ../../node_modules/eslint/bin/eslint.js scripts/verify-settings-preferences.mjs`.
5. Narrow **real local Auth/API/Postgres** verification passed, including repeat run after adding the port guard:

```powershell
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
node apps/api/scripts/verify-settings-preferences.mjs
```

   Uses only local LifeOS32 endpoints and a temporary API on port 3196, pinned to tracked `apps/api/tsconfig.json`. Creates two explicitly confirmed fixture accounts, checks PATCH/GET, identical retry, master-off retention, fresh client/session reload, re-enable, cross-account isolation, foreign-row RLS and unauthenticated rejection, then deletes only those fixtures. No signup/email/provider/delivery acceptance is inferred. No schema changes/reset or owner-review data mutations occur.
6. In-memory installed Expo plugin check: automatic config maps to iOS `Automatic` while 0.5.0/build 9 stay unchanged. No native files written. Mobile typecheck uses its tracked app tsconfig extending Expo directly; local API launch/verifier explicitly pin the tracked API config. No dependency on the preserved untracked root tsconfig was identified.
7. Current isolated `/settings` returns HTTP 200; Metro serves a compiled JavaScript development bundle. These prove preview availability/compilation **only**, not rendered acceptance.
8. Final notification error-copy correction: **12/12 notification UI tests passed**, followed by mobile typecheck/lint. `git diff --check`, explicit new-text-file whitespace validation and protected-file baseline comparison passed. The index remains empty; all changes remain uncommitted.

## Preview and owner review

Current URL: **http://localhost:8083/settings**. The isolated API is **http://127.0.0.1:3197**. Existing processes were preserved. Reload the page for source changes. If they have stopped, start each command in a separate PowerShell terminal; do not run duplicate listeners:

```powershell
Set-Location -LiteralPath 'D:\code\LifeOS'
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
node apps/api/scripts/review-daily-flow.mjs api
```

```powershell
Set-Location -LiteralPath 'D:\code\LifeOS'
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
node apps/api/scripts/review-daily-flow.mjs web
```

These require the existing running disposable LifeOS32 service. If it is unavailable, stop and report that fact; do not reset it or fall back to hosted environment files. The launcher supplies local endpoints internally and disables Expo dotenv loading. Use an existing local review account; fixture preview data is not product evidence.

1. At 440 x 956: Today profile control -> Settings. Compare account/connections/notifications/appearance hierarchy with the prototype. Open Account and return; confirm actual name/email and existing reset/logout entry without confusing them with calendar access.
2. Open Google and Apple pages. Both must truthfully report unavailable integration, then return to Settings. Check existing Calendar still presents real local commitments.
3. Open Notifications: four obvious switches, details initially closed. Enable weekly reminders, intentionally open the category, choose a weekday and exact time, Save, reload and reopen. Repeat with a custom commitment lead. Collapse, disable the category, and turn master off; re-enable and verify values remain. Cancel a draft and confirm no saved change. Web correctly reports no native delivery.
4. Open sound/vibration: no operational switch is offered for unsupported behavior. On a future authorized iPhone candidate, check denied/granted OS permission changes after returning to the app and actual delivery separately.
5. Choose dark/light/system, reload, switch accounts, and confirm the device-wide appearance persists while account notification settings differ. With system selected, change OS/browser appearance. Repeat at 320 x 956, long Hebrew labels, keyboard Tab/Space/Enter, scrolling and return navigation. Recheck Today/Week/Tasks visually after theme changes.

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
| Included issues/source | #34/#26/#27 Settings/preferences/notification controls from `6b53159`, included in `3310f96`; provider/device acceptance remains scoped and pending |

**Candidate: LifeOS 2.0.0 (10); tracked metadata prepared, not built, installed or accepted.** [Current release record](release-2.0.0-verification.md) separates completed API/schema/configuration evidence from pending authenticated hosted OAuth, native synchronization/signing, physical delivery and full integration acceptance. No new implementation, production-data mutation, Git write, tag or publication is authorized by this preparation. #17 remains Open / In Progress with outbound/background phases unfinished.

## Tracking and checkpoint readiness

#26/#27 software controls and targeted automated gates passed and their actual Project Status is **Verify**, with remaining manual functional/physical acceptance pending. The reviewed Settings appearance has owner-reported local visual acceptance as scoped above. #34 remains **In Progress** because selected-calendar/disconnect/provider-dependent full integration remains unfinished; truthful unavailable surfaces complete only the authorized initial slice. All three remain open. Status writes were read back; before/after selected Project metadata comparison passed with only Status differing. Priorities, labels, assignees, milestones, membership and unrelated issues were preserved. Evidence comments were also read back: [#26](https://github.com/OzAvrahami/LifeOS/issues/26#issuecomment-6079951963), [#27](https://github.com/OzAvrahami/LifeOS/issues/27#issuecomment-6079952481), [#34](https://github.com/OzAvrahami/LifeOS/issues/34#issuecomment-6079953049).

This is a coherent **partial #34 local checkpoint**, with final available checks passed; it is not a completed provider integration or release. All staging/commit/push actions remain owner-managed and unauthorized in this task. Protected handoff/root config/environment/index hashes match the initial inventory. Today/Week/task business logic and accepted component source remain unchanged apart from additive shared icons and Settings entry routing.

## Exact changed files

The following final inventory excludes the eight pre-existing owner files. All paths are unstaged; no generated/native/environment file is included.

```text
CHANGELOG.md
apps/api/scripts/verify-settings-preferences.mjs
apps/mobile/__tests__/commitment-reminder-ui-test.tsx
apps/mobile/__tests__/notification-provider-test.tsx
apps/mobile/__tests__/notification-ui-test.tsx
apps/mobile/__tests__/notification-web-test.tsx
apps/mobile/__tests__/settings-api-test.ts
apps/mobile/__tests__/settings-screens-test.tsx
apps/mobile/__tests__/v2-settings-surfaces-test.tsx
apps/mobile/__tests__/v2-theme-test.tsx
apps/mobile/app.json
apps/mobile/assets/icons/lucide/ArrowRight.png
apps/mobile/assets/icons/lucide/ArrowRight.svg
apps/mobile/assets/icons/lucide/Bell.png
apps/mobile/assets/icons/lucide/Bell.svg
apps/mobile/assets/icons/lucide/ChevronDown.png
apps/mobile/assets/icons/lucide/ChevronDown.svg
apps/mobile/assets/icons/lucide/ChevronLeft.png
apps/mobile/assets/icons/lucide/ChevronLeft.svg
apps/mobile/assets/icons/lucide/Clock3.png
apps/mobile/assets/icons/lucide/Clock3.svg
apps/mobile/assets/icons/lucide/LogOut.png
apps/mobile/assets/icons/lucide/LogOut.svg
apps/mobile/assets/icons/lucide/README.md
apps/mobile/assets/icons/lucide/SunMoon.png
apps/mobile/assets/icons/lucide/SunMoon.svg
apps/mobile/assets/icons/lucide/UserRound.png
apps/mobile/assets/icons/lucide/UserRound.svg
apps/mobile/assets/icons/lucide/Vibrate.png
apps/mobile/assets/icons/lucide/Vibrate.svg
apps/mobile/assets/icons/lucide/Volume2.png
apps/mobile/assets/icons/lucide/Volume2.svg
apps/mobile/src/app/account.tsx
apps/mobile/src/app/more.tsx
apps/mobile/src/app/settings/appearance.tsx
apps/mobile/src/app/settings/calendar-connection.tsx
apps/mobile/src/app/settings/index.tsx
apps/mobile/src/app/settings/notification-delivery.tsx
apps/mobile/src/app/settings/notifications.tsx
apps/mobile/src/app/settings/preferences.tsx
apps/mobile/src/components/v2-icon.tsx
apps/mobile/src/features/notifications/notification-delivery-screen.tsx
apps/mobile/src/features/notifications/notification-provider.tsx
apps/mobile/src/features/notifications/notification-settings-screen.tsx
apps/mobile/src/features/notifications/reminder-lead-picker.tsx
apps/mobile/src/features/settings/account-screen.tsx
apps/mobile/src/features/settings/app-version-footer.tsx
apps/mobile/src/features/settings/appearance-setting.tsx
apps/mobile/src/features/settings/calendar-connection-screen.tsx
apps/mobile/src/features/settings/date-preferences-screen.tsx
apps/mobile/src/features/settings/settings-screen.tsx
apps/mobile/src/features/settings/settings.api.ts
apps/mobile/src/features/settings/settings.components.tsx
apps/mobile/src/features/settings/v2-settings.tsx
docs/issue-34-verification.md
```

Final scope: **55 files** (24 tracked modifications; 31 new files). The seven handoff files and root tsconfig remain outside the scope.
