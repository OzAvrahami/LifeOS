# Issue #2 — Tasks and Weekly Focus

## Current handoff — 2026-09-23

**#2: Closed / Completed / Done / P1 — High**, read back after scoped owner acceptance of **LifeOS 0.4.1 (8)**. The prerequisite [#9 decision](issue-9-decision.md) retains optional normal/important Task importance without new priority UI. Full Daily Planning remains #5.

Baseline: clean main at `ce113fbc14142056b042eedba503863cdee17929`, matching the local origin/main reference and read-only remote main lookup. Both issue bodies and all comments were read before implementation (neither had comments at baseline). #9 was handled first: Backlog → In Progress → Verify for decision review. #2 began Ready → In Progress. No unrelated owner changes were present. At the implementation handoff, #2 moved In Progress → Verify and #9 remained Open / Verify / P2 — Medium. Both have since completed their required gates, as recorded below. Readback confirmed original issue metadata, Project membership and unrelated recorded items/fields were preserved. See the [#2 handoff comment](https://github.com/OzAvrahami/LifeOS/issues/2#issuecomment-5793133860) and [#9 decision comment](https://github.com/OzAvrahami/LifeOS/issues/9#issuecomment-5792951985).

## Owner-reported acceptance — 2026-09-23

The owner reports that the prepared iPhone **build 8 was successfully installed wirelessly**. After receiving the physical acceptance checklist, the owner reported **“נראה טוב” (“Looks good”)** and instructed that this be recorded as acceptance of the reviewed behavior. Accepted internal binary: **LifeOS 0.4.1 (8)**. Source checkpoint `3fb6695a094ad6e3682bd069a823e5087a16dfe4` is verified on local and remote main and contains the #2 implementation, approved #9 decision and preparation.

