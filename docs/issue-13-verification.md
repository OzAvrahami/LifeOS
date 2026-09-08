# Issue #13 verification and owner review

## Current owner acceptance — 2026-09-08

On 2026-09-08, after manually committing/pushing release preparation `2aa6bc4a246a06efc31a6c7753b1ad9f51b8a102`, the owner built and installed the standalone internal iPhone Release, confirmed the app displays **0.2.1 / build 3**, and replied **"מאשר הכל" — "I approve everything."** This is **owner-reported acceptance**, not an independently observed device test. Standalone opening/data loading over cellular without the Mac/Metro and retention of the tested commitment/task times/dates after saving and reopening the app were approved.

- [x] Planning-date selection, correct visible placement, a distant date, cancellation, a disposable-task move without a visible duplicate, and save/app-reopen retention of its selected date. **Owner-reported physical-iPhone acceptance.**

Previous automated tests remain the evidence for internal IDs, unrelated-field/deadline/status/history preservation, cache membership, and timezone invariants. No new instrumented live-database/history/RLS test, full accessibility audit, exhaustive platform matrix, direct Railway active-deployment inspection, or extraction of the installed binary's exact source SHA was performed. The reported device persistence is accepted user-flow evidence, separate from the earlier preview/demo acceptance. Unrelated older release checks and backlog work are not approved by this record.

