# LifeOS Roadmap

This is the authoritative path from the project foundation to the first usable LifeOS release. Product intent lives in `VISION.md` and `PRODUCT_SPEC_V0.1.md`; current implementation truth lives in `IMPLEMENTATION_STATUS.md`.

Status is based on repository evidence. A phase can contain implemented code while remaining **IN PROGRESS** until its required runtime or release verification is recorded.

## Release strategy

- **v0.1.0-alpha.1** — first official development snapshot of the existing LifeOS implementation.
- **v0.1.0-alpha.N** — additional internal snapshots while the core flow is completed and stabilized.
- **v0.1.0** — first internal MVP where the daily/weekly planning loop works end to end on a real iPhone with persisted authenticated data.
- **v0.1.1** — standalone internal deployment milestone: Railway HTTPS API and a Release iPhone build that operates without the development Mac, Metro, or local API.
- **v0.2.0** — historical standalone internal iPhone preparation: Day Window, task-backed summaries, capture/Week fixes, Weekly Focus stabilization, and visible version metadata; not published; historical preparation does not establish device acceptance.
- **v0.2.1** — installed standalone internal iPhone update, build 3. Owner-reported #11 precise commitment times, #12 keyboard interactions, #13 date placement/moves, and tested save/app-reopen persistence were accepted on 2026-09-08. Published on GitHub the same day as Latest; not TestFlight or App Store distribution.
- **v1.0.0** — a later stable-product milestone; it is not the current target.

