# LifeOS GitHub Development Standard

LifeOS follows Oz GitHub Development Standard v1 for Issues, Project workflow, priority, and releases. This document describes how the standard is applied in this repository.

## Status workflow

GitHub Project Status is the source of truth for workflow state:

```text
Backlog → Ready → In Progress → Verify → Done
```

- **Backlog:** Captured work that is not currently planned for active implementation.
- **Ready:** Defined, prioritized, and ready to be started.
- **In Progress:** Currently being implemented.
- **Verify:** Implementation is complete and awaiting verification.
- **Done:** Completed and verified.

New Issues enter Backlog. Moving work through Ready, In Progress, and Verify is a deliberate development decision. Closing an Issue moves it to Done; reopened work is reviewed and moved manually when native automation is unavailable.

## Priority

Priority lives in the LifeOS Development Project, not repository labels:

- **P0 — Critical:** Immediate intervention for an outage, data-loss or corruption risk, or an equivalent critical problem.
- **P1 — High:** Important work that should be among the next items addressed.
- **P2 — Medium:** Normal planned development work and the default priority.
- **P3 — Low:** Nice-to-have work or something that can reasonably wait.

## Labels

Use at most one primary type label per Issue:

- `bug`
- `feature`
- `enhancement`
- `chore`
- `documentation`

The durable LifeOS scope labels are `mobile` and `api`; both may apply to cross-cutting work. The `ux` label may remain as useful secondary context, but it does not replace a primary type. Meta labels are `duplicate`, `invalid`, and `wontfix`.

Status and Priority must not be represented by labels. Multiple scope or secondary-context labels may apply when they add useful information.

## Default Project views

- `Development` — Board grouped by Status, used for daily flow.
- `All work` — Table used for inspection and editing.

Preferred Development card fields are Priority, Labels, and Assignees. Additional views should be added only when a demonstrated need justifies them.

## Issue lifecycle

Use the Bug, Feature, Enhancement, or Chore Issue Form. Apply the appropriate `mobile` or `api` scope when known, define the work clearly, set Priority in the Project, and move Status deliberately as implementation progresses. Closing an Issue represents completed work; `Verify` is used when implementation is complete but verification remains.

## Release policy

LifeOS versions use Semantic Versioning with a leading `v`:

- `vMAJOR.MINOR.PATCH`
- `vMAJOR.MINOR.PATCH-alpha.N`
- `vMAJOR.MINOR.PATCH-beta.N`

A GitHub Release represents a meaningful published version and is authoritative for the released version. A Git tag by itself is not a published release. Generated release notes group changes by canonical type labels and exclude `duplicate`, `invalid`, and `wontfix` items.

### Owner-controlled publication

Codex prepares and verifies release documentation only. It must not create or publish GitHub Releases, including drafts, or edit an existing Release. The owner creates Git tags manually only after all documentation, including `CHANGELOG.md`, is complete, approved, and committed. The release tag must target the final approved documentation commit, including any final release-note corrections; Codex must not create or guess a future commit SHA.

The owner performs Git state-changing operations and GitHub publication. Release readiness and internal-device acceptance do not imply GitHub publication. For v0.2.1, use a normal non-prerelease Release marked Latest at publication, as specified in [the publication handoff](release-0.2.1-verification.md#owner-publication-settings-and-stop-point).
