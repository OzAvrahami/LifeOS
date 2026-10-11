# LifeOS 2.0.0 — unreleased device-test candidate

## Current installed candidate — 2026-10-11

**LifeOS 2.0.0 (10) was built, verified, installed wirelessly as an update and launched on the owner's paired iPhone. Scoped owner iPhone results are recorded below; full scenario acceptance is incomplete.** Source remains **22761937e99a96ecf1bc922e64eb763528929b58** on main, matching the existing origin/main reference. This is the recorded build checkout, not a source SHA independently extracted from the binary. The two existing unstaged preparation documents and all prepared native changes were preserved.

### Owner-reported iPhone results — 2026-10-11

The owner reports that installed **LifeOS 2.0.0 (10)** looks good, **Google authorization succeeded**, the **Google calendar list is displayed**, and **import was performed with imported calendar content visible in LifeOS**. These are hosted iPhone results reported by the owner against source `22761937e99a96ecf1bc922e64eb763528929b58`, distinct from earlier local/web feedback. They supersede the earlier absence of hosted-device authorization/import feedback; they are not independent assistant observation or a fresh instrumented hosted API/DB test.

**Not individually confirmed:** duplicate prevention/repeated import, all-day correctness, cancellation, reminders and session continuity. Do not mark these scenarios passed. Specific callback payloads, authenticated status responses, every calendar/event, timezone/recurrence behavior and disconnect/reconnect were not independently inspected. General “looks good” feedback is not a complete UI/accessibility or integration audit. The successful owner flow does not finish #17's outbound/background synchronization or broader remaining scope; #17 remains **Open / In Progress**.

The prior build/signature/update-install/version-readback/launch evidence below is reused unchanged. No rebuild, reinstallation or provider operation was repeated for this documentation update. **This records device testing, not release publication or blanket release approval.**

### Release build and artifact verification

- Executed the documented production-environment `xcodebuild` sequence from `apps/mobile`, using existing `ios/LifeOS.xcworkspace`, scheme **LifeOS**, configuration **Release**, physical destination **00008150-00181C513E30C01C**, and `-allowProvisioningUpdates`. **BUILD SUCCEEDED, exit 0**, completed **2026-10-11T04:53:40Z**. The output directory contained no previous LifeOS.app before this build; executable/bundle timestamps are later than the recorded build start. No stale artifact was installed.
- New artifact: `/tmp/lifeos-2.0.0-10-derived-data/Build/Products/Release-iphoneos/LifeOS.app`.
- Artifact Info.plist and embedded Expo app configuration both report **2.0.0 / 10**; bundle identifier **il.co.ozavrahami.lifeos**. `codesign --verify --deep --strict` passed. Signing team is **AVQU374YW5**, using the existing Apple Development identity. Signed entitlements exactly match the retained accepted build-9 artifact, including application/Keychain identity; no new APNs entitlement or signing setting was introduced.
- Embedded development profile covers the intended physical device. Created **2026-10-07T09:20:58Z**, actual expiry **2026-10-14T09:20:58Z**. Existing profile was used; no owner account/trust/Keychain interaction or provisioning renewal was required in this run.
- Verified the actual bundled JavaScript contains the production Railway API origin, hosted LifeOS Supabase URL and expected public key (compared in memory, never printed). Embedded config preserves `lifeos`, automatic appearance and **2.0.0 (10)**; native plist retains **EXExpoAppSceneDelegate**. All five Heebo font assets are present byte-identically in the built app. This is a standalone Release artifact, not a Metro/dev-client refresh.
- Compiler/dependency deprecation, Swift-mode and script warnings remain; the build had no compiler errors. Previously documented Expo patch recommendations remain advisory and unchanged. No dependency install/upgrade, Pod reconciliation, prebuild, native configuration or application-source change was needed during this build/install turn. Baseline hashes confirm prepared native inputs, package-lock and documentation remained unchanged until the installation record was added.

