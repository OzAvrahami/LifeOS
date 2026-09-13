# Issue #3 — Weekly Planning lifecycle verification

## Release candidate

| Field | Value |
| --- | --- |
| SemVer impact | Minor — new Weekly Planning and Week/day capabilities |
| Candidate/accepted version | 0.3.0 |
| Accepted iOS build | 4 |
| Version prepared | Yes — tracked app/root/API/Mobile and lockfile metadata synchronized on 2026-09-13 |
| Native version synchronized | Yes — this Mac's ignored Info.plist and Debug/Release project fields verified as 0.3.0 / 4 |
| Physical build installed | Yes — owner reports installed LifeOS 0.3.0 (4), visibly confirmed |
| Owner accepted exact build | Yes — LifeOS 0.3.0 (4), owner-reported physical iPhone verification |
| Owner acceptance date | 2026-09-13 |
| Published release | [v0.3.0](https://github.com/OzAvrahami/LifeOS/releases/tag/v0.3.0) |
| Published | 2026-09-13 |
| Accepted binary | 0.3.0 (4) |
| Included issues | #3, #4; preparation `e1a3470`, containing implementation `286cec4` / `7785381` |

Both issues are **Closed / Completed / Done / P1 — High**, read back after finalization. The owner explicitly confirmed the remaining #3/#4 physical scenarios were satisfactory on **LifeOS 0.3.0 (4)** on **2026-09-13**. [Final acceptance comment](https://github.com/OzAvrahami/LifeOS/issues/3#issuecomment-5655476777). This is owner-reported acceptance, not independent Codex observation or extraction of the binary's source SHA.

Production readiness was already verified before the physical test, as confirmed in the owner's handoff: remote migration `20260913120000` applied and candidate Railway API deployment successful. No remote operation was repeated here. Prior automated/component/API and local PostgreSQL/Auth/RLS results remain separate evidence for internal invariants; no new instrumented production/history/RLS or full accessibility audit is claimed. See [release acceptance and publication state](release-0.3.0-verification.md). Published in **v0.3.0** on **2026-09-13**, with annotated tag target `cefd84a6d8e21c631bc666d49d20ac91ccce2657`. Later documentation reconciliation does not alter the tag or owner-acceptance attribution; the issue has no remaining acceptance/publication gate.

## Historical implementation and local integration handoff — 2026-09-13

The following snapshot predates the later owner installation/acceptance above; its pending rollout/device statements are historical, not current gates.

The implementation and local integration checkpoint is now committed/pushed as `286cec4`; it contains #4 at `7785381`. **Issue #3 is Open / Verify / P1 — High.** The local PostgreSQL/Auth/RLS integration command was independently rerun successfully after the owner prepared the local stack: exit 0, all 11 verification groups passed, including the new Weekly Planning checks. Previously completed Mobile/API tests, typecheck, lint, build and export results remain separate evidence below. Production schema/API readiness has not been verified in this preparation; owner/device acceptance remains pending. Do not close the issue before acceptance.

The [earlier implementation/blocker comment](https://github.com/OzAvrahami/LifeOS/issues/3#issuecomment-5655051501) records the initial failed attempt. The [successful local verification follow-up](https://github.com/OzAvrahami/LifeOS/issues/3#issuecomment-5655173219) supersedes that blocker. Only #3 was moved In Progress → Verify and read back as Open/Verify/P1; #4 remains Open/Verify/P1. Priorities, issue metadata, other states and the existing 18-item membership are preserved.

**Historical implementation baseline:** Started from clean `main` at `778538155ea13587d11f4892a71973a64791dfd4` (`feat(week): add week and day navigation`). Local `main`, `origin/main`, and live remote main matched. Read the full #3 issue and its only existing comment, repository instructions, current records, planning/Week implementation/tests, schema/RPCs, and local integration process. Only #3 was moved Ready → In Progress and read back. #4 was Open / Verify / P1 and its workflow is unchanged. Its navigation/day implementation is preserved; the Week integration adds the lifecycle entry and an optional context caption to the existing Focus editor.

During the implementation/local integration stage, no production data or schema changes, deployment, device build/install, version/build, dependency, signing, or persistent environment changes were performed. The later candidate metadata preparation is recorded above. Existing accepted #7/#8/#10/#11–#13 behavior remains unchanged. The local integration rerun used disposable Auth users and records; its real PostgreSQL/RPC/RLS evidence does not imply production rollout or physical-device acceptance.

## Lifecycle and compatibility

The existing `week_plans` row remains the owner. Its unique `(user_id, week_start)` constraint, UUID, timestamps, Task references, and caller RLS are preserved. No parallel planning entity is introduced.

| State | Database invariant | Week action |
| --- | --- | --- |
| Not started | No row, or `planning_status = not_started`, step `0`, null completion timestamp | `תכנן את השבוע` |
| In progress | `planning_status = in_progress`, resume step `1..4`, null completion timestamp | `המשך תכנון` and the saved step out of four |
| Completed | `planning_status = completed`, step `4`, non-null completion timestamp | `סקירת התכנון`; explicit `עריכת התכנון` inside review |

`20260913120000_add_weekly_planning_lifecycle.sql` is the seventh forward migration, after `20260906120000_add_user_settings_day_window.sql`. It adds the three lifecycle columns and a constraint rejecting inconsistent combinations. Existing focus-only, task-only, and empty owner rows deterministically receive `not_started / 0 / null`. Existing focuses and plan IDs are retained. Historical focus data is not evidence that the user completed the new flow. Old Focus clients/RPCs remain compatible and do not reset lifecycle.

The resume step is the first remaining step, not the most recently visited earlier page. Back is a local review position; saved progress is monotonic. Replaying an earlier save cannot rewind it. Closing and reopening resumes saved server progress. Completion requires reaching step four and the explicit final action. Repeated start/completion retains identity and completion time. Completed edits never reset status or completion time. Concurrent Focus writes retain the existing last-serialized-write behavior; this is not a collaborative draft/versioning system.

## Four authenticated steps and save behavior

1. **Prior work review:** real active date-planned and week-only Tasks from the preceding selected week. This is read-only; no automatic carryover. The existing Week/day actions remain the route to rescheduling.
2. **Commitment review:** real selected-week commitments, ordered by date/time, with actual optional end times. No simulated calendar events or invented occupied duration.
3. **Weekly Focus:** the existing persistent editor, with the same maximum of three, ordering, empty-set support, validation, cancel, and failed-save draft retry. `שמירת מיקודים` explicitly persists the selected titles. The subsequent Continue action records completion of the step. Unsaved editor cancellation discards only that editor draft, not prior saved steps.
4. **Review and completion:** actual selected-week Tasks/commitments and saved Focus, with `סיום תכנון`. Existing Week/day scheduling remains accessible on return; Focus is not assigned dates or converted into Tasks.

This keeps a genuine four-step flow while removing the preview's unsupported simulated carryover selection and Focus-to-day scheduling from authenticated behavior. No new carryover/Focus scheduling data model, #2 product decision, Daily Planning redesign, or task-template/location/description/calendar feature is implied.

Review-only steps persist their acknowledged progress through `שמירה והמשך`. Data load failure blocks advancing that review step. Focus edits persist atomically with the lifecycle owner; a failed write preserves the editor draft. Saved values reload with a new provider/session. Completed-plan editing opens the saved Focus values and returns to completed review after saving; the other steps review existing Task/Commitment data rather than capturing new plan fields.

All lifecycle, Focus, review ranges, progress, start/resume/review/edit actions and cache keys use #4's explicit selected week. Calendar keys remain `YYYY-MM-DD`; the API validates real calendar dates and accepts configured week starts without imposing Sunday or reinterpreting UTC dates. Account timezone/week-start selection remains in #4. Changing week/account cannot reuse another query key. The preview wizard is retained separately and never supplies production lifecycle state.

## API and cache contract

- `GET /week-plans/:weekStart` returns `{ weekPlan, focuses }`, including `weekPlan: null` for an untouched week without creating a row. Existing owner rows return their explicit state. The query reads lifecycle fields and related focuses in one owner-filtered snapshot.
- `PUT /week-plans/:weekStart` accepts `{ action: "start" }`, `{ action: "save", step: 1..4, advance?: boolean, titles?: string[] }`, or `{ action: "complete" }`. Titles are valid only on step three; absent titles preserve the existing set, and `[]` clears intentionally. Omitted `advance` means save without advancing.
- The `save_weekly_planning` SECURITY INVOKER RPC uses `auth.uid()`, existing uniqueness, and a row lock. Start upserts without duplicating. Save rejects unstarted/skipped steps, performs optional Focus replacement in the same transaction, and advances monotonically. Complete rejects an incomplete predecessor state; repeated completion returns the existing completion timestamp. The legacy Focus RPC acquires the same owner lock.
- Invalid dates/payloads return 400; illegal transitions return 409; missing lifecycle schema/RPC returns 503 with an update-required message; internal provider details are not exposed. The GET requests explicit lifecycle columns so an unmigrated empty database does not falsely report “not started.” An older API without these routes produces a visible planning-load error, leaving the existing Week/day experience available.
- React Query keys include user and selected week. Save responses update only that plan and Focus cache, cancelling obsolete reads. Settlement re-reads that exact lifecycle to recover a lost response; failed writes do not synthesize completion. Standalone Focus saves invalidate only the corresponding lifecycle snapshot. No local-only progress store or duplicate Task/Commitment cache is added.

## Automated evidence

Results on 2026-09-13: the software suites/build/export below are prior implementation runs. This follow-up reran local integration and documentation checks only; it did not repeat the full suites.

| Check | Result |
| --- | --- |
| Focused API command below | 3 suites, **37 passed**, no skips/failures. |
| Focused Mobile command below | 6 suites, **54 passed**, no skips/failures. |
| Full Mobile | 40 suites, **258 passed**, 1 existing Android-only skip (259 total), no failures. |
| Full API | 8 suites, **77 passed**, no skips/failures. |
| Native Task date Android regression | 1 suite, **3 passed**, no skips/failures; covers the default iOS run's platform exclusion. |
| Root typecheck / lint | Both API and Mobile passed. |
| API build | Passed. |
| iOS JavaScript export | Passed; one Hermes bundle and metadata outside the checkout. No native compilation/install. |
| Local integration | **Passed on independent rerun**, exit 0, all **11 PASS groups**, including Weekly Planning PostgreSQL/RPC constraints, atomic saves/retries, Auth restoration, compatibility, and caller/anonymous RLS. No skips or failures reported. |
| Documentation links / whitespace | Local file/anchor checks and `git diff --check` passed. |

No pre-existing suite failures were found in the final runs, and no new skips or weakened assertions were introduced. The initial typecheck identified the pre-existing planning test double's missing new interface methods; these were implemented rather than suppressing the check. API request/store mocks remain separate from the now-executed local PostgreSQL/Auth/RLS assertions; neither is production/device acceptance.

Focused commands use repository-root paths for API and workspace-relative paths for Mobile.

```sh
node --import tsx --test apps/api/__tests__/planning.test.ts apps/api/__tests__/weekly-planning-service.test.ts
npm run test --workspace @lifeos/mobile -- --runTestsByPath \
  __tests__/weekly-planning-lifecycle-test.tsx __tests__/week-navigation-test.tsx \
  __tests__/weekly-focus-screen-test.tsx __tests__/planning-query-cache-test.tsx \
  __tests__/planning-api-test.ts __tests__/week-planning-focus-test.tsx
npm run test --workspace @lifeos/mobile
npm run test --workspace @lifeos/api
npm run typecheck
npm run lint
npm run build --workspace @lifeos/api
npm run test --workspace @lifeos/mobile -- --config jest.task-date-android.config.js
npm run test:integration:local --workspace @lifeos/api
git diff --check
```

Bundling was checked from `apps/mobile` with process-only non-service placeholders, without loading environment files:

```sh
EXPO_NO_DOTENV=1 \
EXPO_PUBLIC_API_URL=https://example.invalid \
EXPO_PUBLIC_SUPABASE_URL=https://example.invalid \
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=export-check \
../../node_modules/.bin/expo export --platform ios --output-dir /tmp/lifeos-issue3-ios-export
```

This proves bundling, not a configured live API, production rollout, or installed-device behavior.

The Mobile tests use real components/query/mutation hooks with mocked API boundaries. They cover lifecycle loading/error distinctions, selected-week start/independence, real review data, step three save/restart/Back, completed review/edit identity, cancellation, retry after failed Focus/completion/start, a committed start with a lost response, and stale read/cache isolation. Existing Week/navigation/Focus/preview tests are retained. API route tests use a disposable store; adapter tests check caller filters, exact RPC input, authoritative response mapping, and safe errors. They do not execute PostgreSQL or prove lock/RLS behavior.

The established local harness executed `verify-weekly-planning.mjs` after its existing checks and before emitting the Weekly Planning PASS line. It uses its existing two disposable local Auth users, real authenticated API/RPC calls, fresh normal sign-in, concurrent starts/completions, invalid transition/constraint checks, atomic rollback of invalid focuses, stable plan identities, legacy/empty Focus owner compatibility, and cross-user/anonymous denial. It retains local-target guards and cleanup. The assistant installed no integration environment or dependencies; the rerun used the stack prepared by the owner.

## Required database verification and rollout

**Historical rollout instructions:** Local integration passed during implementation; the owner subsequently confirmed the remote migration and successful API deployment before the accepted device test. The commands and earlier preparation limitations below are retained as historical evidence, not outstanding actions.

**Resolved local gate — 2026-09-13:** The earlier implementation attempt failed before fixtures because Docker/Podman was unavailable. The owner subsequently prepared OrbStack and the local Supabase stack and reported a passing run. The assistant independently reran the command. This tool session initially still lacked Docker on PATH; using the existing OrbStack executable through a process-only PATH addition resolved that environment mismatch:

```sh
PATH="/Users/ozavrahami/.orbstack/bin:$PATH" npm run test:integration:local --workspace @lifeos/api
```

Result: **exit 0; all 11 PASS groups**. Targets were local Supabase API `http://127.0.0.1:54321` and PostgreSQL `127.0.0.1:54322` in `supabase_db_LifeOS`; the harness started its temporary checkout API on port 3199. Read-only local migration-history inspection confirmed `20260913120000`. The lifecycle module actually executed real RPC/constraint/RLS assertions, including concurrent starts/completions, stable IDs, fresh-sign-in resume, completed edits, legacy/empty Focus owners, rejected invalid states, atomic rollback, and cross-user/anonymous denial. The remaining ten groups passed for Auth, privileges, Task/WeekPlan isolation and transitions, DailyPlan, WeeklyFocus, Commitments, and UserSettings. This run reused the owner's prepared local schema; it did not reset a database, apply a migration, or establish a fresh migration-replay result. The PATH addition expires with the command; no restoration or persistent configuration edit is needed.

For future reproduction, the repository's established initialization process is **only for a confirmed disposable local stack** (not run in this follow-up):

```sh
npx supabase start
npx supabase db reset --local
npm run test:integration:local --workspace @lifeos/api
```

A reset destroys the selected local test database. For an already isolated alternate Supabase workdir/project, the harness supports `LIFEOS_INTEGRATION_SUPABASE_WORKDIR` and `LIFEOS_INTEGRATION_SUPABASE_PROJECT_ID`; the migrations must be present/applied there. Do not reset an owner's non-disposable database or use `--linked` for reset. The local integration gate has passed and #3 is now Verify, preserving Open/P1 and #4's Verify state.

The earlier implementation handoff did not perform production rollout. The implementation is now pushed at `286cec4`; this candidate preparation has not verified current production migration history or active API deployment. Confirm actual schema/API readiness before device verification. For any still-pending migration, the owner must confirm the intended linked project and full pending set, then review the dry run before explicitly authorized application:

```sh
npx supabase migration list --linked
npx supabase db push --linked --dry-run --skip-vault
npx supabase db push --linked --skip-vault
```

Proceed only when the pending set is understood and includes the new migration in sequence. `--skip-vault` avoids unrelated Vault configuration changes. CLI help was checked locally; none of these remote operations ran. Apply schema before releasing the new API contract, then verify the API before loading a mobile build containing #3. API rollout follows the existing Railway process under owner control. Physical acceptance is blocked until the schema and updated API are available in the approved test environment. Existing installed 0.2.1 predates this implementation.

## Physical-iPhone owner checklist

**Owner-reported acceptance completed on 2026-09-13, LifeOS 0.3.0 (4).** The owner confirmed the remaining scenarios below were satisfactory after production prerequisites were verified. Checked items record that scoped approval; exact IDs, cache/atomicity/RLS invariants rely on the existing automated evidence, not an owner database inspection. Hebrew RTL/touch acceptance is not a full accessibility audit.

- [x] An untouched current week shows `תכנן את השבוע`, without an Edit-plan action.
- [x] Start it and confirm step 1 of 4, the correct selected-week range, and real prior-work review.
- [x] Continue through commitment review, save Focus on step 3, and exit.
- [x] Week shows `המשך תכנון` and the correct saved progress.
- [x] Resume at the saved step with Focus restored; Back inspects earlier steps without losing saved values.
- [x] Reach the final review and press `סיום תכנון`; Week clearly shows completion.
- [x] Open `סקירת התכנון`, deliberately choose `עריכת התכנון`, change/save Focus, and confirm completed review returns with the same values and completed state.
- [x] Browse next/previous weeks; their lifecycle is independent. Return to the original week and confirm its own state.
- [x] Force-close/reopen and log out/in; navigate back to the saved week and confirm progress/completion and Focus persist.
- [x] Check Hebrew RTL, touch targets, keyboard, scrolling, safe exit/cancel, and visible retry behavior. #4 week/day navigation, Tasks and commitments remain available.

These checkboxes are completed by the owner-reported physical acceptance above, with prior automated integration evidence supporting internal identity/concurrency invariants. No new device test was performed by Codex during this finalization.
