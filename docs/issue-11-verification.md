# Issue #11 verification and owner review

## Current status — 2026-09-08 release preparation

The owner committed and pushed #11 (`6bbccdc`), #12 (`3db8d52`), and #13 (`544cde0`). Owner-reported desktop-browser acceptance passed for #11/#12; isolated preview/demo acceptance passed for #13. All three issues remain open in Verify. Physical-iPhone acceptance and #13 authenticated live-database persistence/history acceptance remain pending.

Version 0.2.1/build 3 is prepared separately, with no native build/install in this step. GitHub records successful Railway deployment for exact SHA `544cde042a83684bc389d903ef17f51adee8af2f`, and live `/health` matches the contract. Direct provider/active-deployment identity was not inspected; health and deployment success do not prove task writes/history behavior. See [the current release preparation record](release-0.2.1-verification.md) for evidence and the manual Git checkpoint. Earlier local/undeployed, desktop-pending, and uncommitted references below are historical implementation/handoff observations; their automated results and unchecked native acceptance remain intact.


Implementation against `main` at `9db574e448f11dd48556ef10c4539239c21affc2`, using Node 24.11.1, npm 11.6.2, Expo ~57.0.14, and the installed `@react-native-community/datetimepicker` 9.1.0. Initial worktree was clean. No Git staging, commits, branch operations, package/version changes, or native regeneration were performed.

## Confirmed cause and fix

The native time field closed on every change and restricted selection to 15-minute intervals. The picker was also inside a half-width start/end field. That layout is a confirmed code observation, not proof of the reported iPhone rendering cause; no device reproduction was performed.

