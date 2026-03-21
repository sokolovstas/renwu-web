# Трекер: шаблоны и NgModule / bootstrap

Документ для **пошагового доведения** шаблонов и фиксации политики по старым модулям. Обновляйте чекбоксы по мере работ; полный инвентарь шаблонов ниже — **справочный** (без чекбокса на каждый файл).

Связано с: [MIGRATION-ANGULAR-21.md](./MIGRATION-ANGULAR-21.md).

---

## Как вести процесс

1. Берёте пункт из **очереди** (разделы с `[ ]`).
2. Делаете PR / коммит, прогоняете `nx run-many -t lint --all` (и при необходимости таргетированный `build` / `test`).
3. Ставите `[x]` и при желании краткую дату или ссылку на коммит в комментарии к PR.

Проверки «на здоровье» для шаблонов:

```bash
# Не должно находить ничего в активном контуре (без apps/old)
rg '\*ng(If|For|Switch)' --glob '*.html' --glob '!apps/old/**'

rg '\*ngTemplateOutlet' --glob '*.html' --glob '!apps/old/**'
```

---

## Политика

### Шаблоны

- **Сделано:** в активном контуре нет `*ngIf` / `*ngFor` / `*ngSwitch*`; используется встроенный control flow (`@if`, `@for`), где уже мигрировали.
- **Дальше:** точечно — `*ngTemplateOutlet`, крупные цепочки `@if` → `@switch`, при необходимости `@defer` / `@let` (без обязательной «миграции всех 116 файлов»).

### NgModule / `AppModule` / bootstrap

- **Сделано:** все перечисленные приложения стартуют через `bootstrapApplication` в `bootstrap.ts`; `main.ts` подключает federation и динамический импорт `bootstrap`.
- **Дальше:** **без массового удаления** `AppModule`. Политика: **новые** компоненты / директивы / пайпы — **standalone** (см. `nx.json`, ESLint `prefer-standalone`). Существующий `app.module.ts` **упрощаем только при касании** файла: убрать дубли с `bootstrap.ts`, вынести оставшиеся куски (например `TranslocoHttpLoader`) в отдельные файлы, не раздувать модуль новыми `declarations`.

---

## 1. Шаблоны — очередь работ

### 1.1 Базовая миграция control flow

- [x] Нет `*ngIf` / `*ngFor` / `*ngSwitch*` в `.html` активного контура (исключая `apps/old/`).

### 1.2 `*ngTemplateOutlet` (явный хвост)

| Файл | Комментарий | Готово |
|------|-------------|--------|
| `libs/components/src/lib/dropdown/dropdown.component.html` | Один outlet; оценить замену на паттерн с `@defer` / проекцией / оставить с обоснованием | [ ] |
| `libs/components/src/lib/select/select.component.html` | Несколько outlet + `context`; высокий риск регрессий — отдельная задача и тесты вручную | [ ] |

### 1.3 `@switch` / уплотнение ветвлений

| Файл | Комментарий | Готово |
|------|-------------|--------|
| `libs/components/src/lib/calendar/calendar.component.html` | Уже используется `@switch (currentState)` | [x] |
| `libs/core/src/lib/issue/history-item/history-item.component.html` | Много `@if (value.type === …)` и `@if (field.field_name === …)` — кандидат на один или два `@switch` + `@default` | [ ] |
| `libs/messaging/src/lib/item/item.component.html` | Ветки по `message.type` разнесены по разметке; `@switch` — по желанию, после ревью | [ ] |

### 1.4 `@defer` и `@let`

- [ ] В репозитории пока нет `@defer` / `@let` в `.html`. Кандидаты подбирать по **тяжёлым** или **редко открываемым** блокам (модалки, второстепенные панели), с проверкой под native federation / бандлинг.

### 1.5 Крупные шаблоны (приоритет ревью, не обязательная миграция)

Упорядочено по размеру (~строки). Исключены `apps/old/`, `styles/`, артефакты `.nx/`.

