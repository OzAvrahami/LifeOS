# LifeOS V2 milestone 1 - issues #29 and #30

## Owner acceptance and authorized local checkpoint — 2026-10-09

The owner accepted the reviewed **local web-preview screen appearance** and confirmed proposal adjustment/cancellation, approval persistence after reload, completion consistency across Today/Week/Tasks, and reopening a task with updated Today/counts. This is owner-reported acceptance of that local scope. The earlier appearance acceptance request and checkpoint pause are superseded for those reviewed screens/checks; the agent's supported-browser limitation remains an honest record of independent verification.

Do not infer physical-device, hosted-provider, email/callback, production or full integration acceptance, an exhaustive viewport/theme/keyboard matrix, or additional onboarding/authentication acceptance from this report. Earlier disposable local Auth evidence remains separate. No issue is closed or Project metadata changed.

One new local commit is owner-authorized over `bf02eff`, containing #33 and the subsequent onboarding/Today/visual corrections. The [current 96-file scope and checkpoint record](issue-33-verification.md#owner-accepted-local-web-checkpoint--2026-10-09) supersede older manifests. Source remains identical to the recorded final checks; this preparation edits documentation only. Current/last accepted 0.5.0 (9) and proposed, unprepared V2 0.6.0 (10) are unchanged. Provider/device/production and unreported acceptance gates remain pending.

## Today visual correction — 2026-10-09

The owner rejected the preceding Today presentation. This correction is implemented and focused automated checks pass, but **rendered fidelity and owner acceptance remain pending**. Older working-tree inventories below are historical, not the current checkpoint scope. Existing onboarding, Auth and planning behavior is preserved.

### Reference-to-native mapping

Read the actual `design-reference/LifeOS-V2-Handoff/prototype.html` markup, embedded font/icon assets and CSS cascade, including the final compact-proposal overrides. These are logical CSS pixels/React Native points. The decorative phone frame, fake status bar and flow annotations are excluded.

| Mismatch | Actual correction |
| --- | --- |
| Gear/header | `V2Header` uses the 37-point circular bordered profile/name control, with actual initials or an unnamed-account user icon, retaining More/Settings access. The reference brand has a 28-point rotated L mark and 21-point wordmark. Header bottom gap: 15. |
| Greeting | Heebo 800, 29/36.25 line height, tracking -0.8; 26/32.5 at widths <=375. Body horizontal padding 19, or 14 on narrow screens. Real date 12/18.6 with 5-point bottom gap; greeting gap 8; supporting copy 13/20.8: “בוא נפנה מקום למה שחשוב לך.” Timezone/time/profile supply the real date, greeting and name. |
| Summary | Lucide Sparkles 19; soft-green card radius 22, padding/top gap 17; heading 20/26 at weight 750. The “הצעה” pill uses the card surface (white in light mode), radius 20, 5-by-9 padding and 11-point weight 650. Real count and “לפי המשימות שלך.” avoid fictional calendar/capacity claims. |
| Task cards | Right-side 24-point pale-green rank badge, radius 8; card radius 15, padding 12, internal gap 10, list gap 9. Title 14/21 at weight 650; actual reason 11/16.5 in accent color, 4 points below. Removed “1 · מוצעת להיום”. Long titles have no fixed card height or truncation. |
| Approval | One primary action, minimum height 48, padding 12-by-15, radius 14, 14-point Heebo 700, Lucide Check 18 and top gap 22. Existing pending/stale-review/approval behavior retained. |
| Navigation | Actual Lucide Sun, CalendarDays, Plus, ListTodo, Calendar geometry. Icons 20, labels 10, gap 5; controls at least 53 by 46; central add 43 by 43/radius 15; active indicator 19 by 3. Padding 9 top/10 horizontal/at least 16 bottom with safe-area support. Existing routes/capture retained. |
| Font | V2 uses bundled Heebo, replacing Assistant: exact embedded regular TTF plus explicit 650/700/750/800 faces from official Heebo 3.100. Root font loading waits before rendering. Legacy screens retain Assistant; the intentional Arial L follows the reference. |

Real LifeOS events use the reference's bordered 14-radius, 13-padding row, golden 3-point side bar and 13-point title/11-point time. A local calendar icon and LifeOS source replace the fictional Google badge. Actual events appear before approval; no sample event, connected status or calendar-based recommendation is fabricated. Empty/loading/error/approved states use the corrected Heebo, palette, cards and controls. Existing approved counts/actions remain data-driven. Scroll containers and accessibility labels/states remain; visually small controls have expanded hit targets.

The prototype declares only Heebo 400 even where CSS requests heavier weights, so browsers may synthesize bold. Native static weights follow the requested values; exact rendered weight matching remains unverified. Both the former Assistant font and all five Heebo files contain all 27 Hebrew letters including final forms: **a missing-Hebrew-glyph fallback was not established**. Latin, digits and application Hebrew punctuation were also checked with FontTools. Actual browser computed-font selection/native rasterization requires rendered verification. See [font provenance/license](../apps/mobile/assets/fonts/README.md) and [Lucide geometry/license](../apps/mobile/assets/icons/lucide/README.md). No dependency or native-module addition; assets do not depend on the owner handoff at runtime.

