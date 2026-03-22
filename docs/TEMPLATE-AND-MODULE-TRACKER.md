# Трекер: шаблоны и NgModule / bootstrap

Документ для **пошагового доведения** шаблонов и фиксации политики по старым модулям. Обновляйте чекбоксы по мере работ; полный инвентарь шаблонов ниже — **справочный** (без чекбокса на каждый файл).

Связано с: [MIGRATION-ANGULAR-21.md](./MIGRATION-ANGULAR-21.md).

## Журнал

| Дата | Что сделано |
|------|-------------|
| 2026-03-21 | `history-item`: `@switch (value.type)` + `@switch (field.field_name)` с `@default`; `dashboard`: вынесен `TranslocoHttpLoader` в `transloco-http-loader.ts`, удалён неиспользуемый `app.module.ts`; `MentionsListComponent`: убран `super(elementRef, cd)` после перехода базового класса на `inject()`. |
| 2026-03-21 | **§2 NgModule:** во всех shell-приложениях удалён неиспользуемый `app.module.ts`. Федеративные приложения: `transloco-http-loader.ts` + импорт из `bootstrap.ts`. Shell `app`: плюс `custom-error-handler.ts`, `shell-app-initializers.ts` (логика бывшего конструктора `AppModule` после `bootstrapApplication`). `timeline`: мёртвый `app.module.ts` удалён (bootstrap без transloco, как и раньше). |
| 2026-03-21 | **§2.3 / §1.3:** удалён закомментированный `libs/mentions/.../mentions.module.ts`; `messaging/item`: `@switch (message.type ?? MessageType.REGULAR)` для веток REGULAR / PULSE. **§1.2** (`*ngTemplateOutlet` в `dropdown` / `select`): осознанно **отложено** — нативной замены в control flow нет; трогать только вместе с редизайном или e2e. |
| 2026-03-21 | **§1.2:** `dropdown` / `select` — микросинтаксис `*ngTemplateOutlet` заменён на `[ngTemplateOutlet]` и при необходимости `[ngTemplateOutletContext]`; в активных `.html` `*ngTemplateOutlet` не остаётся. **§1.4:** `select.component.html` — `@let` для `selected` / `emptyItem` в дефолтном шаблоне строки; `@defer (when opened)` только вокруг `.rw-select-options` (поиск и `#input` снаружи — стабильный `ViewChild` и `focusOnInput`); плейсхолдер `.rw-select-defer-placeholder` в `select.component.scss`. |
| 2026-03-21 | **Закрытие очереди шаблонов:** §1.4 без открытых чекбоксов — дальнейший `@defer`/`@let` только по отдельным задачам. **§1.7** зафиксирован как **вне объёма**: `apps/old/` не мигрируем (под переписывание). Инвентарь §1.6 пересчитан: **116** `.html` в активном контуре. |
| 2026-03-21 | **§1.5 → §1.3:** `settings/user.component.html` — действия под формой: `@switch (user.status)` (`DELETED` / `@default`), в `@default` кнопка приглашения только при `PENDING`; используется `user` из внешнего `@if`, без повторных подписок на `editedUser`. |
| 2026-03-21 | **§1.5 (пакет):** `dictionary`: `@let dictName` + `@switch (dictName)` для ветки `'status'` (шапка таблицы, строки, подсказки). `task/detail`: `@let isNew` / `isFavorite`, `@switch (isNew)` для статуса, комментариев и кнопок создания. `date-picker`: один `@if` вместо дублей для `range`, `range && helpers`, четыре кнопки «часы» в одном `@if (showTime)`. `board/group`: `isCardLayoutView()` вместо тройного сравнения `config.view.id` в шаблоне. |
| 2026-03-21 | `query-builder.component.html`: в `#dropdownContent` — `@let multiHint = multipleSelectHint()` вместо двух вызовов сигнала в `@if`. |
| 2026-03-21 | **`history-item` рефактор:** `hasRenderableFieldChanges()` вместо длинного `@if` в `@default`; `@for` по полям с `track $index`; ссылки — `linkChangeRows()` + `@for` (сохранены `field-name` и тексты); убран лишний вывод `getAdded` в `watchers`; `auto_scheduling` — `@switch (!!field.new_value)`. |

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
- **Сделано (§1.2):** в `dropdown` / `select` outlet’ы через `[ngTemplateOutlet]` / context, без `*ngTemplateOutlet` в `.html` активного контура.
- **Сделано (§1.4, старт):** в `rw-select` — `@let` и `@defer` на списке опций (см. журнал).
- **Вне объёма:** `apps/old/` (§1.7) — не мигрируем шаблоны; каталог под переписывание, вне основного контура Nx.
- **Дальше (по желанию):** крупные цепочки `@if` → `@switch`, точечно `@defer` / `@let` на других тяжёлых блоках (без обязательной «миграции всех 116 файлов»).