Private build log and filtered verification evidence are outside Git at `~/Library/Application Support/LifeOS-verification/build10-20261011T045059Z/`. Executable SHA-256: `126ded529a1970cd406cd6d74d7832dff88bd0ba778bfd362de235016fdf3b41`; JavaScript bundle SHA-256: `51f84e61ac531d403c947fb37d5fb3a193b24f0fadd8dac4f76ba42a7b47d7c7`. These identify the local artifact, not its acceptance.

### In-place installation, data boundary and launch

- Before installation, CoreDevice independently reported **0.5.0 (9)** for the existing app. `devicectl device install app` completed with **exit 0** over the existing paired wireless connection. Independent installed-app readback then reported **2.0.0 (10)** for the same bundle identifier on the intended iPhone 17 Pro Max.
- No uninstall, container erasure/reset, session clearing or Keychain extraction was performed. Read-only before/after container inventories show **14 retained file paths with unchanged sizes**, one removed and two added files confined to system SplashBoard snapshots. This is metadata-level preservation evidence, not a byte-for-byte content audit or proof that the owner remains signed in. The update retained the app's signed Keychain identity; secure-session migration and visible session continuity remain part of owner review.
- Ordinary `devicectl device process launch` succeeded, **exit 0**, process **19909**, without requiring unlock/trust interaction. Subsequent process inspection through **2026-10-11T04:55:54Z** found that same LifeOS process running, and the accessible device crash inventory contained no new LifeOS crash report. This bounded observation establishes launch survival, not independent UI observation, network success or full runtime/functional acceptance.
- Installation and launch are complete. The later owner-reported authorization, calendar-list and visible-import results are recorded above. No Google connection/import was initiated by the assistant. Instrumented hosted status/callback evidence and the unconfirmed scenarios remain separate from the reported successful flow. #17 stays **Open / In Progress / P1 — High**; bidirectional/background scope remains unfinished.

### Owner review of this installed build

**Original supplied checklist, retained as context.** The owner subsequently reported the specific successes above. This list is not an item-by-item pass record; duplicate prevention, all-day correctness, cancellation, reminders and session continuity remain unconfirmed. Already reported authorization/list/import success need not be repeated just to document it.

1. Confirm the visible footer shows **2.0.0 (10)**, normal UI loads, and existing account/data remain available. Relaunch away from the Mac/Metro.
2. Review Today/Daily Planning, Week/tasks and Settings; check Hebrew/RTL, fonts, light/dark/system appearance and an existing notification/reminder flow.
3. In Settings → Google Calendar, use the intended LifeOS account and review consent/cancel/return behavior. The app should return through `lifeos://settings/google-return`; no web return URL is required for the native flow.
4. Only after explicit calendar selection, try the authorized manual read-only import and review event placement without duplicates. Avoid an account still accessed by an incompatible 0.5.0 client; do not expect outbound or background synchronization yet.

Reuse the completed preparation tests below; no broad suite rerun is needed for this installation record. No commit, push, database migration/mutation, Railway change, archive upload, tag, TestFlight/App Store submission or Release publication occurred. The installation step left two documentation files unstaged; this scoped feedback checkpoint additionally reconciles the #17 record. All three remain unstaged for owner review.


## Historical Mac preparation — 2026-10-11

**LifeOS 2.0.0 (10) is ready for the separately authorized native build step, with dependency advisories recorded below. It has not been compiled, installed or accepted.** The owner's 2.0.0 decision is unchanged. #17 remains **Open / In Progress / P1 — High**; no issue or Project mutation was performed.

### Source, preservation and build-number inventory

