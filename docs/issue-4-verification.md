# Issue #4 — Week/day navigation verification

## Release candidate

| Field | Value |
| --- | --- |
| SemVer impact | Minor — new Weekly Planning and Week/day capabilities |
| Candidate/accepted version | 0.3.0 |
| Accepted iOS build | 4 |
| Version prepared | Yes — tracked app/root/API/Mobile and lockfile metadata synchronized on 2026-09-13 |
| Native version synchronized | Yes — this Mac's ignored Info.plist and Debug/Release project fields verified as 0.3.0 / 4 |
| Physical build installed | Yes — owner reports installed LifeOS 0.3.0 (4), visibly confirmed |
| Owner accepted exact build | Yes — LifeOS 0.3.0 (4), owner-reported physical iPhone verification |
| Owner acceptance date | 2026-09-13 |
| Published release | [v0.3.0](https://github.com/OzAvrahami/LifeOS/releases/tag/v0.3.0) |
| Published | 2026-09-13 |
| Accepted binary | 0.3.0 (4) |
| Included issues | #3, #4; preparation `e1a3470`, containing implementation `286cec4` / `7785381` |

Both issues are **Closed / Completed / Done / P1 — High**, read back after finalization. The owner explicitly confirmed the remaining #3/#4 physical scenarios were satisfactory on **LifeOS 0.3.0 (4)** on **2026-09-13**. [Final acceptance comment](https://github.com/OzAvrahami/LifeOS/issues/4#issuecomment-5655480067). This is owner-reported acceptance, not independent Codex observation or extraction of the binary's source SHA.

Production readiness was already verified before the physical test, as confirmed in the owner's handoff: remote migration `20260913120000` applied and candidate Railway API deployment successful. No remote operation was repeated here. Prior automated/component/API and local PostgreSQL/Auth/RLS results remain separate evidence for internal invariants; no new instrumented production/history/RLS or full accessibility audit is claimed. See [release acceptance and publication state](release-0.3.0-verification.md). Published in **v0.3.0** on **2026-09-13**, with annotated tag target `cefd84a6d8e21c631bc666d49d20ac91ccce2657`. Later documentation reconciliation does not alter the tag or owner-acceptance attribution; the issue has no remaining acceptance/publication gate.

## Historical implementation baseline and scope — 2026-09-10

Started from clean `main` at `c5443a01c8b8a73b153bfc4e72532609049e8e13` after reading `git status`, the latest commit, repository instructions, the full issue/comments, existing Week code/tests, and Task/Commitment editing and cache flows. Only the existing #4 Project item was moved from Ready to In Progress, then read back as Open / In Progress / P1 — High. The original approved task/commitment scope is preserved.

This implementation is **unreleased**. Installed, owner-accepted 0.2.1/build 3 and its published tag are unchanged. Existing #7/#8/#10 and #11–#13 acceptance is preserved, not extended to #4. No device observation, native compilation/installation, production-data mutation, API deployment, or release operation was performed.

## Implemented behavior and decisions

- `server-week-screen.tsx` owns an explicit calendar-date anchor and focused-day state within the existing Week route. Task ranges, week-only Tasks, commitments, Weekly Focus, seven day keys, and the visible date range all derive from the selected week. Account timezone determines Today; configured week start determines boundaries. Date-only values stay on the existing `YYYY-MM-DD` model.
- `week-navigation.tsx` supplies labeled Hebrew RTL previous/next/current controls with minimum 48-point targets. Day navigation crosses week/month/year boundaries, and returning to Week uses the inspected date's week. Selection lasts within the mounted Week experience; it is not a new persisted user setting or a promise of restoration after leaving/relaunching the app.
- `week-day-view.tsx` provides compact day cards and full day contents. The unchanged `week-aggregation.ts` supplies the exact same active Task set to both. Open/in-progress Tasks count; completed Tasks appear separately; cancelled Tasks remain excluded by the existing lifecycle/query rules. Null estimates add no invented time. Weekly Focus and commitments never count as Tasks.
- Task estimated time has its own label, separate from commitment counts and actual clock times. Compact previews show up to two Tasks and two commitments plus remaining counts. The opened day shows every applicable item. Commitments sort by actual start time and show an end only when supplied; no occupied-time total or artificial end/duration is introduced. Commitment-only days do not appear empty/free.
- Task inspection exposes title, estimate, planning date, optional deadline, and lifecycle state. It reuses the existing title-only editor and shared date selection, with completion/reopen and confirmed soft deletion through existing Task mutation hooks. It does not claim the lightweight Inbox editor is a complete Task detail model or introduce #16 description editing. A planning move sends only `planning`, preserving unrelated fields through the existing API contract.
- Commitments reuse `CommitmentEditor` for detail/edit/create/delete. Task and commitment forms return to the source inspected date after a move, so the user can inspect its updated membership and navigate to the destination. All list data stays in existing account-scoped query caches; no parallel Task/Commitment store was added.
- Day Add Task opens the existing capture form with the exact selected date already chosen; Add Commitment defaults its existing editor to that date. Global capture still defaults to Inbox. The explicit “השבוע המוצג” destination and Weekly Focus editing use the selected week; explicit Today actions still mean the actual settings-aware Today.
- Server and preview rendering are separated. Authenticated Week uses API hooks, never the demo planning wizard/fixtures. Loading/errors are visible; failed settings/data hydration is not presented as a fabricated empty day. The existing preview fixtures remain available as historical preview behavior, not verification of the new authenticated path.

## Automated verification

Final results on 2026-09-10:

| Command/check | Result |
| --- | --- |
| Focused command below | **12 suites, 92 tests passed**, no failures/skips. |
| `npm run test --workspace @lifeos/mobile` | **39 suites, 240 tests passed, 1 existing Android-only skip** (241 total); no failures. |
| `npm run test --workspace @lifeos/mobile -- --config jest.commitment-android.config.js` | **2 suites, 11 tests passed**, 9 complementary iOS-only exclusions. |
| `npm run test --workspace @lifeos/mobile -- --config jest.task-date-android.config.js` | **1 suite, 3 tests passed**, no failures/skips. Covers the native-date case excluded from the default iOS run. |
| `npm run typecheck` | Passed for both API and Mobile. |
| `npm run lint` | Passed for both API and Mobile. |
| iOS JavaScript export below | Passed; one Hermes bundle and metadata written outside the checkout. No native compilation or installation. |
| Local Markdown file/anchor check | Passed for all 22 local links in the five changed documentation files. |
| `git diff --check` | Passed. |

```sh
npm run test --workspace @lifeos/mobile -- --runTestsByPath \
  __tests__/week-navigation-test.tsx __tests__/week-screen-test.tsx \
  __tests__/week-aggregation-test.ts __tests__/weekly-focus-screen-test.tsx \
  __tests__/settings-product-integration-test.tsx __tests__/commitment-screen-test.tsx \
  __tests__/task-query-cache-test.tsx __tests__/commitment-query-cache-test.tsx \
  __tests__/planning-query-cache-test.tsx __tests__/task-request-audit-test.tsx \
  __tests__/task-date-capture-test.tsx __tests__/task-server-flow-test.tsx
```

Bundling smoke, run from `apps/mobile` using non-service placeholders and without loading environment files:

```sh
EXPO_NO_DOTENV=1 \
EXPO_PUBLIC_API_URL=https://example.invalid \
EXPO_PUBLIC_SUPABASE_URL=https://example.invalid \
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=export-check \
../../node_modules/.bin/expo export --platform ios \
  --output-dir /tmp/lifeos-issue4-ios-export
```

These placeholders are process-local bundling inputs, not a runtime API verification or persistent override. No development service was started or stopped.

The new integration suite uses real Week components and query/mutation/cache hooks with API boundaries replaced by isolated in-memory records. It covers selected ranges/queries and focus writes, non-default week start and timezone, all four day-content combinations, ordering/no-end commitments, estimated/unestimated and completed/cancelled Tasks, no focus/fixture leakage, day boundaries/return context, create/title edit/date cancellation/failure retry, completion/reopen/delete, and Task/Commitment moves into a previously cached destination week without duplicates. A delayed previous-week response cannot appear under the newly selected week. Global Inbox capture and explicitly selected-week capture are tested separately.

Existing aggregation, task flow, settings, commitment, capture, and cache assertions are retained. Older summary assertions now include the explicit task-time label; affected server harnesses supply account settings rather than depending on a failed network/settings fallback. No timeout was raised, no assertion weakened, and no new skip or snapshot was introduced. An initial full run overlapped bundling and timed out in existing suites; subsequent isolated runs are recorded separately as the final results.

Mocks establish software/query/cache behavior, not real database persistence, RLS, native gesture rendering, device accessibility, or provider deployment. API implementation is unchanged; no new API-suite or production-data run is claimed.

## Physical-iPhone owner checklist

**Owner-reported acceptance completed on 2026-09-13, LifeOS 0.3.0 (4).** The owner confirmed the remaining scenarios below were satisfactory after production prerequisites were verified. Checked items record that scoped approval; exact IDs, cache/atomicity/RLS invariants rely on the existing automated evidence, not an owner database inspection. Hebrew RTL/touch acceptance is not a full accessibility audit.

- [x] In Hebrew RTL, browse previous/next weeks and return using “השבוע הזה”. Check the visible range, subtle Today/current-week indication, and actual changing content. With a configured Monday week start, confirm all seven dates and the range follow it.
- [x] Open days containing only Tasks, only commitments, both, and neither. Check titles, separate counts, explicit Task estimates/missing estimates, and complete lists. Include at least three commitments in time order and one without an end; include completed Tasks separately from active totals. A known 45m + 30m + unestimated active set should remain three Tasks / 1:15, without counting Weekly Focus.
- [x] Navigate previous/next day across a week and month/year boundary, return to Today, and return to Week. Open and cancel Task/Commitment details and confirm the selected date/week survives.
- [x] From a browsed day, create one disposable Task and one commitment using the separate actions; verify default and saved dates. Global capture still defaults to Inbox; explicit “השבוע המוצג” capture appears in the browsed week's unscheduled list.
- [x] Edit a Task title, cancel a date change, move it to another week, complete/reopen it, and confirm deletion only on the disposable record. Inspect source and destination summaries/lists: one identity, no visible duplicate/stale membership, active totals consistent with the lists. Existing deadline/estimate/status behavior must be preserved by planning-only moves.
- [x] Edit/move a disposable commitment between dates/weeks and check both memberships; create/delete and cancel the existing editor without losing the inspected date. Actual start/end presentation must remain correct and commitments must have no Task completion action.
- [x] Edit/save/reopen/cancel Weekly Focus in a future week; check that returning to the current week shows its own focuses and that neither week's Task counts include them. Schedule a week-only Task and confirm its date membership.
- [x] Save/reopen the app and inspect the changed records again in their saved dates/weeks. Confirm authenticated freshness/persistence and comfortable iPhone scrolling, keyboard/form access, and touch targets. Selection itself is not promised across app relaunch; navigate back to the saved date to inspect persistence.

This completes targeted acceptance of the new Week entry points and context without reopening accepted #7/#8/#10/#11–#13 or implying a full accessibility/database audit. The old known-estimate fixture prerequisite belonged to preparation; the owner has now accepted the remaining scenarios, without claiming a new estimate-editing UI.

## Historical workflow handoff — 2026-09-10

[Verification handoff comment](https://github.com/OzAvrahami/LifeOS/issues/4#issuecomment-5616279054) was posted once and read back. After all software checks passed, the existing #4 item was moved from In Progress to **Verify** and read back as **Open / Verify / P1 — High**. Physical-iPhone owner acceptance is the remaining completion gate. No acceptance checkbox or original requirement was removed or marked complete. All implementation/documentation changes remain for owner review. No staging, commit, push, branch change, tag, release, deployment, version/dependency/native/environment change, or next issue is included.

The implementation checkpoint was subsequently committed/pushed at `7785381` and is included in `286cec4`. The current Release candidate section supersedes the historical uncommitted/version statements above; the original automated and acceptance evidence is preserved.