Published GitHub Releases are authoritative for released versions, as defined in `github-development-standard.md`. [LifeOS v0.2.1 — Planning fixes](https://github.com/OzAvrahami/LifeOS/releases/tag/v0.2.1) is Latest, non-draft, non-prerelease, published 2026-09-08 at 09:19:03 UTC. Its annotated tag resolves to `93fde4306132f2301f5e2b02c3c374f5c203a1cd`. Preparation, acceptance documentation, and publication checkpoints are complete. See [the release record](release-0.2.1-verification.md#current-publication-and-workflow--2026-09-08).

## Phase 1 — Product definition

**Goal:** Define the focused mobile-first problem and v0.1 planning loop.

**Scope:** Vision, product specification, Today/Week/Inbox behavior, core flow, data model, and technical boundaries.

**Exit criteria:** The initial product question, scope exclusions, core flow, platform priority, and domain concepts are documented.

**Current status: DONE**

Repository evidence: `docs/VISION.md`, `PRODUCT_SPEC_V0.1.md`, `CORE_FLOW.md`, screen specifications, wireframes, `DATA_MODEL_V0.1.md`, and `TECH_STACK.md`.

## Phase 2 — Mobile design and interactive prototype

**Goal:** Establish and validate the Hebrew-first mobile experience before persistence.

**Scope:** Design system, mobile shell, Today, Week, Inbox, Quick Capture, bottom navigation, weekly planning, canonical preview states, and the in-memory task flow.

**Exit criteria:** Approved states exist, main routes work, the same local task moves through Capture → Inbox → Week/Today → Active → Done, and component tests protect the behavior.

**Current status: DONE**

Repository evidence: the committed Claude Design export, feature implementations under `apps/mobile/src/features`, Expo Router routes, fixture previews, and mobile UI/local-flow tests.

## Phase 3 — Application and authentication foundation

**Goal:** Establish the real client/API/Auth boundary without inventing product data shortcuts.

**Scope:** npm workspaces, Expo/React Native, Expo Router, Express API, Supabase Auth client/session restoration, production Auth screens, email/deep-link flows, Bearer injection, `/auth/me`, route gating, and caller-scoped Supabase clients.

**Exit criteria:** Automated Auth tests pass, API tokens are verified rather than decoded and trusted, signed-out routes are gated, and signup/recovery/API identity are verified in the intended runtime.

**Current status: DONE**

Implementation and automated verification exist. Phase 7C verified two normal remote password sessions, API identity, logout, and fresh login; authenticated real-iPhone login, restart, and logout/login persistence also passed.

## Phase 4 — Persistent core Task foundation

**Goal:** Make one stable Task identity persist through the LifeOS planning and execution states.

**Scope:** `tasks`, minimal `week_plans`, RLS, ownership, REST CRUD, Inbox/Week/Today filters, retained cancellation, `start_task()`, single-active enforcement, TanStack Query integration, and targeted cache synchronization.

**Exit criteria:** Migration replay succeeds locally; real local Auth JWTs prove RLS isolation; Capture, moves, Start/Stop/Complete preserve IDs; normal Mobile flows use the Node API; and the same behavior passes against the designated remote environment.

**Current status: DONE**

Implementation, unit/component tests, migration replay, and an opt-in local real-JWT/RLS harness exist. Phase 7C verified the remote Task/WeekPlan Core Flow, restart/login persistence, two-user isolation, and single-active invariant.

## Phase 5 — Planning context, Commitments, and Settings

**Goal:** Persist the minimum context needed for realistic daily and weekly planning.

**Scope:** DailyPlan/Daily Focus, WeeklyFocus, one-time Commitments, workload calculation, More, Account, daily capacity, week start, timezone, and sign-out cache clearing.

**Exit criteria:** Migrations and RLS pass local replay/integration tests; Mobile reads and mutates these resources through the API; settings affect Today/Week correctly; and remote/device persistence is verified.

**Current status: DONE**

The tracked implementation and automated/local verification exist, all five migrations are deployed remotely, Phase 7C verified authenticated remote planning, Commitment, and Settings persistence, and real-iPhone Settings persistence passed.

## Phase 6 — Authoritative alpha baseline

**Goal:** Create a coherent, auditable first development-snapshot baseline.

**Scope:** Roadmap, current implementation matrix, changelog, release policy, full non-destructive validation, build smoke checks, and explicit separation of implementation from verification.

**Exit criteria:** Documentation agrees with the repository; typecheck, lint, Mobile/API tests, and build smoke checks pass; no critical regression is known; and the tree is ready for the user’s manual release commit/tag.

**Current status: DONE**

The authoritative documents, full TypeScript/lint/test pass, local real-JWT integration harness, Expo Doctor, and iOS/Web export smoke checks passed on 2026-08-15. Tag `v0.1.0-alpha.1` records the released baseline.

## Phase 7 — Production-real core-flow verification

**Goal:** Prove the core product loop against the designated Supabase environment and primary device.

**Scope:** Safe migration reconciliation, authenticated cloud data, Capture → Inbox → Week/Today → Active → Completed, reload/restart, logout/login, cross-screen consistency, settings, and a real iPhone smoke test.

**Exit criteria:** The full v0.1.0 release gate below is recorded as passed with no release-blocking bug.

**Current status: DONE**

Migration reconciliation, privilege normalization, Phase 7C remote Auth/RLS/Core Flow verification, real-iPhone persistence smokes, and the final fresh-development-build smoke are complete. The Auth bootstrap race and Today hydration flicker found on device were fixed and regression-tested; no known release-blocking product bug remains.

## Phase 8 — Standalone internal MVP deployment

**Goal:** Remove the installed iPhone build's runtime dependency on the development Mac and expose the API securely over HTTPS.

**Scope:** Railway production API execution, HTTPS public networking, deployment health verification, Mobile deployment API configuration, and a standalone real-iPhone Release build.

**Exit criteria:** The Railway API health and authenticated identity routes pass, and the installed iPhone build operates through Railway and Supabase with Metro, the local API, and the Mac unavailable.

**Current status: DONE**

The `lifeos-api` Railway service runs the compiled API behind HTTPS. A Release iOS build completed and standalone operation passed over cellular networking: iPhone → Railway API → Supabase Cloud. This is an internal development-signed build, not completed TestFlight or App Store distribution.

**Release milestone:** v0.1.1 — published on GitHub on 2026-08-27; standalone verification was recorded on 2026-08-20.

## Phase 9 — Real-world usage and the completed v0.2.1 milestone

**Ongoing purpose:** Use LifeOS in real planning, capture defects and friction, and select further work only when supported by evidence. Ongoing usage does not imply an issue is actively being implemented.

**Completed milestone:** The owner completed preparation and acceptance-documentation checkpoints, installed 0.2.1/build 3, approved the documented #11/#12/#13 physical flows and tested persistence, and published v0.2.1 from final documentation commit `93fde4306132f2301f5e2b02c3c374f5c203a1cd`.

**Milestone exit criteria: MET.** Installed version/build confirmation, scoped owner acceptance, and GitHub publication are recorded. No broader specialized audit or unrelated feature acceptance is implied.

**Remaining work:** #4’s selected-week queries, task/commitment day inspection, day navigation, and editing/return context are implemented and await [physical-iPhone owner acceptance](issue-4-verification.md). This unreleased work does not change the completed v0.2.1 milestone. #3’s full Weekly Planning lifecycle remains Open / Ready. Live #7/#8/#10 are Closed/Completed/Done and their accepted behavior is preserved. Other backlog work, including Google Calendar integration and #16, is unchanged; no new release target is selected.

## Release gate — v0.1.0-alpha.1

This release gate passed on 2026-08-15:

- Repository/documentation baseline is coherent.
- Current implementation is verified by the repository’s automated and local checks.
- No known critical regression exists in the current application.
- Smoke tests of the existing Mobile build pass.
- The user creates the first official LifeOS development-snapshot commit and tag.

## Release gate — v0.1.0

The release is ready only when all of these are verified end to end:

- [x] The complete core flow works remotely: Quick Capture → Inbox → Today/Week → Active → Completed.
- [x] Authenticated user data persists remotely.
- [x] Quick Capture persists remotely.
- [x] Inbox placement persists remotely.
- [x] Today/Week planning persists remotely.
- [x] Active/completed transitions persist remotely.
- [x] A fresh API process reconstructs remote state.
- [x] Logout/login restores the correct user's remote data, with direct two-user RLS isolation verified.
- [x] Basic Settings persist across fresh fetch and logout/login.
- [x] Cross-screen state stays consistent on the target device.
- [x] A real iPhone development-build smoke test passes, including a final smoke after Expo SDK patch alignment.
- [x] No known release-blocking bug remains.

**Status: PASSED — v0.1.0 is the published first internal MVP milestone. This historical acceptance does not cover v0.2.0 or v0.2.1.**

Unrelated nice-to-have features are not part of this gate.