- Mac checkout `/Users/ozavrahami/code/lifeOS`, origin `https://github.com/OzAvrahami/LifeOS.git`, branch main. Before changes, tracked/untracked worktree and index were clean. `git fetch origin` succeeded; HEAD and origin/main both already equalled **22761937e99a96ecf1bc922e64eb763528929b58**, `chore(release): prepare LifeOS 2.0.0 (10) device-test candidate`. No fast-forward, reset, cleanup or stash was necessary. The Windows-only untracked handoff/root tsconfig was absent here; no substitute was created.
- Paired physical iPhone 17 Pro Max installed-app metadata independently reports **0.5.0 (9)**. The accessible LifeOS artifacts are Release iphoneos **0.5.0 (9)**, Release simulator **0.4.0 (5)**, and Debug iphoneos **0.1.0 (1)**. Inventory covered Xcode Archives/DerivedData, local verification storage, Downloads, `/tmp` and the checkout; no relevant archive/exported IPA or artifact with build 10 or higher was found. Before synchronization native source also used 0.5.0 (9). Thus **10 is available in the inspected records**; unavailable external archives/other devices are not certified, and cached artifacts are not installed-device evidence.
- Native backup before any reconciliation: `/tmp/lifeos2-native-before-6ezt9ewr/ios`. Canonical manifest/lockfile hashes match the source commit after preparation. No tracked runtime, test, dependency, environment or version file changed.

### Ignored native and local dependency reconciliation

The existing native project was retained; **no prebuild/regeneration** ran.

| Actual mismatch | Completed preparation |
| --- | --- |
| Native 0.5.0 / 9 despite tracked 2.0.0 / 10 | Targeted Info.plist `CFBundleShortVersionString=2.0.0`, `CFBundleVersion=10`, plus Debug/Release `MARKETING_VERSION=2.0.0`, `CURRENT_PROJECT_VERSION=10`; plist/project structures and resolved Release settings verified. |
| Info.plist forced Light despite tracked automatic appearance | Set `UIUserInterfaceStyle=Automatic`, matching installed Expo config introspection. The existing ThemeProvider's system/light/dark selection remains unchanged. |
| Committed SecureStore missing from installed node_modules and Pods | `npm ci --no-audit --no-fund` synchronized exactly the committed lockfile; `pod install` from `apps/mobile/ios` added **ExpoSecureStore 57.0.4**. Existing Pod versions/checksums are unchanged; the ignored Podfile.lock diff contains only SecureStore's entry/dependency/path/checksum. Pods/Manifest.lock matches it. |
| New configured SecureStore plugin not reconciled to plist | Added its standard `NSFaceIDUsageDescription`, matching config introspection. Session storage does not enable biometric authentication; this does not introduce a new authentication flow. |
| Ignored Expo route declarations described old routes | Regenerated `.expo/types` through the installed Expo CLI's `setupTypedRoutes` with current `src/app`; no development server or source workaround. Initial mobile typecheck's four stale-route errors are resolved. |

Preserved by before/after comparison: AppDelegate factory-provider/`EXExpoAppSceneDelegate`, entitlements, Podfile/properties, Node environment files, shared schemes, bundle identifier **il.co.ozavrahami.lifeos**, automatic signing, team **AVQU374YW5** and unrelated project settings. No APNs entitlement or push infrastructure was added. Pod-generated projects/support files changed only through normal dependency integration and remain ignored, as do native version/config files. No native files are to be staged.

### Mac gate evidence

