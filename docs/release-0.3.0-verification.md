# LifeOS 0.3.0 (4) — internal verification candidate

## Current candidate — 2026-09-13

**Prepared, not built, installed, owner-accepted or published.** Includes #3 Weekly Planning lifecycle and #4 Week/day navigation. Both issues remain **Open / Verify / P1 — High**. Latest published release and last owner-accepted binary remain **v0.2.1 / build 3**. Read-only remote tag/release inspection found no v0.3.0 tag or Release. The candidate is a MINOR update because these are substantial new user-facing planning capabilities, grouped into one acceptance build rather than separate versions per issue.

[Development Workflow](DEVELOPMENT_WORKFLOW.md) is now the canonical standard, with the automatic pre-device gate referenced by root AGENTS.md and all four Issue Forms. The standard requires every future new acceptance binary to have a fresh increasing build number, even when SemVer stays unchanged. No release date or future commit/tag target is assigned here.

## Baseline and version evidence

The initial worktree was clean on `main` at **`286cec4fc68d1a4f8c24788bc411e79047929f61`** (`feat(planning): add weekly planning lifecycle`). The authorized `git fetch origin` completed; HEAD and `origin/main` match. This contains #4 implementation `7785381`. Their implementation checkpoints are pushed; this later preparation does not identify an installed binary's source SHA.

Before preparation, app.json, root/API/Mobile manifests, lockfile package metadata, native Info.plist and Debug/Release settings were 0.2.1 / build 3. The inspected cached Release artifact was 0.2.1 (3), cached Debug was 0.1.0 (1); no app artifacts in local `ios/build` or Xcode archives were found. No build 4 or higher appeared in these relevant known sources. Cached artifacts do not prove installed metadata; the last accepted build is the owner's recorded 0.2.1 (3). No device connection or installed-app inspection was required or performed.

The prior release preparation `2aa6bc4` confirms the shared private root/API/Mobile product-version convention. This preparation changes:

- `apps/mobile/app.json`: `expo.version = 0.3.0`, `expo.ios.buildNumber = "4"`.
- `package.json`, `apps/api/package.json`, `apps/mobile/package.json`: version 0.3.0.
- `package-lock.json`: exactly four version values, top-level and root/API/Mobile package records. Dependencies and resolutions are unchanged.

The bundle identifier remains `il.co.ozavrahami.lifeos`. No application behavior or dependency changes are included; one footer regression now exercises the prepared config with simulated corresponding native metadata while retaining mismatch/Web/development/missing-build coverage.

## Ignored native synchronization

