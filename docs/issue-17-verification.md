# Issue #17 — Google Calendar phases 1–2

Implementation/evidence: 2026-10-09. This is a **partial implementation** of the existing bidirectional issue. #17 stays open and **In Progress**; import-only delivery does not complete it. [Data, security, synchronization and future-write contracts](issue-17-calendar-contracts.md) are the phase 1 specification.

## Current production-preparation follow-up — 2026-10-10

The owner completed checkpoint **`16245b7075741428284d4ac2399a7cc1abf920f3`**. Actual checkout is `main`, **4 ahead / 0 behind** existing `origin/main`, with an empty index. Only the owner handoff directory and root `tsconfig.json` were untracked at entry. This follow-up leaves staging/commit/push owner-managed and supersedes the earlier pending-checkpoint, pending-migration and missing-production-variable statements below.

The owner reports applying `20261009120000`, `20261009150000` and `20261009180000`, seeing all 13 remote history entries and an up-to-date subsequent dry run. The post-apply pg-delta catalog-cache timeout is not evidence of a failed migration. No migration was reapplied and no history repair/reset was performed. The owner also confirms adding the production Google callback to the existing OAuth Web client; the older downloaded JSON is not evidence against that live update. The agent did not inspect/change Google Cloud settings or run a real hosted callback.

### Hosted schema verification and resolved ledger blocker

Management-API SQL inspection used `BEGIN READ ONLY` / `ROLLBACK` against the verified linked LifeOS project `vcizpdzqbctjksnivnzt`; no product records, credentials or connection rows were selected or mutated. Independently confirmed all **13 migration versions**, the V2 `flow_state` column/operation ledgers, imported commitment columns and constraints, enabled provider guard trigger and unique per-user/account/calendar/event index. All seven relevant product/private tables have RLS enabled. Product/operation policies bind authenticated callers to `auth.uid() = user_id`; the private Google table has no client policy and anon/authenticated lack private schema/table access. `google_calendar_command(uuid,text,jsonb)` is SECURITY DEFINER with empty search_path, granted to service_role and denied to anon/authenticated. V2 caller RPCs remain SECURITY INVOKER and deny anon. Seven inspected function definitions match the tested disposable schema (Google differs only in trailing whitespace; six hashes match exactly).

**Blocker discovered, subsequently resolved below:** hosted `public.daily_flow_operations` granted authenticated callers **UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER and MAINTAIN**, in addition to SELECT/INSERT. Its owner RLS policy remained enabled, but these extra grants violated the append-only ledger contract. The #32 migration revoked anon privileges and granted authenticated SELECT/INSERT without first revoking pre-existing/default authenticated privileges. The #33 `week_allocation_operations` migration explicitly revokes both roles and its hosted grants correctly remain SELECT/INSERT only. The earlier disposable SELECT/INSERT-only characterization was incomplete: fresh ACL inspection also found residual TRUNCATE/REFERENCES/TRIGGER/MAINTAIN there and different service-role grants. The corrective harness therefore reproduces the reviewed hosted ACL explicitly inside its rollback transaction. No forbidden operation was attempted on hosted LifeOS.

The owner subsequently authorized the single forward-only correction and its hosted application after local validation and an exact plan check, before the combined follow-up Git checkpoint. This is the explicitly authorized exception to the usual checkpoint-before-hosted-application sequence; no historical migration or history entry was edited. The private Google table and canonical commitments do not have those extra authenticated/anon grants. The timeout warning was unrelated to the privilege discrepancy.

### Ledger correction applied and verified — 2026-10-10

Source review confirms `save_daily_flow(date,jsonb)` is SECURITY INVOKER under the caller JWT: it SELECTs the owner/operation identity for safe retries and INSERTs one immutable command after saving the plan. It never updates/deletes ledger rows. `20261010120000_restrict_daily_flow_operation_privileges.sql` revokes this table's PUBLIC/anon/authenticated grants, explicitly clears its four columns' client grants and restores authenticated SELECT/INSERT. It preserves service-role grants and owner RLS. A postcondition rejects unexpected inherited excess privileges. No global membership/default ACL, unrelated object, product record or historical migration changes are included. PostgreSQL's [REVOKE contract](https://www.postgresql.org/docs/current/sql-revoke.html) and [effective privilege functions](https://www.postgresql.org/docs/current/functions-info.html) informed the table/column/inheritance checks.

Pre-apply hosted inspection found direct authenticated grants, no PUBLIC grant, no column ACLs and no inherited authenticated role beyond itself. Service_role had all eight PostgreSQL 17 table privileges. The new disposable-only `verify-daily-flow-privileges.mjs` recreates those service/client grants and adds PUBLIC/column bypass fixtures, applies the exact migration twice, and verifies:

- Effective authenticated SELECT/INSERT only; no anon table/column access, and no UPDATE/REFERENCES column bypass or MAINTAIN grant.
- Actual SECURITY INVOKER RPC insertion and identical retry with one ledger record; changed-command identity reuse rejection, own direct insertion/read, cross-account read filtering and insert rejection, anonymous denial.
- Actual UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER denial **only in LifeOS32**; service-role fixture SELECT/INSERT/UPDATE/DELETE still works and its full ACL is unchanged.
- Rollback removes fixture users/plans/schema and restores pre-test grants. Before/after user-ID, plan, ledger and ACL fingerprints match. No reset or persistent disposable record/ACL change occurred.

