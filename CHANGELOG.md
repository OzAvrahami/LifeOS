# Changelog

All notable changes to LifeOS will be documented in this file.

LifeOS follows Semantic Versioning for development and release tags.

## [Unreleased]

### Fixed

- Fixed commitment keyboard interactions (#12): blank form taps and non-text actions request native dismissal without swallowing controls, with platform-specific scroll dismissal and preserved Web focus. Physical-iPhone acceptance remains pending.
- Fixed commitment time selection (#11): arbitrary minutes, an editor-wide iOS draft picker with explicit confirmation/cancellation, native Android confirmation, and protection against abandoned selections. Physical-iPhone acceptance remains pending.
- Replaced More’s stale hardcoded version label with the shared metadata-derived version/build footer, preserving LifeOS branding, Hebrew/RTL styling, and development/web fallbacks.

## [0.2.0] — Unreleased preparation

Prepared for the next standalone internal iPhone build; not published and pending physical-iPhone acceptance. Scope reviewed against `v0.1.1..5a18f28`, plus this release preparation. The user reported that the Day Window migration was applied and browser checks passed; this is user-reported evidence, not a new remote verification or acceptance of this binary.

### Added

- Added an account-persisted, optional “My day” window with recurring local start/end clock times and explicit overnight behavior.
- Added LifeOS branding assets and the configured application icon.
- Added a read-only Hebrew/RTL Settings version/build footer using Expo metadata and the actual native iOS build number when available; development/web fallbacks do not substitute a configured build number.
- Adopted GitHub issue forms, release-note categories, and the LifeOS Development Project workflow.

### Changed

- Replaced the normal authenticated fixture-backed Weekly Planning wizard with an honest, account/week-scoped Weekly Focus editor; the canonical four-step wizard remains development-preview-only.
- Connected Today’s inline “Add Task” action to Quick Capture with Today preselected while preserving the global Inbox default.
- Made Week’s “More Tasks” action expand and collapse all remaining week-planned Tasks with the same scheduling controls.
- Replaced Today’s arbitrary capacity denominator and capacity-derived status with an honest planned Task-time summary; Commitments remain visibly separate and Tasks without estimates are disclosed.
- Retired daily capacity as the primary Settings concept while preserving its stored values and older-client compatibility. This intentionally supersedes Issue #6’s Today capacity notice, not its persistence semantics.
- Aligned root, API, Mobile, lockfile, and Expo versions from `0.1.0` to `0.2.0`; configured iOS build `2`, following local native and cached Debug/Release build `1` evidence. The installed iPhone build was not inspected.

### Fixed

- Prevented Today development-fixture suggestions from appearing as user Tasks in normal server-backed usage.
- Preserved inherited/null/zero daily-capacity semantics and ensured Daily Focus edits do not create or erase legacy capacity overrides.
- Derived Week day counts and duration summaries from actual planned Tasks, excluding Weekly Focus items and invented durations.
- Stabilized authenticated Weekly Focus loading, cancel/clear, failed-save/retry, and account/week isolation while keeping fixture content in development previews.

### Acceptance still pending

- Install a new standalone Release binary and verify Day Window persistence, Today summaries and fixture exclusion (#8), capture entry points, Week expansion, Weekly Focus, and the version footer on the physical iPhone.
- Keep #8 open in Verify. Issue #3 remains open in In Progress: the full planning lifecycle, persisted progress, resume, and completed-plan review/edit behavior are incomplete. Issue #4 remains open in In Progress: previous/next/current-week navigation and broader day-detail/task-access behavior are incomplete.

## [0.1.1] - 2026-08-27

Published on GitHub on 2026-08-27; the deployment and standalone-iPhone verification below were recorded on 2026-08-20.

### Added

- Deployed the production API as the Railway `lifeos-api` HTTPS service and verified both public health and authenticated identity requests.
- Created and verified a standalone iPhone Release build using bundle identifier `il.co.ozavrahami.lifeos`.

### Changed

- Changed the API production start path to run compiled JavaScript with `node dist/src/server.js`.
- Pointed the Mobile deployment environment at the Railway HTTPS API.
- Removed the installed iPhone build's normal-use dependency on the local Mac, Metro, and local LifeOS API; standalone cellular operation now uses Railway and Supabase Cloud.

### Security

- Preserved the publishable-key + caller JWT + RLS architecture in production; the application does not use `service_role`.

## [0.1.0] - 2026-08-20

### Added

- Final real-iPhone development-build verification of authenticated login, the Core Flow, restart and logout/login persistence, Settings persistence, and correct Today hydration.
- Deterministic AuthProvider bootstrap-race and Today server-hydration regression coverage.

### Changed

- Aligned Expo SDK 57 patch dependencies with Expo Doctor compatibility expectations and verified a fresh iOS development build.
- Established `il.co.ozavrahami.lifeos` as the iOS bundle identifier.

### Fixed

- Prevented a stale bootstrap `getSession()` result from overwriting a newer `SIGNED_IN` session in AuthProvider.
- Prevented Today from rendering a false empty-day state before its initial server-backed data finished hydrating.

## [0.1.0-alpha.2] - 2026-08-16

### Added

- Remote authenticated Core Flow E2E verification through the real LifeOS API: Quick Capture → Inbox → Week/Today → Active → Completed with one stable Task identity.
- Remote two-user RLS and isolation verification for Tasks, WeekPlans, DailyPlans, WeeklyFocuses, Commitments, and UserSettings, including independent single-active-task behavior.
- Remote persistence verification across fresh API state, API restart, and User A logout/login.

### Changed

- Updated implementation and release-status documentation to record Phase 7C as complete and make the authenticated real-iPhone v0.1.0 smoke test the next release gate.

### Security

- Normalized LifeOS Data API privileges explicitly for every user-owned application table and authenticated RPC.
- Denied `anon` access to LifeOS user-owned tables and authenticated RPC operations.
- Limited `authenticated` to the table operations and RPC execution privileges required by the application, with RLS continuing to enforce caller ownership.
- Left `service_role` as Supabase-managed administrative state without changing its privileges.

## [0.1.0-alpha.1] - 2026-08-15

### Added

- Mobile-first Expo/React Native application, Expo Router navigation, Hebrew/RTL design foundation, and canonical preview states.
- Approved Today, Week, Inbox, Quick Capture, weekly-planning, Auth, Commitments, More, Settings, and Account experiences.
- Shared local Task prototype proving Capture → Inbox → Week/Today → Active → Done with stable identity.
- Production Supabase Auth client/session layer with signup, email confirmation, sign-in, password recovery, deep-link callback handling, route gating, and a development verification route.
- Node/Express REST API with Bearer authentication and safe `/auth/me` identity verification.
- Versioned PostgreSQL migrations for Tasks/WeekPlans, DailyPlans/WeeklyFocuses, one-time Commitments, and UserSettings.
- RLS ownership policies, cross-owner relationship constraints, atomic `start_task()`, and database enforcement of one active Task per user.
- Task, planning, Commitment, and Settings REST APIs with validation and caller-derived ownership.
- TanStack Query server-state integration for normal authenticated Mobile flows, including targeted cache synchronization.
- Daily Focus, Weekly Focus, one-time Commitment editing, real workload calculation, capacity override, configurable week start, IANA timezone, and secure sign-out cache clearing.
- API, Mobile, migration-static, and opt-in local Docker/Auth/RLS integration coverage.

### Changed

- Replaced the normal in-memory Task flow with authenticated Node API persistence while retaining fixtures only for development previews.
- Replaced fixture-driven Daily Focus, Weekly Focus, Commitments, workload, and Settings data in normal authenticated flows with server state.
- Centralized Today/week-boundary calculations around the effective user timezone and week-start preference.
- Reduced mutation request multiplication through authoritative mutation results and targeted query-cache updates.
- Clarified custom Weekly Focus creation as separate from selection; only visibly selected focuses are saved.

### Fixed

- Corrected RTL placement for Auth back controls and password-visibility controls.
- Handled Supabase implicit-flow URL fragments in Web Auth callbacks without exposing tokens, while preserving recovery-session behavior.
- Removed invalid nested interactive button structure from Inbox rows on Web.
- Prevented custom Weekly Focus text from being silently selected or saved and enforced the maximum of three selected focuses in the UI.

### Security

- Product API requests use the current Supabase access token and server-side token verification; raw decoded JWTs are never trusted.
- Product data access uses caller-scoped Supabase clients so PostgreSQL RLS remains active.
- Local real-JWT integration tests verify two-user isolation, cross-user write blocking, ownership constraints, and single-active-task enforcement.
- Sign-out clears all user-scoped TanStack Query data to prevent cached data from appearing for another session.
