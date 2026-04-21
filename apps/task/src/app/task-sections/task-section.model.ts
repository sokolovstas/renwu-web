export interface TaskSectionConfig {
  /** Custom element tag, e.g. `renwu-task-todo` */
  element: string;
  /** Optional sort order (ascending). Default 0. */
  order?: number;
  /** Tailwind / CSS classes for the wrapper grid cell (e.g. `col-span-2`). */
  wrapperClass?: string | string[] | Record<string, boolean>;
}

export interface TaskLayoutConfig {
  sections: TaskSectionConfig[];
}