- **Toolchain:** Node **26.3.0**, npm **11.16.0**, Xcode **27.0 (27A266a)** / iPhoneOS **27.0** SDK, CocoaPods **1.17.0**. Repository Node requirement is >=24; locked RN 0.86.2 accepts this Node. `.xcode.env.local`'s `/opt/homebrew/Cellar/node/26.3.0/bin/node` exists and executes. No tool upgrade.
- **Native linkage:** Pod installation succeeded, **112 Podfile dependencies / 111 installed pods**. Mobile-root `expo-modules-autolinking resolve --platform apple --json` reports **26 unique packages**, including SecureStore 57.0.4, Notifications 57.0.12, Font 57.0.4 and ModulesCore 57.0.18. Generated ExpoModulesProvider imports SecureStore and includes its module in the appropriate configurations; Notifications remains linked. An initial root-directory resolver returned no mobile modules and was not used as mobile linkage evidence.
- **Identity/signing:** existing LifeOS workspace/project and LifeOS scheme, Release configuration, Apple Development identity available, automatic team AVQU374YW5. The LifeOS development profile includes this physical device, was created 2026-10-07T09:20:58Z and expires **2026-10-14T09:20:58Z**. It is valid at this inspection; subsequent build may renew it through existing automatic signing. No identity/team/profile was changed or exported. Tool/profile presence does not prove the future binary's signature/installability.
- **Destination:** `00008150-00181C513E30C01C`, Oz’s iPhone, iPhone 17 Pro Max, iOS **27.0.1 (24A446)**; CoreDevice reports paired, localNetwork tunnel connected and Developer Mode enabled. Xcode lists this exact physical destination. No app launch/install occurred.
- **Fonts:** all five repository Heebo TTF assets are loaded through the existing root `useFonts` map and were found byte-identical in the iOS JS export. No runtime CDN font fetch or native font regeneration is needed.
- **URL/auth behavior:** native plist retains `lifeos`; router source has `/settings/google-return`, matching **lifeos://settings/google-return**. Ordinary Release routes are session-gated; development preview/auth-dev require `__DEV__`. The server native Google path does not require a web return URI, and focused fixture tests pass. No real OAuth session was attempted.
- **Production configuration:** production-mode Expo public config/introspection resolves **2.0.0 / 10**, existing bundle ID, `lifeos`, automatic appearance and scene support. Native API origin is **https://lifeosapi-production-0362.up.railway.app**; public Supabase URL matches hosted LifeOS **vcizpdzqbctjksnivnzt** and the public key is present. No localhost/LAN override is selected and no server-secret-named public variable was found. Values/full environment files were not printed or changed.

### Checks run on this Mac

| Command / check | Result |
| --- | --- |
| `npm ci --no-audit --no-fund`; `npm ls --depth=0 --workspace @lifeos/mobile` | Passed; 1202 packages synchronized, no manifest/lockfile resolution changes. npm reports unapproved install-script notices for esbuild/fsevents/unrs-resolver; no blanket approval was applied. The focused tooling/export checks below succeed. |
| `pod install` from apps/mobile/ios | Passed; existing pod versions preserved, SecureStore added. |
| `npm run typecheck` | Initial failure from four stale ignored route declarations; final API/mobile pass after Expo regeneration. |
| `npm run lint` | API and mobile pass. |
| `npm run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/app-version-footer-test.tsx __tests__/v2-auth-lifecycle-test.tsx __tests__/auth-infrastructure-test.tsx __tests__/v2-theme-test.tsx __tests__/google-return-test.tsx __tests__/google-calendar-test.tsx` | **6 suites / 44 passed / 0 failed / 0 skipped**. |
| `npm run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/secure-session-storage-test.ts` | **1 suite / 5 passed / 0 failed / 0 skipped**. |
| `node --import tsx --test apps/api/__tests__/google-calendar.test.ts` | **19 tests passed / 0 failed / 0 skipped** (Node runner: 0 named suites). Controlled fixtures, not hosted authorization/import. |
| `CI=1 NODE_ENV=production npx --no-install expo export --platform ios --output-dir /tmp/lifeos2-ios-export` from apps/mobile | Passed: **1551 modules / one Hermes iOS bundle**, all five Heebo assets. JS export only, no native compilation. |
| Production Expo public config + `expo config --type introspect --json` | Passed, safe selected-field readback; no full configuration disclosure. |
| Mobile-root Expo autolinking; Pod lock equality; `plutil -lint`; Debug/Release project comparison; `xcodebuild -list`, `-showBuildSettings`, `-showdestinations` | Passed. Xcode inspection only, not a build. |
| `CI=1 NODE_ENV=production npx --no-install expo install --check` | **Exit 1, compatibility advisories remain**: newer patches recommended for Expo, asset, build-properties, constants, dev-client, linking, notifications, router, splash-screen, RN, eslint-config-expo and jest-expo. Locked Expo 57.0.23 / build-properties 57.0.20 / RN 0.86.2 retained; no broad upgrade authorized/performed. Not a clean dependency-advisory gate and not proof of native compilation failure. |
| Version/dependency preservation, local documentation links/anchors, `git diff --check` | Passed. All canonical versions remain 2.0.0, build 10; new tracked changes are documentation only. |

