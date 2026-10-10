# LifeOS 2.0.0 — unreleased device-test candidate

## Current preparation — 2026-10-10

**Candidate: LifeOS 2.0.0 (10). Tracked metadata prepared; Mac-native synchronization, build, installation and exact-build acceptance are pending.** This is an internal device-test candidate, not a published release, App Store/TestFlight submission or accepted iPhone binary.

The owner explicitly selected **2.0.0**, superseding the earlier unprepared 0.6.0 proposal. This records the owner's major-version product decision for the combined V2 release; this preparation adds no feature, protocol change or dependency upgrade. Build numbering is independent: canonical configuration and the last accepted binary were **0.5.0 (9)**. Available repository release/build records contain only a proposed, unbuilt build 10 and no higher prepared/built candidate. Thus tracked build **10** is prepared; the build Mac's current archives, cached artifacts and installed metadata are inaccessible here and must be checked before using that number for a new binary.

Actual baseline: `main` / HEAD / existing `origin/main` all **`3310f96bbdfd9c8d46816c4a3f8cbea03ddcf42d`**, 0 ahead / 0 behind, empty index. No fetch was performed. Owner handoff files, untracked root `tsconfig.json`, environments, private credentials and ignored/generated files are preserved. No uncommitted 0.6.0 metadata preparation existed. Historical accepted-release records remain unchanged.

## API deployment evidence

Verified the existing Railway **LifeOS** project `4b0ede86-7928-45fa-ade4-46a1094b7101`, **production** environment `628a150a-e576-462f-9f82-ea5ca4651dc5`, **@lifeos/api** service `d99536c4-ae42-429d-9116-f073396a3943`.

- Active deployment **`bd36780e-65b9-496f-91c2-8e53aeca247c`** is **SUCCESS**, created `2026-10-10T14:38:43.741Z`, with instance `3911a784-3a24-4713-8c13-dfd83c42835c` RUNNING. Source SHA is exactly **`3310f96bbdfd9c8d46816c4a3f8cbea03ddcf42d`** on main. The old `6407ae8` deployment is REMOVED, not the source of this pass.
- Public `GET https://lifeosapi-production-0362.up.railway.app/health` returned **200**, with the expected `service: lifeos-api`, `status: ok` contract at `2026-10-10T14:52:29.964Z`.
- Deployment-specific snapshot **`41ff3da5-2c08-4e31-8d6e-268057a3e0f2`**, created `2026-10-10T14:38:46.060Z`, contains all five required server variables: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`, `GOOGLE_CALENDAR_ENCRYPTION_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Values were compared in memory with saved service configuration and match. This is configuration associated with the actual deployed revision, not merely a saved-variable listing; no secret value is recorded here.
- Snapshot configuration targets hosted LifeOS `vcizpdzqbctjksnivnzt`, has a 32-byte base64 encryption key and the exact production Google callback `https://lifeosapi-production-0362.up.railway.app/integrations/google/callback`. `GOOGLE_CALENDAR_WEB_RETURN_URI` is intentionally absent. Source retains the native return `lifeos://settings/google-return`; web initiation requires an explicit validated web return. The Google callback's registration remains owner-reported, not independently inspected in Google Cloud.
- Read the exact deployment's 182 build-log entries and seven startup/runtime entries available at inspection. Build TypeScript compilation completed; startup reached the listening state; no error/fatal/exception/failed entries were found. Npm production-option and dependency-deprecation warnings are present. This bounded log review does not establish future runtime health or OAuth request-log redaction.
- Source derives the read-only authenticated status route as **`GET /integrations/google`**. No existing authorized hosted-user session was accessible: supported browser discovery returned no apps/browsers, and no explicit hosted-user session was supplied in the available local configuration. An unauthenticated GET returned **401**, establishing the auth boundary only. Authenticated `configured: true` runtime evidence, real Google consent, callback completion, calendar selection/import and physical-device acceptance remain **unverified**. No production user/session was created or substituted, and no OAuth/import action was initiated.

