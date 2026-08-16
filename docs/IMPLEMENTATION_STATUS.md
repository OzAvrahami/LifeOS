# LifeOS Implementation Status

- **Last updated:** 2026-08-16
- **Current target release:** v0.1.0-alpha.2 — Cloud Core Flow E2E verified snapshot being prepared
- **Current phase:** Phase 7 — real-iPhone release-gate verification
- **Phase 7C status:** PASSED — Remote Auth/RLS/Core Flow E2E verified
- **Next exact task:** Run the authenticated v0.1.0 release smoke on a real iPhone development build, including Capture → Inbox → Week/Today → Active → Completed, restart, logout/login, and Settings persistence.

This document is the current source of truth for implementation status. “Verified” means supported by tracked code plus a repeatable repository check; it does not imply remote or real-device verification unless stated.

## Implementation matrix

| Area | Status | Persistence | Tests | Notes |
| --- | --- | --- | --- | --- |
| Product/UI foundation | ✅ Verified | N/A | Mobile visual-state/component coverage | Hebrew/RTL, mobile-first tokens, approved design export, and canonical previews are committed. Pixel-perfect device verification is separate. |
| Mobile navigation | ✅ Verified | Session route state | Mobile navigation/Auth-gate tests | Expo Router routes exist for Auth, Today, Week, Inbox, More, Settings, and Account. |
| Tasks | ✅ Verified remotely | Remote migration and authenticated API persistence verified | API, Mobile, local real-JWT/RLS harness, remote Phase 7C E2E | Stable UUIDs survived the remote Core Flow; single-active handoff and two-user isolation passed. Real-device UI verification remains separate. |
| Quick Capture | 🟡 Partial / real-device verification required | Remote API capture persistence verified | Mobile API/cache/flow tests; remote Phase 7C E2E | Capture persisted through fresh reads, API restart, and logout/login. `Choose day` remains intentionally limited to the approved lightweight behavior. |
| Inbox | 🟡 Partial / real-device verification required | Remote API persistence verified | UI, processing, routing, Task flow tests; remote Phase 7C E2E | The same remote Task persisted through Inbox → Week/Today without duplication. Real-iPhone UI verification remains. |
| Today | 🟡 Partial / real-device verification required | Tasks, DailyPlan, Commitments, Settings verified remotely | Today, task-flow, planning, commitment, settings tests; remote Phase 7C E2E | Today → Active → Completed and related planning state persisted remotely. End-of-day rescheduling is not complete. |
| Week | 🟡 Partial / real-device verification required | Tasks, WeekPlan, WeeklyFocus, Commitments verified remotely | Week, planning, commitments, settings-boundary tests; remote Phase 7C E2E | Inbox → Week → Today and ordered WeeklyFocus persistence passed remotely. Real-iPhone UI verification remains. |
| Daily/Weekly planning | 🟡 Partial / real-device verification required | DailyPlan/WeeklyFocus migrations + APIs verified remotely | API, cache, UI, local and remote RLS checks | DailyPlan and ordered WeeklyFocus persistence survived restart and logout/login. Full planning ritual state is intentionally not persisted. |
| Commitments | 🟡 Partial / real-device verification required | Commitment migration + API verified remotely | API, UI/cache/workload, local and remote RLS checks | One-time remote persistence and two-user isolation passed. Recurrence and calendar sync are deferred. |
| Workload/availability | ✅ Verified | DailyPlan override + UserSettings default | Metrics and screen integration tests | Task estimates plus timed Commitments drive Today status; missing durations contribute zero. Real-use calibration remains product validation. |
| More / Settings | 🟡 Partial / real-device verification required | UserSettings remote persistence verified | API, UI/cache/date, local RLS tests; remote Phase 7C E2E | A reversible capacity change survived fresh fetch and logout/login; two-user Settings isolation passed. Real-iPhone UI verification remains. |
| API | ✅ Verified | Stateless REST over caller-scoped Supabase | API unit/integration suite | Health, Auth identity, Tasks, planning, Commitments, and Settings routes exist with validation and safe errors. |
| Authentication | 🟡 Partial / real-device verification required | Remote Supabase Auth session flow verified | Auth provider/UI/callback/API tests; remote Phase 7C E2E | Two distinct confirmed users signed in normally; `/auth/me`, logout, fresh password login, and caller-owned data restoration passed. Real-iPhone Auth remains. |
| Supabase/database | ✅ Verified | Five versioned migrations deployed remotely | Local reset/lint, remote history/dry-run/lint, opt-in local integration harness | Remote history matches all five migrations, linked dry-run is up to date, and remote public-schema lint passes. |
| RLS/security | ✅ Verified locally and remotely | Caller-JWT RLS policies on all user data | Two-user local harness; anonymous and authenticated remote checks | Bidirectional remote read/write isolation passed for Tasks, WeekPlans, DailyPlans, WeeklyFocuses, Commitments, and UserSettings; anonymous table/RPC denial remains verified with `42501`. |
| Cross-screen synchronization | ✅ Verified in automated Mobile tests | TanStack Query user-scoped caches | Cache membership/request-audit tests | Targeted cache updates prevent copies and request multipliers. Real cloud/restart observation remains. |
| Automated tests | ✅ Verified | N/A | 109 Mobile + 37 API tests; local harness opt-in | Standard tests mock external cloud boundaries; local harness exercises actual Docker PostgreSQL/Auth/RLS. |
| Real-device verification | ⏭️ Next | Not established | No repeatable result in repository | A real iPhone development-build smoke test is required for v0.1.0. |
| Life Areas and broader product modules | ⏸️ Deferred | None | None | Life Areas UI remains disabled; recurring schedules, external calendars, notifications, AI, projects, habits, and billing are outside the current gate. |

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
- One-time Commitments are separate from Tasks and are physically deleted.
- Daily capacity, week start, and IANA timezone are persisted in one UserSettings row per user.
- DailyPlan capacity overrides the global setting; changing week start does not rewrite historical WeekPlans.