### NgModule / `AppModule` / bootstrap

- **Сделано:** все перечисленные приложения стартуют через `bootstrapApplication` в `bootstrap.ts`; `main.ts` подключает federation и динамический импорт `bootstrap`.
- **Сделано (shell apps):** файлов `app.module.ts` в приложениях больше нет; загрузчик переводов — `transloco-http-loader.ts`, shell `app` — см. §2.1.
- **Дальше:** **новые** компоненты / директивы / пайпы — **standalone** (см. `nx.json`, ESLint `prefer-standalone`). Новые **`NgModule`** в библиотеках не заводить без необходимости.

---

## 1. Шаблоны — очередь работ

### 1.1 Базовая миграция control flow

- [x] Нет `*ngIf` / `*ngFor` / `*ngSwitch*` в `.html` активного контура (исключая `apps/old/`).

### 1.2 `*ngTemplateOutlet` (явный хвост)

| Файл | Комментарий | Готово |
|------|-------------|--------|
| `libs/components/src/lib/dropdown/dropdown.component.html` | `[ngTemplateOutlet]="dropdownContent"` вместо `*ngTemplateOutlet`. | [x] |
| `libs/components/src/lib/select/select.component.html` | Все outlet’ы: `[ngTemplateOutlet]` + `[ngTemplateOutletContext]="thisContext"` где нужно. | [x] |

### 1.3 `@switch` / уплотнение ветвлений

| Файл | Комментарий | Готово |
|------|-------------|--------|
| `libs/components/src/lib/calendar/calendar.component.html` | Уже используется `@switch (currentState)` | [x] |
| `libs/core/src/lib/issue/history-item/history-item.component.html` | `@switch` по типу и `field_name`; `hasRenderableFieldChanges()`, `linkChangeRows()` + `@for` для links; см. журнал | [x] |
| `libs/messaging/src/lib/item/item.component.html` | `@switch (message.type ?? MessageType.REGULAR)` — `@case` REGULAR (бывший `!type`) и PULSE | [x] |
| `apps/settings/src/app/user/user.component.html` | `@switch (user.status)`: `@case` DELETED (restore), `@default` (delete + `@if` PENDING для invite) | [x] |
| `apps/settings/src/app/dictionary/dictionary.component.html` | `@let dictName`; `@switch (dictName)` / `@case ('status')` вместо трёх однотипных `@if` по имени словаря | [x] |
| `apps/task/src/app/detail/detail.component.html` | `@let isNew`, `isFavorite`; `@switch (isNew)` для выбора статуса и блока комментариев / «Создать» | [x] |
| `libs/components/src/lib/date-picker/date-picker.component.html` | Один `@if` на `range` и на `range && helpers` вместо пар дублей; кнопки «последние N часов» в одном `@if (showTime)` | [x] |
| `libs/board/src/lib/group/group.component.html` | `isCardLayoutView(viewId)` в TS вместо тройного сравнения в шаблоне | [x] |
| `libs/core/src/lib/query-builder/query-builder.component.html` | `@let multiHint` в выпадающем шаблоне подсказок (один сигнал на два `@if`) | [x] |

### 1.4 `@defer` и `@let`

- [x] **`libs/components/src/lib/select/select.component.html`:** `@let` для потоков `selected` / `emptyItem` в дефолтном шаблоне выбранного элемента; `@defer (when opened)` только вокруг `.rw-select-options` (поле поиска и `#input` вне `@defer`, чтобы не ломать фокус и `ViewChild`). Плейсхолдер: класс `.rw-select-defer-placeholder` в `select.component.scss`.

Очередь по §1.4 **исчерпана** для текущего контура: дальнейшее добавление `@defer` / `@let` — только по отдельным задачам (модалки, панели и т.п.), с проверкой под federation и lifecycle DOM.

### 1.5 Крупные шаблоны (приоритет ревью, не обязательная миграция)

Упорядочено по размеру (~строки). Исключены `apps/old/`, `styles/`, артефакты `.nx/`.

| Строк (прибл.) | Файл |
|----------------|------|
| ~421 | `libs/core/src/lib/issue/history-item/history-item.component.html` *(рефактор блока links и условий)* |
| ~355 | `libs/messaging/src/lib/item/item.component.html` |
| ~225 | `apps/task/src/app/detail/detail.component.html` *(§1.3: `@let` + `@switch` по `isNew`)* |
| ~200 | `libs/components/src/lib/date-picker/date-picker.component.html` *(уплотнены дубли `@if` для `range` / helpers / `showTime`)* |
| ~184 | `libs/components/src/lib/select/select.component.html` |
| ~158 | `apps/settings/src/app/user/user.component.html` *(§1.3: `@switch` по `user.status` для кнопок)* |
| ~153 | `apps/settings/src/app/dictionary/dictionary.component.html` *(§1.3: `@let` + `@switch` для `'status'`)* |
| ~145 | `libs/core/src/lib/issue-table/issue-table.component.html` |
| ~124 | `libs/board/src/lib/group/group.component.html` *(`isCardLayoutView` в TS вместо тройного `===` в шаблоне)* |

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