Exact hosted target was reverified as **LifeOS**, `vcizpdzqbctjksnivnzt` (ap-northeast-1), matching the linked project. All 13 prior versions matched the local historical filenames. Fresh `supabase db push --linked --dry-run --skip-vault` succeeded and listed **only** `20261010120000_restrict_daily_flow_operation_privileges.sql`. Its reviewed SHA-256 was checked again before one `supabase db push --linked --skip-vault --yes` invocation. Vault, seed and custom-role updates were excluded. Application exited **0** and reported completion; a post-apply catalog-cache timeout warning did not prompt reapplication or repair.

Independent read-only Management-API readback confirms **14** migration entries through `20261010120000`; the subsequent dry run exits **0**, reports up to date and lists no pending migrations. Authenticated has exactly SELECT/INSERT, including effective column access; UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN are false. All four column ACLs remain null; anon has no access. Service_role retains all eight table privileges and full effective column access. Owner RLS/policy and role inheritance are identical. Ledger count/content digest, global role-membership/default-ACL fingerprints, other public/private table ACLs and relevant function definitions are unchanged. `save_daily_flow` remains caller-invoker/authenticated-accessible; Google RPC remains service-only SECURITY DEFINER. Hosted verification used introspection only, with no destructive-operation probe or calendar import.

Focused checks: disposable harness **pass**; its ESLint check from `apps/api` **pass**; `git diff --check` **pass**. During harness development, a temporary-table foreign key was correctly rejected by PostgreSQL before the intended privilege check; the fixture now uses an isolated rollback-only regular schema. The service fixture also now explicitly matches hosted grants after discovering different disposable defaults. An initial root-directory lint invocation lacked the app ESLint config; the corrected app-directory invocation passes. These failed probes rolled back and never touched hosted records. The existing **19/19 native-auth tests**, controlled-provider Auth/DB/RLS pass and API typecheck/lint evidence below are reused because their four source/test files remain byte-identical. No broad suite, version change or build was needed for the ACL-only correction.

### Minimal native-only configuration correction

`GOOGLE_CALENDAR_WEB_RETURN_URI` is now optional at the shared configuration boundary. Absent web return produces `webReturn: null`; native authorization retains the fixed **`lifeos://settings/google-return`**. Web initiation without an explicit return fails with `503 setup_required` **before storing an attempt or contacting Google**. If a web return is supplied, the existing HTTPS/loopback, no-userinfo/query/fragment and exact `/settings/google-return` path validation remains mandatory. Existing callback URI, key, server-credential, PKCE, one-use state, ownership/proof/receipt and account-isolation checks are unchanged. No placeholder production web URL was introduced.

Valid native callbacks retain the attempt's stored app return for success, denial/cancellation, missing code and provider failure. Only successful exchange supplies a completion receipt; credentials/provider errors never enter return URLs. Forged/replayed state still fails closed. The local persistent web return/callback configuration was preserved and validates with the corrected code; the owner preview was not restarted or reauthorized.

### Railway configuration saved, not deployed

Verified exact target: **LifeOS** project `4b0ede86-7928-45fa-ade4-46a1094b7101`, **production** environment `628a150a-e576-462f-9f82-ea5ca4651dc5`, **@lifeos/api** service `d99536c4-ae42-429d-9116-f073396a3943`. The existing Supabase URL matches hosted LifeOS, not LifeOS32.

Saved and read back these **five** authorized server variables using supported `railway variable set --stdin --skip-deploys`, with values supplied only through stdin and captured output suppressed:

- `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET`, from the existing private local OAuth configuration.
- `GOOGLE_CALENDAR_REDIRECT_URI`: `https://lifeosapi-production-0362.up.railway.app/integrations/google/callback`.
- `GOOGLE_CALENDAR_ENCRYPTION_KEY`: no valid existing production key was present; generated 32 cryptographically random bytes as base64, separate from the local key, and persisted privately at `%LOCALAPPDATA%\LifeOS\production\google-calendar-key.env` with owner/SYSTEM-only access.
- `SUPABASE_SERVICE_ROLE_KEY`: retrieved through the authenticated Supabase project-key API for `vcizpdzqbctjksnivnzt` and checked for matching project/service_role claims; never sourced from LifeOS32.

`GOOGLE_CALENDAR_WEB_RETURN_URI` remains unset intentionally. No unrelated variable was altered. The existing STAGED pending patch was empty and its ID/status/content remained unchanged; deployment IDs/statuses also remained unchanged. No pending changes were applied. The active API remains SUCCESS deployment `ca91328a-57b3-475a-93f7-06237f856d9f`, source `6407ae8856ee8289e8183aaeaf6661b680d32267`. **Saved variables are not evidence that a deployed process has loaded them.** Local evaluation of the corrected config with the saved values passes in production mode; no production deployment or integration request was made. Secret values were not printed, passed in command arguments, written to Git/logs or put in public Expo variables.

### Focused verification and handoff

- `node --import tsx --test apps/api/__tests__/google-calendar.test.ts` with tracked API TS config: **19/19 pass**, including 11 new native/web configuration/callback checks. Native-only setup, missing required secrets, invalid return URLs, web setup rejection, success/cancel/error/missing-code redirects and one-use state are covered.
- `node --import tsx apps/api/scripts/verify-google-calendar.mjs` against existing **LifeOS32**: **pass**. Now removes the web return during actual local Auth/DB/RLS native initiation/completion, rejects web initiation, verifies ownership/proof/receipt/replay, restores the local web configuration and runs existing controlled-provider selection/import regressions. Only temporary harness users/data were removed; real owner records were preserved. No Google request or production import occurred.
- API `typecheck` and `lint`: **pass**; targeted harness lint after its last change: **pass**. The corrected config also validates both saved native-only production values and the unchanged local web values. One ad hoc local probe used an incorrect relative CLI path; rerunning with the absolute repository CLI path passed, with no configuration change.
- Diff/whitespace, secret containment, private ACLs, version consistency and preservation checks: **pass**. No mobile source changed, so no broad mobile suite, native export/build or owner Google-flow repetition was run.

