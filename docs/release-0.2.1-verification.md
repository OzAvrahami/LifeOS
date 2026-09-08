# LifeOS 0.2.1/build 3 — preparation and owner acceptance

## Current owner acceptance — 2026-09-08

On 2026-09-08, after manually committing/pushing release preparation `2aa6bc4a246a06efc31a6c7753b1ad9f51b8a102`, the owner built and installed the standalone internal iPhone Release, confirmed the app displays **0.2.1 / build 3**, and replied **"מאשר הכל" — "I approve everything."** This is **owner-reported acceptance**, not an independently observed device test. Standalone opening/data loading over cellular without the Mac/Metro and retention of the tested commitment/task times/dates after saving and reopening the app were approved.

- [x] #11: visible hour/minute controls, precise 09:17 without premature dismissal, confirm/reopen/cancel, and optional-end set/clear.
- [x] #12: blank-space keyboard dismissal without closing the form or losing text, one-tap date/time activation, and the requested text-field/description interactions.
- [x] #13: selecting a planning date, correct visible placement, selecting a distant date, cancelling a change, and moving a disposable task without a visible duplicate.
- [x] Saving and reopening the app preserves the tested commitment and task with their selected times/dates.

Previous automated tests remain the evidence for internal IDs, unrelated-field/deadline/status/history preservation, cache membership, and timezone invariants. No new instrumented live-database/history/RLS test, full accessibility audit, exhaustive platform matrix, direct Railway active-deployment inspection, or extraction of the installed binary's exact source SHA was performed. The reported device persistence is accepted user-flow evidence, separate from the earlier preview/demo acceptance. Unrelated older release checks and backlog work are not approved by this record.

Read-only Git checks for this finalization found clean tracked `main`, with local HEAD and remote `main` both at `2aa6bc4a246a06efc31a6c7753b1ad9f51b8a102`. Full implementation SHAs, all ancestors of that baseline:

| Issue | Implementation SHA | Verified final GitHub state | Preserved priority |
| --- | --- | --- | --- |
| [#11](https://github.com/OzAvrahami/LifeOS/issues/11#issuecomment-5581736859) | `6bbccdc7ce655fda60cae2cd29a1c8212d36ca65` | CLOSED / COMPLETED / Done | P1 — High |
| [#12](https://github.com/OzAvrahami/LifeOS/issues/12#issuecomment-5581738239) | `3db8d52d90389a0da132cb1857a651b497e2ab44` | CLOSED / COMPLETED / Done | P2 — Medium |
| [#13](https://github.com/OzAvrahami/LifeOS/issues/13#issuecomment-5581739385) | `544cde042a83684bc389d903ef17f51adee8af2f` | CLOSED / COMPLETED / Done | P1 — High |

One acceptance comment per issue was posted with macOS `gh` and read back after checking for duplicates. Supported acceptance boxes were reconciled with their evidence; broad unperformed accessibility audits remain explicit. Existing Project automation moved each original item to Done after closure, with no duplicate item or manual Project-field mutation. Labels, assignees, milestones, titles, and priorities were preserved. No unrelated issue was changed.

This update records an **installed, owner-accepted internal build**, not a GitHub Release, TestFlight, or App Store publication. No tag or GitHub Release was created. Documentation changes still require the owner's manual commit/push: `docs(release): record 0.2.1 iPhone acceptance`. No rebuild, test-suite rerun, or production action occurred in this finalization.

Finalization checks passed: documentation consistency, local file/fragment links, unchanged 0.2.1/build 3 metadata, preservation of all existing ignored native/environment file contents, and `git diff --check`. Only the eight intended documentation files changed; the Git index remains untouched. The test counts below are retained preparation results, not new runs.

## Historical preparation stage — earlier on 2026-09-08

The following preparation-stage results, availability statements, and build instructions describe the state before the owner's later installation/approval. They are preserved as historical evidence and are superseded by the current acceptance above wherever they say acceptance or installation was pending.


Prepared on 2026-09-08 in `/Users/ozavrahami/code/lifeOS`. **Stop point: owner manual Git checkpoint.** No native compilation, build, installation, publication, Git state-changing operation, API deployment, migration, dependency installation, or production data mutation was performed.

## Baseline and acceptance

Local `main` HEAD and read-only `git ls-remote origin refs/heads/main` both returned `544cde042a83684bc389d903ef17f51adee8af2f`; the initial worktree was clean. Ancestor checks confirm #11 (`6bbccdc`) and #12 (`3db8d52`) are included alongside #13 (`544cde0`). No pre-existing overlapping work was found.

The owner reports #11/#12 desktop-browser acceptance and #13 isolated preview/demo acceptance passed. All three issues were read back as **OPEN / Verify** and were left unchanged. Physical-iPhone acceptance of all three and #13 authenticated live-database persistence/history acceptance remain pending. Implementation-era verification records are retained with current-status addenda.

## API deployment and live health

- Checked commit: `544cde042a83684bc389d903ef17f51adee8af2f`.
- [GitHub commit status](https://github.com/OzAvrahami/LifeOS/commit/544cde042a83684bc389d903ef17f51adee8af2f): context `LifeOS - @lifeos/api`, state `success`, updated `2026-09-08T06:55:17Z`.
- Linked [Railway deployment](https://railway.com/project/4b0ede86-7928-45fa-ade4-46a1094b7101/service/d99536c4-ae42-429d-9116-f073396a3943?id=88584cb4-e0a1-4b79-86b1-396f55ff0017&environmentId=628a150a-e576-462f-9f82-ea5ca4651dc5): `88584cb4-e0a1-4b79-86b1-396f55ff0017`.
- GitHub deployment `6322298644`, environment `LifeOS / production`, exact same SHA: success at `2026-09-08T06:55:20Z`. It is the newest deployment in the returned repository list; no newer GitHub deployment was found.
- Read-only `GET https://lifeosapi-production-0362.up.railway.app/health` from this Mac returned **HTTP 200** with exactly `{"service":"lifeos-api","status":"ok"}`, matching `apps/api/src/routes/health.routes.ts`; the final check was at `2026-09-08T07:10:53Z`.

No Railway CLI, provider session, or provider credential was available. This is GitHub's recorded successful deployment plus live public health, **not independent inspection of the active Railway deployment**. Health does not expose a commit identifier and cannot prove database writes, task history preservation, RLS, or authenticated persistence. No API deployment/rollback/settings changes or migrations were attempted. The API preparation gate has no observed failure; live authenticated acceptance remains pending.

## Version/build selection and changes

Before preparation, Expo configuration and native Info.plist/Debug/Release settings were `0.2.0 (2)`. The local DerivedData Release artifact was `0.2.0 (2)` and Debug artifact `0.1.0 (1)`. No local Xcode archives or evidence of build 3/higher were found in the inspected native build/DerivedData/archive locations. GitHub's latest published release remains v0.1.1. The registered iPhone was listed as unavailable; no installed-app metadata was read, and cached artifacts do not prove its installed version.

Build **3** is unused in the available evidence and greater than the highest known relevant build **2**. The prepared application version is **0.2.1**. The repository's existing shared root/API/Mobile version convention was retained; there is no separately versioned package or second release-version constant to bump.

Tracked metadata changes:

- `package.json`, `apps/api/package.json`, `apps/mobile/package.json`: `version` only, `0.2.0` → `0.2.1`.
- `package-lock.json`: exactly four version values (root plus root/API/Mobile package records), with every dependency and resolution unchanged.
- `apps/mobile/app.json`: `expo.version` → `0.2.1`, `ios.buildNumber` → `"3"`; bundle identifier remains `il.co.ozavrahami.lifeos`.

Documentation changes: `CHANGELOG.md`, `docs/DEPLOYMENT.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/ROADMAP.md`, the three issue verification records, and this record. Historical release entries and unrelated Unreleased work are preserved. No implementation or test source changed.

### Ignored native changes — separate from the Git commit

- `apps/mobile/ios/LifeOS/Info.plist`: `CFBundleShortVersionString = 0.2.1`, `CFBundleVersion = 3`.
- `apps/mobile/ios/LifeOS.xcodeproj/project.pbxproj`: both Debug and Release `MARKETING_VERSION = 0.2.1`, `CURRENT_PROJECT_VERSION = 3`.

Structures were parsed/validated before the documented targeted replacements. Plist syntax, parsed values, and comparison with original contents confirm that only these version/build fields changed. Signing team/style, bundle identifier, provisioning settings, entitlements, icons, permissions, schemes, and all other existing native/environment file contents were preserved. Native files remain ignored; do not force-add them. No prebuild, Pods operation, or native regeneration was run.

The unchanged Settings/More footer reads `Constants.expoConfig.version` and the binary-derived `Constants.platform.ios.buildNumber`. The installed Expo Constants Pod phase regenerates bundled `app.config` from app configuration during a future build. These sources will provide 0.2.1/build 3 after rebuilding; the current config and mocked footer tests do not identify an installed binary. No hardcoded display version or version-test expectation change was necessary.

## Production iOS environment and prerequisites

- Production-mode Expo environment loading and config evaluation passed: version 0.2.1, iOS build 3, expected bundle identifier, static `app.json`, no dynamic config.
- Native `EXPO_PUBLIC_API_URL` matches the documented Railway HTTPS service. The shared API client has no native/platform-specific override selecting localhost or LAN. Required public Supabase URL/key are present; the URL uses HTTPS. No values or complete environment files were printed.
- No Release environment/bundling-disable override was selected. Normal product routes require authentication; preview/demo paths are gated by `__DEV__` and do not become the Release launch path. No Web preview setting was applied to native Release.
- `.env` files remain ignored, untracked, and byte-for-byte unchanged. No temporary API override needs restoring.
- Selected Xcode: `/Applications/Xcode.app/Contents/Developer`, Xcode 26.6 (`17F113`); Node 26.3.0, npm 11.16.0, CocoaPods 1.17.0.
- Read-only `xcodebuild -list -workspace apps/mobile/ios/LifeOS.xcworkspace -disableAutomaticPackageResolution -skipPackageUpdates` succeeded and includes scheme `LifeOS`; no compilation was requested.
- Existing automatic signing/team configuration is present and unchanged; Keychain reports one valid Apple Development signing identity. This does not prove current device trust, Developer Mode, or provisioning validity for a future installation.
- `Podfile.lock` and `Pods/Manifest.lock` match. The Node executable referenced by `.xcode.env.local` exists and reports v26.3.0. No extra `.xcode.env.updates` override was found.
- Installed Expo SDK 57.0.14 / CLI 57.0.16: `expo run:ios --help` confirms `--device` and `--configuration Release`. Installed CLI source sets production environment loading for Release and only prebuilds when the native directory is absent.

## Automated verification on the prepared metadata

All commands ran from the repository root unless stated. All exited successfully.

| Check | Result |
| --- | --- |
| `npm run test --workspace @lifeos/mobile` | 38 suites; 217 passed, 1 existing Android-only exclusion, 0 failures |
| Focused footer and #11/#12/#13 command below | 13 suites; 87 passed, 1 existing Android-only exclusion, 0 failures |
| `npm run test --workspace @lifeos/mobile -- --config jest.commitment-android.config.js` | 2 suites; 11 passed, 9 complementary existing iOS-only exclusions, 0 failures |
| `npm run test --workspace @lifeos/mobile -- --config jest.task-date-android.config.js` | 1 suite; 3 passed, 0 skipped/failures |
| `npm run test --workspace @lifeos/api` | 6 suites; 48 passed, 0 skipped/failures; includes commitment precision and task planning/history preservation against isolated stores |
| `npm run typecheck` | API and Mobile passed |
| `npm run lint` | API and Mobile passed, no warnings |
| Production app config/environment evaluation | Passed; endpoint match and public-variable presence checked without printing secrets |
| Version/build consistency and original-content comparisons | Passed; all intended sources agree; only four lockfile version values and the intended native fields changed |
| `plutil -lint` on Info.plist and project.pbxproj | Both passed |
| `git diff --check` | Passed |

Focused command:

```sh
npm run test --workspace @lifeos/mobile -- --runTestsByPath \
  __tests__/app-version-footer-test.tsx __tests__/settings-screens-test.tsx \
  __tests__/commitment-keyboard-test.tsx __tests__/commitment-keyboard-web-test.tsx \
  __tests__/commitment-time-picker-test.tsx __tests__/commitment-screen-test.tsx \
  __tests__/commitment-web-fields-test.tsx __tests__/task-date-capture-test.tsx \
  __tests__/task-date-native-test.tsx __tests__/task-date-web-test.tsx \
  __tests__/task-server-flow-test.tsx __tests__/task-query-cache-test.tsx \
  __tests__/inbox-screen-test.tsx
```

No new skips, weakened assertions, dependency changes, or test-source changes were introduced. The standard run covers the iOS-only cases excluded by Android; Android covers the standard run's Android-only exclusion. API tests use isolated stores/fake external boundaries. The opt-in live PostgreSQL/Auth/RLS harness was not run; no current isolated full-stack environment or approved usable test account was confirmed. Historical retained test-account records are not proof of current suitability/authorization. No simulator/browser test counts as physical-iPhone acceptance.

## Original extended Release checklist — evidence reconciliation

The owner approval above accepts the reported #11/#12/#13 device flows. The original combined checklist also contained broader claims, separated here rather than marked complete mechanically:

- [x] Installed app displays version **0.2.1**, native build **3** — owner-reported; no independent inspection of both footer locations or binary source SHA.
- [x] Standalone opening and data loading without the Mac/Metro over cellular — owner-reported, distinct from preview/demo checks; no separate instrumented authentication trace.
- [x] #11/#12/#13 visible interactions and save/app-reopen persistence — owner-reported scope listed above. Prior automated/desktop tests remain separate evidence for additional creation/editing, title-only Inbox capture, and shared entry points.
- [x] Internal identity, unrelated fields, deadlines, status/history, cache membership, and timezone invariants — supported by the prior automated tests, not by owner inspection of database rows or internal IDs.
- [ ] New instrumented live-database/history/RLS inspection of the installed flow — not performed or required as a new test in this finalization.
- [ ] Full accessibility/VoiceOver audit and physical device-timezone/near-midnight matrix — not reported. Usable controls and accepted touch/text flows are not a full audit.

The older Day Window/Today/Week/Weekly Focus checks in [DEPLOYMENT.md](DEPLOYMENT.md) retain their prior status. They and unrelated backlog features are not included in this acceptance.

## Historical preparation checkpoint and build command

The owner reviews the tracked diff, stages the intended tracked files, commits, and pushes manually. Keep ignored native/environment files ignored. Suggested conventional commit:

```text
chore(release): prepare 0.2.1 iOS build 3
```

**Only later, after that manual commit/push**, connect/unlock the intended physical iPhone, confirm Developer Mode/trust and signing prerequisites, and run:

```sh
cd /Users/ozavrahami/code/lifeOS/apps/mobile
NODE_ENV=production npx --no-install expo run:ios --device --configuration Release
```

Select the intended physical iPhone when prompted. This command builds, signs, and installs through the existing internal delivery path; it was inspected via help/source but **not executed**. No EAS, TestFlight/App Store, OTA delivery, new signing identity, tag, release, or distribution infrastructure is introduced.
