# LifeOS Development Workflow

This is the canonical development, verification, version/build and rollout standard. Read it before issue work and before suggesting any device build, including requests such as “build it on the iPhone” or “let's verify it.” [GitHub conventions](github-development-standard.md) describe labels, priorities and views; [deployment instructions](DEPLOYMENT.md) describe the existing internal delivery path. Explicit owner instructions control authorization.

## Project workflow

`Backlog → Ready → In Progress → Verify → Done`

| Status | Meaning |
| --- | --- |
| Backlog | Defined work, not yet selected. |
| Ready | Scope sufficiently understood and intentionally queued. |
| In Progress | Implementation actively underway. Partial but paused work is not automatically active. |
| Verify | Full software scope implemented and automated gates passed; owner acceptance or an explicitly documented external gate remains. A blocked required local automated check is not a pass. |
| Done | Owner acceptance and every required release/build/device gate for the issue passed. A commit, deployment or passing tests alone is insufficient when physical acceptance is required. Publication is a gate only when the issue explicitly requires it. |

Before implementation, read the actual issue and all comments, approved scope, current code/tests and verification records. Inspect `git status`, HEAD, branch and local/remote relationship; inventory and preserve pre-existing changes. Use main unless the repository/owner requires another workflow. Fetch only when authorized. Read actual Project fields rather than inferring status from issue state or labels.

Use the existing LifeOS Development Project #2 item (`PVT_kwHOAgE74M4BhLsq`). Move only the selected issue as justified, preserving priority, labels, assignees, milestone, other fields and membership. Never create duplicate items. Read back every write. Keep Verify issues open; close as Completed only after the full scope and acceptance pass. Document supersession separately rather than marking unimplemented scope Completed. Report permission failures without changing credentials.

## Git checkpoints

A checkpoint normally requires a coherent issue slice, relevant passing tests, `git diff --check`, current documentation, and no hidden implementation blocker. Before asking the owner to commit, report changed files, exact test results (including skips/failures and evidence boundaries), Git status, current HEAD, and whether the checkpoint is safe. Distinguish partial checkpoints from full issue completion.

Staging, commits, pushes, branch/history changes, tags, releases, deployments and version changes require owner authorization. Never commit/push automatically. A local commit checkpoint and a remote push are distinct: pushing can trigger API deployment. Keep ignored native/environment files ignored. Record completed checkpoints as dated evidence; put the next manual checkpoint in the handoff rather than a perpetual “this document awaits commit” statement.

## Database / API rollout

For schema-dependent changes, follow this order:

```text
Local implementation
→ disposable local DB verification
→ Git checkpoint (local commit; hold deployment-triggering push)
→ inspect linked remote migration state
→ dry-run remote migration
→ apply schema migration
→ verify remote migration history
→ push API code
→ verify deployment success
→ build/install mobile candidate
```

Prepare forward-only migrations. Verify constraints, compatibility, retries and caller/anonymous RLS through the established disposable local harness; production is never a substitute. Preserve existing IDs/data and document compatibility. Never print or store credentials in logs, documentation or Git; use existing authenticated tools and filtered configuration checks.

Production mutations require explicit owner authorization. Before any real remote push, confirm the linked project and inspect **every** pending migration, then review the dry run. After authorized application, verify remote history before intentionally deploying schema-dependent API code. The concrete migration commands and existing Railway path are in [Deployment](DEPLOYMENT.md) and the issue handoff. Do not deploy an API requiring absent schema. If API code is already pushed, report that fact and inspect the actual rollout evidence; do not assume schema readiness or silently redeploy/roll back.

Verify deployment evidence for the intended source and the repository health contract. Distinguish provider-observed active deployment from historical GitHub status; health alone does not prove writes, RLS or history. Document any remaining rollout gate before mobile installation.

## Mobile Version / Build Policy

This policy is mandatory for every issue affecting installable mobile behavior, including corrections, configuration and dependency changes. Review release impact automatically before physical-device verification; do not rely on the owner to request it.

| SemVer impact | Use |
| --- | --- |
| PATCH | Bug fixes/corrections without a meaningful new capability, e.g. `0.3.0 → 0.3.1`. |
| MINOR | Backwards-compatible user-facing capability or substantial workflow, e.g. `0.2.1 → 0.3.0`. |
| MAJOR | Genuinely breaking product/API/platform change where appropriate. Do not bump casually before 1.0; document the decision. |

Do not mechanically bump SemVer per issue. Group compatible issues into one candidate: #3 Weekly Planning lifecycle and #4 Week/day navigation share **0.3.0**. Determine included scope and release impact before acceptance; additions after a build require a new candidate review.

Every **new installable iOS binary used for acceptance** needs a build number greater than the previously accepted binary. Also exceed every relevant known prepared/built candidate number: never reuse a number for a different binary or lower a version/build. Examples: `0.3.0 (4)`, `0.3.0 (5)`, `0.3.1 (6)`. Reinstalling the identical binary is not a new build. Do not bump again merely for documentation edits before an unbuilt candidate is compiled. If evidence conflicts, report it before choosing a different target.

### Mandatory pre-device gate

Before instructing the owner to build/install, the agent must:

1. Read current semantic app version/build, the last owner-accepted version/build and acceptance scope, relevant native/artifact/archive evidence, and accessible installed metadata if available. Cached artifacts never prove what is installed; do not require a device connection merely for preparation.
2. Identify all included issues and source commits, choose/document None/Patch/Minor/Major impact and candidate grouping, and decide whether the new binary requires another build number. Confirm the source includes each issue and disclose runtime changes since the tested baseline.
3. Prepare authorized tracked version sources and synchronize existing ignored native metadata; verify both. If preparation is not authorized, present the concrete proposed version/build and stop before build instructions.
4. Update CHANGELOG and current verification/release records, run version/footer/config checks, appropriate typecheck/lint and `git diff --check`. Use the established iOS JavaScript export where appropriate; it is not a native build or device acceptance.
5. Confirm schema/API rollout, native Release endpoint and public configuration presence without exposing credentials, ordinary authenticated launch, and applicable Xcode/signing/Pods/Node prerequisites. Tool presence alone does not prove device trust/provisioning.
6. Provide the exact candidate version/build and scoped checklist, then respect the owner's Git and build authorization checkpoints. Never ask the owner to install before completing this gate or resolving its prerequisites.

### Canonical sources and synchronization

`apps/mobile/app.json` owns `expo.version` and string `expo.ios.buildNumber`. The established shared product version convention (including preparation commit `2aa6bc4`) synchronizes **only** these first-party manifests: `package.json`, `apps/api/package.json`, `apps/mobile/package.json`. In `package-lock.json`, update exactly four version values: top-level `version`, `packages[""].version`, `packages["apps/api"].version`, and `packages["apps/mobile"].version`. These private packages are not independently released. Do not bump third-party packages, regenerate resolutions, or use a version command that commits/tags.

Settings/More share `AppVersionFooter`: Expo config supplies the semantic version; `Constants.platform.ios.buildNumber` supplies binary-derived build metadata. Preserve honest Web/development/missing-build fallbacks. Do not add another hardcoded display version or call Web configuration installed-binary evidence.

An existing ignored `apps/mobile/ios` project is **not** regenerated just because app.json changes. Before building, use [the targeted native synchronization procedure](DEPLOYMENT.md#native-version-synchronization--existing-ios-project). Validate file structures and change only:

| File | Fields |
| --- | --- |
| `apps/mobile/ios/LifeOS/Info.plist` | `CFBundleShortVersionString`, `CFBundleVersion` |
| `apps/mobile/ios/LifeOS.xcodeproj/project.pbxproj` | Debug/Release `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION` |

Read back all values and verify unrelated signing, bundle identifier, provisioning, entitlements, permissions, icons and build settings are preserved. Keep files ignored; never force-add, run `prebuild --clean`, regenerate native directories or install/upgrade Pods to perform a version-only sync. If structures differ or the directory is missing, report the required preparation instead of fabricating it.

## Acceptance and verification records

Every issue verification document involving mobile acceptance must contain this section and keep facts distinct from targets:

```md
## Release candidate

| Field | Value |
| --- | --- |
| SemVer impact | None / Patch / Minor / Major, with reason |
| Candidate version | Chosen version or not yet chosen |
| Candidate iOS build | Chosen build or not yet chosen |
| Version prepared | Yes with date/evidence, or pending |
| Native version synchronized | Yes on identified checkout with fields verified, or pending |
| Physical build installed | Pending, or owner-reported exact version/build and date |
| Owner accepted exact build | Pending, or exact version/build, date and scoped approval |
| Included issues | Issue numbers and source baseline |
```

Before installation use **“Candidate: LifeOS 0.3.0 (4); not installed/accepted.”** Only after actual verification record **“Tested: LifeOS 0.3.0 (4)”**, identifying owner-reported versus independently observed evidence. Record the source used to build; never claim a binary SHA was extracted without evidence. Tie acceptance to that exact installed binary and the issue checklist, not unrelated audits.

**An issue must not move Verify → Done when the physical acceptance binary does not contain that issue's implementation.** An older accepted binary cannot accept newer work. Retries after code changes require a fresh build identity. Prior automated tests remain separate evidence for internal invariants; mocks/exports cannot prove device or production behavior.

Issue Forms collect release impact without demanding a numeric version. Before device verification, reconcile their Release / Build gate: impact reviewed, version/build chosen, tracked sources updated, native fields synchronized, installed, owner accepted, exact accepted build recorded. Check each only when supported; legacy issues need the same gate appended without discarding original requirements.

## Candidate versus publication

A prepared or installed **internal verification candidate** does not imply a tag, GitHub Release, Latest status, TestFlight or App Store publication. The normal LifeOS path remains a locally signed internal iPhone Release installation; do not introduce EAS/OTA/distribution infrastructure implicitly.

Publication is a separate owner-controlled step after documentation approval and the required acceptance. The owner manually creates the annotated tag on the final approved documentation commit. Codex prepares notes but must not create/edit/publish GitHub Releases, including drafts. No automatic tag/release merely because a binary passes. Do not upload binaries, signing materials, profiles or environment files unless separately authorized and appropriate. Preserve historical release entries and label candidate notes unpublished until actual publication is verified.