Combined follow-up checkpoint scope is now **nine files**:

```text
CHANGELOG.md
apps/api/__tests__/google-calendar.test.ts
apps/api/scripts/verify-daily-flow-privileges.mjs
apps/api/scripts/verify-google-calendar.mjs
apps/api/src/features/google-calendar/google.config.ts
apps/api/src/features/google-calendar/google.service.ts
docs/DEPLOYMENT.md
docs/issue-17-verification.md
supabase/migrations/20261010120000_restrict_daily_flow_operation_privileges.sql
```

The previous seven-file manifest is superseded. The earlier 53-file slice is already in `16245b7` and must not be restaged. Owner handoff/root config, environments/private credentials, ignored files and index remain preserved. Final Railway readback confirms saved variables and deployment metadata unchanged; no deployment or pending-change application was triggered.

Ready for the combined owner checkpoint; **the hosted ledger privilege blocker is resolved, with no pending migration**. Next: owner checkpoint and separately authorized push/API rollout, verify the new active source and loaded configuration, then complete mobile release preparation. Saved Railway variables are not active-process evidence. Current/last accepted **0.5.0 (9)** and proposed unprepared **0.6.0 (10)** remain unchanged. Do not import into production accounts used by the old binary; it is not compatible with all-day imports. Hosted callback/consent, operational log redaction, exact physical binary and device acceptance remain pending. #17 stays Open / In Progress (read back unchanged); no later phase was implemented.

## Owner-reported local success — 2026-10-10

After configuring Google OAuth and trying the local flow, the owner reported **“Amazing, it works.”** This is owner-reported local success for the flow they tried, not independent observation or an item-by-item acceptance checklist. It supersedes the earlier absence of any real-provider owner feedback; it does not establish which individual connection, selection, import or event-detail steps were checked.

Duplicate prevention, cancellation, disconnect/reconnect, every imported event/time/recurrence, complete rendered visual review and physical iPhone behavior were **not individually attested**. Their existing controlled-provider/automated evidence remains separate from live-provider acceptance. Hosted Google/Auth/email/callback behavior, production rollout and physical-device acceptance remain pending. Outbound writes and automatic/background synchronization are unimplemented; #17 remains **Open / In Progress**, confirmed by read-only GitHub inspection on 2026-10-10. No tracking write or issue closure was needed.

## Baseline and preservation

Historical implementation baseline: `6b531593e0fcae87dbd1a4696f5c48a4ab7d70d1`, branch `main`, then **3 ahead / 0 behind** existing `origin/main` (`9b775df50b563f518464810ddf5e646b2087b67e`). The owner subsequently committed that slice as `16245b7`; the current follow-up status is above. No agent fetch/pull/branch/history operation occurred.

The seven owner handoff files and untracked root `tsconfig.json` are preserved. Baseline SHA-256 comparison passes for 26 protected paths, including index, environment and native files. No dependency/version/font/license change is needed: existing Heebo/Lucide assets and dependencies are reused. Mobile typecheck uses its tracked app config extending Expo; API launch and TypeScript tests explicitly pin `apps/api/tsconfig.json`. The untracked root config is not a prerequisite.

Applicable AGENTS/workflow/GitHub/deployment instructions, #17 and comments, related #15/#28/#30/#31/#32/#33/#34 contracts, verification records and the owner handoff were reviewed. Octocode local discovery failed input validation; focused `rg`/source reads supplied the local structural evidence. Current official Google documentation is linked in the contracts record.

## Implemented scope

| Area | Implementation and boundary |
| --- | --- |
| Account authorization | One Google subject per LifeOS user, separate from LifeOS login. Server web-code OAuth, least read-only Calendar scopes, PKCE, ten-minute state attempt, authenticated initiation and completion. |
| Callback security | One-use hashed state; same-user completion needs the original client proof **and** a separate receipt returned only through the callback. Both are hashed server-side. Superseded/cancelled/expired/replayed requests fail closed. Completion retries are idempotent. Native proofs use existing secure storage; web uses account-keyed browser storage. No Google tokens enter the client. |
| Server credentials | AES-256-GCM with owner/purpose binding. Private schema and service-only RPC. Ordinary task/settings/commitment API continues using caller JWT and RLS. Access tokens are ephemeral; provider errors are sanitized. No credential values are documented, logged or committed. |
| Selection | Real calendar list and access roles; no default selection, including primary. Free/busy-only calendars cannot import details. At most ten selected calendars. Saving the selection and importing are separate explicit actions; empty selection is valid. |
| Import | Expanded occurrences, complete pagination, 30 days back / 180 ahead from UTC midnight (exclusive end). Stable `(user, subject, calendar, event-instance)` identity. Atomic full selected-calendar snapshot; failed pages/normalization preserve the last snapshot. Revision/lease prevents concurrent selection/disconnect from being undone. No provider event write method exists. |
| Canonical commitments | Same IDs/table/API/cache in Calendar/Today/Week. All-day floating dates and exclusive end; timed original instants/offsets, timezone, overnight and recurring metadata retained. Day queries use overlap. Cancelled/absent in-window occurrences are hidden only after successful reconciliation. Snapshots outside the import window remain historical, not a claim of freshness. |
| Permissions and disconnect | Imported details are read-only even when Google grants writer/owner permission. API and database trigger reject local edits/deletes/provider-field forgery. Disconnect removes local credentials and hides imports, including immediate pruning of confirmed hidden records from account-scoped caches when a later refresh fails; no Google events or local commitments are deleted. Google-side revocation can be done by the owner in their Google account; this slice does not revoke shared OAuth grants automatically. |
| Location / #15 foundation | Optional separate free-text location on local and imported commitments; trim, blank-to-null, maximum 2000 application code units. Local editor saves it; imported details preserve location and multiline description as text. This does not claim full #15 owner/device acceptance or change its tracking. |
| Existing planning/reminders | Local timed/start-only commitments remain editable. Imported events get no LifeOS reminder. All-day/transparent events have no inferred busy duration; timed metrics use real elapsed instants. Tasks, templates and Focus never become events; imports do not write task plans. |
| V2 surfaces | Settings reports real server availability/status/selection counts. Google loading/disconnected/connected/failed/reconnect-required states, cancel and confirmed disconnect; Apple remains unavailable. Callback return requires explicit completion. Validated internal return survives the existing Auth redirect. Accepted task/proposal logic is untouched. |

