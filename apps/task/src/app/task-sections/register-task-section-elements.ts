import { Injector, Type } from '@angular/core';
import { createCustomElement } from '@angular/elements';

/**
 * Lazy loaders: one chunk per section. Keys must match `element` in `task.json`.
 */
const TASK_SECTION_LOADERS: Record<
  string,
  () => Promise<Type<unknown>>
> = {
  'renwu-task-description': () =>
    import('../description/description.component').then(
      (m) => m.DescriptionComponent,
    ),
  'renwu-task-todo': () =>
    import('../todo/todo.component').then((m) => m.TodoComponent),
  'renwu-task-related': () =>
    import('../related/related.component').then((m) => m.RelatedComponent),
  'renwu-task-links': () =>
    import('../links/links.component').then((m) => m.LinksComponent),
  'renwu-task-attachments': () =>
    import('../attachments/attachments.component').then(
      (m) => m.AttachmentsComponent,
    ),
  'renwu-task-sub-task': () =>
    import('../sub-task/sub-task.component').then((m) => m.SubTaskComponent),
  'renwu-task-time-log': () =>
    import('../time-log/time-log.component').then((m) => m.TimeLogComponent),
  'renwu-task-history': () =>
    import('../history/history.component').then((m) => m.HistoryComponent),
};

/**
 * Defines custom elements for the given section tags (typically from `task.json`).
 * Unknown tags are skipped with a console warning.
 */
export async function registerTaskSectionElements(
  injector: Injector,
  sectionElements: readonly string[],
): Promise<void> {
  const unique = [...new Set(sectionElements)];
  await Promise.all(
    unique.map(async (tag) => {
      const loader = TASK_SECTION_LOADERS[tag];
      if (!loader) {
        console.warn(`[task] Unknown section element "${tag}", skipping.`);
        return;
      }
      if (customElements.get(tag)) {
        return;
      }
      const component = await loader();
      customElements.define(tag, createCustomElement(component, { injector }));
    }),
  );
}
