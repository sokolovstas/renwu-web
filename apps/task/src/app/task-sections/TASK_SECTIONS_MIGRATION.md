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
- `task.subtask`, `task.subtask-empty`
- `task.attachments`, `task.attachments-empty`
- `task.timelog`, `task.time-log-total`, `task.time-log-completion`, `task.time-log-duration`, `task.time-log-comment`, `task.time-log-empty`
- `task.history`, `task.history-empty`

## Current State

- Section registration exists via `register-task-section-elements.ts`.
- Section order exists in `apps/task/src/assets/task.json`.
- Components are present and connected to `RwIssueService` / `RwDataService`.
- Some UX states are incomplete vs expected legacy behavior (empty/loading/error/new-issue handling and consistency between sections).
- Legacy reference path `apps/old/src/app/issue` is not present in current repository snapshot and must be уточнен by branch/tag/path.

## Requirements (Implementation Contract)

1. **New Issue Guard**
   - For sections requiring persisted issue ID (related add, attachments upload/delete, timelog add), show save-first hint and block mutating actions.

2. **Empty States**
   - Every section must have deterministic empty state:
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
     - completion defaults to `0`.

5. **I18n Completeness**
   - Required keys must exist in `en.vendor.json`, `ru.vendor.json`, `zh.vendor.json` and source bundle.
   - No hardcoded human text in templates.

6. **State Sync**
   - After successful mutations, sync `issueForm` and previous state via `RwIssueService` (`patchIssue`, `setPrevState`) to avoid stale sections.

7. **Backward Compatibility**
   - Keep API payload format compatible with existing backend endpoints used by `RwDataService`.

## Iterative Delivery Plan

### Phase 0 - Baseline (this commit)

- Add migration requirements and phased checklist.
- Confirm legacy reference location from product/owner.

### Phase 1 - Related/Subtask UX parity

- Normalize empty/new/error states.
- Validate duplicate/self key checks and success flow.
- Add/adjust tests for add/remove and empty state rendering.

### Phase 2 - Attachments parity

- Ensure upload/remove behavior is resilient and reflects latest issue state.
- Add tests for save-first guard and empty state fallback.

### Phase 3 - Time Log parity

- Stabilize summary defaults and add flow.
- Confirm duration display formatting (`1 hour`) and completion behavior.
- Add tests for addLog payload and post-save reset.

### Phase 4 - History parity

- Validate ordering, empty state, and error fallback.
- Add tests for descending event sorting.

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

- Provide actual legacy source location for comparison:
  - branch/tag/path that contains old `issue` components.
  - or confirmation to treat current behavior + API contract as source of truth.
