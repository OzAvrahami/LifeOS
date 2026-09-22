# LifeOS Implementation Status

- **Last updated:** 2026-09-22
- **#1 handoff status:** Closed / Completed / Done / P2 — Medium. **LifeOS 0.4.0 (7)** is owner-accepted for release on 2026-09-22; production schema/API rollout is complete. Publication is prepared, not yet published. See [current verification](issue-1-verification.md).
- **Accepted internal build:** LifeOS **0.4.0 (7)** on iPhone 17 Pro Max, owner-reported installation, launch, usable normal UI and release approval on **2026-09-22**. Includes #1. See [release verification](release-0.4.0-verification.md).
- **Current work item:** v0.4.0 acceptance/publication documentation only; no implementation is selected. #26 explicit category toggles and #27 contextual category details are non-blocking Open / Backlog / P2 follow-ups, not part of v0.4.0.
- **Project status:** #3 and #4 are Closed / Completed / Done / P1 — High, read back after the owner accepted 0.3.0 (4). #7/#8/#10 and #11/#12/#13 remain Closed / Completed / Done. Priorities, unrelated states, labels, assignees, milestones and membership are preserved.
- **Latest published release:** [LifeOS v0.3.0 — Weekly planning and week navigation](https://github.com/OzAvrahami/LifeOS/releases/tag/v0.3.0), published **2026-09-13T19:24:14Z**, non-draft and non-prerelease. Annotated tag target: `cefd84a6d8e21c631bc666d49d20ac91ccce2657`, the accepted #3/#4 checkpoint. v0.2.1 is historical; post-publication docs do not move the tag.
- **Last owner-accepted internal version:** **0.4.0/build 7**, source baseline `c99ef3f402687befc37d252d246634dae5ede27a`. No installed-binary SHA was extracted. Build 5 failed launch; build 6 fixed startup but was superseded, not failed or accepted. Earlier 0.3.0 and 0.2.1 acceptances remain separate historical evidence.
- **Acceptance:** The owner states 0.4.0 (7) appears to work correctly and explicitly approves release. This does not attest every individual permission/delivery/background/cold-start/tap/timezone/DST scenario. Prior automated/native evidence supports internal behavior separately; no new instrumented production or full accessibility audit is claimed.
- **API evidence:** Owner-confirmed production application/history reconciliation of `20260922120000` (`20260922120000 | 20260922120000`). GitHub reports `LifeOS - @lifeos/api = success` for exact source `c99ef3f`, updated `2026-09-22T10:39:33Z`; no independent active-provider inspection was performed.
- **Current phase:** Phase 9 ongoing usage continues. Prior 0.2.1/0.3.0 publication milestones are complete; 0.4.0 (7) internal acceptance is complete and GitHub publication is prepared, not yet performed.
- **Phase 8 status:** Historical standalone verification remains recorded for 2026-08-20; current 0.2.1 owner evidence is separately dated 2026-09-08.
- **Next action:** Owner review and manual acceptance-documentation Git checkpoint, followed by separate manual v0.4.0 tag/publication. No schema/API/device rollout remains pending for this accepted build.

This document is the current source of truth for implementation status. “Verified” means supported by tracked code plus a repeatable repository check; it does not imply remote or real-device verification unless stated.

## Current workflow — 2026-09-08

**Historical reconciliation snapshot:** The table below records 2026-09-08, before the owner closed #7/#8/#10 and selected #4 for implementation. Current #4 implementation and acceptance are recorded above and in [its verification record](issue-4-verification.md).

The focused reconciliation changed only the existing Status field for #3 (Verify → Ready), #4 (In Progress → Ready), and #10 (In Progress → Verify). Issues remain open and P1 — High. No implementation, acceptance checkboxes, issue scope, or priorities were changed.

| Issue | Recorded state / Status | Evidence and remaining gate |
| --- | --- | --- |
| [#3](https://github.com/OzAvrahami/LifeOS/issues/3#issuecomment-5583631633) | Open / Ready | `5a18f28` implements authenticated Weekly Focus editing; the wizard is preview-only. Full persisted lifecycle/progress, resume, completion, and completed-plan review/edit remain unimplemented. No inspected active implementation. |
| [#4](https://github.com/OzAvrahami/LifeOS/issues/4#issuecomment-5583631766) | Open / Ready | `82e911b`, `a0bd7eb`, and #13 provide summaries, week-only expansion, and scheduling. Selected-week navigation, full day task/commitment inspection, day navigation, detail access, and return context remain incomplete; committed work is paused. |
| [#7](https://github.com/OzAvrahami/LifeOS/issues/7#issuecomment-5583632191) | Open / Verify | `bc6b2f6` and existing settings/API tests support Day Window. Owner same-day/overnight/cleared persistence and independent Today task-time acceptance remain pending. |
| [#8](https://github.com/OzAvrahami/LifeOS/issues/8#issuecomment-5583632405) | Open / Verify | `3bbbc8a` excludes hardcoded preview suggestions from authenticated Today; empty/populated hydration tests cover the root cause. Owner fixture-exclusion checks across restart/logout-login remain pending. Orphan-record cleanup hypotheses do not describe the discovered source. |
| [#10](https://github.com/OzAvrahami/LifeOS/issues/10#issuecomment-5583631959) | Open / Verify | `82e911b`, aggregation tests, and cache regressions support real plannedDate membership, active-status filtering, explicit-duration totals, and updates. Known-data iPhone totals/freshness acceptance remains pending; #4’s missing day-detail UI is not a blocker. |

#2 remains Open / Ready / P1. #6 remains Open / Ready / P1, with its body unchanged. **Owner decision pending: close as NOT_PLANNED, superseded by #7's retired Today capacity display; not a claim that the historical calculation was repaired.** No disposition was applied.

#11/#12/#13 remain Closed / Completed / Done. #1/#5/#9/#14–#18 remain Backlog with existing priorities; #16 has not begun. The owner’s #11–#13 acceptance is not extended to unrelated checks. Prior automated results remain historical evidence; no new test or device verification was performed during reconciliation.

## Issue #11 historical implementation review — 2026-09-07

The local commitment time-picker fix adds exact-minute draft/confirm/cancel behavior and a full-width iOS selection surface within the existing editor. Focused iOS/Android, Web/date-field, and API precision tests pass, as do mobile/API typecheck and lint. The authorized test-only follow-up replaces the pre-existing date-dependent Monday-label assertion with controlled Monday/Thursday cases covering query boundaries, all seven rows, Today treatment, and cache preservation. The full mobile suite now passes: 33 suites, 185 tests passed, one existing Android-only exclusion covered by the separate Android run. #11 was moved to Verify and read back as open with P1 — High; physical-iPhone acceptance is still pending. No release/version, Git state, or other issue status changes were made. See [the verification record and owner checklist](issue-11-verification.md). These are implementation-time checks. The owner subsequently accepted desktop behavior and the 0.2.1/build 3 physical picker/save-reopen flows; #11 is now Closed/Completed/Done as recorded above.

## Issue #12 historical implementation review — 2026-09-07

Implemented against the owner's clean `main` at `6bbccdc` (#11). Commitment form background taps now request native keyboard dismissal without taking responder ownership; drags remain governed by platform scrolling behavior. Date, optional-end clearing, details, life-area selection, Save, and delete-request actions dismiss within their own handlers. Web text/date/time focus and #11's picker drafts, precise minutes, validation, and cancellation remain intact. All automated gates pass: 35 mobile suites, 196 tests passed, one existing Android-only exclusion; the separate Android run passes 11 tests, with nine complementary iOS exclusions. Mobile typecheck/lint and whitespace checks pass. #12 was read back as open, Verify, P2 — Medium. #11 remains open/Verify/P1, with its physical-iPhone acceptance pending. No connected browser or native device was available; DOM/native mocks are automated evidence only. See [the #12 verification record](issue-12-verification.md) for exact commands and desktop-first owner instructions. These are implementation-time checks. The owner subsequently accepted desktop behavior and 0.2.1/build 3 physical keyboard/text/picker flows; #12 is now Closed/Completed/Done as recorded above.

## Issue #13 owner acceptance — 2026-09-08

The owner previously accepted isolated preview/demo behavior and now reports accepting planning-date selection, visible placement, distant dates, cancellation, disposable-task movement without a visible duplicate, and selected-date persistence after saving/reopening the installed 0.2.1/build 3 app. This is actual owner-reported device persistence evidence, not only preview verification. Prior component/API/cache tests support exact planning payloads, identity/field/deadline/status/history preservation, and timezone/cache invariants. No new instrumented database inspection or physical timezone matrix was performed. #13 is Closed/Completed/Done with P1 — High preserved. See [the issue record](issue-13-verification.md) and [release acceptance](release-0.2.1-verification.md).

## Implementation matrix

| Area | Status | Persistence | Tests | Notes |
| --- | --- | --- | --- | --- |
| Product/UI foundation | ✅ Verified | N/A | Mobile visual-state/component coverage | Hebrew/RTL, mobile-first tokens, approved design export, and canonical previews are committed. Pixel-perfect device verification is separate. |
| Mobile navigation | ✅ Verified | Session route state | Mobile navigation/Auth-gate tests | Expo Router routes exist for Auth, Today, Week, Inbox, More, Settings, and Account. |
| Tasks | ✅ Verified remotely and on device | Remote migration and authenticated API persistence verified | API, Mobile, local real-JWT/RLS harness, remote Phase 7C E2E | Stable UUIDs survived the remote Core Flow; single-active handoff, two-user isolation, and real-device Core Flow passed. |
| Quick Capture | ✅ Verified remotely and on device | Remote API capture persistence verified | Mobile API/cache/flow tests; remote Phase 7C E2E | Capture persisted through fresh reads, API restart, logout/login, app restart, and the final real-iPhone smoke. Issue #13 date selection and save/app-reopen persistence are now owner-accepted on 0.2.1/build 3; internal invariants retain prior automated evidence. |
| Inbox | ✅ Verified remotely and on device | Remote API persistence verified | UI, processing, routing, Task flow tests; remote Phase 7C E2E | The same Task persisted through Inbox → Week/Today without duplication; the real-iPhone Core Flow passed. |
| Today | ✅ Owner-accepted #7/#8 behavior | Tasks, DailyPlan, Commitments, Settings previously verified remotely | Today, hydration, task-flow, planning, commitment, settings tests | Committed source shows planned Task time without a capacity denominator, discloses missing estimates, and excludes fixture suggestions. The owner identifies #7/#8 behavior as accepted; live issues are Closed/Completed/Done. Earlier browser/migration reports remain dated evidence. |
| Week | ✅ #4 owner-accepted on 0.3.0 (4) | Tasks, WeekPlan, WeeklyFocus, Commitments verified remotely | Week, planning, commitments, settings-boundary tests; remote Phase 7C E2E | Normal authenticated use now exposes an account/week-scoped Weekly Focus editor; fixture planning content is development-preview-only. The stabilization is committed at `5a18f28`. #10 is now Closed/Completed/Done; its aggregation is unchanged. #4 adds selected-week queries/focus editing, full day contents, navigation, and detail/create/move/lifecycle access through existing forms and caches. See [the new regression evidence](issue-4-verification.md). |
| Daily/Weekly planning | 🟡 Partial | DailyPlan/WeeklyFocus migrations + APIs verified remotely | API, cache, UI, local and remote RLS checks | DailyPlan and ordered WeeklyFocus persistence survived restart and logout/login. Issue #3 now implements explicit persisted lifecycle/progress, resume, and completed review/edit over the existing WeekPlan. Software checks and real local PostgreSQL/Auth/RLS integration passed; the owner confirmed production readiness and accepted #3 on 0.3.0 (4). Broader Daily Planning remains partial. |
| Commitments | ✅ Verified remotely | Commitment migration + API verified remotely | API, UI/cache/workload, local and remote RLS checks | One-time remote persistence and two-user isolation passed. Recurrence and calendar sync are deferred. |
| Workload/availability | 🟡 Retired from Today | Legacy DailyPlan override + UserSettings default retained | Legacy metrics/data-integrity tests | Today no longer claims availability or capacity-derived status. Commitments remain separate; missing Task estimates are disclosed rather than treated as known time. |
| More / Settings | ✅ Owner-accepted #7 behavior | Legacy UserSettings verified remotely; user reports Day Window migration applied and browser checks passed | API, UI/cache/date, local RLS tests | “היום שלי” stores nullable recurring local clock times. Pre-upgrade servers are detected and no device-only save is claimed. Owner confirms the installed app displays 0.2.1/build 3; #7 is now Closed/Completed/Done; this work does not extend acceptance to other Settings features. |
| API | ✅ Deployed and verified | Stateless Railway HTTPS service over caller-scoped Supabase | API unit/integration suite; Railway health and authenticated identity checks | `lifeos-api` runs compiled JavaScript on Railway; public health and authenticated `/auth/me` checks passed. |
| Authentication | ✅ Verified remotely and on device | Remote Supabase Auth session flow verified | Auth provider/UI/callback/API and bootstrap-race tests; remote Phase 7C E2E | Remote and real-iPhone login, logout/login restoration, and restart persistence passed; the stale-bootstrap session race is fixed. |
| Supabase/database | ✅ Historical verification + user-reported Day Window rollout | Five baseline migrations verified remotely; sixth Day Window migration reported applied by user | Local reset/lint, remote history/dry-run/lint, opt-in local integration harness | Phase 7 history/dry-run/lint verified the five baseline migrations. Day Window rollout is user-reported; no production migration or fresh remote schema audit was run during v0.2.0 preparation. |
| RLS/security | ✅ Verified locally and remotely | Caller-JWT RLS policies on all user data | Two-user local harness; anonymous and authenticated remote checks | Bidirectional remote read/write isolation passed for Tasks, WeekPlans, DailyPlans, WeeklyFocuses, Commitments, and UserSettings; anonymous table/RPC denial remains verified with `42501`. |
| Cross-screen synchronization | ✅ Verified in automation, remotely, and on device | TanStack Query user-scoped caches | Cache membership/request-audit tests | Targeted cache updates prevent copies and request multipliers; remote and real-device Core Flow remained consistent. |
| Automated tests | ✅ #3 software and local integration checks passed | N/A | Prior #3 runs: 40 Mobile suites, 258 passed / 1 existing Android exclusion; 8 API suites, 77 passed; separate Android regression 3 passed | Independent local harness rerun passed all 11 PostgreSQL/Auth/RLS groups on 2026-09-13. Full suites were not rerun for the documentation follow-up. See [exact commands and evidence boundaries](issue-3-verification.md#automated-evidence). |
| Real-device verification | ✅ Historical verification + owner-accepted 0.2.1 flows | Remote authenticated persistence observed on device | Real-iPhone development and Release-build smokes | The installed Release build operated over cellular with Metro, the local API, and the Mac unavailable. It remains development-signed and is not a TestFlight or App Store release. |
| Notifications MVP (#1) | Owner-accepted 0.4.0 (7); publication prepared | Production schema rollout confirmed by owner; GitHub API status success | Prior: 47 mobile suites (310 passed, 1 existing skip); 86 API tests; 13 local DB/RLS groups | #1 completed. Owner reports install/launch/usable UI and approves release; individual notification scenarios are not all attested. #26/#27 remain non-blocking follow-ups. See [#1](issue-1-verification.md). |
| Life Areas and broader product modules | ⏸️ Deferred | None | None | Life Areas UI remains disabled; recurring task schedules, external calendars, AI, projects, habits, and billing are outside the current gate. |

## Evidence by subsystem

### Product/UI foundation

- Expo SDK 57 React Native application with Assistant typography and RTL-first screens.
- Approved Today, Week, Inbox, Auth, Commitments, More, and Settings designs are represented in the committed design export.
- Development-only fixture routes preserve canonical states independently of server data.

### Mobile navigation

- Protected product routes: `/`, `/week`, `/inbox`, `/more`, `/settings`, and `/account`.
- Public Auth routes and callback/recovery handling are registered separately.
- Bottom navigation keeps Today, Week, Inbox, More, and the shared center Quick Capture available where intended.

### Tasks and core flow

- One Task row changes planning/execution state; moves do not insert copies.
- API supports list, create, patch, and retained cancellation.
- PostgreSQL enforces one active Task per user; `start_task()` performs the handoff atomically.
- Normal authenticated Today, Week, Inbox, and Quick Capture use TanStack Query → Node API → caller-JWT Supabase.

### Planning, Commitments, and Settings

- Daily Focus points to an existing same-owner Today Task.
- WeeklyFocus belongs to a WeekPlan, is ordered, and is capped at three selected rows.
- Normal authenticated Week loads WeeklyFocus data before enabling its focused editor; empty, cancel, clear, failed-save/retry, and cache-backed reopen behavior do not fall back to fixtures or create Tasks.
- The fixture-backed four-step Weekly Planning wizard is restricted to explicit development previews and cannot persist account data.
- One-time Commitments are separate from Tasks and are physically deleted.
- Daily capacity, week start, and IANA timezone are persisted in one UserSettings row per user.
- DailyPlan capacity overrides the global setting; changing week start does not rewrite historical WeekPlans.
- The optional Day Window is stored as a nullable start/end local clock-time pair; omission preserves it, both-null clears it, and an earlier end is overnight.
- Day Window is not availability and does not change Task or DailyPlan calendar-date ownership.

### API, Auth, database, and security

- Node/Express verifies Bearer tokens with Supabase Auth and creates caller-scoped clients for RLS.
- `/auth/me` returns only a safe identity payload.
- Every tracked user-owned product table has RLS policies.
- The local integration harness refuses non-local Supabase URLs and uses two real disposable Auth users/JWTs.

## Known gaps / risks

1. Phase 7C and the real-iPhone smokes are dated release verifications, not always-on CI jobs; the dedicated E2E rows remain available as persistence evidence.
2. Broader end-of-day review/replanning remains incomplete. Issue #13 implements exposed calendar-date capture/moves; distant-week navigation/day discovery is implemented by #4 and owner-accepted on 0.3.0 (4).
3. The Product Spec mentions an “All Tasks” screen and Life Areas, but neither is part of the narrow v0.1 release gate; Life Areas are explicitly disabled/deferred.
4. Expo Web is a secondary review/development target, not the v0.1 release platform.
5. The standalone iPhone build uses the current Apple Personal Team/development-distribution setup. TestFlight and App Store distribution are not complete.
6. The user reported Issue #7’s Day Window migration applied and browser checks passed. This task did not repeat migrations or independently verify the deployed API/schema; the owner now identifies #7 as accepted and its live issue is Closed/Completed/Done. No new device test is claimed here.
7. Issue #3’s lifecycle migration/API/flow and automated verification are complete. The independent local PostgreSQL/Auth/RLS rerun passed all 11 groups using the owner-prepared stack. That verifies local schema/RPC behavior separately from the later owner-confirmed production prerequisites and physical acceptance on 0.3.0 (4).
8. Issue #4’s software and targeted owner iPhone acceptance are complete on 0.3.0 (4). [The accepted checklist](issue-4-verification.md#physical-iphone-owner-checklist) records its scope; no full accessibility audit or new task-estimate editing capability is implied.

## Current Critical Path

1. #3 and #4 are complete on owner-accepted 0.3.0 (4); acceptance checkpoint `cefd84a` is the fixed published v0.3.0 tag source.
2. v0.3.0 publication is complete. Preserve the fixed tag, accepted behavior and unrelated backlog; no further implementation or build is selected.

## Current release gate

### v0.3.0/build 4

**Status: PUBLISHED ON GITHUB; INSTALLED AND OWNER-ACCEPTED.** #3 and #4 are Closed/Completed/Done after owner-reported physical acceptance on 2026-09-13. Production prerequisites were confirmed before the test. v0.3.0 is Latest, published 2026-09-13 at 19:24:14 UTC, non-draft and non-prerelease. Its annotated tag remains at `cefd84a6d8e21c631bc666d49d20ac91ccce2657`; later documentation commits are separate. See [the acceptance record](release-0.3.0-verification.md).

### v0.2.1/build 3

**Status: PUBLISHED ON GITHUB; INSTALLED AND OWNER-ACCEPTED INTERNALLY FOR #11/#12/#13.** The owner built/installed after preparation commit `2aa6bc4`, confirmed the displayed version/build, and approved the documented physical flows and tested save/app-reopen persistence on 2026-09-08. Prior preparation/test results below remain historical. Internal IDs/history/RLS were not newly inspected, and broad accessibility/device-timezone checks are not implied. Unrelated Day Window/Today/Week/Weekly Focus acceptance is unchanged. See [the detailed evidence boundary](release-0.2.1-verification.md).

## Historical release gates

### v0.1.1

**Status: PUBLISHED on GitHub, 2026-08-27.** Phase 8 is complete: the Railway HTTPS API, authenticated Railway identity request, Railway-backed Mobile configuration, and standalone real-iPhone Release operation have been verified. The deployed architecture is iPhone → Railway HTTPS API → Supabase Cloud. This release does not represent TestFlight or App Store distribution.

### v0.1.0-alpha.1

**Status: RELEASED.** Tag `v0.1.0-alpha.1` marks the first development baseline. On 2026-08-15, root TypeScript and lint passed; 109 Mobile and 37 API tests passed; the local two-user real-JWT/RLS harness passed; Expo Doctor passed 21/21 checks; and iOS/Web exports succeeded.

### v0.1.0-alpha.2

**Status: RELEASED.** Tag `v0.1.0-alpha.2` records completed Phase 7C remote Auth/RLS/Core Flow E2E verification and the deployed Data API privilege normalization.

### v0.1.0

**Status: RELEASED.** Phase 7A migration alignment, Phase 7B privilege normalization, Phase 7C remote Auth/RLS/Core Flow, real-iPhone persistence smokes, the two device-discovered regression fixes, Expo SDK patch alignment, and the final fresh-build smoke all passed. The published v0.1.0 release records the first internal MVP milestone.

## Next Action

**Next gate:** Owner review/manual documentation checkpoint and separate v0.4.0 publication. No new implementation is selected; #26/#27 remain Backlog and unrelated backlog/dispositions are unchanged.

## v0.2.0 preparation validation — 2026-09-06

| Check | Result |
| --- | --- |
| Repository baseline | Clean `main` at `5a18f28` before edits; HEAD and branch unchanged; release-preparation files remain unstaged |
| `npm run typecheck` | Passed for API and Mobile |
| `npm run lint` | Passed for API and Mobile |
| `npm test` | Passed: 44 API tests and 171 Mobile tests across 31 suites |
| Settings footer coverage | Native/config build mismatch, release/development labels, web fallback, missing metadata, and Settings integration passed; focused suite rerun after a test-only TypeScript correction |
| Version/config consistency | Package and resolved Expo versions `0.2.0`; iOS build `2`; exactly four lockfile version fields changed, no dependency changes |
| Native metadata | Info.plist and project plist syntax passed; comparison with originals confirms only version/build fields changed, including Debug/Release settings |
| Environment | Effective production API matches documented Railway HTTPS URL; required public Supabase variables present; values not printed |
| `git diff --check` | Passed |

These are local preparation checks. No production migrations, deployments, device builds/installs, or new remote/device acceptance were performed. Expo Doctor's historical result below was not rerun. The user-reported Day Window migration/browser results remain separate from acceptance of the prepared iPhone build.

## Phase 8 standalone deployment evidence — 2026-08-20

- The compiled API starts with `node dist/src/server.js` and is deployed as the Railway service `lifeos-api` at `https://lifeosapi-production-0362.up.railway.app`.
- Railway `GET /health` returned `{"service":"lifeos-api","status":"ok"}`, and authenticated `GET /auth/me` succeeded with a real Supabase JWT.
- Railway supplies `PORT`; the service uses the remote Supabase URL, publishable key, caller JWT, and RLS. The application does not use `service_role`.
- Mobile targets the Railway HTTPS API in the deployment environment. A real-device Release build was created with `npx expo run:ios --device --configuration Release` using bundle identifier `il.co.ozavrahami.lifeos`.
- Standalone operation passed on the real iPhone over cellular networking with Metro stopped, the local API stopped, and the Mac disconnected: iPhone → Railway API → Supabase Cloud.
- This proves standalone internal usage only. The build is signed through the current Apple development setup and has not been distributed through TestFlight or the App Store.

## Historical validation baseline — 2026-08-20

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed for API and Mobile |
| `npm run lint` | Passed for API and Mobile |
| `npm test` | Passed: 37 API tests and 113 Mobile tests across 26 suites |
| Expo Doctor | Passed 21/21 checks |

These results verify the tracked implementation and local database boundary. Expo Doctor passed 21/21 after the SDK 57 patch alignment. The Phase 7 evidence below separately records remote schema, security, Auth, Core Flow, and real-iPhone verification.

## Phase 7 remote evidence — 2026-08-15

- **Phase 7A complete:** linked project identity was confirmed; migration history matched; dry run was up to date; remote schema/lint were audited without writes.
- **Phase 7B complete:** application-facing privileges were normalized, deployed, and verified; five migrations now match remote history and remote lint passes.
- **Phase 7C complete:** two distinct users authenticated through normal `signInWithPassword`; bidirectional read/write isolation passed for Tasks, WeekPlans, DailyPlans, WeeklyFocuses, Commitments, and UserSettings; and User A completed Quick Capture → Inbox → Week/Today → Active → Completed through the real LifeOS API.
- **Persistence evidence:** unique run marker `lifeos-remote-e2e-20260815204540` survived fresh reads, an API restart, normal logout/fresh password login, and Settings reload. Starting Task 2 returned Task 1 to `open` with `completed_at = null`; User B's active Task remained independent.
- **Retained E2E data:** the two pre-existing Auth users remain. For the unique run, User A retains four Tasks (one completed, three open), one WeekPlan, one DailyPlan, two WeeklyFocuses, one Commitment, and one UserSettings row; User B retains three open Tasks, one WeekPlan, one DailyPlan, two WeeklyFocuses, one Commitment, and one UserSettings row. No test Task remains active.

## Phase 7 real-iPhone evidence — 2026-08-20

- The authenticated Core Flow passed on a real iPhone development build, including Quick Capture, Inbox → Today, Active, Completed, app restart persistence, logout/login persistence, and Settings persistence.
- The AuthProvider startup race discovered during smoke testing was fixed so a stale bootstrap `getSession()` result cannot overwrite a newer auth event; deterministic regression coverage preserves initial restoration, sign-out, and recovery behavior.
- The Today false-empty hydration flicker discovered during smoke testing was fixed so server-backed content waits for initial required-query hydration; completed-only, genuinely empty, open, and active states remain covered.
- Expo SDK 57 patch dependencies were aligned, Expo Doctor passed 21/21, a fresh iOS development build was generated, and the final real-iPhone smoke passed login, correct Today hydration, Quick Capture, restart persistence, and Settings persistence.
