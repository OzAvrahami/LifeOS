# Changelog

All notable changes to LifeOS will be documented in this file.

LifeOS follows Semantic Versioning for development and release tags.

## [Unreleased]

### Validation

- Completed Phase 7C against the designated remote LifeOS project with two normally authenticated users: verified caller isolation for Tasks, WeekPlans, DailyPlans, WeeklyFocuses, Commitments, and UserSettings; exercised Quick Capture → Inbox → Week/Today → Active → Completed through the real API; and confirmed persistence after an API restart and User A logout/login.
- Verified remotely that starting a second User A Task atomically returns Task 1 to `open` with no completion timestamp, leaves only Task 2 active for User A, and does not affect User B's independent active Task.

### Security

- Normalized remote Data API privileges so `anon` has no direct access to LifeOS user-owned tables or authenticated RPCs, while `authenticated` retains only the operations required by the application and RLS remains enforced.

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
