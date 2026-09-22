# LifeOS 0.4.0 (7) — owner-accepted; publication prepared

## Release identity — 2026-09-22

| Field | Recorded value |
| --- | --- |
| Product version / accepted iOS build | **LifeOS 0.4.0 (7)** |
| Proposed release title | LifeOS v0.4.0 — Notifications |
| Publication state | **PREPARED / NOT YET PUBLISHED** |
| Latest published GitHub Release | [v0.3.0](https://github.com/OzAvrahami/LifeOS/releases/tag/v0.3.0), verified during finalization |
| Source before final acceptance-documentation commit | `c99ef3f402687befc37d252d246634dae5ede27a` — `feat(notifications): add commitment reminders and task details access` |
| Included issue | [#1 Notifications MVP](https://github.com/OzAvrahami/LifeOS/issues/1): Closed / Completed / Done / P2 — Medium |
| Accepted device/date | Owner's iPhone 17 Pro Max; **2026-09-22** |
| Distribution | Locally signed internal iPhone Release; **not App Store/TestFlight** |
| Follow-up exclusions | [#26 explicit/intuitive category controls](https://github.com/OzAvrahami/LifeOS/issues/26), [#27 contextual category details / less clutter](https://github.com/OzAvrahami/LifeOS/issues/27); non-blocking, Open / Backlog / P2 — Medium |

Finalization began from clean `main`, equal to fetched `origin/main` at `c99ef3f`. Its history includes `aba01ce` Notifications MVP and `5d93b92` Xcode 27 compatibility. Changes in this checkpoint are documentation only. No installed-binary source SHA was independently extracted.

No remote v0.4.0 tag was found at inspection; GitHub Latest remains v0.3.0. No tag or GitHub Release is created here. The intended annotated tag must target the **final owner-approved documentation commit after it exists**, not the earlier implementation commit or a guessed future SHA. Release notes are prepared at `/tmp/lifeos-v0.4.0-release-notes.md`, derived from [CHANGELOG](../CHANGELOG.md). The changelog's 2026-09-22 date denotes acceptance, not an invented publication timestamp.

## Owner-reported physical acceptance

The owner reports that **LifeOS 0.4.0 (7)** installed successfully on the physical iPhone 17 Pro Max, launched successfully, and has usable normal visible UI. The owner states the implementation appears to work correctly and **explicitly approves v0.4.0 for release** on 2026-09-22. This is the final accepted internal binary for #1.

[Final acceptance comment](https://github.com/OzAvrahami/LifeOS/issues/1#issuecomment-5775271352) records the decision. Closing #1 triggered the existing Project automation to set Done; readback confirmed Closed / Completed / Done / P2. #26/#27 already had Backlog Project items; only their previously unset priorities were set to P2, with no duplicate membership.

This is owner-reported evidence, not independent Codex device observation. It does **not** establish that every permission, notification delivery, background/closed-app, cold-start, tap, timezone/DST, account-switch or other physical scenario was individually executed. The detailed preparation checklist is retained without mechanically completing its individual boxes. Prior automated/native checks support internal invariants separately; no new instrumented production/RLS/history or accessibility audit is claimed.

The owner accepts #26 and #27 as **non-blocking follow-up UX** beyond v0.4.0. They do not undo #1 acceptance and are not included as implemented features in this release.

## Build history and Xcode compatibility

| Build | Evidence and disposition |
| --- | --- |
| 0.4.0 (5) | Built/installed; immediate native scene-creation / SIGTRAP launch failure under Xcode 27 / iOS 27. **Never accepted.** |
| 0.4.0 (6) | Supported UIScene fix built/installed and survived native startup. Valid startup-compatible candidate, **not failed**; superseded during product acceptance when Task discovery and Commitment reminder gaps were identified. Not accepted. |
| 0.4.0 (7) | Adds the accepted #1 product scope; compiled successfully, subsequently installed/launched by the owner and **accepted for release on 2026-09-22**. |

Expo **57.0.23**, expo-build-properties **57.0.20**, `ios.enableSceneSupport=true`, and Expo Notifications **57.0.12** retain the supported Xcode 27 / iOS 27 lifecycle. Earlier native preparation verified `EXExpoAppSceneDelegate`, AppDelegate factory-provider integration, signing, entitlements and Pods. No SDK, native project or version change is made during this finalization. The previously documented online newer-patch advisory is not reclassified as a passing dependency check. See [the detailed compatibility evidence](issue-1-verification.md#xcode-27-launch-correction--2026-09-22).

## Completed production rollout

The owner confirms SQL from [`20260922120000_add_commitment_reminders.sql`](../supabase/migrations/20260922120000_add_commitment_reminders.sql) was applied to production and migration history reconciled. Owner-verified local/remote history:

```text
20260922120000 | 20260922120000
```

Authenticated GitHub commit-status inspection during this finalization confirms:

| Field | Evidence |
| --- | --- |
| API source | `c99ef3f402687befc37d252d246634dae5ede27a` |
| Context | `LifeOS - @lifeos/api` |
| State | **success** |
| Status updated | `2026-09-22T10:39:33Z` |
| Railway deployment linked by GitHub | `98a21801-a6f1-48cc-8c20-c93769e89a64` |

[GitHub source/status](https://github.com/OzAvrahami/LifeOS/commit/c99ef3f402687befc37d252d246634dae5ede27a) links the successful Railway deployment. Schema application/history is owner-reported; API success is a freshly read GitHub status. This finalization does not inspect Railway's active provider state, apply SQL, retest production writes or access user records. No schema/API rollout or build-7 installation gate remains pending for this accepted release.

## Prior implementation verification

These results were completed before this documentation finalization; feature suites, local integration and native builds were **not rerun** to record approval.

| Check | Recorded result |
| --- | --- |
| Full mobile suite | **47 suites / 310 passed / 1 existing skip**, no failures |
| Full API suite | **11 suites / 86 passed**, no skips/failures |
| Focused notification/footer/discovery | **8 suites / 57 passed**, no skips/failures |
| New York timezone/DST suite | **8 passed** |
| Local PostgreSQL/Auth/RLS integration | **13 PASS groups**, including real constraints, old-client preservation, caller/anonymous isolation and 1,001-row pagination |
| Typecheck / lint | Passed for API and Mobile |
| Expo configuration / iOS export / autolinking | Passed |
| Xcode 27 signed Release compile | **BUILD SUCCEEDED** for 0.4.0 (7) |

Exact implementation commands and evidence boundaries remain in [Issue #1 verification](issue-1-verification.md#prior-build-7-automated-and-native-verification). Task instants, relative Commitment leads, Weekly recurrence, capacity/retry/account cleanup and routing are implemented; mocks/calculation tests do not prove every iOS delivery condition.

## Version and publication boundary

Root/API/Mobile package versions, corresponding lockfile product metadata and Expo version remain **0.4.0**; Expo iOS build remains **"7"**. No runtime code, dependencies, ignored native files or environment settings change. The accepted build is not rebuilt or reinstalled.

[Development Workflow](DEVELOPMENT_WORKFLOW.md) remains authoritative. The owner reviews the final documentation, manually commits/pushes the checkpoint, and separately creates the annotated v0.4.0 tag and GitHub Release. Publication is prepared, not performed. No binary/signing/environment attachments are prepared.

## Acceptance-finalization validation

New checks for this documentation-only checkpoint: `npm run typecheck` and `npm run lint` passed for API and Mobile; `git diff --check`, version/preservation checks and **48 local documentation paths/anchors** passed. The worktree contains only five modified documentation files and this new release record; nothing is staged. Source HEAD and `origin/main` remain `c99ef3f402687befc37d252d246634dae5ede27a`. No new feature-suite, DB integration, Expo export, native compile/install or production operation was needed or performed.

Issue/Project readback verifies #1 Closed / Completed / Done / P2, with all eight Release / Build gate items complete; #26/#27 remain Open / Backlog / P2 with existing membership and unchanged issue bodies/labels/assignees/milestones. Unrelated Project items and fields are unchanged.