[Acceptance comment](https://github.com/OzAvrahami/LifeOS/issues/13#issuecomment-5581739385) posted and read back using macOS `gh`. Issue #13 is **CLOSED / COMPLETED**, its existing Project item is **Done**, and **P1 — High** is preserved. Existing automation applied Done; other issue metadata was preserved. See [the release acceptance record](release-0.2.1-verification.md). These documentation changes await the owner's manual commit/push; no tag or GitHub Release was created.

## Historical implementation and preparation evidence

The earlier implementation/desktop/preparation observations below are retained as dated evidence. Their pending-device/open-issue/uncommitted statements describe those earlier stages and are superseded by the current acceptance above. Automated results are prior runs, not new tests.



## Baseline and scope

Implemented on macOS in `/Users/ozavrahami/code/lifeOS`, starting from clean `main` at `3db8d52` (the owner's committed #11/#12 fixes). Node `v26.3.0`, npm `11.16.0`, installed date picker `9.1.0`, Expo `~57.0.14`, and React Native `0.86.2`. No dependency, migration, native configuration, version/build, staging, commit, push, branch, release, deployment, or device-build changes.

The owner's desktop acceptance of #11/#12 is retained. Their physical-iPhone acceptance is still pending; neither issue nor its Project fields was changed.

## Confirmed causes and implementation

- Quick Capture's `day` chip only changed a string destination. The callback had no calendar date, and `useTaskCapture` returned successfully without creating anything for `day`. The sheet then closed. These are confirmed source observations, not a claim of device reproduction.
- Inbox actions and processing offered three fixture labels; a parser guessed their year and could fall back to Today. Week's choose-day control exposed only a Today shortcut. All three now use the same arbitrary calendar selection as capture. The obsolete fixture choices and guessing parser were removed.
- `TaskCapturePlacement` and Inbox processing's discriminated placement type require an explicit `plannedDate` for day selection. Every capture caller (Today, Week, Inbox, More, and inline Inbox) is updated. Existing initial destinations remain: Today inline capture selects Today; global capture defaults to Inbox.
- `TaskDateSelection` owns an isolated draft. Confirm commits it; cancel unmounts it without changing the previous placement/title. Capture shows the committed `YYYY-MM-DD` before Save, blocks Save and keyboard submission during an unfinished selection, and unmounts its form state between sessions. Selecting a date alone never creates a task.
- Web retains an actual HTML date input, normal focus and keyboard behavior, and explicit Confirm/Cancel. Empty/malformed input is sanitized by the browser and blocked by calendar validation. iOS uses a full-width spinner inside the existing surface and waits for explicit confirmation through multiple day/month/year changes. Android uses the native positive/dismissal events. Late callbacks from an unmounted picker are ignored. No nested React Native modal or global focus/RTL change was added.
- The installed [picker 9.1.0 documentation](https://github.com/react-native-datetimepicker/datetimepicker/tree/v9.1.0#readme) and its `src/index.d.ts` were checked for `onValueChange`, `onDismiss`, date mode, spinner, and Android button APIs. The new controls use those supported event APIs. #11/#12 commitment controls are unchanged.
- Task moves PATCH the same ID with planning only. The API previously reset status and `completed_at` on every planning change; planning-only updates now preserve execution state/history as well as title, description, duration, priority, position, creation time, and deadlines. Explicit status transitions still own their existing semantics. Preview moves preserve status too, and preview capture/moves stay in the local demo provider.
- Existing user-scoped mutations synchronize day, date-range, Week-only, and Inbox caches. Completed tasks are not inserted into open Inbox when ensuring a destination cache. Tests verify old/new range aggregates and duplicate-free membership, including another user's unchanged cache.
- Today uses the configured settings timezone. Week helpers now recognize the actual settings property `timezone` alongside their existing `timeZone` context, fixing the mismatch at timezone/week boundaries. Selected calendar dates stay strings; native picker adapters use local calendar components at noon, never an ISO/UTC conversion of the chosen date. `dueDate` is never included in a rescheduling payload.
- Failed capture retains the title/date and displays retry feedback. Capture and shared calendar moves guard repeated pending submissions and cancellation. Capture/Inbox selection surfaces scroll within their existing safe-area sheets; native opening dismisses the keyboard while Web does not imperatively blur inputs.

## Automated verification

All commands below run from `/Users/ozavrahami/code/lifeOS` with npm. Final results:

| Command | Result |
| --- | --- |
| `npm run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/task-date-capture-test.tsx __tests__/task-date-native-test.tsx __tests__/task-date-web-test.tsx __tests__/task-server-flow-test.tsx __tests__/task-query-cache-test.tsx __tests__/inbox-screen-test.tsx` | 6 suites, 44 tests passed; no failures or skips. |
| `npm run test --workspace @lifeos/mobile` | 38 suites, 217 tests passed, 1 existing Android-only exclusion; 0 failures. |
| `npm run test --workspace @lifeos/mobile -- --config jest.task-date-android.config.js` | 1 suite, 3 tests passed; no failures or skips. |
| `npm run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/commitment-keyboard-test.tsx __tests__/commitment-keyboard-web-test.tsx __tests__/commitment-time-picker-test.tsx __tests__/commitment-screen-test.tsx __tests__/commitment-web-fields-test.tsx` | 5 suites, 26 tests passed, 1 existing Android-only exclusion; 0 failures. |
| `npm run test --workspace @lifeos/mobile -- --config jest.commitment-android.config.js` | 2 suites, 11 tests passed, 9 complementary existing iOS-only exclusions; 0 failures. |
| `npm run typecheck --workspace @lifeos/mobile` | Passed. |
| `npm run lint --workspace @lifeos/mobile` | Passed, no warnings. |
| `npm run test --workspace @lifeos/api` | 6 suites, 48 tests passed; no failures or skips. Includes isolated Task/planning persistence and #11 precision regressions. |
| `npm run typecheck --workspace @lifeos/api` | Passed. |
| `npm run lint --workspace @lifeos/api` | Passed. |
| `git diff --check` | Passed. |

No new skips or suppressed failures were introduced. The stabilized Week/settings tests retain their assertions; the standalone Week component harness now supplies its required calendar props. Initial failures included reading the transformed native host instead of mocking the picker boundary, exact idle accessibility props, and a TypeScript narrowing error; all were corrected. A Web async-action `act` warning and import-order lint warning were fixed, not suppressed.

Tests exercise the actual capture component and hook through the real mutation hook with API boundaries mocked; actual Inbox/processing/Week flows; native control events; real DOM/React Native Web inputs; real cache synchronization and aggregation; and the API router/validation/service with isolated in-memory stores and fixture users. Literal dates include `2026-12-31`, `2027-01-02`, `2028-02-29`, and Los Angeles settings at `2027-01-01T00:30:00Z` (LifeOS date `2026-12-31`). Clock mocks are restored after each test. No real user tasks or production data were changed. A fresh test app over the same isolated store verifies retained persistence and membership; no live PostgreSQL, production restart, or RLS deployment was performed.

## Desktop review — environment rechecked 2026-09-08

Open [the isolated-data Today preview](http://localhost:8081/?preview=1) in a private/incognito window without signing in. For the other screens, open [Inbox preview](http://localhost:8081/inbox?preview=1) or [Week preview](http://localhost:8081/week?preview=1) directly. The existing navigation callbacks do not retain `preview=1`; check the URL before interacting after navigation. Keep the preview parameter on each screen and use only its disposable demo fixtures. No real user task was created, moved, or deleted during this handoff.

### Actual configuration and service evidence

- The normal Web API origin resolves to `https://lifeosapi-production-0362.up.railway.app`, the existing remote production API. `apps/mobile/src/lib/api/client.ts` reads `EXPO_PUBLIC_API_URL`; no platform-specific API client or Web-specific environment override was found. The actual served `platform=web` development bundle's virtual environment confirms that same origin. Loading the UI from localhost does not select a local API.
- The API environment points to cloud Supabase, matching the mobile authentication project. `npm run api` would load that configuration and listen on port `3100`; it would still use the cloud database. No running local LifeOS API was found, and `http://localhost:3100/health` refused the connection. The unrelated service on `127.0.0.1:3007` belongs to another checkout and was left alone. The remote API's unauthenticated `/health` returned HTTP 200; this is reachability evidence only.
- No available isolated full-stack environment was found. The repository-local `supabase status --output json` failed: `failed to inspect container health: docker: command not found (podman also not found)`. Local Supabase at `127.0.0.1:54321` refused the connection. The integration script requires that local Docker/PostgreSQL/Auth environment; its isolated automated test doubles are not a running review API. No API was started against cloud data, and no infrastructure was provisioned.
- The existing Metro process initially served HTML but stopped during bundle retrieval. Only Expo Web was restarted, using `BROWSER=none npm run start --workspace @lifeos/mobile -- --web --port 8081`. The replacement serves this checkout at `http://localhost:8081`; its HTML, preview HTML, and complete Web JavaScript bundle were reachable. No temporary API override was applied and no persistent environment or release configuration was changed.
- A fresh headless Chrome profile loaded `http://localhost:8081/?preview=1` to document-ready completion with rendered controls and no uncaught exceptions. Observed page requests were exclusively to `http://localhost:8081`, with no Fetch/XHR or non-GET requests. This is actual browser evidence for initial preview loading only: no task/date interactions, authenticated remote API requests, or full-stack acceptance were exercised. The temporary browser/profile were removed afterward; Metro remains running for the owner.

### Review scope and owner checklist

The preview uses the existing in-memory demo task provider. Date confirmation/cancellation, local demo capture/moves, keyboard navigation, and layout can be reviewed without changing account data. Its Today anchor is `2026-08-08` and its fixture week is August 2–8, rather than the actual current week. Reloading resets demo changes; preview navigation and fixture counts cannot establish server persistence or current-week membership.

1. Open Quick Capture, type a disposable title, choose a date in the actual current calendar week (for this handoff, `2026-09-08` is suitable), and confirm. Check the exact date before Save, then Save once in preview. This checks the UI/demo flow only; current-week server membership and save/reload persistence remain pending a safe full-stack environment.
2. Select a date in another month/year, such as `2027-01-02`, and confirm/save in preview. Check the displayed date before Save. Arbitrary future-week browsing remains #4 scope, so lack of a destination view does not verify stored placement.
3. Choose a date, reopen selection, change it, then cancel. The typed title and previous selection must remain. Also cancel before the first confirmation, and close/reopen capture to check that drafts do not leak. Check mouse/Tab focus through title, date, Confirm, Cancel, and Save.
4. On the explicit Inbox or Week preview URL, use a disposable existing demo fixture task: choose another date, cancel once, then confirm. Review the local move and absence of duplicate source entries. Do not move real account tasks. Actual API identity/status/history/deadline preservation and database/cache consistency still require safe full-stack acceptance; the existing isolated automated results above are the current evidence for the undeployed fix.
5. On Inbox preview, create a title-only task with Inbox selected. It should appear locally as unscheduled. Check destination changes after a custom date and the narrow RTL layout. Reloading intentionally discards demo changes.

The ordinary app at `http://localhost:8081/` uses the older remote API when authenticated. It is suitable here only for non-mutating UI inspection: open the picker, change its draft, and cancel; do not save captures or move account tasks. The local API status/history fix remains undeployed and has not been exercised against a live database in this handoff. Owner desktop acceptance is still pending.

### Usual development setup

No override needs to be undone. To leave preview, remove `preview=1`; the ordinary app still uses the existing remote configuration. If Metro stops, run from the repository root:

```sh
BROWSER=none npm run start --workspace @lifeos/mobile -- --web --port 8081
```

Stop that Expo process with Ctrl-C when finished. A future full-stack review must first identify an isolated Supabase/Auth target and configure both API and Web processes for it. Starting the API with the current environment alone is not isolation.

This task does not add distant-week browsing, general day-detail editing, task times, description UI, templates, recurrence, calendar integration, or day replanning. No owner re-review of unchanged #11/#12 desktop behavior is needed before reviewing #13.

## Physical-iPhone acceptance — evidence reconciliation

The owner subsequently built/installed 0.2.1/build 3 after the manual preparation checkpoint and approved the flows above. The original extended combinations below retain unchecked details that were not separately reported; no exhaustive entry-point/device-timezone/accessibility audit is inferred.

- [ ] Repeat capture, first/later cancel, changing month/year components before Confirm, reopening, destination switching, save/reload, Inbox/processing/Week moves, and return to Inbox on a physical iPhone.
- [ ] Verify keyboard dismissal, scrolling with the wheel visible, Hebrew RTL, safe areas, and VoiceOver focus/announced dates. Confirm no intermediate wheel change closes selection.
- [x] Verify #11's exact-minute time picker and #12's native keyboard interactions together — owner-reported scope in their current acceptance records.
- [ ] Check device timezone differing from LifeOS settings and a date near midnight. No selected date or deadline should shift.

Android event behavior is covered in automation; no Android device acceptance is claimed.

## GitHub and manual Git checkpoint

On 2026-09-08, Project access succeeded after the owner's authorization. The actual fields of LifeOS Development Project #2 (`PVT_kwHOAgE74M4BhLsq`) and #13's existing item (`PVTI_lAHOAgE74M4BhLsqzg5wUf4`) were read. Only its Status field (`PVTSSF_lAHOAgE74M4BhLsqzhgIacM`) was updated from Backlog to the existing Verify option (`d0690992`). Readback confirmed **Verify**, **P1 — High** (`7cca08aa`), and issue state **OPEN**, with one existing item in this Project. Other metadata was preserved; no duplicate item was created and #11/#12 were not modified. There is no remaining Project permission blocker. Desktop and physical-iPhone acceptance remain pending, so #13 is not Done and remains open.

The existing [English handoff comment](https://github.com/OzAvrahami/LifeOS/issues/13#issuecomment-5580215621) was updated with this environment/status follow-up and its exact content was read back. Automated verification above is retained from the completed implementation; no implementation or test-suite rerun was performed for this environment/status follow-up.

The owner reviews the diff and manually stages, commits, and pushes. Suggested commit: `fix(tasks): persist calendar day selection across capture and moves`.