### API, Auth, database, and security

- Node/Express verifies Bearer tokens with Supabase Auth and creates caller-scoped clients for RLS.
- `/auth/me` returns only a safe identity payload.
- Every tracked user-owned product table has RLS policies.
- The local integration harness refuses non-local Supabase URLs and uses two real disposable Auth users/JWTs.

## Known gaps / risks

1. There is no recorded real-iPhone smoke result for the current complete application; this is the exact remaining v0.1.0 release gate.
2. Phase 7C is recorded as a dated remote release verification, not an always-on CI job; its dedicated E2E rows remain available as persistence evidence.
3. End-of-day review/rescheduling and a full arbitrary-date picker are not complete v0.1 behaviors.
4. The Product Spec mentions an “All Tasks” screen and Life Areas, but neither is part of the narrow current release gate; Life Areas are explicitly disabled/deferred.
5. Expo Web is a secondary review/development target, not the v0.1 release platform.

## Current Critical Path

1. Run the authenticated release smoke on a real iPhone development build.
2. Confirm device restart, logout/login, cross-screen state, and Settings behavior against the already verified remote project.
3. Fix only release-blocking defects, repeat the gate, and tag v0.1.0.

## Current release gate

### v0.1.0-alpha.1

**Status: RELEASED.** Tag `v0.1.0-alpha.1` marks the first development baseline. On 2026-08-15, root TypeScript and lint passed; 109 Mobile and 37 API tests passed; the local two-user real-JWT/RLS harness passed; Expo Doctor passed 21/21 checks; and iOS/Web exports succeeded.

### v0.1.0-alpha.2

**Status: READY FOR COMMIT/TAG.** This snapshot records completed Phase 7C remote Auth/RLS/Core Flow E2E verification and the deployed Data API privilege normalization. The release commit and tag have not been created.

### v0.1.0

**Status: NOT RELEASED / NOT READY.** Phase 7C passed the cloud-backed Auth/RLS/Core Flow, API-restart, and logout/login requirements. The exact remaining release gate is the authenticated real-iPhone development-build smoke test.

## Next Action

**Run the v0.1.0 release smoke on a real iPhone development build against the verified remote project.** Do not add a product feature during that increment.

## Validation baseline — 2026-08-15

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed for API and Mobile |
| `npm run lint` | Passed for API and Mobile |
| `npm test` | Passed: 37 API tests and 109 Mobile tests |
| `npm run test:integration:local` in `apps/api` | Passed against local Supabase with two real Auth users/JWTs |
| Expo Doctor | Passed 21/21 checks |
| Expo iOS export | Passed |
| Expo Web export | Passed |

These results verify the tracked implementation and local database boundary. The Phase 7 evidence below separately records remote schema, security, Auth, and Core Flow checks; real-iPhone behavior remains unproven.

## Phase 7 remote evidence — 2026-08-15

- **Phase 7A complete:** linked project identity was confirmed; migration history matched; dry run was up to date; remote schema/lint were audited without writes.
- **Phase 7B complete:** application-facing privileges were normalized, deployed, and verified; five migrations now match remote history and remote lint passes.
- **Phase 7C complete:** two distinct users authenticated through normal `signInWithPassword`; bidirectional read/write isolation passed for Tasks, WeekPlans, DailyPlans, WeeklyFocuses, Commitments, and UserSettings; and User A completed Quick Capture → Inbox → Week/Today → Active → Completed through the real LifeOS API.
- **Persistence evidence:** unique run marker `lifeos-remote-e2e-20260815204540` survived fresh reads, an API restart, normal logout/fresh password login, and Settings reload. Starting Task 2 returned Task 1 to `open` with `completed_at = null`; User B's active Task remained independent.
- **Retained E2E data:** the two pre-existing Auth users remain. For the unique run, User A retains four Tasks (one completed, three open), one WeekPlan, one DailyPlan, two WeeklyFocuses, one Commitment, and one UserSettings row; User B retains three open Tasks, one WeekPlan, one DailyPlan, two WeeklyFocuses, one Commitment, and one UserSettings row. No test Task remains active.
