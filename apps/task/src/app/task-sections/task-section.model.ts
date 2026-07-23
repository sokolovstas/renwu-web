import { IconName } from '@renwu/components';

export interface TaskSectionConfig {
  /** Custom element tag, e.g. `renwu-task-todo` */
  element: string;
  /** Optional sort order (ascending). Default 0. */
  order?: number;
  /** Tailwind / CSS classes for the wrapper grid cell (e.g. `col-span-2`). */
  wrapperClass?: string | string[] | Record<string, boolean>;
  /** Icon for the section tab strip. */
  icon?: IconName;
  /** i18n key for tab tooltip / layout settings label. */
  titleKey?: string;
}

export interface TaskLayoutConfig {
  sections: TaskSectionConfig[];
}

/** Fallback UI metadata when `task.json` omits icon/titleKey. */
export const TASK_SECTION_META: Record<
  string,
  { icon: IconName; titleKey: string }
> = {
  'renwu-task-description': { icon: 'document', titleKey: 'task.description' },
  'renwu-task-todo': { icon: 'todo', titleKey: 'task.todo' },
  'renwu-task-links': { icon: 'link', titleKey: 'task.links' },
  'renwu-task-related': { icon: 'share', titleKey: 'task.related' },
  'renwu-task-sub-task': { icon: 'list', titleKey: 'task.subtask' },
  'renwu-task-attachments': { icon: 'picture', titleKey: 'task.attachments' },
  'renwu-task-time-log': { icon: 'timelapse', titleKey: 'task.timelog' },
  'renwu-task-history': { icon: 'history', titleKey: 'task.history' },
};

export function resolveSectionMeta(section: TaskSectionConfig): {
  icon: IconName;
  titleKey: string;
} {
  const fallback = TASK_SECTION_META[section.element] ?? {
    icon: 'document' as IconName,
    titleKey: 'task.layout-block',
  };
  return {
    icon: section.icon ?? fallback.icon,
    titleKey: section.titleKey ?? fallback.titleKey,
  };
}