### Checks and remaining acceptance

Final source checks from `D:\code\LifeOS`:

- `npm.cmd run typecheck --workspace @lifeos/mobile` — pass.
- `npm.cmd run lint --workspace @lifeos/mobile` — pass.
- `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/v2-today-integration-test.tsx __tests__/daily-flow-test.tsx __tests__/v2-foundation-test.tsx __tests__/week-navigation-test.tsx __tests__/v2-task-experience-test.tsx` — **5 suites, 49/49 pass**. Existing proposal/approval/edit/cancel, membership/completion, empty/loading/error, account-switch, task/capture and navigation checks pass. Four added component cases use mocked widths 440/320, height 956, light/dark theme state and long Hebrew content; they retain profile/settings, Week/tasks/capture, actual reason and a single approval without an incidental write. These are **not rendered layout or keyboard checks**.
- `git diff --check` and new source/document whitespace validation — pass. No API, Auth, schema or proposal/query logic changed; broad DB/Auth suites were not repeated. Earlier evidence remains scoped to that implementation.
- Baseline hashes preserve the Git index, owner handoff, root `tsconfig.json`, environments, manifests/lockfile and unrelated pre-existing work. HEAD remains `bf02eff3f6ec2ee51e0a5e0891e3e3729f846f08`, main, 1 ahead / 0 behind the existing origin/main ref. No fetch or Git mutation.

Final inventory: 53 modified tracked files and 51 untracked files across the entire existing tree. This correction changed 12 pre-existing paths (eight source/test paths plus CHANGELOG and the three verification records) and added 27 font/icon/helper/provenance files; the other 358 baseline file hashes match. New implementation helpers are `src/components/v2-icon.tsx` and `src/theme/v2-fonts.ts`; assets are under `apps/mobile/assets/fonts` and `apps/mobile/assets/icons/lucide`. The untracked owner handoff/root config remain excluded from implementation scope. The live development server returns the exact bundled bytes for all five Heebo faces and the Sparkles/Check PNGs; this confirms asset delivery, not font selection or rendering.

Supported browser discovery returned no apps/browsers. Opening the actual reference failed with `Browser is not available: edge`; opening the isolated preview failed with `Browser is not available: iab`. Neither proposal screen could be rendered through supported access. Development bundle/asset serving establishes compilation/reachability only. **Pixel fidelity, actual font/icon rasterization, wrapping/scrolling, keyboard focus, owner/provider/integration and physical-device acceptance remain pending.** #29 stays In Progress; #32/#33 stay open with their existing Verify statuses. No issue metadata changed for this correction.

### Preview and owner recheck

Current isolated preview: **http://localhost:8083**, API **http://127.0.0.1:3197**. Hard-refresh once for the bundled fonts. If the web process has stopped:

```powershell
Set-Location -LiteralPath 'D:\code\LifeOS'
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
node apps/api/scripts/review-daily-flow.mjs web
```

No API restart is needed for this visual change. If that process has stopped, use the same location/environment in a separate terminal and `node apps/api/scripts/review-daily-flow.mjs api`. These launchers do not reset the database or change hosted configuration.

Review an existing unapproved proposal at **440 by 956 logical viewport** against the reference proposal at the same content viewport, excluding its phone/status-bar decorations. Check greeting, summary, ranks/reasons, real events when present, approval and navigation. Repeat at **320 by 956**, with a long Hebrew title, in light/dark appearance. Open profile/settings and return; open/cancel task details and proposal adjustment; approve once and check the approved state. Use a zero-task account for the empty state. Shared changes also need a quick Week/tasks/capture visual check. **Please supply application/reference screenshots labelled with viewport, theme and state while supported browser access remains unavailable.** Do not reset an approved day to obtain a screenshot.

**Release candidate:** patch-level correction within proposed combined V2 **0.6.0 (10)**, still unprepared/unauthorized. Current and last accepted **0.5.0 (9)** are unchanged. No version bump, build/export/install, provider configuration, DB mutation, production change, staging, commit or push. Checkpoint preparation remains paused for owner review.

## Owner review corrections — 2026-10-09

This section supersedes earlier onboarding/Today readiness claims below. Owner checkpoint `bf02eff3f6ec2ee51e0a5e0891e3e3729f846f08` remains HEAD on main, 1 ahead / 0 behind the existing origin/main ref. The index remains empty. Final tree: 49 tracked modifications and 24 untracked paths (16 implementation/verification files plus the seven owner handoff files and root tsconfig). All 16 protected hashes match the pre-#33 inventory; only six pre-existing #33 paths changed further for this correction (CHANGELOG, both affected #32/#33 records, local verifier, planning routes and daily-flow query hook). The pre-existing uncommitted #33 implementation, owner handoff, root tsconfig, environment/native boundaries and versions are preserved. No checkpoint preparation, staging, commit, push, fetch, DB reset, schema application, deployment or build/install was performed for these corrections.

### Findings and corrections