The existing local native project was synchronized with the targeted process in [Deployment](DEPLOYMENT.md#native-version-synchronization--existing-ios-project):

| Native field | Read-back value |
| --- | --- |
| Info.plist `CFBundleShortVersionString` | 0.3.0 |
| Info.plist `CFBundleVersion` | 4 |
| Debug and Release `MARKETING_VERSION` | 0.3.0 |
| Debug and Release `CURRENT_PROJECT_VERSION` | 4 |

Both files passed `plutil -lint`; parsed before/after comparison confirms only the version/build fields changed. Bundle identifier, signing/provisioning, entitlements, icons and other settings are preserved. The files remain ignored and are not part of the Git checkpoint. Other inspected native/environment files remain byte-for-byte unchanged. No native regeneration, Pods operation, build or installation occurred.

## Preparation verification

Commands ran from the repository root unless stated; each completed successfully on 2026-09-13.

| Check | Result |
| --- | --- |
| `npm run typecheck` | API and Mobile passed |
| `npm run lint` | API and Mobile passed, no warnings |
| Focused footer/Settings command below | **2 suites / 18 passed / 0 skipped / 0 failed**; no snapshots |
| All four Issue Forms | YAML parsed with installed `yaml`; required structure, unique IDs, dropdown string options and validations passed; existing fields/labels and config.yml unchanged |
| Tracked version comparison | All sources agree on 0.3.0 (4); exactly four lockfile version values changed, no dependency resolutions changed |
| Production-mode Expo config | 0.3.0 / 4 and expected bundle identifier verified; no environment files loaded or full configuration printed |
| Native plist/project structure and metadata | Parsed before/after comparison and syntax checks passed; only intended fields changed |
| iOS JavaScript export | Passed, one Hermes bundle and metadata under `/tmp/lifeos030-ios-export`; no native compilation |
| Documentation links and `git diff --check` | 55 local file/anchor links passed; tracked diff and new-file whitespace checks passed |

```sh
npm run test --workspace @lifeos/mobile -- --runTestsByPath \
  __tests__/app-version-footer-test.tsx __tests__/settings-screens-test.tsx
npm run typecheck
npm run lint
git diff --check
```

The export ran from `apps/mobile` with process-only non-service placeholders:

```sh
EXPO_NO_DOTENV=1 \
EXPO_PUBLIC_API_URL=https://example.invalid \
EXPO_PUBLIC_SUPABASE_URL=https://example.invalid \
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=export-check \
../../node_modules/.bin/expo export --platform ios --output-dir /tmp/lifeos030-ios-export
```

This verifies bundling, not production endpoint readiness or an installed binary. The shared footer still reads version from Expo config and build from binary-derived Constants; simulated tests cannot prove installation. Full API/Mobile suites and local integration were not rerun for metadata/docs/forms/test-only preparation. Prior feature evidence remains in [#3](issue-3-verification.md#automated-evidence) and [#4](issue-4-verification.md#automated-verification), including #3's successful real local PostgreSQL/Auth/RLS integration.

## Before physical installation

The version/native preparation is complete. **Do not build/install during this task.** The owner reviews and manually commits/pushes the intended preparation files. No tag or GitHub Release is implied by that checkpoint.

Before a later authorized build, verify that `20260913120000_add_weekly_planning_lifecycle.sql` is applied to the intended server database and that the deployed API contains the #3 contract. Implementation `286cec4` is already pushed, but current linked migration history and the active API deployment were not independently inspected in this preparation. Do not assume that a push or successful local integration establishes remote readiness. Follow the [schema/API ordering standard](DEVELOPMENT_WORKFLOW.md#database--api-rollout) for pending work; any production mutation requires explicit authorization.

Recheck the [mandatory pre-device gate](DEVELOPMENT_WORKFLOW.md#mandatory-pre-device-gate), including production iOS endpoint/public configuration presence, ordinary authenticated launch, existing signing/device/Pods/Node prerequisites, and native version readback. Then use the existing internal Release command in [Deployment](DEPLOYMENT.md), only after owner build authorization.

The owner should first confirm the installed footer says **0.3.0 / build 4**, then perform both [#3's lifecycle checklist](issue-3-verification.md#physical-iphone-owner-checklist) and [#4's Week/day checklist](issue-4-verification.md#physical-iphone-owner-checklist) on that same binary with approved disposable records. Include standalone operation and save/reopen persistence. #4's known-estimate scenarios require suitable existing disposable fixtures because the current UI cannot edit task estimates. Record exact build/date and scoped owner approval independently per issue; neither can close based on accepted 0.2.1 (3).

If runtime code changes after this candidate is built, prepare a new increasing build number and repeat affected acceptance. Documentation-only edits before this unbuilt candidate do not consume another build number. Official tag/GitHub Release/Latest publication remains a separate owner-controlled action after approval.

## GitHub readback

The Release / Build gate was appended to both original issue bodies. Impact, candidate version/build, tracked preparation and local native synchronization are checked; installation, owner acceptance and exact accepted build remain unchecked. Readback confirms #3 and #4 remain Open / Verify / P1 — High, with original requirements/comments, labels, assignees and milestones preserved. All 18 Project items, priorities and memberships are unchanged; no workflow Status mutation was performed.
