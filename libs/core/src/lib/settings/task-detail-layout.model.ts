/**
 * Keys for main form rows on the task detail screen (excluding title).
 * Visibility is per project (`container.id`) in the user profile.
 */
export const TASK_DETAIL_FORM_FIELD_KEYS = [
  'container',
  'milestones',
  'type',
  'priority',
  'status',
  'affected_versions',
  'assignes',
  'estimated_time',
  'watchers',
  'labels',
  'comments',
] as const;

export type TaskDetailFormFieldKey =
  (typeof TASK_DETAIL_FORM_FIELD_KEYS)[number];

/** Custom blocks from task.json use `section:<element tag>`. */
export type TaskDetailLayoutFieldKey =
  | TaskDetailFormFieldKey
  | `section:${string}`;

export function taskDetailSectionFieldKey(
  elementTag: string,
): TaskDetailLayoutFieldKey {
  return `section:${elementTag}`;
}