- One editor-scoped selection surface now sits below the start/end row, at the form's full width inside its existing scrolling, safe-area-aware sheet. No additional modal, scaling, clipping, or global RTL change.
- iOS wheels update a draft until Hebrew Confirm/Cancel. The existing 09:00 default is only a draft for an empty field. Cancelling preserves the existing value, including null. Reopening reads the current form value.
- One-minute selection and local HH:mm formatting preserve 09:10, 09:25, and 09:17. iOS spinner locale `en-GB` provides a 24-hour numeric control; surrounding labels/actions remain Hebrew. Android uses `is24Hour` and its native positive/negative buttons, without another confirmation dialog. These are separate platform mechanisms, checked against installed typings/source and the [version 9.1.0 documentation](https://github.com/react-native-datetimepicker/datetimepicker/blob/v9.1.0/README.md).
- Switching fields, clearing the optional end, cancelling, hiding the editor, and changing commitment identity discard abandoned selection callbacks. Confirming a picker does not submit or close the editor.
- The shared field's standalone Day Window caller remains supported; settings, overnight semantics, and capacity calculations are unchanged. Web HTML fields and the commitment date picker retain their existing behavior.
- The only #12 overlap is `Keyboard.dismiss()` when opening time selection. General blank-space/focus/scroll keyboard behavior remains in #12, which was not modified.

Main implementation: `commitment-date-time-fields.native.tsx`, its platform exports, and `commitment-editor.tsx`. API production code, schema, commitment validation, and Week/day screens are unchanged.

## Automated verification

Run from `D:\code\LifeOS` unless indicated:

| Command | Result |
| --- | --- |
| `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/commitment-time-picker-test.tsx __tests__/commitment-screen-test.tsx` | 14 passed; Android-only case runs separately. |
| `npm.cmd run test --workspace @lifeos/mobile -- --config jest.commitment-android.config.js` | 2 passed; iOS-only cases run in the standard preset. |
| `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/commitment-web-fields-test.tsx` | 1 passed; real DOM input events, no browser/native-device claim. |
| `npm.cmd run test --workspace @lifeos/mobile` | Final stabilization run: 33 suites passed; 185 tests passed, 1 existing Android-only exclusion (186 total), no failures. |
| `npm.cmd run typecheck --workspace @lifeos/mobile` | Passed. |
| `npm.cmd run lint --workspace @lifeos/mobile` | Passed. |
| `node --import tsx --test __tests__/commitments.test.ts` (from `apps/api`) | 10 passed, including HTTP create/edit/read precision and real persistence-service mapping against a fake database boundary. |
| `npm.cmd run typecheck --workspace @lifeos/api` | Passed. |
| `npm.cmd run lint --workspace @lifeos/api` | Passed. |
| `git diff --check` | Passed. |

The tests mock only the native picker boundary and emit successive events through the actual native fields and editor. They cover draft/confirmation/cancel, null end, reopening, stale callbacks, field/session isolation, validation, and exact create/edit API payloads. API tests use isolated memory/fake database facilities; no real commitments or production data were accessed.

The direct `--preset jest-expo/android` attempt failed before test execution: the installed platform preset drops the inferred Babel preset for a project without `babel.config.js`. The focused test-only Android configuration retains the installed base Babel options and overrides its platform. No runtime/native configuration or dependency was changed.

### Initial full-suite failure — resolved by authorized test stabilization

On Monday, 2026-09-07, the original `settings-product-integration-test.tsx:276` expected Monday's name, while the current day's Week row correctly displayed Today. Before stabilization, re-running the suite with original HEAD commitment sources reproduced the identical failure (5 passed, 1 failed), establishing that this was pre-existing. The failure was confirmed again before the authorized test-only edit. Production Week/settings code remains unchanged.

Baseline reproduction used read-only `git show HEAD:<path>` copies of the commitment directory in `%TEMP%\lifeos-issue11-baseline`, with a temporary Jest module mapping to those files:

```powershell
npm.cmd run test --workspace @lifeos/mobile -- --config C:/Users/ozavr/AppData/Local/Temp/lifeos-issue11-baseline/jest.baseline.json --runTestsByPath __tests__/settings-product-integration-test.tsx --silent
```

That initial failure kept #11 In Progress. The authorized stabilization below resolves the automated gate; #11 is ready for Verify, with owner/device acceptance still pending.

### Authorized test stabilization — final results

Only `apps/mobile/__tests__/settings-product-integration-test.tsx` changed in this follow-up's executable code. The existing picker work is preserved. The formerly date-dependent test now runs two explicit scenarios: Monday 2026-09-07 and Thursday 2026-09-10, each at 09:00 UTC. Jest 29.7 freezes only `Date`; `doNotFake` retains all timer, microtask, animation, and performance APIs so React Query and testing-library asynchronous scheduling continue normally. The controlled-date cases have a scoped `afterEach` restoring real timers, with rendered views unmounted in `finally`.

Both scenarios independently assert the Sunday September 6–12 and Monday September 7–13 query boundaries, including task date-range and week-placement queries, commitments, and weekly focus. Literal seven-day weekday/date sequences verify row order and exactly one selected Today row before and after switching week start. Monday must display Today in the Monday case and its weekday name in the Thursday case. The old Sunday-boundary focus cache and the previous week's cache retain their identities and data; no mutation API is called. Expectations do not come from the production date helpers, and no assertion was relaxed or skipped.

Final follow-up commands from the repository root:

| Command | Final result |
| --- | --- |
| `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/settings-product-integration-test.tsx` | 1 suite, 7 tests passed. |
| `npm.cmd run test --workspace @lifeos/mobile` | 33 suites passed; 185 passed, 1 existing platform exclusion, 0 failures. |
| `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/commitment-time-picker-test.tsx __tests__/commitment-screen-test.tsx __tests__/commitment-web-fields-test.tsx` | 3 suites passed; 15 passed, 1 existing Android-only exclusion. |
| `npm.cmd run test --workspace @lifeos/mobile -- --config jest.commitment-android.config.js` | 1 suite passed; 2 passed, 9 existing iOS-only exclusions. |
| `npm.cmd run typecheck --workspace @lifeos/mobile` | Passed. |
| `npm.cmd run lint --workspace @lifeos/mobile` | Passed. |
| `git diff --check` | Passed. |

Platform exclusions are complementary: the Android-only case passes in the Android run, and the nine iOS-only cases pass in the standard run. No new skips or suppressed failures were introduced. API production/tests were unchanged in this follow-up; the earlier passing API verification above remains the applicable record.

All required automated gates now pass. Readback confirmed #11 is open, P1 — High, and Verify on its single existing project item. The existing GitHub handoff comment was updated with this separate stabilization record. Physical-iPhone acceptance remains pending; none of its checkboxes below are completed.

## Run/reload for owner verification

From `D:\code\LifeOS`, use the checkout's existing development environment and installed LifeOS development client:

```powershell
npm.cmd run start --workspace @lifeos/mobile -- --lan
```

Open the resulting Metro link/QR code in the LifeOS development client on the same network. Press `r` in the Metro terminal to reload after reviewing the diff. If the existing development configuration points to the local API, run `npm.cmd run api` in a second terminal and ensure the configured API address is reachable from the phone. Use a disposable test account/environment for the checklist.

This diff changes JavaScript/TypeScript and tests/docs only. An already compatible development client needs a JS reload, not a native rebuild. A standalone Release installation does not load this checkout from Metro; use an existing development client for this review. No rebuild, release, or deployment was initiated.

## Physical-iPhone checklist — pending

No device or simulator was available in this Windows session. Mocked tests and DOM tests do not establish native wheel layout or touch accessibility.

- [ ] **Create:** open start; change the hour and then minutes repeatedly (09:10, 09:25, 09:17); verify both wheels remain usable; confirm; reopen; change and cancel. Confirm the prior value remains and the editor stays open.
- [ ] **Optional end:** open an empty end and cancel (still empty); set a later end and confirm; reopen and cancel another change; clear it; reopen/cancel and confirm it remains empty. Check end-before/equal-start validation.
- [ ] **Save/reopen:** save the test commitment, reopen it, and verify exact times, date, title, description, and life area. Repeat after app reload.
- [ ] **Edit:** repeat start hour/minute changes, confirm/reopen/cancel, optional-end set/clear, save, and reopen an existing test commitment. No default duration or date changes.
- [ ] **Narrow-screen Hebrew RTL:** check complete hour/minute wheels, clear selected-field label, reachable Confirm/Cancel and clear-end targets, scrolling, safe areas, and one-tap time opening from a focused title. Switch start/end with an unconfirmed draft and confirm only one time picker is present. Broader keyboard acceptance remains #12.

After code review and required device checks, the owner performs the manual Git checkpoint: inspect the diff, stage the intended files, commit, and push. The full-suite gate now passes. Suggested commit: `fix(mobile): preserve precise commitment time selections`. Do not close #11 before owner acceptance.