**Не делаем:** старое приложение вынесено под переписывание; шаблоны и control flow здесь **намеренно не мигрируем**. Каталог **вне основного контура** линта/сборки Nx. Возврат в продукт — отдельный проект, не пункт этого трекера.

---

## 2. NgModule, `AppModule`, bootstrap — реестр

### 2.1 Общая схема (все перечисленные приложения)

| Файл | Роль |
|------|------|
| `apps/<name>/src/main.ts` | `initFederation()` → динамический `import('./bootstrap')` |
| `apps/<name>/src/bootstrap.ts` | `bootstrapApplication(AppComponent, { providers: [...] })` |
| `apps/<name>/src/app/transloco-http-loader.ts` | `TranslocoHttpLoader` для federated apps (вместо бывшего `app.module.ts`) |
| `apps/app/src/app/*.ts` | Shell: `transloco-http-loader`, `custom-error-handler`, `shell-app-initializers` |

### 2.2 Чеклист приложений (`AppModule` + входы)

Отметьте `[x]`, когда для приложения **нет смысла держать тяжёлый** `AppModule` (или он сведён к минимуму / удалён), без регрессий.

| Приложение | Вместо `AppModule` | `bootstrap.ts` | `main.ts` | Готово |
|------------|--------------------|----------------|-----------|--------|
| `app` | `transloco-http-loader.ts`, `custom-error-handler.ts`, `shell-app-initializers.ts` | `apps/app/src/bootstrap.ts` | `apps/app/src/main.ts` | [x] |
| `boards` | `transloco-http-loader.ts` | `apps/boards/src/bootstrap.ts` | `apps/boards/src/main.ts` | [x] |
| `dashboard` | `transloco-http-loader.ts` | `apps/dashboard/src/bootstrap.ts` | `apps/dashboard/src/main.ts` | [x] |
| `documents` | `transloco-http-loader.ts` | `apps/documents/src/bootstrap.ts` | `apps/documents/src/main.ts` | [x] |
| `messenger` | `transloco-http-loader.ts` | `apps/messenger/src/bootstrap.ts` | `apps/messenger/src/main.ts` | [x] |
| `profile` | `transloco-http-loader.ts` | `apps/profile/src/bootstrap.ts` | `apps/profile/src/main.ts` | [x] |
| `projects` | `transloco-http-loader.ts` | `apps/projects/src/bootstrap.ts` | `apps/projects/src/main.ts` | [x] |
| `settings` | `transloco-http-loader.ts` | `apps/settings/src/bootstrap.ts` | `apps/settings/src/main.ts` | [x] |
| `task` | `transloco-http-loader.ts` | `apps/task/src/bootstrap.ts` | `apps/task/src/main.ts` | [x] |
| `tasks` | `transloco-http-loader.ts` | `apps/tasks/src/bootstrap.ts` | `apps/tasks/src/main.ts` | [x] |
| `timeline` | *(отдельного loader нет; удалён только мёртвый `app.module.ts`)* | `apps/timeline/src/bootstrap.ts` | `apps/timeline/src/main.ts` | [x] |
| `todos` | `transloco-http-loader.ts` | `apps/todos/src/bootstrap.ts` | `apps/todos/src/main.ts` | [x] |

### 2.3 Библиотеки с `NgModule`

| Файл | Комментарий | Готово |
|------|-------------|--------|
| `libs/mentions/src/lib/mentions.module.ts` | Файл удалён (весь код был закомментирован; API уже standalone: `MentionsDirective`, `BaseMentionsList*`). | [x] |

### 2.4 Политика-напоминание (новый код)

- Новые компоненты / директивы / пайпы: **standalone**; не добавлять их в `declarations` существующих `AppModule`, если можно импортировать в родителя или в `bootstrap`/`routes`.
- Новые фичи в приложениях с federation: проверять, что импорты идут через `imports` standalone или через провайдеры в `bootstrap.ts`, а не раздувают легаси-модуль.

---

## 3. Следующий шаг (рекомендация)

1. **Шаблоны (активный контур):** очередь §1.1–§1.4 закрыта; улучшения — точечно при рефакторинге (§1.5 / §1.6 как ориентир по размеру файлов).
2. **`apps/old/` (§1.7):** не трогать в рамках этого трекера — переписывание отдельно.
3. **§2** — новый код: standalone, без новых `NgModule` без нужды.

После крупного изменения пересоберите инвентарь §1.6 (`find` по дереву без `node_modules`, `dist`, `.nx`, `apps/old`, `styles`).