- The old onboarding used an in-memory two-step check/leaf presentation and did not persist completion. Recreated the reference's native orbit/L hero and floating tags, centered Assistant typography, spacing, “היום שלך, בקצב שלך”, explanatory text and calendar introduction. Replaced “להיום שלי” with “לתכנון היום”, including the related invalid-link return action. The calendar action explains current unavailability; it neither connects nor marks onboarding complete. Both continuation actions explicitly save completion before product navigation. Copy avoids claiming that calendar capacity shapes the proposal.
- New application registrations receive `lifeos_onboarding_version: 1` and an unset `lifeos_onboarding_completed_at` in existing Auth user metadata, alongside the optional name. The product route guard redirects these authenticated accounts to onboarding until an explicit continuation is acknowledged by Auth. Failures remain retryable; mounting, restarting and opening calendar information do not complete onboarding. Completion survives refresh/new login. Account-keyed views and response ownership checks prevent a late result from replacing another account's session. Legacy accounts without the marker retain their existing access; use a **fresh registration after this correction** to review the first-registration journey. These metadata fields are presentation state, not authentication authorization.
- Today now displays the real timezone-local date, time-appropriate greeting and optional profile name. First eligible entry initializes the persisted #32 proposal. Proposal cards carry actual titles/order/reasons, a clear adjustment action and one approval action. Approved days show real progress/membership and explicit editing; optional summary/system-adjustment tools are secondary. A fresh zero-task account has one primary task-creation action and an optional deliberate empty-day path. Empty calendar sections and repeated task-list actions are removed from that state. See [#32 correction evidence](issue-32-verification.md#owner-review-corrections--2026-10-09) for initialization, concurrency and historical-plan guarantees.

### Why email verification was skipped locally

Inspected the **running** `supabase_auth_LifeOS32` container: `GOTRUE_MAILER_AUTOCONFIRM=true`, `GOTRUE_EXTERNAL_EMAIL_ENABLED=true`, `GOTRUE_DISABLE_SIGNUP=false`. The isolated config at `%TEMP%/lifeos-32-disposable/supabase/config.toml` has email `enable_confirmations=false`. A real synthetic signup returned both a session and `email_confirmed_at`; this establishes expected local auto-confirmation, not an app bypass. The signup screen enters onboarding only for a returned authenticated session. A null session routes to Verify Email; an unconfirmed-password sign-in is rejected by Auth.

`verify-local-auth.mjs` separately started a temporary loopback-only GoTrue sidecar from the same installed image/network with auto-confirmation **disabled**, using only its own synthetic accounts in LifeOS32. It verified null signup session, `email_not_confirmed` sign-in rejection, actual Mailpit email, actual verification redirect into `/auth/callback`, the application's `processAuthCallback`, pending onboarding after login, explicit metadata completion, fresh-login persistence and isolation from the other test account. Synthetic users and the temporary container were removed. No owner account or existing service configuration was changed; no database reset was used.

The **existing** local service still has site URL `http://127.0.0.1:3000` and redirect allow-list `https://127.0.0.1:3000`. These do not authorize the current preview callback on localhost:8083. The temporary confirmation-required service used its own explicit preview allow-list; its passing callback must not be represented as verification of the existing local redirect configuration. Hosted confirmation requirements, delivery, redirects/app links and provider behavior remain unverified and unchanged.

### Exact available checks

