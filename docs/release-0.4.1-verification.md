# LifeOS 0.4.1 (8) — candidate verification

## Current state — 2026-09-23

**Locally prepared; not built, installed, physically accepted or published.** Scope: #2 Task/Weekly Focus clarification and the owner-approved #9 product decision. Latest published release and last owner-accepted internal binary remain **v0.4.0 / 0.4.0 (7)**. No tag, GitHub Release, App Store or TestFlight publication is implied.

Preparation began on main at `ce113fbc14142056b042eedba503863cdee17929`, matching local origin/main and read-only remote main. The existing 19 modified and 2 new #2/#9 files were inventoried and preserved. Runtime source and tests remain byte-for-byte unchanged from that verified implementation; this step changes version metadata and documentation only. The eventual source checkpoint is the owner's future commit containing the implementation and this preparation; no future SHA is invented.

## Scope and acceptance

The actual runtime diff corrects how existing Focus directions and Tasks are labelled, explains source/daily selection, and opens the existing independent Task capture explicitly. It preserves task/focus models, lifecycle, APIs and notification behavior. Preview-only fictional Focus scheduling is removed. This is a **PATCH** correction of existing behavior, not a new planning lifecycle or priority-management capability. #5 and other backlog features are excluded.

The owner explicitly approved #9 on 2026-09-23: retain optional normal/important Task importance, separate from Weekly Focus, daily selection, scheduling, deadlines and reminders; keep Quick Capture lightweight; a future importance control stays outside this implementation. See [the accepted decision](issue-9-decision.md). #9 remains Open / Verify / P2 pending the owner Git checkpoint before closure. This decision approval does not accept #2's physical UI behavior.

#2 remains **Open / Verify / P1**, with the [physical checklist and implementation evidence](issue-2-verification.md#eventual-owner-acceptance-checklist). No prior accepted binary contains these uncommitted changes.

## Release candidate

| Field | Value |
| --- | --- |
| SemVer impact | Patch, reviewed against the actual runtime diff |
| Candidate version | 0.4.1 |
| Candidate iOS build | 8 |
| Version prepared | Yes, 2026-09-23, after explicit owner authorization |
| Native version synchronized | Yes, existing ignored project on this Mac, targeted fields only |
| Physical build installed | No |
| Owner accepted exact build | No; #9 decision approval is separate |
| Included issues | #2 implementation + #9 accepted product-decision documentation |

### Build-number evidence

Before preparation, tracked Expo configuration, native Info.plist and Debug/Release project settings all used 0.4.0 / 7. Historical candidate records identify build 5 (failed launch), build 6 (startup-compatible, superseded before acceptance), and accepted build 7.

Read-only artifact inventory covered `apps/mobile/ios/build`, Xcode DerivedData/Archives, and LifeOS temporary build directories. Found cached Debug device 0.1.0 (1), Release simulator 0.4.0 (5), temporary scene-fix device 0.4.0 (6), and device Release 0.4.0 (7), including `/tmp/lifeos7-release`. No archive or artifact using 8 or higher was found. **8 is unused in the inspected evidence and exceeds every relevant known candidate.** Cached artifacts are not evidence of what is installed. Device discovery reported the owner's iPhone unavailable; installed metadata, trust and provisioning were not re-inspected. No connection was required for preparation.

### Canonical tracked versions

- `package.json`, `apps/api/package.json`, `apps/mobile/package.json`: 0.4.1, following the shared first-party product-version convention.
- `apps/mobile/app.json`: `expo.version = 0.4.1`, `ios.buildNumber = "8"`; other configuration, including UIScene support, unchanged.
- `package-lock.json`: exactly top-level `version`, `packages[""].version`, `packages["apps/api"].version`, and `packages["apps/mobile"].version`. Parsed comparison confirms every dependency resolution and other value unchanged.

### Ignored native metadata