Projection uses the LifeOS timezone captured at import; after changing that preference, explicitly import again to reproject timed events. Details show the captured display timezone. Provider descriptions render literally as text, including any HTML markup; no HTML execution. Unsupported oversized or invalid records fail the snapshot rather than silently truncating data. Full pagination is capped at 20 pages/10,000 items, with request/page/import time budgets; over-limit calendars require a future larger-window strategy and remain a truthful failure.

## Schema and rollout

New forward-only migration: `supabase/migrations/20261009180000_add_google_calendar_import.sql`. Adds location/source/visibility/end-date support without changing local IDs; all-day imports alone may omit start time. Creates private Google state and restricted integration RPC; imported product rows remain user-isolated.

Applied once transactionally using `psql --single-transaction -v ON_ERROR_STOP=1` **only** to verified Docker container `supabase_db_LifeOS32`, project `LifeOS32`, localhost API `56321`, DB `56322`, workdir `%TEMP%\lifeos-32-disposable`. No reset. Existing records/accounts were retained; harness-created users were deleted after each run. The direct disposable SQL application is not a claim of remote migration-history application.

Production was untouched by the original implementation. The owner subsequently applied all three migrations; the current read-only verification and remaining privilege blocker are recorded above. The schema-before-API ordering remains mandatory; successful migration history alone does not resolve the grant discrepancy.

## Checks and results

- API changed-path tests: **20/20**, `google-calendar.test.ts` plus `commitments.test.ts`. Includes fixed OAuth scopes/callback/PKCE, ciphertext ownership/integrity, missing setup, partial consent/revocation, pagination/no event writes, DST spring/fall, all-day/exclusive midnight/overnight, modified/cancelled recurrence, locations and malformed data.
- New real local Auth/DB/RLS harness: **pass**, `verify-google-calendar.mjs`. Controlled provider only; real caller JWTs, private-schema/RPC denial, callback expiry/supersession/replay, wrong-user/proof/receipt completion, denied/cancelled consent, selection permissions, stable repeat/reconnect IDs, local and foreign-owner protection, atomic failed imports, concurrent disconnect **and** deselection, and unchanged approved daily plan. Malformed-provider input returns a sanitized failure and retains the prior snapshot.
- Existing narrow DB/API regressions: **pass**, `verify-local-tasks.mjs --week-allocation` and `--daily-entry`. Covers ordered membership, empty plans, retries/stale/concurrent edits, history, task descriptions, Today initialization, next-day identity and account isolation.
- Mobile regression group: **88/88 across 14 files**, listed in the reproducible commands below. Final changed selection/event/return group: **27/27 across five files**, including a new real DOM keyboard test after matching the reference checkbox geometry. These groups overlap and must not be added as unique tests.
- Both workspaces: `typecheck` and `lint` **pass** after final source changes. Existing React Native Web icon `tintColor` deprecation and Expo notification/Expo Go test warning are not delivery evidence.
- Working-tree `git diff --check` and new-file whitespace validation: **pass**. Source inventory and protected-file hashes reconciled; index empty.

Initial runs identified a missing completion timestamp in the disposable plan fixture, an outdated Today availability-copy assertion, and two older Week test fixtures that did not mock the V2 daily/weekly API or assert its current combined date heading. Fixtures/assertions were corrected while retaining their date/order/cache behavior checks; final results above supersede those failures. No broad repository test suite was used as a substitute for these changed-path checks.

```powershell
Set-Location -LiteralPath 'D:\code\LifeOS'
$env:TSX_TSCONFIG_PATH = 'D:\code\LifeOS\apps\api\tsconfig.json'
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
$env:LIFEOS_INTEGRATION_SUPABASE_PROJECT_ID = 'LifeOS32'
node --import tsx --test apps/api/__tests__/google-calendar.test.ts apps/api/__tests__/commitments.test.ts
node --import tsx apps/api/scripts/verify-google-calendar.mjs
node apps/api/scripts/verify-local-tasks.mjs --week-allocation
node apps/api/scripts/verify-local-tasks.mjs --daily-entry
npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/google-calendar-test.tsx __tests__/google-return-test.tsx __tests__/v2-settings-surfaces-test.tsx __tests__/v2-today-integration-test.tsx __tests__/week-allocation-test.tsx __tests__/commitment-screen-test.tsx __tests__/commitment-query-cache-test.tsx __tests__/commitment-api-test.ts __tests__/commitment-metrics-test.ts __tests__/commitment-notifications-test.ts __tests__/commitment-reminder-ui-test.tsx __tests__/auth-infrastructure-test.tsx __tests__/v2-auth-lifecycle-test.tsx __tests__/settings-product-integration-test.tsx
npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/google-calendar-test.tsx __tests__/google-calendar-web-test.tsx __tests__/google-return-test.tsx __tests__/v2-today-integration-test.tsx __tests__/commitment-screen-test.tsx
npm.cmd run typecheck --workspace @lifeos/api
npm.cmd run typecheck --workspace @lifeos/mobile
npm.cmd run lint --workspace @lifeos/api
npm.cmd run lint --workspace @lifeos/mobile
git diff --check
```

