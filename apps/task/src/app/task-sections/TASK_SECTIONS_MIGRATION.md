# Task Sections Migration Plan

## Scope

Migrate and complete behavior for:

- `renwu-task-related`
- `renwu-task-sub-task`
- `renwu-task-attachments`
- `renwu-task-time-log`
- `renwu-task-history`

Related i18n keys:

- `task.related`, `task.related-add-placeholder`, `task.related-empty`
- `task.subtask`, `task.subtask-empty`, `task.subtask-decomposite`, `task.subtask-decomposite-*` (modal)
- `task.attachments`, `task.attachments-empty`
- `task.timelog`, `task.time-log-total`, `task.time-log-completion`, `task.time-log-duration`, `task.time-log-comment`, `task.time-log-empty`
- `task.history`, `task.history-empty`

## Current State

- Section registration exists via `register-task-section-elements.ts`.
- Section order exists in `apps/task/src/assets/task.json` (mirrored under `apps/app/src/assets/task.json` for the federated shell).
- Task detail shell loads `task.json`, registers matching custom elements, and filters sections plus main form rows using per-project visibility in the user profile (`task_detail_hidden_by_container`).
- Components are present and connected to `RwIssueService` / `RwDataService`.
- Some UX states are incomplete vs expected legacy behavior (empty/loading/error/new-issue handling and consistency between sections).
- Legacy reference is available at `apps/old/src/app/issue`.

## Legacy Baseline (Source of Truth)

Baseline files used for migration decisions:

- Related: `apps/old/src/app/issue/detail/related`
- Subtasks (legacy name "Childs"): `apps/old/src/app/issue/detail/implemented`
- Attachments: `apps/old/src/app/issue/detail/attachment`
- Time log modal + side summary: `apps/old/src/app/issue/timelog` and `apps/old/src/app/issue/detail/time-tracking`
- History modal: `apps/old/src/app/issue/history`

Behavior observed in legacy implementation:

1. **Related**
   - Section is editable only when user can edit issue and issue is persisted (not `new`).
   - Remove action is confirm-based.
   - Section renders issue link and status for each related item.
   - Empty list has no explicit text placeholder in legacy UI.

2. **Subtasks**
   - Legacy section is named "Childs" and backed by `getChildIssues(issue.id)`.
   - Includes progress/status visualization (`IssueStatusBar`) when children exist.
   - Remove child-parent link is confirm-based and persisted through save calls.
   - Empty list has no explicit text placeholder in legacy UI.
   - Legacy **Decomposite** modal (`apps/old/.../decomposite`) creates multiple children in one flow from titles, cloning optional to-dos/description from the parent.

3. **Attachments**
   - Upload is available only for editable issues.
   - Attachments are split into two groups: images and non-images.
   - Supports open/download/delete, post-to-messages, and copy-markdown link.
   - Delete action is confirm-based (different endpoint for unsaved/saved flow).
   - Collapsible list when attachments exist.

4. **Time Log**
   - Primary action is modal-driven logging flow.
   - Side panel shows aggregated `time_logged` and allows opening editor for existing logs.
   - "Log time" is disabled for `new` issues and for parent issues with child tasks.
   - Completion in modal is coupled with status transitions (`completed/closed` semantics).

5. **History**
   - Legacy history is modal-based (`getIssueEvents(issueId)`), rendered as event list.
   - No explicit empty placeholder in modal template.

## Requirements (Implementation Contract)

1. **New Issue Guard**
   - For sections requiring persisted issue ID (related add, attachments upload/delete, timelog add), show save-first hint and block mutating actions.

2. **Empty States**
   - Every section must have deterministic empty state in new Task UI (explicit improvement over legacy):
     - related: `task.related-empty`
     - subtask: `task.subtask-empty`
     - attachments: `task.attachments-empty`
     - timelog: `task.time-log-empty`
     - history: `task.history-empty`

3. **Data/Loading/Error Behavior**
   - Never break rendering on backend errors.
   - Fallback to empty arrays/null-safe values and keep UI interactive where possible.

4. **Time Log Defaults**
   - Add form defaults:
     - duration = `3600` seconds (`1 hour`)
     - comment = empty string
   - Summary must always render stable values:
     - total defaults to `0` (or display placeholder if product requires)
     - completion summary defaults to `95` when absent (matches legacy “reopen / in-progress” display baseline); API payloads still use the issue’s actual `completion` field when present.

5. **I18n Completeness**
   - Required keys must exist in `en.vendor.json`, `ru.vendor.json`, `zh.vendor.json` and source bundle.
   - No hardcoded human text in templates.
   - **Federated shell rule**: when Task runs inside `apps/app`, Transloco loads `apps/app/src/i18n/*.vendor.json` only — the `task` namespace must exist there (keep in sync with `apps/task/src/i18n/*.vendor.json`), otherwise `task.*` keys render as missing.

6. **State Sync**
   - After successful mutations, sync `issueForm` and previous state via `RwIssueService` (`patchIssue`, `setPrevState`) to avoid stale sections.

7. **Backward Compatibility**
   - Keep API payload format compatible with existing backend endpoints used by `RwDataService`.
   - Preserve legacy gating rules:
     - block log time for `new` issues,
     - keep mutate actions behind edit permissions,
     - keep child-issue fetch and event history fetch contract unchanged.