All commands below ran from `D:\code\LifeOS`; no broad test suite, export or native build was run.

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` and `npm.cmd run lint` | Both workspaces pass after final source edits. Initial lint failures in new harness imports were corrected. |
| `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/auth-ui-test.tsx` | 23/23 pass: actual form branching under SDK mocks, callback/gates, new onboarding no-write-on-entry/calendar, save failure/retry, completion, restart and account switch. An old exact metadata expectation was updated for the new registration marker. |
| `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/v2-today-integration-test.tsx __tests__/daily-flow-test.tsx __tests__/v2-auth-lifecycle-test.tsx __tests__/auth-infrastructure-test.tsx` | Final 38/38 pass: proposal entry/reason/order, explicit approval, adjustment cancellation, real completion/focus/events, approved empty day, loading/error retry, settings readiness, account switch and late onboarding result protection, session/callback regressions. |
| `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/v2-today-integration-test.tsx __tests__/daily-flow-test.tsx __tests__/v2-foundation-test.tsx __tests__/week-navigation-test.tsx __tests__/v2-task-experience-test.tsx` | 44/44 pass before the final Today presentation refinement; the subsequently changed Today/daily-flow paths are included in the final 38/38 run above. Week/task/navigation regressions remain unchanged. |
| `$env:TSX_TSCONFIG_PATH = Join-Path (Get-Location) 'apps/api/tsconfig.json'; node --import tsx --test apps/api/__tests__/daily-flow.test.ts apps/api/__tests__/week-allocation.test.ts` | 11/11 pass. |
| `node --import tsx apps/api/scripts/verify-local-auth.mjs` | Both real Auth groups pass as detailed above; requires the local workdir and tracked TSX config below. |
| `node apps/api/scripts/verify-local-tasks.mjs --daily-entry` | Pass: actual local HTTP/DB initialization, empty/future-only entry, concurrent idempotence, saved/empty/stale selections, approval, next-day identity/history and account isolation. |
| Same local verifier with `--daily-flow`, then `--week-allocation` | Both pass: #32 proposals/approval/edit/retry/missed days/history/RLS and #33 allocation/order/empty days/stale/concurrent edits/descriptions/RLS. |
| `git diff --check`; explicit unstaged new-file whitespace checks | Pass. Protected baseline hashes and unchanged index checked. |

Harness environment (no hosted credentials/config):

```powershell
Set-Location -LiteralPath 'D:\code\LifeOS'
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
$env:LIFEOS_INTEGRATION_SUPABASE_PROJECT_ID = 'LifeOS32'
$env:TSX_TSCONFIG_PATH = Join-Path (Get-Location) 'apps/api/tsconfig.json'
```

The root owner `tsconfig.json` remains untracked and untouched. Both workspaces use their tracked configs; the new Auth harness command explicitly pins the tracked API config, as do the existing local API verifier/review launcher. It is not part of the application dependency or proposed source scope.

### Running preview and owner recheck

The existing isolated web preview is **http://localhost:8083**. Its API on 127.0.0.1:3197 was restarted to load the new initializer; LifeOS32 Auth/API remains 56321, DB 56322, Mailpit 56324. Existing database data and the web process were preserved. HTML, current development bundle and API health are reachable; bundle content includes the new onboarding marker and initializer. This is reachability/compilation evidence only.

If either preview process is later stopped, use two PowerShell terminals with the harness environment above, then respectively:

```powershell
node apps/api/scripts/review-daily-flow.mjs api
```

```powershell
node apps/api/scripts/review-daily-flow.mjs web
```

Do not start a duplicate listener or reset the local DB. The launcher reads only the explicitly named disposable project and bypasses mobile `.env` loading for this preview.

1. Open the URL without `preview`/`state` query parameters. Sign out if needed; register a fresh dedicated local account. Expected here: local auto-confirmed session → onboarding. Check orbit/L composition, Hebrew heading and “לתכנון היום”; the calendar action must explain unavailability without completing onboarding.
2. Reload before continuing: onboarding must remain. Continue explicitly; inspect the simple zero-task Today state. Reload/sign out/in: onboarding must not repeat. Switch to another fresh account: it must have its own onboarding/empty state.
3. Add one task for today. Today should show its proposal immediately, real date/greeting and a truthful reason. Open adjustment, cancel, then reorder/save a draft and reload. Approve once; check progress/completion against Week and task list after reload. Use adjustment to approve an intentionally empty day as a separate state.
4. For prior-day continuation, optionally use the existing `seed <fresh-local-email@example.test>` review helper only on a separate empty disposable review account; it refuses accounts with existing product rows. Inspect unfinished suggestions with real origin dates, retained historical plans and the already-approved next day. Do not seed the owner's current review account.
5. Compare prototype `welcome`, `proposal`, `adjust` and `today` at 390×844 and 320px width, light/dark, keyboard visible and RTL. Check scrolling, navigation/return and one primary proposal approval. Supported browser attempts returned `Browser is not available: edge` and `Browser is not available: iab`; no rendered comparison was possible in this session. Visual, owner, hosted provider/integration and physical-device acceptance remain pending.

### Release candidate and tracking for the corrections

These fixes remain within the proposed shared **0.6.0 (10)** V2 candidate, not prepared/authorized/installed/accepted. Tracked versions remain **0.5.0**, configured iOS build **9**; accepted 0.5.0 (9) predates this work. Recheck later native artifacts and complete the workflow's pre-device/schema/API gates in a future authorized task. No new schema migration is needed for these corrections; the existing pending #32/#33 rollout gates remain.

#29/#30 retain their existing **In Progress** states; this correction pass does not reassess their entire external acceptance scope. #32 moved Verify → In Progress while fixing Today, then back to **Verify** after software checks; each write was read back. #33 remains **Verify** with the integration regression evidence above. All four issues remain open; metadata other than the justified #32 Status transition is preserved. Checkpoint preparation remains paused by the owner; the historical manifests below/in #33 are not current staging instructions.

## Scope and baseline

Implementation baseline: `9b775df50b563f518464810ddf5e646b2087b67e`, main, following the owner-authorized no-tags fetch and clean fast-forward. The pre-existing untracked `design-reference/LifeOS-V2-Handoff/` is preserved. No implementation from the issue-creation instructions is repeated.

Read the owner handoff, including the account addendum. The prototype remains an in-memory reference, not a provider or planning contract. Browser/Computer Use review is blocked despite explicit owner authorization: the supported browser flow returns `Browser is not available: edge`; Windows Computer Use returned `Computer Use was not approved to use Microsoft Edge`. No alternate automation bypass was used. The prototype has been source-inspected, but rendered visual/interaction/RTL/narrow-screen/keyboard review remains pending.

## Reuse/change map

| Surface | Exact existing source | Reuse / bounded change |
| --- | --- | --- |
| Navigation | `apps/mobile/src/app/_layout.tsx`, `src/components/mobile-shell.tsx`, `src/components/bottom-navigation.tsx` | Keep Expo Router guards, stack and existing destinations; add V2 chrome and a Calendar route backed by existing local commitments. More remains reachable through the header. |
| Native theme | `apps/mobile/src/theme/tokens.ts` | Preserve the single existing token vocabulary and Assistant fonts. Add reference-derived light/dark palettes and persisted device system/light/dark preference via `theme-provider.tsx`; shared `components/v2.tsx` primitives. |
| Today | `apps/mobile/src/features/today/today-screen.tsx`, `today-task-summary.ts` | Retain historical development state previews; production index uses `v2-today-screen.tsx`. Preserve real data and command APIs; remove task-duration/capacity framing from the V2 Today presentation. |
| Tasks | `apps/mobile/src/features/tasks/task.queries.ts`, `task.api.ts`, `task-details.tsx`, `task-detail-screen.tsx` | Reuse account-scoped caches, existing completion/start/stop/reopen commands and detail editor. One identity across daily selection and dated tasks. |
| DailyPlan | `apps/mobile/src/features/planning/daily-planning.queries.ts`, `daily-planning-command.ts`, `daily-planning-session.tsx`, `daily-planning-view.tsx`, `planning.queries.ts` | Reuse durable draft/revision/approval and retry lifecycle plus explicit legacy focus selection. No ranking, recommendation reasons or next-day algorithm (#32). |
| Capture | `apps/mobile/src/features/capture/quick-capture-sheet.tsx`, `src/features/tasks/use-task-capture.ts` | Reuse title-only capture and existing save/cancel semantics; no mandatory duration or task slot. |
| Week | `apps/mobile/src/features/week/server-week-screen.tsx`, `week-day-view.tsx`, `weekly-planning-session.tsx` | Keep working week/day navigation and task/commitment editing. Full V2 Week migration and shared weekly approval remain #33/#32. |
| Calendar | `apps/mobile/src/features/commitments/commitment.queries.ts`, `commitment-editor.tsx`, `commitment-detail-screen.tsx` | Reuse actual LifeOS commitments and original times. Calendar entry links to Week for other dates. Explicitly unavailable Google/Apple connections; no provider icons or invented events. |
| Settings | `apps/mobile/src/features/settings/settings-screen.tsx`, `settings.components.tsx`, `account-screen.tsx`, `more-screen.tsx` | Preserve current preference and account paths; add actual appearance choice/account reset access. Full Settings migration remains #34. |
| Notifications | `apps/mobile/src/features/notifications/notification-provider.tsx`, `notification-reconciler.ts` | Preserve ownership-scoped scheduling, cleanup and existing preferences. No new categories or provider reminders. |
| Authentication | `apps/mobile/src/lib/supabase/client.ts`, `src/features/auth/auth-provider.tsx`, `auth-callback.ts`, `auth-callback-screen.tsx`, `auth-gate.ts`, `session-query-cache.tsx`, existing account screens | Extend the existing Supabase client/session system. Retain accounts, storage key and API ownership. Fix callback credential requirements, recovery lifecycle, provider-aligned validation and account actions. |
| Verification | `apps/mobile/__tests__/daily-planning-test.tsx`, `auth-ui-test.tsx`, `auth-infrastructure-test.tsx`, `task-query-cache-test.tsx`, `notification-provider-test.tsx` | Preserve lifecycle/ownership regression evidence; add meaningful V2 presentation, callback and session persistence tests. |

Paths abbreviated as `src/` in the table are relative to `apps/mobile/`.

## Legacy reconciliation and interfaces

#6 remains an unresolved capacity investigation; removing the V2 Today hours presentation is not a fix or acceptance of its calculation requirements. Preserve stored capacity/day-window values and APIs. #14's optional task hours/templates conflict with the current no-task-slot direction and require a later explicit product decision; neither implement nor close them here. Preserve #2/#5/#9 historical acceptance, explicit task importance and separate Weekly Focus semantics.

No new schema/API contract was needed for the original #29/#30 milestone. Existing authenticated requests, IDs, history, reminders and event times are reused. Google remains #17 (full bidirectional scope); Apple #31. The subsequent #32 implementation now shares this working tree and adds proposal ranking, next-day continuation and the joint weekly persistence contract; its API and migration are mandatory in the combined checkpoint. See [the #32 record](issue-32-verification.md). Full Week migration remains #33.

## Provider contract and limits

Local `supabase/config.toml` declares minimum password length 6, no character-class requirements and email confirmations disabled. This is local configuration, not proof of hosted configuration. The existing UI's minimum-eight and fixed-60-minute claims are unsupported and must not be carried forward. The hosted provider is authoritative for password acceptance; hosted configuration, redirect allowlist, email delivery and real callback acceptance remain external gates unless independently verified.

Official references reviewed: [password security](https://supabase.com/docs/guides/auth/password-security), [password authentication](https://supabase.com/docs/guides/auth/passwords), [React Native sessions](https://supabase.com/docs/guides/auth/quickstarts/react-native). Verify installed SDK bytes as well as documentation when implementing callbacks/storage.

## Release candidate

| Field | Value |
| --- | --- |
| SemVer impact | Minor: substantial compatible visual/account capability; both issues may share one future candidate |
| Proposed future candidate | 0.6.0 (10), compatible Minor grouping; not prepared or authorized |
| Candidate inventory gate | Recheck the owner's native artifacts before preparation; exceed every relevant known build |
| Version prepared | No; existing baseline remains 0.5.0 (9) |
| Native version synchronized | No; native files preserved |
| Physical build installed | Pending for this implementation |
| Owner accepted exact build | Pending; 0.5.0 (9) predates this implementation |
| Included issues | #29 and #30 in this record; the combined local checkpoint also includes #32 and its existing shared Week/day contract, not full #33 implementation |

No production mutation, provider configuration change, deployment, native build/install, tag or release is authorized. Complete the canonical pre-device gate in a later authorized task before requesting installation.

## Verification

Exact completed command results are recorded below. Mocks, source assertions and JavaScript exports do not establish rendered appearance, live provider behavior or physical acceptance.

| Executed check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Passed for API and mobile |
| `npm.cmd run lint` | Passed for API and mobile; no final warnings/errors |
| `npm.cmd test --workspace @lifeos/mobile -- --silent --json --outputFile=$env:TEMP/lifeos-v2-mobile-tests-final.json` | 53 suites passed; 366 passed, 0 failed, 1 platform-specific skipped test |
| `npm.cmd test --workspace @lifeos/mobile -- --config jest.task-date-android.config.js --silent` | 1 Android suite, 3 tests passed; covers the Android-only case skipped in the default platform run |
| `npm.cmd test --workspace @lifeos/api` | 13 suites, 96 tests passed |
| From `apps/mobile`: `npx.cmd expo export --platform ios --output-dir $env:TEMP/lifeos-v2-ios-js-final --max-workers 2` | Passed; 1,501 modules, Hermes JavaScript bundle; no native binary |
| From `apps/mobile`: `npx.cmd expo export --platform web --output-dir $env:TEMP/lifeos-v2-web-js-final --max-workers 2` | Passed; 1,122 modules; no deployment |
| `Invoke-WebRequest -UseBasicParsing http://localhost:8081/welcome` | HTTP 200; not rendered/interaction evidence |
| Preview launch follow-up: root `npm.cmd run web -- --port 8082`, then fetch `/welcome` and its script URL | Passed: workspace `src/app` selected, 1,209 modules bundled from `expo-router/entry.js`; page and JavaScript bundle HTTP 200. Port 8081 was occupied; no existing server was stopped. Rendering remains pending. |
| `git diff --check` | Passed |
| Existing dependency lock entries compared with HEAD | Preserved exactly; only the mobile SecureStore dependency and its new package entry added |
| Version/config review | All first-party versions remain 0.5.0; configured iOS build remains 9; existing footer contract preserved |