Used the [documented targeted synchronization](DEPLOYMENT.md#native-version-synchronization--existing-ios-project), from `apps/mobile`, after backing up original version files outside the repository. Both file structures were validated before writing and after synchronization. Parsed structural comparison confirmed only these fields changed:

| File | Readback |
| --- | --- |
| `ios/LifeOS/Info.plist` | `CFBundleShortVersionString = 0.4.1`, `CFBundleVersion = 8` |
| `ios/LifeOS.xcodeproj/project.pbxproj` | Debug and Release: `MARKETING_VERSION = 0.4.1`, `CURRENT_PROJECT_VERSION = 8` |

Bundle ID `il.co.ozavrahami.lifeos`, existing development team, automatic signing, provisioning/build settings, entitlements, schemes and other plist/project content are preserved. `EXExpoAppSceneDelegate` and `ExpoReactNativeFactoryProvider` remain. AppDelegate and other snapshotted native files are unchanged; no prebuild, regeneration, pod install or dependency update occurred. Native files remain ignored. Settings/More continue using the shared footer and actual binary build metadata after rebuilding; config is not an installed-binary readback.

## Pre-device prerequisites and validation

| Check | Result on 2026-09-23 |
| --- | --- |
| `npm run test --workspace @lifeos/mobile -- --runTestsByPath __tests__/app-version-footer-test.tsx` | 1 suite / 6 passed / 0 skips or failures; prepared config plus simulated native metadata, Web/dev/missing-build fallbacks |
| `npm run typecheck` | API and mobile passed |
| `npm run lint` | API and mobile passed |
| Production-mode `npx --no-install expo config --type public --json` (filtered readback) | 0.4.1 / 8, correct bundle ID, scene support true |
| `npx --no-install expo export --platform ios --output-dir /tmp/lifeos041-ios-export` from mobile | Passed; one Hermes bundle. CI, dotenv disabled, temporary process-only non-service placeholders; no environment-file changes |
| `npx --no-install expo-modules-autolinking verify --platform ios` | Passed; no duplicate native-module warning |
| `plutil -lint` and parsed native comparison | Passed; only required version/build fields changed |
| Tracked/lockfile version consistency and preservation hashes | Passed; prior runtime/tests, environment and unrelated snapshotted native files preserved |
| Local documentation links/anchors and `git diff --check` | Passed |

Reused still-valid #2 evidence from earlier on 2026-09-23: focused **8 suites / 73 passed**; full mobile **47 suites / 318 passed / 1 existing Android-only skip**; API **11 suites / 86 passed**. No runtime/test/dependency-resolution change invalidates those results. Full suites and disposable DB integration were not repeated for metadata/documentation changes. No new schema or API implementation requires rollout.

Production-mode environment evaluation selects **https://lifeosapi-production-0362.up.railway.app**; required existing public Supabase URL/key are present and URL is HTTPS. The shared API client has no platform-specific native override. Release routes require `__DEV__` for preview and therefore select the ordinary authenticated server path. Environment files remain unchanged and untracked/ignored; values were not dumped and no override was persisted.

GitHub's `LifeOS - @lifeos/api` status is **success** for `ce113fbc14142056b042eedba503863cdee17929`, updated `2026-09-22T11:09:48Z`. Read-only live GET `/health` returned HTTP 200 with `{"service":"lifeos-api","status":"ok"}`, matching `apps/api/src/routes/health.routes.ts`. Existing schema rollout remains documented in [0.4.0 verification](release-0.4.0-verification.md). No active Railway provider inspection, production write/RLS/history test, remote migration or deployment was performed; health does not establish those facts.

Selected Xcode: `/Applications/Xcode.app/Contents/Developer`, **27.0 (27A266a)**. Existing workspace lists scheme LifeOS. One valid Apple Development signing identity is available, without exporting credentials. Pods lock equals manifest; ExpoNotifications remains in the workspace. Node **26.3.0**, npm **11.16.0**, CocoaPods **1.17.0**; `.xcode.env.local` points to an existing executable reporting Node 26.3.0. Installed Expo CLI help supports the established device/Release options. Tool presence does not establish current device trust, Developer Mode or provisioning validity.

## Stop point

Ready for the owner's review and manual Git checkpoint. No known software or local preparation blocker remains. #9 may be closed only after its required Git checkpoint is completed and verified; #2 must remain open/Verify until acceptance of a binary containing this implementation. Before any later build/install, obtain separate authorization and confirm connected-device trust/Developer Mode/signing validity. No build/install command was executed, and no commit, push, migration, deployment, tag or Release operation was performed.