Still-valid implementation/DB evidence above is reused. No broad suite, disposable/hosted migration, production user mutation or fresh security audit was run. Existing dependency advisories remain a follow-up before broader release approval, distinct from preparation readiness.

### API readback and remaining acceptance

GitHub context **LifeOS - @lifeos/api** for exact **22761937e99a96ecf1bc922e64eb763528929b58** is **success**, timestamp **2026-10-10T16:02:04Z**, pointing to Railway deployment **9d4efa5e-5f75-4ed0-b52c-cb7cba990128**. Public `/health` returned **HTTP 200**, `{"service":"lifeos-api","status":"ok"}`, on 2026-10-11. This preparation has no authenticated Railway CLI/connector available, so the currently active instance/source/startup logs were **not independently inspected anew**. The prior direct-provider evidence for 3310f96 / bd36780e remains historical; GitHub success plus live health does not prove which provider instance serves every request.

All 14 hosted migration/history checks are reused as prior evidence, not repeated. Hosted authenticated Google status, consent/callback/import and **2.0.0 (10) physical acceptance remain unverified**. Health (or an unauthenticated 401) cannot establish them. Do not import production calendar events into an account still using incompatible **0.5.0 (9)**. After compatible installation, any real authorization/calendar selection/import needs its own owner-approved scope. #17 remains Open / In Progress because bidirectional/background scope is unfinished.

### Exact subsequent build/install handoff — not executed

**Historical preparation instructions:** these were unexecuted at preparation; the later authorized execution and results are recorded at the top. Do not repeat installation merely to reconcile this historical heading.

After owner review and separate build/install authorization, use this existing native workspace, scheme, signing and physical destination. These commands intentionally avoid prebuild, dependency updates, archive/upload and Metro. Run from the mobile directory so production environment/config resolution uses the inspected project:

```bash
cd /Users/ozavrahami/code/lifeOS/apps/mobile
NODE_ENV=production node <<'JS'
require('@expo/env').load(process.cwd(), { silent: true });
const result = require('node:child_process').spawnSync('xcodebuild', [
  '-workspace', 'ios/LifeOS.xcworkspace',
  '-scheme', 'LifeOS', '-configuration', 'Release',
  '-destination', 'id=00008150-00181C513E30C01C',
  '-derivedDataPath', '/tmp/lifeos-2.0.0-10-derived-data',
  '-allowProvisioningUpdates', 'build'
], { stdio: 'inherit', env: process.env });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
JS
```

Only after that build succeeds, verify the produced artifact and install it in place (never uninstall the existing app to prepare):

```bash
LIFEOS_CANDIDATE_APP=/tmp/lifeos-2.0.0-10-derived-data/Build/Products/Release-iphoneos/LifeOS.app
codesign --verify --deep --strict "$LIFEOS_CANDIDATE_APP"
python3 - "$LIFEOS_CANDIDATE_APP/Info.plist" <<'PY'
import plistlib, sys
with open(sys.argv[1], 'rb') as stream:
    p = plistlib.load(stream)
assert (p['CFBundleShortVersionString'], p['CFBundleVersion']) == ('2.0.0', '10')
assert p['CFBundleIdentifier'] == 'il.co.ozavrahami.lifeos'
print('Artifact: LifeOS 2.0.0 (10)')
PY
xcrun devicectl device install app --device 00008150-00181C513E30C01C "$LIFEOS_CANDIDATE_APP"
xcrun devicectl device info apps --device 00008150-00181C513E30C01C --filter 'bundleIdentifier == "il.co.ozavrahami.lifeos"'
xcrun devicectl device process launch --device 00008150-00181C513E30C01C il.co.ozavrahami.lifeos
```