The harness refuses non-local URLs or a mismatched disposable project, requires the new schema, never loads production credentials as fallback, and never contacts Google. Do not reset a database to run it.

## Google setup checklist — local configuration completed, provider acceptance pending

At implementation handoff on 2026-10-09, local Google configuration was absent and the preview correctly reported unavailable. The owner authorized local setup on 2026-10-10; the configuration evidence below supersedes that local setup blocker. Hosted configuration remains unchanged and unverified.

1. Owner selects the Google Cloud project and consent audience, enables Calendar API, and prepares a **Web application OAuth client** for the server-code exchange. Add intended review users while in testing mode. Request `openid`, `email`, `https://www.googleapis.com/auth/calendar.calendarlist.readonly`, and `https://www.googleapis.com/auth/calendar.events.readonly`. Do not request write scopes. Public use may require Google's verification/consent review; testing grants may expire and require reconnect.
2. Register the **Google authorized redirect URI** exactly as below. It terminates at LifeOS API, not Supabase. The mobile custom scheme is a subsequent LifeOS return, not a Google authorized redirect URI.

| Purpose | Exact current/derived URL |
| --- | --- |
| Local Google callback (API port 3197) | `http://127.0.0.1:3197/integrations/google/callback` |
| Local web return (preview port 8083) | `http://localhost:8083/settings/google-return` |
| Native app return, existing `lifeos` scheme | `lifeos://settings/google-return` |
| Future hosted Google callback, derived from documented Railway API | `https://lifeosapi-production-0362.up.railway.app/integrations/google/callback` — not deployed/verified by this task |
| Future hosted web return | Requires the owner's actual web origin plus `/settings/google-return`; no hosted web origin is assumed |

3. Supply **server-only** `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`, `GOOGLE_CALENDAR_ENCRYPTION_KEY` (base64-encoded cryptographically random 32 bytes), and `SUPABASE_SERVICE_ROLE_KEY`, alongside existing `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`. Set `GOOGLE_CALENDAR_WEB_RETURN_URI` only for an explicitly configured web client; native-only production does not require it after the current correction. Use the matching disposable service key for local tests, never a hosted key. Preserve and back up the encryption key securely; changing it without re-encryption forces reconnection. Never prefix these secrets with `EXPO_PUBLIC_`, paste them into logs/docs, or commit an environment file.
4. Configure production `CORS_ALLOWED_ORIGINS` only for approved web origins; redirect and return URLs must be HTTPS in production. Native on-device testing needs an owner-approved reachable HTTPS API/Supabase endpoint; a phone's loopback is not this PC. Native uses the same server callback followed by the `lifeos` return, with same-user proof checked in the app.
5. Before real use, ensure reverse-proxy/APM/request logging redacts callback query codes/state/receipts, Authorization headers and response bodies. The application itself does not log requests or provider payloads. Review service-key access, key rotation and secret retention operationally.
6. After explicit authorization, restart only the isolated API with those server variables, sign into the intended LifeOS review account, choose the intended Google account during consent, complete the app return, explicitly select calendars, save, then import. Cancel/deny consent first as a negative check. Do not treat setup or connecting an account as authorization to import every calendar.

The agent did not create/change Cloud configuration, connect an account, select a calendar or perform a real import. The owner's subsequent local success is recorded above, without inferring individually verified steps. Hosted configuration is unchanged. LifeOS email verification and provider-login callback behavior remain separate #30 acceptance gates.

## Authorized local configuration — 2026-10-10

The owner-supplied Downloads OAuth JSON was parsed without printing credentials. It contains a Web application client, the expected Google authorization/token endpoints, and the exact registered redirect `http://127.0.0.1:3197/integrations/google/callback`. This validates the downloaded configuration, not live Google consent, Calendar API enablement, test-user eligibility or a successful exchange.

The five `GOOGLE_CALENDAR_*` settings are persisted in `%LOCALAPPDATA%\LifeOS\LifeOS32\api.env`, outside the repository. File/directory ACLs permit only the current Windows owner and SYSTEM. No existing local encryption key was found; 32 cryptographically random bytes were generated and persisted as base64. Keep this file private and retain the encryption key across restarts. No credentials were added to application source, logs, public Expo variables or Git.

`apps/api/scripts/review-daily-flow.mjs` now reads those five settings only for its API child. It obtains `SUPABASE_SERVICE_ROLE_KEY` and public/API settings directly from the verified local LifeOS32 status on every launch. Inherited Google/Supabase/dotenv overrides are filtered; API dotenv is pinned to the private file, preventing repository/hosted fallback. The web child receives local public configuration and does not receive the server/provider credentials. No protected repository environment file was changed.

Docker Desktop was initially stopped. Starting the installed runtime restored the existing LifeOS32 services and records; no Supabase start/reset or migration was run. Verified project ID `LifeOS32`, local API `127.0.0.1:56321`, DB port `56322`, local Auth health, private Google state table, integration RPC and required commitment columns. Existing data counts before and after verification remained 2 Auth users, 3 tasks, 0 commitments and 0 Google connection-state rows.