New tests exercise native storage migration/restart, Unicode size boundaries, failed writes, stale-plaintext logout protection, recovery-session isolation and restart, unproven/ambiguous/used callbacks, provider-authoritative validation, known internal return destinations, theme persistence, and real-query-hook Today actions/loading/error/retry/draft identity/event times/account change. Existing capture, task mutation/cache, planning, settings, notification and keyboard tests remain regression evidence. The API suite uses controlled adapters and includes ownership rejection; no production database was used.

Intermediate runs caught obsolete navigation/callback expectations, a missing mocked recovery-storage adapter and a capture-settings fixture that omitted query data. These were corrected without removing behavior assertions. Typecheck also caught stale generated route types and an SDK return type narrower than the installed runtime result; final checks pass. The mock-backed auth and native storage cases remain separate from hosted-provider and physical-device gates.

## Reviewable implementation

- Shared native V2 palette, typography, cards, buttons, notices, task rows and navigation. System/light/dark appearance persists through Settings. Hebrew RTL and LTR credential inputs are retained, with scrollable keyboard-aware forms and accessible password visibility controls.
- Today reads real account/timezone-scoped Tasks, existing daily planning state and LifeOS Commitments. Draft selections remain explicitly unapproved. Completion/reopen, start/stop, details, focus selection and capture reuse current commands. Stored estimates/capacity, priorities, reminders, history and event times are preserved. Center capture defaults to Inbox; the Today action explicitly targets Today.
- Calendar remains a tab showing today's actual LifeOS commitments, with access to Week for other dates. Provider availability is stated honestly. Existing Week, Inbox, planning sessions and detail editors remain reachable; their full visual migration belongs to later slices.
- Account access covers optional-name registration, verification waiting/resend, confirmation/onboarding, neutral recovery requests, SDK callbacks, reset/success/invalid links, account details/reset requests and confirmed logout. Returning sign-in bypasses onboarding and retains known internal destinations.
- Callbacks require a supported route and exactly one complete credential mechanism. Cached login alone is never callback evidence. Missing, duplicate, mixed and unsupported callback parameters are rejected. Web credential parameters are removed on success/error. Invalid links preserve unrelated valid sessions.
- Sign-in, immediate registration and callback success wait until the route guard observes the authenticated account. A delayed auth-state event is covered by a regression test; SDK return timing alone cannot prematurely redirect past confirmation/onboarding.
- Recovery restrictions persist across restart/token refresh using a credential-free account/sign-in-bound marker. Password updates require that matching recovery context. A logout retry after a successful update does not resubmit the password.
- Native sessions migrate the existing Supabase AsyncStorage key to SecureStore. Unicode-safe chunks and an atomic manifest preserve the previous durable value on write failure. Logout tombstones prevent stale plaintext resurrection; cleanup is retried on reads. Web retains the existing browser-storage contract. See [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) for platform limits/persistence. Adapter tests do not prove physical Keychain/Keystore behavior.
- Task, Commitment, settings and legacy-plan queries/mutations carry the account that initiated them through the existing token-account guard. Product drafts/editors remount on account changes. Existing query-cache clearing and notification ownership remain in place. Logout is local to this device; server data is retained.
- A provider-authenticated session survives API transport failure; product queries show their own retry states. Explicit API identity rejection/mismatch is not treated as successful login.