Stop if build/signature/version verification fails; do not install a stale artifact. Read actual installed metadata and the visible footer, then record the scoped owner V2/auth/appearance/notification/optional Google review against **2.0.0 (10)**. Unlock the paired phone if launch is denied while locked. Preparation does not certify runtime linkage, a new signature, installation, launch or acceptance. No commit/push/build/install/archive/upload/migration/deployment/tag/Release action was performed here; only the authorized fetch, local dependency/native synchronization and checks.


## Historical Windows preparation — 2026-10-10

**Candidate: LifeOS 2.0.0 (10). Tracked metadata prepared; Mac-native synchronization, build, installation and exact-build acceptance are pending.** This is an internal device-test candidate, not a published release, App Store/TestFlight submission or accepted iPhone binary.

The owner explicitly selected **2.0.0**, superseding the earlier unprepared 0.6.0 proposal. This records the owner's major-version product decision for the combined V2 release; this preparation adds no feature, protocol change or dependency upgrade. Build numbering is independent: canonical configuration and the last accepted binary were **0.5.0 (9)**. Available repository release/build records contain only a proposed, unbuilt build 10 and no higher prepared/built candidate. Thus tracked build **10** is prepared; the build Mac's current archives, cached artifacts and installed metadata are inaccessible here and must be checked before using that number for a new binary.

Actual baseline: `main` / HEAD / existing `origin/main` all **`3310f96bbdfd9c8d46816c4a3f8cbea03ddcf42d`**, 0 ahead / 0 behind, empty index. No fetch was performed. Owner handoff files, untracked root `tsconfig.json`, environments, private credentials and ignored/generated files are preserved. No uncommitted 0.6.0 metadata preparation existed. Historical accepted-release records remain unchanged.

## Historical API deployment evidence — 2026-10-10

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

The reviewed local Today/Week/task appearance and owner-attested adjustment/cancel, approval reload, completion/reopening consistency retain their scoped evidence. The earlier Settings appearance review and “Amazing, it works” Google feedback were **local web/flow evidence only**. The later 2026-10-11 iPhone report at the top adds general appearance, successful Google authorization, calendar-list display and visible imported content; it does not attest retries, cancellation, reconnect or every event.

#17 remains **Open / In Progress**, read back without changes. Outbound event writes, bidirectional conflict/deletion completion and automatic/background synchronization remain unfinished. Apple integration #31 and broader provider-dependent #34 acceptance remain pending. This candidate does not close any issue or import templates/tasks/Focus into calendars.

**Compatibility gate:** do not import all-day events into production accounts used by the old **0.5.0 (9)** binary. The new API does not update that binary. Coordinate an explicitly authorized real import only after the compatible client is installed and the owner has chosen calendars.

## Release candidate

| Field | Value |
| --- | --- |
| SemVer decision | Owner-selected Major **2.0.0**, replacing the unprepared 0.6.0 proposal |
| Candidate iOS build | **10**; Mac artifact/installed/native inventory completed 2026-10-11, no collision found; accepted/installed predecessor 0.5.0 (9) |
| Version prepared | **Yes**, Windows tracked metadata, 2026-10-10 |
| Native version synchronized | **Yes, Mac 2026-10-11**: existing ignored plist and Debug/Release metadata resolve 2.0.0 / 10; see current Mac evidence above |
| Physical build installed | **Yes, 2026-10-11**: wireless update from 0.5.0 (9), independent 2.0.0 (10) readback and successful launch; see current installed-candidate evidence |
| Owner accepted exact build | **Scoped owner verification, 2026-10-11, 2.0.0 (10)**: looks good; Google authorization/list/import visibility succeeded. Unconfirmed scenarios and broader issue/release acceptance remain incomplete; no blanket acceptance claimed |
| Source baseline | Preparation committed/pushed as **22761937e99a96ecf1bc922e64eb763528929b58**, including `3310f96` plus the historical 13-file manifest below; current Mac changes are documentation and ignored native preparation |