Only the identified API process was restarted on port 3197. The existing web listener on port 8083 was reused; one listener per preview port was confirmed. API health and web route return HTTP 200. The protected integration route returns 401 without a session. With a temporary local probe account, the running API returned HTTP 200 with `configured: true`, `status: disconnected`, `readOnly: true`, exercising the matching local service-role credential and integration RPC. The probe account and its state were deleted; no existing account was signed into or changed. No Google authorization/callback, calendar selection or import was requested.

Additional checks: launcher `node --check` and targeted ESLint pass; isolated launcher environment probes confirm persistent Google values, matching local server credentials, rejection of inherited hosted values and exclusion of server secrets from the web child. `git diff --check` passes. Existing application source was unchanged by this setup task, so the previously recorded application suites were not repeated. Only the review launcher and this record changed during configuration; HEAD/index remain unchanged.

At the end of the configuration task, no real Google flow had been attempted by the agent; the later owner-reported local success is recorded above. Scenario-specific provider, rendered UI and physical-device acceptance remain pending. Configuration availability alone is not Google connection success. Issue #17 remains open/In Progress; broader bidirectional scope is unchanged. The startup blocks below load the persisted private configuration automatically; do not duplicate existing listeners.

## Checkpoint and read-only deployment review — 2026-10-10

**Historical pre-apply review.** The completed owner checkpoint, applied migrations, native-only correction and saved Railway configuration in the current follow-up above supersede the pending-state statements in this section. No instructions here authorize repeating a migration.

Current checkout independently re-read: `main`, HEAD `6b531593e0fcae87dbd1a4696f5c48a4ab7d70d1`, empty index, **3 ahead / 0 behind** existing `origin/main`. GitHub's read-only main lookup also returns `9b775df50b563f518464810ddf5e646b2087b67e`; no fetch was performed. The complete scope remains **53 files**, including the API, migration, tests, native-component surfaces, review launcher and records in the manifest below. No dependency, bundled-font/license or version changes are missing. The handoff directory and root `tsconfig.json` are excluded, as are private credentials, environments and ignored generated/native files.

Reviewed the existing callback/ownership/encryption boundary, explicit selection, atomic import and source identity, canonical commitment/overlap presentation, account-scoped caches, tests and launcher isolation. No checkpoint-blocking source issue was identified. This review changes documentation only. Reused the recorded 20 API tests, 88 mobile regressions and overlapping final 27 checks, disposable Auth/DB/RLS/planning evidence, typecheck/lint and launcher checks; no application test suite or database harness was rerun. Fresh whitespace/diff, file-scope, known-secret containment, private ACL and preservation checks pass. The private OAuth JSON and `%LOCALAPPDATA%\LifeOS\LifeOS32\api.env` remain outside Git; no server credentials are in the reviewed paths. **Ready for an owner-managed partial phases 1–2 checkpoint; not ready to push/deploy or build an iPhone candidate.**

### Database prerequisites

Read-only `supabase migration list --linked` against the already-linked LifeOS project `vcizpdzqbctjksnivnzt` confirms the first **10** migrations aligned through `20261007120000_add_daily_planning_lifecycle.sql`. Exactly these three local migrations are absent from remote history, in order:

1. `supabase/migrations/20261009120000_add_daily_proposals.sql` — #32, already in the existing Git checkpoint.
2. `supabase/migrations/20261009150000_add_week_allocation.sql` — #33, already in the existing Git checkpoint.
3. `supabase/migrations/20261009180000_add_google_calendar_import.sql` — current #17 scope.

No new #34 migration exists. Remote migration history is verified; live catalog/RLS equivalence was not audited. No dry run or application was performed in this review. After the local checkpoint, recheck the linked target/history and review `supabase db push --linked --dry-run`. Apply only after explicit production authorization, then verify history/catalog before the deployment-triggering push. Do not selectively apply #17 while omitting its preceding V2 schema.

### API and Google production prerequisites

Read-only Railway inspection identified LifeOS / production / `@lifeos/api`. Its active deployment `ca91328a-57b3-475a-93f7-06237f856d9f` is SUCCESS at source `6407ae8856ee8289e8183aaeaf6661b680d32267`. The later documentation commit `9b775df` has a SKIPPED Railway deployment despite GitHub's success context. Public `/health` returns HTTP 200 with the expected body; this does not verify authenticated production writes or #17 availability.

Production variable-name inspection confirms `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `NODE_ENV` and `CORS_ALLOWED_ORIGINS` are present; the Supabase target matches LifeOS and `NODE_ENV` is production. `SUPABASE_SERVICE_ROLE_KEY` and all five `GOOGLE_CALENDAR_*` names below are **absent**. `PORT` is not explicitly configured in the variable listing; Railway supplies its runtime port. No values were printed or copied.

- Server API names: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, matching production `SUPABASE_SERVICE_ROLE_KEY`, `NODE_ENV`, runtime `PORT`, and approved-browser `CORS_ALLOWED_ORIGINS`.
- Google server-only names: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`, `GOOGLE_CALENDAR_WEB_RETURN_URI`, `GOOGLE_CALENDAR_ENCRYPTION_KEY`.
- Production Google callback: `https://lifeosapi-production-0362.up.railway.app/integrations/google/callback`. The downloaded local OAuth client JSON does **not** list it. Live Google Cloud configuration was not inspected or changed; the owner must confirm/add the exact production callback to the intended Web client and confirm Calendar API/consent audience/scopes.
- Native return is fixed in the API as `lifeos://settings/google-return`, matching Expo's `lifeos` scheme and existing route. It is a subsequent app return, not Google's registered callback or a Supabase Auth callback. There is no separate native-return environment variable.
- A real owner-approved HTTPS web origin plus `/settings/google-return` is still undecided. The current configuration validator requires `GOOGLE_CALENDAR_WEB_RETURN_URI` even for native authorization; neither the local HTTP preview nor an invented hosted page is a production substitute. Its origin must be reconciled with CORS when browser access is used.
- The production encryption key must be a securely retained 32-byte base64 key, independently managed from disposable local secrets. Never copy local Supabase credentials or encrypted local connection rows to production. Owner consent/selection/import is required separately for the hosted LifeOS account. Reverse-proxy/APM callback-query/header/body redaction and key retention remain operational checks; not verified here.