## Remaining acceptance gates

1. Render and interact with the prototype and implementation. Compare Today/auth, light/dark/system, 320/390 px widths, large text, mixed-direction content, keyboard, loading/error/empty states, capture and navigation. Fix observed mismatches. Source review is not visual acceptance.
2. Read the hosted password policy, email-confirmation setting, SMTP/template behavior and redirect allowlist. Verify real registration, email delivery, existing/unknown email responses, resend/rate limits, recovery/update, expired/used links and configured callbacks/app links. No live settings or test-account/password mutations were performed in this task.
3. Complete the canonical pre-device gate in a later authorized task. Accepted 0.5.0 (9) predates this work. Both native directories are absent in this Windows checkout; none were generated. SecureStore adds a native dependency/plugin. Recheck the owner's Mac artifacts, prepare/synchronize an authorized higher candidate, then verify existing-session migration, restart/refresh/expiry, recovery restart, logout/account switching, native storage failures, notifications, RTL and keyboard on that exact binary. No native build/install instructions are authorized yet.
4. The original #29/#30 slice introduced no schema. Its API tests use mocks/fakes and static migration assertions. The combined checkpoint now includes #32's API/schema changes and separate disposable-database/RLS evidence in [the #32 record](issue-32-verification.md). Hosted rollout, provider configuration, deployment and publication remain pending.