This is scoped owner-reported acceptance, not independent device observation or an assertion that every individual checklist scenario was executed/attested. No binary source SHA was extracted. Automated evidence below supports internal invariants separately. Individual persistence/restart/cancel/layout scenarios were not separately itemized by the owner; no new live-database/history/RLS or full accessibility audit is claimed. No concrete mandatory issue gate remains; publication is separate. [Closure comment](https://github.com/OzAvrahami/LifeOS/issues/2#issuecomment-5793681466).

## Acceptance criteria and implementation evidence

| #2 criterion | Existing behavior inspected before editing | Result / remaining gate |
| --- | --- | --- |
| Distinct semantics | Separate Task and WeeklyFocus models; no Focus-to-Task relationship | Product/data-model clarification and #9 decision explicitly separate action, weekly direction, importance, daily selection, placement, deadlines and reminders |
| Weekly Planning naming | Authenticated Focus editor already says direction, not Task/day assignment | Authenticated planning review and Week card explain the distinction; preview review now displays selected Focus directions instead of fictional day assignments |
| Today does not call a Focus an important Task | #8 already excludes fixture suggestions from authenticated Today | Corrected the remaining preview wording; server Today still has no Focus suggestion feed. Daily selection identifies a real Task selected for daily focus; the normal Task list explains its planned-date source |
| No silent Task insertion | Focus replacement/lifecycle RPCs do not create Tasks; Week totals use real Tasks | Preserved. New action opens the shared blank Quick Capture with Inbox selected. Cancel creates nothing; only explicit Save creates an ordinary Task |
| Source of surfaced Focus | Separate selected-week Focus query/card | Card says weekly directions/results. Capture explains “inspired by” and that the Task is independent; no persisted relationship, inferred priority, date or reminder |
| Clear next action | Week Focus card previously only offered Focus editing; preview Today plus was decorative | Each surfaced Week Focus offers **יצירת משימה חדשה**; planning step 3 can return to the same Week to use it; step 4 retains its Week return action. Preview Today uses the existing capture flow. Actions are offered without pretending to detect matching Tasks |
| Stale/orphaned values reviewed | Existing FK, ownership/RLS, replacement and selected-week query paths | Source/fixture review below; no production record audit or cleanup performed |
| No imaginary priority system | normal/important exists in schema/API; no current shared Task Details toggle | No new levels/control. Misleading preview “important task from this week” removed; priority is never inferred from Focus |
| Hebrew / RTL | Existing Hebrew editors, RTL typography and selected-week navigation | Source/context copy and touch targets retain RTL styles; automated render/interaction checks below. Reviewed behavior is owner-accepted; no separate attestation of each layout/touch/keyboard case or full accessibility audit |
| Reusable model | DailyPlan selects an actual Task; reminders use explicit intent | Documented independent concepts. No #5 implementation or notification behavior change |

Relevant code: `week.components.tsx`, `server-week-screen.tsx`, `weekly-planning-session.tsx`, `week-planning-flow.tsx`, `today-screen.tsx`, `today.components.tsx`, and `quick-capture-sheet.tsx` under `apps/mobile/src/features/`. Existing task creation, cache synchronization, details and lifecycle APIs are reused unchanged. Quick Capture gains only optional explanatory context, not new metadata fields. A user may deliberately choose Today, a date or the displayed week; Inbox remains the default for Focus-originated capture.

## Persistence and stale-data findings

`20260814182107_create_daily_and_weekly_focus.sql` gives every Focus a non-null `week_plan_id` foreign key with cascading deletion. WeekPlan ownership scopes RLS. Focus replacement validates maximum three, trimmed nonempty titles, ordering and uniqueness, and atomically replaces only that account/week's Focus set. The lifecycle extension `20260913120000` preserves WeekPlan identity and existing Focus values; historical focus-only plans are not assumed completed.

Replacement can issue new Focus IDs. Tasks can share a WeekPlan owner but have no Focus foreign key: matching titles or shared week ownership cannot establish a relationship. Therefore the new action creates an independent normal Task, never claims one is attached, and never completes/deletes a Focus when the Task completes. Repeated deliberate capture can create separate Tasks; no title-based deduplication is invented.

The misleading Today suggestion was hardcoded preview content, not evidence of an orphaned database record. Preview planning also displayed fictional day assignments for Focus fixtures; these are removed. Legitimate user-created titles that happen to match fixtures are preserved. Older weeks' Focus sets are valid historical data, not automatically stale. Existing account/week query isolation, empty/error states, explicit clearing and save/retry behavior are preserved. **No live user records were read, no assertion is made that production contains zero stale rows, and no cleanup/migration is needed or performed for this correction.**

## Implementation verification — before version preparation

Run on this checkout on 2026-09-23:

| Command / check | Result |
| --- | --- |
| `npm run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/weekly-focus-screen-test.tsx __tests__/today-screen-test.tsx __tests__/week-screen-test.tsx __tests__/week-planning-focus-test.tsx __tests__/weekly-planning-lifecycle-test.tsx __tests__/task-server-flow-test.tsx __tests__/daily-focus-interaction-test.tsx __tests__/planning-query-cache-test.tsx` | 8 suites, 73 passed, 0 skipped/failed |
| `npm run test --workspace @lifeos/mobile` | 47 suites, 318 passed, 1 existing Android-only skip in the iOS test configuration, 0 failed |
| `npm run test --workspace @lifeos/api` | 11 suites, 86 passed, 0 skipped/failed |
| `npm run typecheck` | API and mobile passed |
| `npm run lint` | API and mobile passed |
| `npx --no-install expo export --platform ios --output-dir /tmp/lifeos-issue2-ios-export` from `apps/mobile` | Passed; one Hermes bundle. `CI=1`, dotenv disabled, process-only non-service API/Supabase placeholders; no environment files changed |
| `git diff --check` and changed-document local links/anchors | Passed |
| Version/source boundary | Root/API/mobile/Expo remain 0.4.0; iOS build 7. No package/lockfile, API, schema, native or environment changes |

New regressions cover cancel without creation, explicit independent Inbox capture, no inferred metadata, selected-future-week placement, failed-create retry, same-title Task/Focus independence through normal Task completion, planning return context, and preview selection-only review. Existing tests retain Focus max-three/order/clear/error behavior, account/week cache isolation, Week/day navigation, aggregation, Task lifecycle and notification coverage.

An initial new integration-style UI test expected the Inbox sheet to remain after moving a Task to Today; the existing flow already navigates to Today. The test was corrected to assert that transition; final focused and full suites pass. Expo's existing Expo Go remote-push warning appeared in Jest output; no remote notification feature was added.

Tests use isolated mocks/fixtures; they do not constitute production persistence or physical-device acceptance. Local PostgreSQL/RLS integration was not rerun because no database, RPC or API implementation changed; existing migrations/constraint tests were inspected. No native compilation, installation, production data inspection, cleanup or rollout was performed.

## Release candidate

Locally prepared on 2026-09-23 after owner authorization; see [version evidence and pre-device checks](release-0.4.1-verification.md). The earlier test table describes the pre-preparation implementation snapshot. Runtime source/tests are unchanged since those passes.

| Field | Value |
| --- | --- |
| SemVer impact | Patch: correction of existing Task/Focus semantics, labels and use of existing capture |
| Candidate version | 0.4.1; #2 plus the owner-approved #9 decision |
| Candidate iOS build | 8; greater than all inspected built/prepared candidates (maximum 7) |
| Version prepared | Yes; canonical manifests/app config and only four lockfile version values updated |
| Native version synchronized | Yes; Info.plist and Debug/Release version fields verified as 0.4.1 / 8; unrelated native settings preserved |
| Physical build installed | Yes; owner reports successful wireless installation of prepared 0.4.1 (8) |
| Owner accepted exact build | Yes, scoped owner report on 2026-09-23: “נראה טוב” (“Looks good”); not individual checklist attestations |
| Included issues | #2 software correction + accepted #9 decision; checkpoint `3fb6695a094ad6e3682bd069a823e5087a16dfe4` |

Local preparation and the applicable [pre-device checks](DEVELOPMENT_WORKFLOW.md#mandatory-pre-device-gate) are recorded in the candidate record. The owner Git checkpoint is complete and the owner reports successful wireless installation. No build/install was performed by the assistant during this documentation finalization.

## Supplied owner acceptance checklist

**Historical checklist supplied before the owner response.** The owner subsequently accepted the reviewed behavior of **LifeOS 0.4.1 (8)** as recorded above. The items below retain the original review scope; they are not individually marked passed and are not a request to repeat acceptance.

1. In a selected week, review/edit/save up to three Focus directions. They remain distinct from day Tasks and do not change Task totals or appear automatically in Today/Inbox. Browse another week and return; saved Focus values remain scoped correctly.
2. Use **יצירת משימה חדשה** on a Focus. Verify blank title, independent-Task explanation and Inbox default. Cancel once (no Task); then explicitly save a disposable action and find the normal Task in Inbox. The Focus stays unchanged.
3. Repeat with explicit placement in a displayed future week/date. Verify the chosen placement, normal Task details/start/completion behavior and unchanged Focus. No inferred importance, deadline or reminder should appear.
4. Today explains the planned-date list and a deliberately selected daily Task; no preview Focus suggestion appears after app restart/login. Reopen the saved Task/Focus to confirm persistence.
5. Check Hebrew RTL wrapping, readable source labels, create/cancel/save touch targets and keyboard/scroll behavior on the physical iPhone. This is scoped UI acceptance, not a full accessibility audit.

The owner approved #9 semantics on 2026-09-23; its Git checkpoint is now verified and #9 is complete. A future optional importance control and #5 remain excluded. #2 closure rests on its new scoped 0.4.1 (8) acceptance and prior software evidence, not the older 0.4.0 (7) acceptance.