Order: owner local checkpoint → fresh pending-migration inspection/dry run → explicitly authorized production migrations/history verification → authorized production Google/server configuration and API push/deployment → confirm active source/health and scoped authenticated/provider behavior → mobile release preparation. Railway's existing build/start commands remain `npm run build --workspace @lifeos/api` / `npm run start --workspace @lifeos/api`; the local review launcher is not the deployment command. No hosted mutation, push or deployment occurred.

### iPhone prerequisites

Actual Expo version/build remains **0.5.0 (9)**. Root/API/mobile manifests and all four first-party lockfile version entries agree at 0.5.0; the shared footer reads Expo version and installed iOS build metadata. The protected mobile environment points to the intended HTTPS API/Supabase endpoints and has a public key. It contains no provider/server secrets. This is source/environment inspection, not installed-binary evidence.

Last recorded accepted binary remains **0.5.0 (9)**, source `6407ae8`, accepted 2026-10-08 and predating V2/#17. Candidate **0.6.0 (10)** remains proposed only. This Windows checkout has no `apps/mobile/ios` project and no Xcode; its ignored `dist` export is not a native binary. Current Mac native fields, archives/newer candidate build numbers, signing/Pods/device trust and installed iPhone metadata could not be verified. The last recorded provisioning expiry is 2026-10-14; recheck on the build Mac rather than assuming it remains usable.

Client rollout risk verified against `6407ae8`: its commitment type requires `startTime: string`, and Week/cache sorting calls `startTime.localeCompare` without a null guard. The new imported all-day representation legitimately has a null start time. Do not import into production accounts still used by that older client; coordinate compatible-client installation before real owner production import, and use an isolated account/compatible client for later authorized provider verification. Schema/API deployment alone does not update the installed app. This is a rollout gate, not new backward-compatibility implementation in this checkpoint.

After schema/API readiness and explicit release-preparation authorization: recheck artifacts/installed build on the Mac; choose a build greater than 9 and any newer candidate (10 only if still unused); update `apps/mobile/app.json`, the three package manifests and only the four first-party lockfile versions; synchronize existing ignored Info.plist and Debug/Release project version fields without regenerating native files; update CHANGELOG and affected Release candidate records; validate versions/footer/config, dependencies/Pods, HTTPS endpoint, normal Auth, deep-link scheme and signing. Build/install requires separate authorization after that gate. No versions/native fields/builds were changed here.

## Preview and visual review

Working preview: **http://localhost:8083/settings/calendar-connection?provider=google**. API: **http://127.0.0.1:3197**. The old non-watching local API was verified and restarted on the same port/database; the new protected integration route returns 401 without a session. Preview page and health return 200. These are availability evidence only.

If stopped, run each block in its own PowerShell terminal (do not duplicate listeners). Existing running disposable LifeOS32 is required; do not reset or fall back to hosted environment values.

```powershell
Set-Location -LiteralPath 'D:\code\LifeOS'
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
node apps/api/scripts/review-daily-flow.mjs api
```

```powershell
Set-Location -LiteralPath 'D:\code\LifeOS'
$env:LIFEOS_INTEGRATION_SUPABASE_WORKDIR = Join-Path $env:TEMP 'lifeos-32-disposable'
node apps/api/scripts/review-daily-flow.mjs web
```

The launcher pins local endpoints and tracked API config; web disables Expo dotenv loading. Normal app routes use actual account data. Provider fixtures exist only in tests; none are seeded into the owner preview.

Reference mapping: existing Heebo/theme/Lucide hierarchy retained. Shared event row follows prototype `.lo-event`: gap 10, padding 13, top margin 9, radius 14, one-pixel border, gold line width 3/radius 6, title 13 and metadata 11; G appears only for actual imported Google records. Local records retain the calendar icon. Selection follows `.lo-option`: gap 11, padding 16, radius 13, top margin 10, checkbox 18, title 14 and metadata 11. Calendar names/details come from real provider data, never prototype fixtures. Provider status wording reflects read-only/manual refresh and setup reality.

Supported browser discovery returned `apps: []`, `browsers: []`; opening the preview returned **`Browser is not available: iab`**. Rendered comparison, pixel fidelity, narrow scrolling, focus appearance and a full light/dark/440×956/320×956 matrix remain pending. DOM/RN tests establish interaction/structure only. Prior owner visual acceptance of #34 does not automatically accept these new screens. Please capture owner screenshots of the new connection/selection/event-detail screens for visual acceptance when review is available.

Owner route now: Today profile → Settings → Google (configured and disconnected; explicit connection available), back → Apple (still unavailable), Calendar/Week → a local commitment → optional location → save/reopen. Preserve start-only editing and Today/task counts. Repeat at 440×956 and 320×956, light/dark, long Hebrew labels and keyboard. With the authorized local setup: consent/cancel → complete → list/select/save/import → Calendar/Today/Week same event IDs/counts → read-only description/location → repeat import → disconnect/reconnect. Confirm no approved task plan changes and no Google event deletion. Real-provider and device acceptance are still pending.