| Строк (прибл.) | Файл |
|----------------|------|
| ~518 | `libs/core/src/lib/issue/history-item/history-item.component.html` |
| ~355 | `libs/messaging/src/lib/item/item.component.html` |
| ~219 | `apps/task/src/app/detail/detail.component.html` |
| ~210 | `libs/components/src/lib/date-picker/date-picker.component.html` |
| ~184 | `libs/components/src/lib/select/select.component.html` |
| ~160 | `apps/settings/src/app/user/user.component.html` |
| ~146 | `apps/settings/src/app/dictionary/dictionary.component.html` |
| ~145 | `libs/core/src/lib/issue-table/issue-table.component.html` |
| ~128 | `libs/board/src/lib/group/group.component.html` |

### 1.6 Полный инвентарь `.html` (116 файлов, активный контур)

Список сгенерирован из дерева репозитория (`find`, без `node_modules`, `dist`, `.nx`, `apps/old`, `styles`). Используйте как **реестр** при поиске «где ещё трогать шаблон».

- `apps/app/src/app/app.component.html`
- `apps/app/src/app/main/main.component.html`
- `apps/app/src/app/sidebar/sidebar.component.html`
- `apps/app/src/index.html`
- `apps/boards/src/app/board/board.component.html`
- `apps/boards/src/app/main/main.component.html`
- `apps/boards/src/index.html`
- `apps/dashboard/src/app/main/main.component.html`
- `apps/dashboard/src/index.html`
- `apps/documents/src/app/document/document.component.html`
- `apps/documents/src/app/main/main.component.html`
- `apps/documents/src/index.html`
- `apps/messenger/src/app/main/main.component.html`
- `apps/messenger/src/index.html`
- `apps/profile/src/app/main/main.component.html`
- `apps/profile/src/app/notifications/notifications.component.html`
- `apps/profile/src/app/settings/settings.component.html`
- `apps/profile/src/index.html`
- `apps/projects/src/app/activity/activity.component.html`
- `apps/projects/src/app/add-milestone/add-milestone.component.html`
- `apps/projects/src/app/add-project/add-project.component.html`
- `apps/projects/src/app/backlog/backlog.component.html`
- `apps/projects/src/app/detail/detail.component.html`
- `apps/projects/src/app/list/list.component.html`
- `apps/projects/src/app/milestone/milestone.component.html`
- `apps/projects/src/app/milestones/milestones.component.html`
- `apps/projects/src/app/settings/settings.component.html`
- `apps/projects/src/app/summary/summary.component.html`
- `apps/projects/src/app/team/team.component.html`
- `apps/projects/src/app/template/template.component.html`
- `apps/projects/src/index.html`
- `apps/settings/src/app/add-user/add-user.component.html`
- `apps/settings/src/app/calendar/calendar.component.html`
- `apps/settings/src/app/calendars/calendars.component.html`
- `apps/settings/src/app/dictionary/dictionary.component.html`
- `apps/settings/src/app/settings/settings.component.html`
- `apps/settings/src/app/system/system.component.html`
- `apps/settings/src/app/user/user.component.html`
- `apps/settings/src/app/users/users.component.html`
- `apps/settings/src/app/workflow/workflow.component.html`
- `apps/settings/src/app/workflows/workflows.component.html`
- `apps/settings/src/index.html`
- `apps/task/src/app/attachments/attachments.component.html`
- `apps/task/src/app/description/description.component.html`
- `apps/task/src/app/detail/detail.component.html`
- `apps/task/src/app/history/history.component.html`
- `apps/task/src/app/links/links.component.html`
- `apps/task/src/app/related/related.component.html`
- `apps/task/src/app/section-wrapper/section-wrapper.component.html`
- `apps/task/src/app/sub-task/sub-task.component.html`
- `apps/task/src/app/time-log/time-log.component.html`
- `apps/task/src/app/todo/todo.component.html`
- `apps/task/src/index.html`
- `apps/tasks/src/app/list/list.component.html`
- `apps/tasks/src/app/main/main.component.html`
- `apps/tasks/src/app/timeline/timeline.component.html`
- `apps/tasks/src/app/tree/tree.component.html`
- `apps/tasks/src/index.html`
- `apps/timeline/src/app/main/main.component.html`
- `apps/timeline/src/app/timeline/timeline.component.html`
- `apps/timeline/src/index.html`
- `apps/todos/src/app/detail/detail.component.html`
- `apps/todos/src/app/main/main.component.html`
- `apps/todos/src/index.html`
- `libs/app-ui/src/lib/page-with-sidebar/page-with-sidebar.component.html`
- `libs/app-ui/src/lib/page/page.component.html`
- `libs/app-ui/src/lib/tour/tour-hint/tour-hint.component.html`
- `libs/board/src/lib/card/card.component.html`
- `libs/board/src/lib/group/group.component.html`
- `libs/components/src/lib/alert/alert.component.html`
- `libs/components/src/lib/button/button.component.html`
- `libs/components/src/lib/calendar/calendar.component.html`
- `libs/components/src/lib/checkbox/checkbox.component.html`
- `libs/components/src/lib/color-picker/color-picker.component.html`
- `libs/components/src/lib/date-picker/date-picker.component.html`
- `libs/components/src/lib/dropdown/dropdown.component.html`
- `libs/components/src/lib/icon/icon.component.html`
- `libs/components/src/lib/modal/modal/modal.component.html`
- `libs/components/src/lib/pager/pager.component.html`
- `libs/components/src/lib/range/range.component.html`
- `libs/components/src/lib/select-group/select-group.component.html`
- `libs/components/src/lib/select/select.component.html`
- `libs/components/src/lib/switch/switch.component.html`
- `libs/components/src/lib/text-area/text-area.component.html`
- `libs/components/src/lib/text-input/text-input.component.html`
- `libs/components/src/lib/text-with-tooltip/text-with-tooltip.component.html`
- `libs/components/src/lib/time-picker/time-picker.component.html`
- `libs/components/src/lib/toast/toast-container/toast-container.component.html`
- `libs/components/src/lib/toast/toast/toast.component.html`
- `libs/components/src/lib/tooltip/tooltip-container/tooltip-container.component.html`
- `libs/components/src/lib/tooltip/tooltip/tooltip.component.html`
- `libs/core/src/lib/attachment/attachment.component.html`
- `libs/core/src/lib/avatar/avatar.component.html`
- `libs/core/src/lib/counter/counter.component.html`
- `libs/core/src/lib/image-viewer/image-viewer.component.html`
- `libs/core/src/lib/issue-table/header-column/header-column.component.html`
- `libs/core/src/lib/issue-table/issue-table.component.html`
- `libs/core/src/lib/issue-table/list-exporter/list-exporter.component.html`
- `libs/core/src/lib/issue/fields/assignees/assignees.component.html`
- `libs/core/src/lib/issue/fields/icon-warning/icon-warning.component.html`
- `libs/core/src/lib/issue/fields/milestones/milestones.component.html`
- `libs/core/src/lib/issue/fields/priority/priority.component.html`
- `libs/core/src/lib/issue/fields/status/status.component.html`
- `libs/core/src/lib/issue/fields/type/type.component.html`
- `libs/core/src/lib/issue/history-item/history-item.component.html`
- `libs/core/src/lib/issue/href/issue-href.component.html`
- `libs/core/src/lib/mention/mentions-list/mentions-list.component.html`
- `libs/core/src/lib/query-builder/query-builder.component.html`
- `libs/core/src/lib/status-bar/parent-progress-tooltip/parent-progress-tooltip.component.html`
- `libs/core/src/lib/status-bar/status-bar.component.html`
- `libs/messaging/src/lib/destination/destination.component.html`
- `libs/messaging/src/lib/destinations/destinations.component.html`
- `libs/messaging/src/lib/input/input.component.html`
- `libs/messaging/src/lib/item/item.component.html`
- `libs/messaging/src/lib/sub-destinations/sub-destinations.component.html`
- `libs/messaging/src/lib/thread/thread.component.html`

