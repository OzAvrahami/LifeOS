# LifeOS 0.2.1/build 3 — preparation, owner acceptance, and publication

## Current publication and workflow — 2026-09-08

Authenticated macOS GitHub inspection confirms [LifeOS v0.2.1 — Planning fixes](https://github.com/OzAvrahami/LifeOS/releases/tag/v0.2.1), published **2026-09-08 at 09:19:03 UTC**, is **Latest, non-draft, non-prerelease**. The annotated `v0.2.1` tag resolves to **`93fde4306132f2301f5e2b02c3c374f5c203a1cd`**. Local HEAD and remote main matched that commit and the worktree was clean before this reconciliation.

The owner’s preparation (`2aa6bc4`), acceptance-documentation (`1712389`), and final publication-documentation (`93fde43`) checkpoints are complete. The release source contains #11/#12/#13 and only documentation changes after the owner-built preparation baseline. Later workflow/documentation reconciliation is separate from the fixed published tag; no installed-binary SHA was extracted. The internal iPhone remains owner-accepted **0.2.1 / build 3**, not TestFlight or App Store distribution.

Post-publication Status reconciliation was read back: #3/#4 Open / Ready and #7/#8/#10 Open / Verify, all P1 — High. #11/#12/#13 remain Closed / Completed / Done. No additional acceptance is inferred from publication. Full remaining scope, comments, and #6’s still-pending owner decision are recorded in [current workflow](IMPLEMENTATION_STATUS.md#current-workflow--2026-09-08); exact #7/#8/#10 checks are in [Deployment](DEPLOYMENT.md#remaining-targeted-owner-checks). No new tests, builds, production operations, or device checks were performed for this reconciliation.

## Historical publication preparation — earlier on 2026-09-08

The snapshot below predates the owner’s final commit/tag/publication. Its absent-release and pending-checkpoint statements describe that earlier stage and are superseded by the completed publication above.


Acceptance documentation was manually committed and pushed as `17123893b8d10f87278a71871f330d8141bce275` (`docs(release): record 0.2.1 iPhone acceptance`). Read-only checks found a clean worktree and local/remote `main` at that SHA before these final documentation edits. The acceptance-documentation checkpoint is complete; only this publication-preparation documentation awaits approval and a new manual commit/push.

### Remote release and source baseline

- The actual remote tag listing has no `v0.2.0` or `v0.2.1`. Authenticated GitHub release listing and `/releases/latest` return only published, non-draft, non-prerelease `v0.1.1`, published `2026-08-27T19:17:11Z`; no v0.2.1 draft or published Release exists.
- The previous Release's annotated `v0.1.1` tag resolves to commit `b7bf0003b8bbb9398836ecd2e4bdf83a4e78d037`. Its changes through the owner-built baseline and the historical 0.2.0 preparation entry were reviewed for inherited release scope. No retrospective 0.2.0 tag/release is planned.
- Current HEAD contains #11 `6bbccdc7ce655fda60cae2cd29a1c8212d36ca65`, #12 `3db8d52d90389a0da132cb1857a651b497e2ab44`, #13 `544cde042a83684bc389d903ef17f51adee8af2f`, release preparation `2aa6bc4a246a06efc31a6c7753b1ad9f51b8a102`, and acceptance documentation `17123893b8d10f87278a71871f330d8141bce275`; read-only ancestor checks passed.
- More's shared version footer was introduced by `9db574e448f11dd48556ef10c4539239c21affc2`, an ancestor of both the owner-built baseline and current HEAD. The baseline's More screen imports/renders `AppVersionFooter`, also used by Settings. Its fix therefore belongs in the 0.2.1 scope rather than Unreleased.
- `git diff --name-only 2aa6bc4..1712389` contains only `CHANGELOG.md` and seven `docs/*.md` files. No runtime, dependency, version, or tracked native change occurred after the owner-built baseline. This describes repository ancestry; the installed binary's exact SHA was not extracted.

### Owner publication settings and stop point

The canonical release summary is [CHANGELOG.md](../CHANGELOG.md), including fixes accepted in 0.2.1 and inherited improvements since v0.1.1. No standalone release-body file convention exists; `.github/release.yml` only configures generated-note categories, so no duplicate release-notes file was added. Copy-ready notes are supplied in the preparation handoff.

- Proposed title: **LifeOS v0.2.1 — Planning fixes**.
- After all documentation, including the changelog, is complete and approved, the owner manually commits/pushes these final edits and creates tag **v0.2.1** at that **final approved documentation commit**. Do not target `2aa6bc4` or `1712389`, which omit these edits; the future commit SHA is not yet known.
- The owner then creates a normal **non-prerelease** GitHub Release using that tag and marks it **Latest at publication**. No GitHub publication has occurred in this preparation step.
- Internal iPhone metadata remains **0.2.1 / build 3**; this does not publish to the App Store or TestFlight. No binary attachment is required. Do not upload an IPA, certificates, provisioning profiles, environment files, or signing materials.
- Codex prepares and verifies only: it must not create tags or create/publish/edit GitHub Releases, including drafts. See [the release policy](github-development-standard.md#release-policy).

No issue state/metadata, Project automation, runtime code, dependency, native configuration, or production setting is changed. No rebuild or test-suite rerun is needed for these documentation-only edits. Existing owner acceptance and specialized evidence limits below remain unchanged. Suggested final documentation commit: `docs(release): finalize v0.2.1 changelog and publication notes`.

Publication-preparation checks passed: commit ancestry and documentation-only differences from the owner-built baseline; unchanged 0.2.1/build 3 metadata, runtime, dependencies, and existing ignored native/environment contents; local documentation/fragment links; diff review; and `git diff --check`. Remote main remained at `1712389`, and the final tag/Release read still found no v0.2.0/v0.2.1. No technical publication blocker was found in the inspected evidence; owner documentation approval, the final manual commit/push, and owner tag/publication remain outstanding. No test results below represent a new run in this step.

## Current owner acceptance — 2026-09-08

On 2026-09-08, after manually committing/pushing release preparation `2aa6bc4a246a06efc31a6c7753b1ad9f51b8a102`, the owner built and installed the standalone internal iPhone Release, confirmed the app displays **0.2.1 / build 3**, and replied **"מאשר הכל" — "I approve everything."** This is **owner-reported acceptance**, not an independently observed device test. Standalone opening/data loading over cellular without the Mac/Metro and retention of the tested commitment/task times/dates after saving and reopening the app were approved.

- [x] #11: visible hour/minute controls, precise 09:17 without premature dismissal, confirm/reopen/cancel, and optional-end set/clear.
- [x] #12: blank-space keyboard dismissal without closing the form or losing text, one-tap date/time activation, and the requested text-field/description interactions.
- [x] #13: selecting a planning date, correct visible placement, selecting a distant date, cancelling a change, and moving a disposable task without a visible duplicate.
- [x] Saving and reopening the app preserves the tested commitment and task with their selected times/dates.

Previous automated tests remain the evidence for internal IDs, unrelated-field/deadline/status/history preservation, cache membership, and timezone invariants. No new instrumented live-database/history/RLS test, full accessibility audit, exhaustive platform matrix, direct Railway active-deployment inspection, or extraction of the installed binary's exact source SHA was performed. The reported device persistence is accepted user-flow evidence, separate from the earlier preview/demo acceptance. Unrelated older release checks and backlog work are not approved by this record.

Read-only Git checks during the earlier acceptance finalization found clean tracked `main`, with local HEAD and remote `main` both at `2aa6bc4a246a06efc31a6c7753b1ad9f51b8a102`. Full implementation SHAs, all ancestors of that baseline:

| Issue | Implementation SHA | Verified final GitHub state | Preserved priority |
| --- | --- | --- | --- |
| [#11](https://github.com/OzAvrahami/LifeOS/issues/11#issuecomment-5581736859) | `6bbccdc7ce655fda60cae2cd29a1c8212d36ca65` | CLOSED / COMPLETED / Done | P1 — High |
| [#12](https://github.com/OzAvrahami/LifeOS/issues/12#issuecomment-5581738239) | `3db8d52d90389a0da132cb1857a651b497e2ab44` | CLOSED / COMPLETED / Done | P2 — Medium |
| [#13](https://github.com/OzAvrahami/LifeOS/issues/13#issuecomment-5581739385) | `544cde042a83684bc389d903ef17f51adee8af2f` | CLOSED / COMPLETED / Done | P1 — High |

One acceptance comment per issue was posted with macOS `gh` and read back after checking for duplicates. Supported acceptance boxes were reconciled with their evidence; broad unperformed accessibility audits remain explicit. Existing Project automation moved each original item to Done after closure, with no duplicate item or manual Project-field mutation. Labels, assignees, milestones, titles, and priorities were preserved. No unrelated issue was changed.

The acceptance finalization recorded an **installed, owner-accepted internal build** and did not itself publish a GitHub Release, TestFlight, or App Store update. The owner completed the acceptance-documentation commit/push as `17123893b8d10f87278a71871f330d8141bce275`, then completed publication documentation and published v0.2.1 at `93fde4306132f2301f5e2b02c3c374f5c203a1cd`, as recorded above. No rebuild, test-suite rerun, or production action occurred during acceptance finalization.

Historical acceptance-finalization checks passed: documentation consistency, local file/fragment links, unchanged 0.2.1/build 3 metadata, preservation of all existing ignored native/environment file contents, and `git diff --check`. Only the eight intended documentation files changed; the Git index remains untouched. The test counts below are retained preparation results, not new runs.

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
