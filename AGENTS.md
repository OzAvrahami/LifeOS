# LifeOS agent execution contract

- Read [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md), the canonical workflow, before work. Read the GitHub issue and all comments, current implementation/tests and verification evidence before implementation.
- Inspect Git status, HEAD, branch and remote relationship. Inventory/preserve pre-existing owner work, ignored native/environment files, unrelated issues and metadata. Never silently reset, overwrite or change branches.
- Manage only the existing LifeOS Development Project #2 item Status and corresponding issue state within the authorized scope. Preserve priorities, labels, assignees, milestones and membership; read back every write. Do not create duplicates.
- Move to In Progress when implementation is active; Verify only when full software scope and automated gates pass; Done/close only when full required acceptance and issue-specific gates pass. Partial work cannot advance a broader issue.
- Before the owner Git checkpoint, report files changed, exact tests, Git status, HEAD, blockers and checkpoint readiness. Staging, commits, pushes, fetches, branch/history operations, tags, deployments and version changes require authorization; never commit/push automatically. Codex must not create/edit/publish GitHub Releases, including drafts.

## Mobile release gate

For every change affecting installable mobile behavior, automatically follow the workflow's pre-device gate, even for “build it on the iPhone” or “let's verify it”:

- Review SemVer impact, current version/build, last owner-accepted binary and relevant prepared/built artifacts.
- Related issues may share one candidate semantic version. Every new iOS acceptance binary needs a higher build number than the last accepted binary and relevant known candidates; never reuse a number for a changed binary.
- Prepare authorized canonical tracked version sources, preserve dependency resolutions, and synchronize existing ignored native iOS version fields before building. Never force-add native files.
- Update CHANGELOG/current records and each mobile verification document's **Release candidate** section. Validate version/footer/config consistency and other required gates.
- State the exact candidate and, after verification, exact tested/accepted version/build in the handoff. Never claim installation or acceptance from config/mocks.

**Never ask the owner to build/install before performing this gate. An issue cannot move Verify → Done based on a binary that predates its implementation.** Publication is separate; do not create tags without explicit authorization.

## Schema-dependent changes

Follow the canonical database/API order: local implementation and disposable DB/RLS verification → local Git checkpoint → inspect remote pending migrations and dry run → explicitly authorized schema application and history verification → API push/deployment verification → mobile candidate. Hold deployment-triggering pushes until required schema exists. Production mutations require explicit owner authorization; never expose credentials or use production to bypass local verification.