## Tracking

Readback: [#29](https://github.com/OzAvrahami/LifeOS/issues/29) and [#30](https://github.com/OzAvrahami/LifeOS/issues/30) are both **Open / In Progress** in [Project #2](https://github.com/users/OzAvrahami/projects/2). Priorities remain unset. Labels, assignees, milestones, membership and relationships are preserved. Foundations and initial regression checks preceded account work; #29 remains #30's prerequisite and has not been falsely closed. No issue was created or closed and no unrelated metadata was changed.

## Local preview

Start the development preview from the repository root using the workspace shortcut:

```powershell
Set-Location D:\code\LifeOS
npm.cmd run web -- --port 8082
```

Open `http://localhost:8082/welcome` for account access, or `/` with an existing valid account for real Today data. Running bare `npx expo start` at the repository root selects Expo's default `AppEntry.js` and fails to resolve `../../App`; the shortcut selects `apps/mobile` and its `expo-router/entry`. Stop a wrongly rooted server with Ctrl+C before reusing its port. The untracked root `tsconfig.json` observed after the failed launch is preserved and excluded from the checkpoint.

The existing ignored `.env` selects the configured Supabase/API endpoints; do not replace it or print its values. Development-only `/?preview=1` is an explicitly labeled fixture preview, never provider/data evidence. More > Settings > Appearance changes the persisted theme; More > Account offers details/reset/logout. Open the local `design-reference/LifeOS-V2-Handoff/prototype.html` directly in the authorized browser for comparison.

## Owner-managed checkpoint

Reconciled on **2026-10-09** against the actual working tree, index, saved verification logs and #29/#30/#32 issue bodies (all open, no comments). HEAD remains `9b775df50b563f518464810ddf5e646b2087b67e` on `main`, 0 ahead / 0 behind the existing `origin/main` ref; no new fetch was performed. The index is empty.

Use the [combined checkpoint manifest and owner commands](issue-32-verification.md#combined-owner-managed-checkpoint--2026-10-09): **98 explicit files**, comprising 71 tracked modifications and 27 new implementation/documentation files. The former mobile-only checkpoint is superseded because #32 overlaps this source and requires eight API files and `supabase/migrations/20261009120000_add_daily_proposals.sql`. The inventory below remains historical evidence for the original milestone, not the current combined staging list.

Current source timestamps are covered by the later #32 checks, including its focused mobile rerun and refreshed API/database checks. No additional source change or uncovered targeted check was identified; broad suites were not repeated. This reconciliation edits only the two verification records. `git diff --check` passes; untracked checkpoint files were also checked without staging. Protected handoff/environment/root-config hashes match the saved baseline. Ignored native directories remain absent.

Ready for the owner-managed local implementation checkpoint, with no identified local checkpoint blocker. Visual, hosted-provider, full integration and exact physical-device acceptance remain pending. Versions remain 0.5.0 (configured iOS build 9); proposed 0.6.0 (10) is still unprepared and unauthorized. No staging, commit, push, version change, schema application, build or deployment was performed. Hold deployment-triggering pushes until the authorized schema/API rollout sequence is completed.

## Changed-file inventory

Tracked modifications (65) and new implementation/documentation files (16), excluding the owner handoff directory and preserved untracked root `tsconfig.json`:

```text
M  CHANGELOG.md
M  apps/mobile/__tests__/auth-ui-test.tsx
M  apps/mobile/__tests__/commitment-reminder-ui-test.tsx
M  apps/mobile/__tests__/core-local-flow-test.tsx
M  apps/mobile/__tests__/daily-planning-test.tsx
M  apps/mobile/__tests__/inbox-screen-test.tsx
M  apps/mobile/__tests__/planning-query-cache-test.tsx
M  apps/mobile/__tests__/settings-product-integration-test.tsx
M  apps/mobile/__tests__/settings-screens-test.tsx
M  apps/mobile/__tests__/task-date-capture-test.tsx
M  apps/mobile/__tests__/task-server-flow-test.tsx
M  apps/mobile/__tests__/today-screen-test.tsx
M  apps/mobile/__tests__/week-navigation-test.tsx
M  apps/mobile/__tests__/week-screen-test.tsx
M  apps/mobile/__tests__/weekly-planning-lifecycle-test.tsx
M  apps/mobile/app.json
M  apps/mobile/package.json
M  apps/mobile/src/app/_layout.tsx
M  apps/mobile/src/app/account.tsx
M  apps/mobile/src/app/auth/callback.tsx
M  apps/mobile/src/app/commitment.tsx
M  apps/mobile/src/app/inbox.tsx
M  apps/mobile/src/app/index.tsx
M  apps/mobile/src/app/more.tsx
M  apps/mobile/src/app/settings/_layout.tsx
M  apps/mobile/src/app/sign-in.tsx
M  apps/mobile/src/app/sign-up.tsx
M  apps/mobile/src/app/task.tsx
M  apps/mobile/src/app/week.tsx
M  apps/mobile/src/app/welcome.tsx
M  apps/mobile/src/components/bottom-navigation.tsx
M  apps/mobile/src/components/mobile-shell.tsx
M  apps/mobile/src/features/auth/auth-api.ts
M  apps/mobile/src/features/auth/auth-callback-screen.tsx
M  apps/mobile/src/features/auth/auth-callback.ts
M  apps/mobile/src/features/auth/auth-errors.ts
M  apps/mobile/src/features/auth/auth-loading-screen.tsx
M  apps/mobile/src/features/auth/auth-provider.tsx
M  apps/mobile/src/features/auth/auth-validation.ts
M  apps/mobile/src/features/auth/auth.components.tsx
M  apps/mobile/src/features/auth/auth.types.ts
M  apps/mobile/src/features/auth/forgot-password-screen.tsx
M  apps/mobile/src/features/auth/reset-password-screen.tsx
M  apps/mobile/src/features/auth/sign-in-screen.tsx
M  apps/mobile/src/features/auth/sign-up-screen.tsx
M  apps/mobile/src/features/auth/verify-email-screen.tsx
M  apps/mobile/src/features/auth/welcome-screen.tsx
M  apps/mobile/src/features/capture/quick-capture-sheet.tsx
M  apps/mobile/src/features/commitments/commitment.api.ts
M  apps/mobile/src/features/commitments/commitment.queries.ts
M  apps/mobile/src/features/planning/daily-planning-view.tsx
M  apps/mobile/src/features/planning/planning.api.ts
M  apps/mobile/src/features/planning/planning.queries.ts
M  apps/mobile/src/features/settings/account-screen.tsx
M  apps/mobile/src/features/settings/more-screen.tsx
M  apps/mobile/src/features/settings/settings-screen.tsx
M  apps/mobile/src/features/settings/settings.api.ts
M  apps/mobile/src/features/settings/settings.components.tsx
M  apps/mobile/src/features/settings/settings.queries.ts
M  apps/mobile/src/features/tasks/task.api.ts
M  apps/mobile/src/features/tasks/task.queries.ts
M  apps/mobile/src/features/tasks/use-task-capture.ts
M  apps/mobile/src/lib/supabase/client.ts
M  package-lock.json
M  package.json
?? apps/mobile/__tests__/secure-session-storage-test.ts
?? apps/mobile/__tests__/v2-auth-lifecycle-test.tsx
?? apps/mobile/__tests__/v2-foundation-test.tsx
?? apps/mobile/__tests__/v2-theme-test.tsx
?? apps/mobile/__tests__/v2-today-integration-test.tsx
?? apps/mobile/src/app/auth/confirmed.tsx
?? apps/mobile/src/app/auth/invalid.tsx
?? apps/mobile/src/app/calendar.tsx
?? apps/mobile/src/components/v2.tsx
?? apps/mobile/src/features/auth/auth-destination.ts
?? apps/mobile/src/features/auth/recovery-state.ts
?? apps/mobile/src/features/settings/appearance-setting.tsx
?? apps/mobile/src/features/today/v2-today-screen.tsx
?? apps/mobile/src/lib/supabase/session-storage.ts
?? apps/mobile/src/theme/theme-provider.tsx
?? docs/v2-milestone-1-verification.md
```