### 1.7 Архив `apps/old/`

Каталог со старыми шаблонами **вне основного контура** линта/сборки Nx. Миграция — только если сознательно возвращаете код в продукт.

---

## 2. NgModule, `AppModule`, bootstrap — реестр

### 2.1 Общая схема (все перечисленные приложения)

| Файл | Роль |
|------|------|
| `apps/<name>/src/main.ts` | `initFederation()` → динамический `import('./bootstrap')` |
| `apps/<name>/src/bootstrap.ts` | `bootstrapApplication(AppComponent, { providers: [...] })` |
| `apps/<name>/src/app/app.module.ts` | Остаточный `NgModule` (часто дублирует импорты/роутер с bootstrap или держит `TranslocoHttpLoader` и т.п.) — **упрощать при касании** |

### 2.2 Чеклист приложений (`AppModule` + входы)

Отметьте `[x]`, когда для приложения **нет смысла держать тяжёлый** `AppModule` (или он сведён к минимуму / удалён), без регрессий.

| Приложение | `app.module.ts` | `bootstrap.ts` | `main.ts` | Готово |
|------------|-----------------|----------------|-----------|--------|
| `app` | `apps/app/src/app/app.module.ts` | `apps/app/src/bootstrap.ts` | `apps/app/src/main.ts` | [ ] |
| `boards` | `apps/boards/src/app/app.module.ts` | `apps/boards/src/bootstrap.ts` | `apps/boards/src/main.ts` | [ ] |
| `dashboard` | `apps/dashboard/src/app/app.module.ts` | `apps/dashboard/src/bootstrap.ts` | `apps/dashboard/src/main.ts` | [ ] |
| `documents` | `apps/documents/src/app/app.module.ts` | `apps/documents/src/bootstrap.ts` | `apps/documents/src/main.ts` | [ ] |
| `messenger` | `apps/messenger/src/app/app.module.ts` | `apps/messenger/src/bootstrap.ts` | `apps/messenger/src/main.ts` | [ ] |
| `profile` | `apps/profile/src/app/app.module.ts` | `apps/profile/src/bootstrap.ts` | `apps/profile/src/main.ts` | [ ] |
| `projects` | `apps/projects/src/app/app.module.ts` | `apps/projects/src/bootstrap.ts` | `apps/projects/src/main.ts` | [ ] |
| `settings` | `apps/settings/src/app/app.module.ts` | `apps/settings/src/bootstrap.ts` | `apps/settings/src/main.ts` | [ ] |
| `task` | `apps/task/src/app/app.module.ts` | `apps/task/src/bootstrap.ts` | `apps/task/src/main.ts` | [ ] |
| `tasks` | `apps/tasks/src/app/app.module.ts` | `apps/tasks/src/bootstrap.ts` | `apps/tasks/src/main.ts` | [ ] |
| `timeline` | `apps/timeline/src/app/app.module.ts` | `apps/timeline/src/bootstrap.ts` | `apps/timeline/src/main.ts` | [ ] |
| `todos` | `apps/todos/src/app/app.module.ts` | `apps/todos/src/bootstrap.ts` | `apps/todos/src/main.ts` | [ ] |

### 2.3 Библиотеки с `NgModule`

| Файл | Комментарий | Готово |
|------|-------------|--------|
| `libs/mentions/src/lib/mentions.module.ts` | Модуль библиотеки; вынос на standalone — **отдельная задача** при рефакторинге mentions | [ ] |

### 2.4 Политика-напоминание (новый код)

- Новые компоненты / директивы / пайпы: **standalone**; не добавлять их в `declarations` существующих `AppModule`, если можно импортировать в родителя или в `bootstrap`/`routes`.
- Новые фичи в приложениях с federation: проверять, что импорты идут через `imports` standalone или через провайдеры в `bootstrap.ts`, а не раздувают легаси-модуль.

---

## 3. Следующий шаг (рекомендация)

1. Закрыть **§1.2** (`dropdown`, `select`) или зафиксировать в таблице решение «оставляем как есть до …».
2. Взять **§1.3** — `history-item` как максимальный выигрыш читаемости от `@switch`.
3. По одному приложению из **§2.2** — при любом изменении `app.module.ts` убрать дубли с `bootstrap.ts` и отметить прогресс чекбоксом.

После крупного изменения пересоберите инвентарь §1.6 командой из блока «Как вести процесс» (или повторите `find` из истории коммита этого файла).