8. **Documented Deviations from Legacy (Intentional)**
   - New Task UI uses inline sections instead of legacy modal-centric UX for time log/history.
   - New Task UI introduces explicit empty placeholders where legacy sections were silent.
   - Decomposite is opened from the Subtasks section toolbar (list icon) rather than only from legacy issue chrome; per-row project/skill pickers remain omitted (legacy UI had those selects commented out).
   - Complex legacy attachment utilities (post to messages, markdown copy, image viewer) are treated as optional parity extensions and can ship in follow-up phases.

## Iterative Delivery Plan

## Migration Board (Live)

- `related`: in progress
  - done: add/remove logic, duplicate/self/not-found guards, permission gate, unlink confirm, status badge, Jest coverage for save-first / no-edit / duplicate / self / not-found / success add, confirm dismiss/accept on remove (`related.component.spec.ts`)
  - pending: shallow DOM / `IssueHref` integration if product wants template-level assertions
- `sub-task`: in progress
  - done: load by `getChildIssues`, empty/save-first states, text progress, status bar + child status, unlink child (confirm + `saveIssue` + reload parent + refresh list), permission gate on unlink, **add subtask** (icon opens shell `task/new` + `RwIssueService.updateFromTemplate` with `links.parent` from current issue; toast if no `container`), **Decomposite** (list icon → `TaskDecompositeModalComponent`: template from `RwContainerService.getIssueTemplate`, sequential `RwDataService.addIssue`, optional clone to-dos/description, `afterCreate` refreshes parent + child list), shared `parentIssueToLink` helper, i18n `task.subtask-decomposite*` in task + app vendors, Jest for addChild + unlink/load (`sub-task.component.spec.ts`)
  - pending: richer row fields (per-row project/skill like partially commented legacy), milestones on batch create
- `attachments`: in progress
  - done: upload/remove sync, save-first state, permission gate, delete confirm, error toasts, image vs file grouping, collapsible list, explicit download link
  - pending: markdown/post-to-messages, image viewer parity
- `time-log`: in progress
  - done: add flow, default duration/comment, total placeholder, 95% fallback display, parent-child guard, duration validation, error handling, modal editor for existing logs (24h / admin rules, save + patch + prev state)
  - pending: elapsed-time prompt parity, status-coupled completion edge cases
- `history`: in progress
  - done: fetch + sort + fallback, inline rendering, event normalization for id/source parity, unit tests for `_id`→`id`, source strip, and descending sort
  - pending: component-level integration spec with mocked `getIssueEvents`

## Definition of Done (Per Section)

- UI labels resolved in host shell (`apps/app` i18n) and remote app (`apps/task` i18n).
- New issue guard + permission gate on mutating actions.
- Backend failures handled without section crash.
- Section spec covers happy path + key guard/error states.
- No lint errors in touched files.

### Phase 0 - Baseline (this commit)

- Add migration requirements and phased checklist.
- Confirmed and documented legacy baseline from `apps/old/src/app/issue`.

### Phase 1 - Related/Subtask UX parity

- Normalize empty/new/error states.
- Validate duplicate/self key checks and success flow.
- Add/adjust tests for add/remove and empty state rendering.
- Sub-task: regression tests for list load (new vs persisted), API error fallback to empty child list, and unlink flow (policy, confirm, success, mutation error).
- Sub-task: **Add subtask** action (shell navigation + `updateFromTemplate` parent link); tests for no-container toast, policy gate, and template payload.
- **Jest note:** `@jsverse/transloco` ships ESM that Jest does not transform by default; component specs that pull `TranslocoPipe` should `jest.mock('@jsverse/transloco', …)` using the standalone stubs in `apps/task/src/testing/transloco-stub.ts` (see `related.component.spec.ts`, `sub-task.component.spec.ts`).

### Phase 2 - Attachments parity

- Ensure upload/remove behavior is resilient and reflects latest issue state.
- Add tests for save-first guard and empty state fallback.
- Evaluate feature parity gaps vs legacy:
  - grouped image/non-image rendering,
  - delete confirm flow,
  - post-to-messages / markdown copy (optional follow-up).

### Phase 3 - Time Log parity

- Stabilize summary defaults and add flow.
- Confirm duration display formatting (`1 hour`) and completion behavior.
- Add tests for addLog payload and post-save reset.
- Reconcile legacy constraints:
  - disabled logging for parent issues with childs,
  - completion semantics near close/complete transitions.

### Phase 4 - History parity

- Validate ordering, empty state, and error fallback.
- Add tests for descending event sorting.
- Verify parity with legacy event payload normalization before render.

### Phase 5 - Regression Sweep

- Cross-section integration test in task detail shell.
- Lint/typecheck and manual smoke test against real issue.

## Commit Strategy

1. `docs(task): add task sections migration contract and phased plan`
2. `feat(task-related): align related/subtask behavior with migration contract`
3. `feat(task-attachments): finalize upload/remove UX and state sync`
4. `feat(task-timelog): stabilize summary defaults and add flow`
5. `feat(task-history): finalize events fallback and ordering`
6. `test(task): add regression coverage for task detail sections`

## Open Input Needed

- Confirm parity target for optional legacy features:
  - attachments "post to messages",
  - attachments "copy markdown link",
  - attachments image viewer/edit overlay,
  - timelog modal-specific prompts based on elapsed tracking.