## Remaining phases

Phase 3 outbound creation/edit/export, writable-calendar consent, conflict resolution and explicit deletion semantics remain unimplemented. Phase 4 incremental/background synchronization, cursor invalidation/rebuild, recurrence-series operations and operational hardening remain unimplemented. Their contracts are documented before dependent implementation. Phase 5 remains full end-to-end/provider and physical-iPhone Hebrew RTL acceptance. No outbound Google event writes were implemented or executed.

## Release candidate

| Release candidate field | Status |
| --- | --- |
| SemVer impact | Minor user-facing integration, grouped with pending V2 work |
| Candidate version/build | Proposed **0.6.0 (10)**, unprepared; recheck relevant prepared/built artifacts before future authorization |
| Current tracked version/build | **0.5.0 (9)**, unchanged |
| Last owner-accepted binary | **0.5.0 (9)**, source `6407ae8`, predates this implementation |
| Version prepared / native synchronized | Pending; forbidden by this task |
| Physical build installed / exact build accepted | Pending; none built or installed |
| Included scope | Partial #17 phases 1–2, required #15 location foundation, native-only configuration correction and verified ledger privilege correction over checkpoint `16245b7` |

**Release candidate: LifeOS 0.6.0 (10), proposed only—not prepared, installed or accepted.** Before any device request, follow the canonical pre-device and schema/API rollout gates with fresh authorization. Provider/hosted Auth/email/callback, production, complete integration, visual and physical-device acceptance remain pending.

## Tracking and checkpoint

#17 is open/In Progress because the broader bidirectional scope remains unfinished. Only its Project Status was changed from Backlog to In Progress, with readback; priority/labels/assignees/milestone/membership and unrelated issues are preserved. [Evidence comment](https://github.com/OzAvrahami/LifeOS/issues/17#issuecomment-6087617536) was read back; before/after Project comparison shows only Status changed. No issue is closed. The local slice is coherent for an owner-reviewed partial checkpoint after the available checks; external setup/acceptance gates remain explicit and are not passes. Staging, commit and push remain owner-managed and were not executed.

## Checkpoint 16245b7 file scope (historical)

The owner committed this **53-file** slice as `16245b7`. It excludes the protected owner handoff, root config, environments and native/generated files. The current combined follow-up has the separate nine-file scope listed above.

```text
CHANGELOG.md
apps/api/__tests__/commitments.test.ts
apps/api/__tests__/google-calendar.test.ts
apps/api/scripts/review-daily-flow.mjs
apps/api/scripts/verify-google-calendar.mjs
apps/api/src/app.ts
apps/api/src/features/commitments/commitment.service.ts
apps/api/src/features/commitments/commitment.types.ts
apps/api/src/features/commitments/commitment.validation.ts
apps/api/src/features/google-calendar/google.config.ts
apps/api/src/features/google-calendar/google.import.ts
apps/api/src/features/google-calendar/google.provider.ts
apps/api/src/features/google-calendar/google.routes.ts
apps/api/src/features/google-calendar/google.service.ts
apps/api/src/features/google-calendar/google.store.ts
apps/api/src/features/google-calendar/google.types.ts
apps/mobile/__tests__/commitment-api-test.ts
apps/mobile/__tests__/commitment-screen-test.tsx
apps/mobile/__tests__/google-calendar-test.tsx
apps/mobile/__tests__/google-calendar-web-test.tsx
apps/mobile/__tests__/google-return-test.tsx
apps/mobile/__tests__/settings-product-integration-test.tsx
apps/mobile/__tests__/v2-settings-surfaces-test.tsx
apps/mobile/__tests__/v2-today-integration-test.tsx
apps/mobile/src/app/_layout.tsx
apps/mobile/src/app/calendar.tsx
apps/mobile/src/app/settings/google-return.tsx
apps/mobile/src/features/auth/auth-destination.ts
apps/mobile/src/features/auth/onboarding-screen.tsx
apps/mobile/src/features/commitments/commitment-editor.tsx
apps/mobile/src/features/commitments/commitment-presentation.ts
apps/mobile/src/features/commitments/commitment.metrics.ts
apps/mobile/src/features/commitments/commitment.queries.ts
apps/mobile/src/features/commitments/commitment.types.ts
apps/mobile/src/features/commitments/imported-commitment-details.tsx
apps/mobile/src/features/commitments/v2-commitment-row.tsx
apps/mobile/src/features/notifications/commitment-reminder-time.ts
apps/mobile/src/features/planning/daily-flow-card.tsx
apps/mobile/src/features/settings/calendar-connection-screen.tsx
apps/mobile/src/features/settings/google-calendar-option.tsx
apps/mobile/src/features/settings/google-calendar-screen.tsx
apps/mobile/src/features/settings/google-calendar.api.ts
apps/mobile/src/features/settings/settings-screen.tsx
apps/mobile/src/features/today/today-screen.tsx
apps/mobile/src/features/today/v2-today-screen.tsx
apps/mobile/src/features/week/server-week-screen.tsx
apps/mobile/src/features/week/v2-week-day.tsx
apps/mobile/src/features/week/week-day-view.tsx
apps/mobile/src/features/week/weekly-planning-review.tsx
docs/DEPLOYMENT.md
docs/issue-17-calendar-contracts.md
docs/issue-17-verification.md
supabase/migrations/20261009180000_add_google_calendar_import.sql
```