All **14 hosted migrations** and the corrected daily-flow SELECT/INSERT-only client contract were already verified before this deployment; [the prior migration/RLS/readback evidence](issue-17-verification.md#ledger-correction-applied-and-verified--2026-10-10) is reused. No migration, reset or history repair was run. Railway saved variables and pending changes are fingerprinted for preservation; no deploy/redeploy, configuration write or staged-change application is part of this task.

### Dependency notices found during log review

The deployment's workspace-wide install reported **73 advisories (14 moderate, 57 high, 2 critical)**. A focused read-only `npm audit --omit=dev --workspace @lifeos/api --json` returned **four package findings**, not a clean audit: proxy-addr (critical), qs (moderate), brace-expansion and js-yaml (high). `npm ls ... --omit=dev --workspace @lifeos/api` places proxy-addr 2.0.7 and qs 6.15.3 under Express 5.2.1; the other two are not in that printed API production dependency tree.

The [proxy-addr advisory](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) requires particular IPv4-mapped IPv6 trust-proxy subnet configuration. Source uses Express's default trust-proxy setting and no IP-based authorization. It also uses the default simple query parser and JSON bodies, without extended qs query parsing or an URL-encoded body parser; [qs advisory details](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) and [comma-parser advisory](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) remain dependency findings. These source observations narrow the known API exposure; they are not a security clearance or remediation. Dependency triage remains a separate follow-up before broader release approval. No `audit fix`, dependency install or resolution change was performed, and these notices are not misreported as deployment failures.

## Included source and acceptance boundaries

| Source checkpoint | Included scope |
| --- | --- |
| `bf02eff` | #29/#30 V2 foundations/account/onboarding and #32 daily proposals/approval/persistence |
| `c3c120b` | #33 Week/task list/details/capture, and subsequent onboarding/Today/visual corrections |
| `6b53159` | #34 Settings and #26/#27 notification controls/category details/preferences |
| `16245b7` | #17 phases 1–2 authorization, explicit selection and manual read-only import; necessary #15 location foundation |
| `3310f96` | Native-only Google configuration and table-specific daily-flow privilege correction |

The reviewed local Today/Week/task appearance and owner-attested adjustment/cancel, approval reload, completion/reopening consistency retain their scoped evidence. Settings acceptance is **local web appearance only**. The owner's “Amazing, it works” Google feedback is **local flow success only**, not separate attestation of retries, cancellation, reconnect, every event or iPhone behavior.

#17 remains **Open / In Progress**, read back without changes. Outbound event writes, bidirectional conflict/deletion completion and automatic/background synchronization remain unfinished. Apple integration #31 and broader provider-dependent #34 acceptance remain pending. This candidate does not close any issue or import templates/tasks/Focus into calendars.

**Compatibility gate:** do not import all-day events into production accounts used by the old **0.5.0 (9)** binary. The new API does not update that binary. Coordinate an explicitly authorized real import only after the compatible client is installed and the owner has chosen calendars.

## Release candidate

| Field | Value |
| --- | --- |
| SemVer decision | Owner-selected Major **2.0.0**, replacing the unprepared 0.6.0 proposal |
| Candidate iOS build | **10**; greater than accepted/configured 9, no higher candidate in available records; Mac inventory still required |
| Version prepared | **Yes**, Windows tracked metadata, 2026-10-10 |
| Native version synchronized | **Pending**; no iOS/Android native directory exists in this checkout |
| Physical build installed | **Pending**; no build/install performed |
| Owner accepted exact build | **Pending**; last accepted binary remains 0.5.0 (9), source `6407ae8` |
| Source baseline | `3310f96bbdfd9c8d46816c4a3f8cbea03ddcf42d` plus only the metadata/documentation preparation manifest below |

## Preparation checks

- Five canonical files set root/API/mobile versions and Expo version to **2.0.0**, with Expo iOS build **"10"**. The lockfile changes only top-level version and the three first-party package version entries; all dependencies, resolutions and integrity values are preserved.
- Production-mode `expo config --type public --json` resolves **2.0.0 / 10**, `lifeos` scheme, existing bundle identifier and automatic appearance. Existing private mobile environment targets the production API and hosted LifeOS public configuration; no server-secret variable appears in public Expo keys. Values are withheld.
- Settings/More share the existing footer, which reads Expo semantic version and actual native binary build metadata; web/missing-build fallbacks remain honest. Its focused test uses simulated native metadata, not an installed binary.
- `npm.cmd run typecheck`: **pass**, API and mobile using tracked workspace configs. `npm.cmd run lint`: **pass**, API ESLint and mobile Expo lint. `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/app-version-footer-test.tsx`: **6/6 pass**. Production-mode Expo public-config resolution and JSON structural version/lockfile checks: **pass**. Existing implementation/provider-fixture/DB tests in the issue records are reused; no application source or dependency changed. No new JavaScript export is needed for version-only metadata; none was run. No native build was run.
- `git diff --check` and new-record whitespace validation: **pass**. Baseline hashes verify existing implementation/tests, owner handoff/root config, private environment/key files and Git index remain unchanged. Only the explicit preparation manifest changed. Railway variable/pending-change fingerprints and active deployment identity are rechecked unchanged before handoff.
- Root untracked `tsconfig.json` is preserved and not required: API and mobile typechecks use their tracked workspace configs, with mobile extending Expo's config. No root config was staged or incorporated.

## Mac handoff — preparation must finish before a build request

1. After the owner checkpoint and separately authorized source transfer/push, inspect the Mac's actual HEAD, owner work, installed metadata if available, ignored native fields and relevant Release/Debug/archive artifacts. **If build 10 has already identified another prepared/built binary, stop and reconcile a higher build; never reuse or downgrade.** Windows cannot verify this inventory.
2. Back up the existing ignored `apps/mobile/ios` project outside Git. Use the [targeted native synchronization procedure](DEPLOYMENT.md#native-version-synchronization--existing-ios-project) to set only `LifeOS/Info.plist` `CFBundleShortVersionString=2.0.0`, `CFBundleVersion=10`, and both Debug/Release `MARKETING_VERSION=2.0.0`, `CURRENT_PROJECT_VERSION=10`. Read back all fields and preserve signing, entitlements, bundle identifier, scenes and permissions. Do not regenerate native projects or force-add native files.
3. Check the existing native project against the V2 plugin/config changes: secure-session `expo-secure-store` linkage/autolinking, bundled Heebo loading, URL scheme and system appearance. Verify `UIUserInterfaceStyle` follows system mode and preserve existing scene support. Inspect `Podfile.lock` versus `Pods/Manifest.lock`, workspace/scheme, installed dependency resolution and `.xcode.env.local` Node path. If pods/plugin reconciliation is actually needed, document the concrete difference for a separately scoped preserving action; do not run prebuild or upgrade/install Pods just to update versions.
4. Verify Xcode/SDK, Apple Development identity/team, provisioning expiry/device registration/trust and Release signing. The historical provisioning expiry was 2026-10-14; that record does not establish current validity. Recheck the production endpoint/public configuration, ordinary authenticated launch path and `lifeos://settings/google-return` routing; no development-preview bypass belongs in Release.
5. Record completed Mac-native/config/signing gates and the exact source/candidate. **Build/install is still separately owner-authorized and is not requested by this preparation.** After a compatible binary is installed, verify its actual **2.0.0 (10)** metadata/footer, then perform the scoped V2, notification-delivery, account and optional owner-authorized Google consent/cancel/selection/manual-import checks. Provider and device observations must identify that exact binary.

## Explicit preparation manifest

```text
CHANGELOG.md
apps/api/package.json
apps/mobile/app.json
apps/mobile/package.json
docs/DEPLOYMENT.md
docs/issue-17-verification.md
docs/issue-32-verification.md
docs/issue-33-verification.md
docs/issue-34-verification.md
docs/release-2.0.0-verification.md
docs/v2-milestone-1-verification.md
package-lock.json
package.json
```

No staging, commit, push, tag, release publication, production-data mutation or build/install was performed by this preparation. A later push of these shared manifests may trigger Railway again; that remains a separate owner action, not part of the local checkpoint commands.
