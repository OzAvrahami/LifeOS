# Changelog

All notable changes to LifeOS will be documented in this file.

LifeOS follows Semantic Versioning for development and release tags.

## [Unreleased]

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
