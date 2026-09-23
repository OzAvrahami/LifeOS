# Issue #9 — Task importance decision

## Decision — 2026-09-23

Choose **Option B: optional Important flag**, retaining the existing `priority: normal | important`, default `normal`. The owner explicitly approved this decision on **2026-09-23**. #9 remains Open / Verify / P2 — Medium until the owner Git checkpoint records the decision; no closure is performed during candidate preparation. A Task is a concrete completable action. Important means an explicit, enduring user flag that the action matters; it is optional planning context, not a rank, urgency, a scheduling instruction or an AI recommendation. No additional priority levels or automatic importance inference.

| Concept | Meaning / effect |
| --- | --- |
| Task importance | Optional normal/important flag, independent of placement and lifecycle |
| Weekly Focus | Outcome/direction for one account/week; not automatically a Task or important Task |
| Daily selection | An explicit existing Task chosen for the day via DailyPlan; not a change to importance |
| Scheduling | Task plannedDate/week placement, changed only by deliberate planning actions |
| Deadline | dueDate; may indicate urgency independently of importance |
| Reminder | Explicit Task reminder instant; importance/Focus selection never creates or changes it |

## Implications and alternatives

- **Quick Capture:** keep title-first capture and optional existing placement controls. No importance question or new default; omission remains normal. Option A would discard an already persisted useful optional flag; Option C adds unsupported levels and maintenance without current product value.
- **Task details/edit:** the API can create/update the flag; current shared Task Details does not expose importance editing. A simple explicit toggle/readback could be a separately selected implementation follow-up, not part of this product-decision issue. Do not imply this control already exists. Do not add sorting/filtering or mandatory metadata here.
- **Weekly Planning:** choose up to three Weekly Focus directions independently of Tasks. Saving a Focus neither creates Tasks nor changes Task importance/placement. Sharing a WeekPlan owner is not a Focus-to-Task link. Explicit capture from a Focus creates an ordinary independent Task only after Save, with user-selected placement.
- **Daily Planning:** existing daily selection is independent of importance; full intentional Daily Planning remains #5. Importance may inform a future suggestion, never silently select or schedule a Task. Do not promise #5 is implemented.
- **Future notifications:** keep opt-in intent. Neither important, a deadline, a Focus nor daily selection authorizes an inferred notification time. Existing #1 Task/Commitment/Weekly reminder semantics are unchanged.
- **Scale/maintenance:** no automatic ranking, expiry or escalation. A stale important flag remains user intent until explicitly changed. It must never monopolize a day's plan or masquerade as a system recommendation.

## Inspected implementation and wording

Baseline `ce113fb` on clean main, matching the local origin/main reference. `tasks_priority_check` in `20260813180329_create_task_foundation.sql` restricts normal/important and defaults normal. API `task.types.ts`, validation and `TaskService.create/update` preserve this independent optional field; mobile Task types mirror it. Capture omits priority. Planning persistence writes WeeklyFocus/WeekPlan or DailyPlan, not inferred Task priority. Existing task move/history tests cover field preservation. Notification reconciliation uses explicit reminder intent, not importance.

At baseline the misleading “משימה חשובה מהשבוע” survived only in Today development fixtures; authenticated Today already excluded it (#8). #2 corrects that preview wording and the preview Focus-as-schedule presentation. Authenticated WeeklyFocusEditor already describes a direction, not a Task/day assignment. Today’s daily Task selection now identifies why the real Task is shown. The preview-only “חשוב” badge denotes a demo Task flag, not Weekly Focus. No production data was inspected or cleaned.

## Acceptance / release impact

All #9 decision criteria are addressed by the table and implications above before #2 code changes. No new priority UI, schema, API or notification behavior is implemented. Owner acceptance covers the written product decision only: optional normal/important, independent Weekly Focus/daily selection/scheduling/deadlines/reminders, lightweight Quick Capture, and no new importance control. It does not accept #2 software on a physical device. No physical test is required solely for this decision. #2's affected mobile copy/actions need their own automated and eventual physical acceptance. Documentation alone has no SemVer bump; grouping and candidate preparation follow [Development Workflow](DEVELOPMENT_WORKFLOW.md). The owner subsequently authorized local preparation of **0.4.1 (8)** for #2 plus this accepted decision, recorded in [the candidate record](release-0.4.1-verification.md). No build, installation, commit, push or publication is authorized in this preparation step.
