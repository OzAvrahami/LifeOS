# Issue #12 verification and owner review

## Current owner acceptance — 2026-09-08

On 2026-09-08, after manually committing/pushing release preparation `2aa6bc4a246a06efc31a6c7753b1ad9f51b8a102`, the owner built and installed the standalone internal iPhone Release, confirmed the app displays **0.2.1 / build 3**, and replied **"מאשר הכל" — "I approve everything."** This is **owner-reported acceptance**, not an independently observed device test. Standalone opening/data loading over cellular without the Mac/Metro and retention of the tested commitment/task times/dates after saving and reopening the app were approved.

- [x] Blank-space dismissal without closing the form or losing text, one-tap date/time activation, the requested text-field/description interactions, and saving/reopening the tested commitment. **Owner-reported physical-iPhone acceptance.**

Previous automated tests remain the evidence for internal IDs, unrelated-field/deadline/status/history preservation, cache membership, and timezone invariants. No new instrumented live-database/history/RLS test, full accessibility audit, exhaustive platform matrix, direct Railway active-deployment inspection, or extraction of the installed binary's exact source SHA was performed. The reported device persistence is accepted user-flow evidence, separate from the earlier preview/demo acceptance. Unrelated older release checks and backlog work are not approved by this record.

[Acceptance comment](https://github.com/OzAvrahami/LifeOS/issues/12#issuecomment-5581738239) posted and read back using macOS `gh`. Issue #12 is **CLOSED / COMPLETED**, its existing Project item is **Done**, and **P2 — Medium** is preserved. Existing automation applied Done; other issue metadata was preserved. See [the release acceptance record](release-0.2.1-verification.md). The owner committed/pushed this acceptance documentation in `17123893b8d10f87278a71871f330d8141bce275`. Separate final publication documentation is now awaiting approval and its own manual commit/push; the eventual v0.2.1 tag must include those final edits. No tag or GitHub Release has been created.

## Historical implementation and preparation evidence

The earlier implementation/desktop/preparation observations below are retained as dated evidence. Their pending-device/open-issue/uncommitted statements describe those earlier stages and are superseded by the current acceptance above. Automated results are prior runs, not new tests.



Started on clean `main` at `6bbccdc7ce655fda60cae2cd29a1c8212d36ca65`, the owner's committed #11 fix. Verified Node 24.11.1, npm 11.6.2, Expo ~57.0.14, React Native 0.86.2, Jest 29.7, and the existing picker 9.1.0. No dependency, native configuration, version, persistence, or Git state changes were performed.

## Confirmed interaction paths and fix

The editor already used keyboard avoidance and `keyboardShouldPersistTaps="handled"`. That setting preserves child actions but does not dismiss automatically for a handled button. Native Date, end clearing, details, life areas, Save, and delete requests did not explicitly dismiss; sheet padding also had no dismissal handler, and scrolling had no dismissal mode. #11 already dismissed when opening time selection. These are code observations, not physical reproduction of the report.

- The sheet padding, heading gaps, form content, time-row gaps, and life-area gaps observe direct background taps. Only `event.target === event.currentTarget` requests dismissal. Child input, button, and picker events can bubble without triggering background dismissal. Movement cancels the background-tap action, leaving drag behavior to the ScrollView. No responder is captured, no overlay is added, and the form is not made into an accessible button.
- Date and optional-end clearing dismiss in their native handlers. Details, life areas, Save, and delete requests dismiss in their own action handlers only on native platforms. Existing time opening continues to use #11's provider. Taps remain `handled`, retaining one-interaction control activation.
- Scrolling uses iOS `interactive`, Android `on-drag`, and Web `none`. Existing keyboard avoidance, sheet sizing, safe-area padding, RTL styles, autofocus, multiline behavior, validation, and outside/explicit close semantics remain.
- Web does not call `Keyboard.dismiss()` from these handlers; browser date/time inputs retain focus and their existing values/behavior. No browser input is replaced or imperatively blurred.
- #11's one full-width time picker, precise HH:mm values, confirm/cancel, null end, session isolation, and stale-callback guards remain. API contracts, dates, time-range semantics, Day Window settings, and deterministic Week/settings tests are unchanged.

Implementation files: `apps/mobile/src/features/commitments/commitment-editor.tsx` and `commitment-date-time-fields.native.tsx`. Regression files: `apps/mobile/__tests__/commitment-keyboard-test.tsx`, `commitment-keyboard-web-test.tsx`, and the existing focused Android configuration extended to include #12.

Checked the installed types/ScrollView/Fabric event implementation alongside the official React Native 0.86 [ScrollView documentation](https://reactnative.dev/docs/0.86/scrollview#keyboarddismissmode), [Keyboard API](https://reactnative.dev/docs/0.86/keyboard), [responder guide](https://reactnative.dev/docs/0.86/gesture-responder-system), and [TextInput documentation](https://reactnative.dev/docs/0.86/textinput). Interactive dismissal is iOS-specific; multiline Return retains its existing newline behavior.

## Automated verification

Commands run from `D:\code\LifeOS`:

| Command | Final result |
| --- | --- |
| `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/commitment-keyboard-test.tsx __tests__/commitment-keyboard-web-test.tsx` | 2 suites, 11 passed. Also passed after the final gesture refinement in the combined run below. |
| `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/commitment-keyboard-test.tsx __tests__/commitment-keyboard-web-test.tsx __tests__/commitment-time-picker-test.tsx __tests__/commitment-screen-test.tsx __tests__/commitment-web-fields-test.tsx` | 5 suites, 26 passed, 1 existing Android-only exclusion, 0 failures. |
| `npm.cmd run test --workspace @lifeos/mobile -- --config jest.commitment-android.config.js` | 2 suites, 11 passed, 9 existing iOS-only exclusions, 0 failures. |
| `npm.cmd run test --workspace @lifeos/mobile` | 35 suites, 196 passed, 1 existing Android-only exclusion (197 total), 0 failures. |
| `npm.cmd run typecheck --workspace @lifeos/mobile` | Passed. |
| `npm.cmd run lint --workspace @lifeos/mobile` | Passed. |
| `git diff --check` | Passed. |

The exclusions are complementary existing #11 cases, not new skips: the Android case passes in the Android run, and the nine iOS cases pass in the standard run. No checks or console failures were suppressed. Initial new-test failures were harness mistakes (unsupported RNTL matcher/query APIs and incomplete synthetic DOM touch events), corrected using the installed APIs and complete touch events. The real React Native Web editor harness retains the native Jest preset's TurboModuleRegistry solely for Expo's lazy test-environment polyfills, resolving its initial logger warning without suppressing output. Final runs are clean.

Native tests render the actual editor and fields, mocking only the native picker widget. They cover create/edit blank taps and drag exclusion, one-tap actions, typing and multiline data, date cancellation, exact 09:17, optional-end clearing/reopening and stale events, validation, delete confirmation/cancellation, and exact onSave payloads. Because RNTL does not perform native event bubbling, tests explicitly deliver target/currentTarget pairs to the observing surfaces. Web tests render the actual editor with React Native Web and real DOM date/time/text controls, checking focus transitions, selection range, focusable controls, multiline input, and one-click save payloads. Programmatic DOM focusability is not proof of physical Tab-key navigation or native focus gestures.

No API check was needed: the diff does not change a persistence contract. Existing mobile API/screen tests pass in the full suite. Only isolated callbacks/fixtures were used; no real commitments or production data were created, edited, or deleted.

## Desktop-first owner review

No connected desktop browser was available (browser discovery returned no browsers), so no live browser interaction or screenshot verification was performed. No listener was observed on local Metro ports 8081–8083, and no development server was started during this task.

If Metro is already running when you review, reuse it: press `w` to open Web and reload the existing browser tab. Otherwise, from `D:\code\LifeOS`:

```powershell
npm.cmd run start --workspace @lifeos/mobile -- --web
```

Use the URL printed by Expo, normally `http://localhost:8081`. Keep the checkout's existing environment configuration. Only if it points to a local API, start that API in another terminal with `npm.cmd run api`.

In a disposable test account, review both creation and editing: title/description typing and selection, multiline Return, mouse clicks and Tab navigation among text/date/time/actions, optional details and life area, time 09:17 and optional-end clearing, invalid Save, valid Save and reopening. Check narrow-width Hebrew RTL and separate blank-space versus outside-backdrop behavior. Unsaved blank taps must never close or save the editor. Desktop review checks Web behavior; it cannot establish native soft-keyboard dismissal or iPhone wheel layout.

This diff needs a Web/JS reload only with an already compatible development client. It does not require a native rebuild. A standalone Release app does not load this checkout from Metro.

## Physical-iPhone acceptance — evidence reconciliation

The historical implementation session performed no device/simulator verification. The later owner approval accepts the normal touch, text, picker, and save/reopen flows above. The original extended checklist below retains combined cases without implying a full VoiceOver, safe-area, deletion, or exhaustive gesture audit:

- [x] Type in the title, tap sheet padding, heading gaps, and form gaps. Keyboard dismisses; editor and entered data remain. Repeat from multiline description.
- [x] Transfer directly between title and description; reposition/select text, continue typing, and insert a newline. No ancestor blur or swallowed gesture.
- [x] From a focused text field, tap Date, Start, and End individually. Each dismisses and activates in one tap. Change hour then minutes to 09:17, confirm, reopen, and cancel a change; keep #11's precise value and isolated draft.
- [ ] Open details, choose/toggle life area, set/clear optional end, and intentionally Save in one interaction each. Reopen and confirm title, description, date, times, and area. Invalid end-before/equal-start still blocks Save. Delete requires explicit confirmation; cancel preserves edits.
- [ ] With keyboard open, drag the form and reach all fields/actions. Check interactive dismissal, narrow-screen Hebrew RTL, safe areas, and VoiceOver focus order. Wheel manipulation and text selection must not trigger background dismissal or unintended close/save.
- [ ] While a time draft is open, tap a blank area; it neither confirms nor cancels the draft. Verify Confirm/Cancel remain reachable. Recheck #11's separate [device evidence reconciliation](issue-11-verification.md#physical-iphone-checklist--evidence-reconciliation).

## Project and manual Git checkpoint

#12's single existing item was moved Backlog → In Progress → Verify, with each status read back. Final readback: **OPEN, Verify, P2 — Medium**. #11 remains **OPEN, Verify, P1 — High** and its pending iPhone acceptance was not changed. No device-dependent issue checkbox was completed.

After owner review and required verification, the owner inspects the diff, stages the intended files, commits, and pushes manually. Suggested commit: `fix(mobile): dismiss keyboard when leaving commitment text fields`. No staging, commit, push, branch operation, PR, release, or deployment was performed. Keep #12 open until owner acceptance.