## Historical Windows preparation checks

- Five canonical files set root/API/mobile versions and Expo version to **2.0.0**, with Expo iOS build **"10"**. The lockfile changes only top-level version and the three first-party package version entries; all dependencies, resolutions and integrity values are preserved.
- Production-mode `expo config --type public --json` resolves **2.0.0 / 10**, `lifeos` scheme, existing bundle identifier and automatic appearance. Existing private mobile environment targets the production API and hosted LifeOS public configuration; no server-secret variable appears in public Expo keys. Values are withheld.
- Settings/More share the existing footer, which reads Expo semantic version and actual native binary build metadata; web/missing-build fallbacks remain honest. Its focused test uses simulated native metadata, not an installed binary.
- `npm.cmd run typecheck`: **pass**, API and mobile using tracked workspace configs. `npm.cmd run lint`: **pass**, API ESLint and mobile Expo lint. `npm.cmd run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/app-version-footer-test.tsx`: **6/6 pass**. Production-mode Expo public-config resolution and JSON structural version/lockfile checks: **pass**. Existing implementation/provider-fixture/DB tests in the issue records are reused; no application source or dependency changed. No new JavaScript export is needed for version-only metadata; none was run. No native build was run.
- `git diff --check` and new-record whitespace validation: **pass**. Baseline hashes verify existing implementation/tests, owner handoff/root config, private environment/key files and Git index remain unchanged. Only the explicit preparation manifest changed. Railway variable/pending-change fingerprints and active deployment identity are rechecked unchanged before handoff.
- Root untracked `tsconfig.json` is preserved and not required: API and mobile typechecks use their tracked workspace configs, with mobile extending Expo's config. No root config was staged or incorporated.

## Historical Windows-to-Mac handoff — now completed above

1. After the owner checkpoint and separately authorized source transfer/push, inspect the Mac's actual HEAD, owner work, installed metadata if available, ignored native fields and relevant Release/Debug/archive artifacts. **If build 10 has already identified another prepared/built binary, stop and reconcile a higher build; never reuse or downgrade.** Windows cannot verify this inventory.
2. Back up the existing ignored `apps/mobile/ios` project outside Git. Use the [targeted native synchronization procedure](DEPLOYMENT.md#native-version-synchronization--existing-ios-project) to set only `LifeOS/Info.plist` `CFBundleShortVersionString=2.0.0`, `CFBundleVersion=10`, and both Debug/Release `MARKETING_VERSION=2.0.0`, `CURRENT_PROJECT_VERSION=10`. Read back all fields and preserve signing, entitlements, bundle identifier, scenes and permissions. Do not regenerate native projects or force-add native files.
3. Check the existing native project against the V2 plugin/config changes: secure-session `expo-secure-store` linkage/autolinking, bundled Heebo loading, URL scheme and system appearance. Verify `UIUserInterfaceStyle` follows system mode and preserve existing scene support. Inspect `Podfile.lock` versus `Pods/Manifest.lock`, workspace/scheme, installed dependency resolution and `.xcode.env.local` Node path. If pods/plugin reconciliation is actually needed, document the concrete difference for a separately scoped preserving action; do not run prebuild or upgrade/install Pods just to update versions.
4. Verify Xcode/SDK, Apple Development identity/team, provisioning expiry/device registration/trust and Release signing. The historical provisioning expiry was 2026-10-14; that record does not establish current validity. Recheck the production endpoint/public configuration, ordinary authenticated launch path and `lifeos://settings/google-return` routing; no development-preview bypass belongs in Release.
5. Record completed Mac-native/config/signing gates and the exact source/candidate. **Build/install is still separately owner-authorized and is not requested by this preparation.** After a compatible binary is installed, verify its actual **2.0.0 (10)** metadata/footer, then perform the scoped V2, notification-delivery, account and optional owner-authorized Google consent/cancel/selection/manual-import checks. Provider and device observations must identify that exact binary.

## Historical Windows preparation manifest

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
