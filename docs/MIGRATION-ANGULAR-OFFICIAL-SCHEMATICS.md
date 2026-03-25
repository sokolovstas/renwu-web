# Официальные миграции Angular (CLI / `@angular/core`)

Сводка по схемам из **[Migrations • Angular](https://angular.dev/reference/migrations)** — что делают, как запускать, и **оценка для репозитория renwu** относительно уже сделанного в [MIGRATION-ANGULAR-21.md](./MIGRATION-ANGULAR-21.md).

Команды ниже предполагают Angular CLI и пакет `@angular/core` с встроенными схемами. В **Nx** обычно из корня воркспейса:

```bash
npx ng generate @angular/core:<имя-схемы>
```

У многих схем есть **`--path`** (ограничить папку) и другие флаги — смотрите страницу конкретной миграции и `ng generate @angular/core:<name> --help`.

**Линтер:** в `@angular-eslint` 21.x **нет** отдельного правила «лишние записи в `imports` у standalone»; это **[NG8113 · Unused standalone imports](https://angular.dev/extended-diagnostics/NG8113)** — расширенная диагностика компилятора Angular, задаётся в **`angularCompilerOptions.extendedDiagnostics.checks.unusedStandaloneImports`** (`warning` / `error` / `suppress`).

Для **`inject()`** есть **`@angular-eslint/prefer-inject`** (`warn` в `apps/*` и `libs/*`) — только для классов с `@Component` / `@Directive` / `@Injectable` / `@Pipe`; намёк на схему **`inject-migration`**, автозамены нет.

Для **самозакрывающихся тегов** в шаблонах используется ESLint **`@angular-eslint/template/prefer-self-closing-tags`** (`fixable`) на **`*.html`** в каждом `apps/*/.eslintrc.json` и `libs/*/.eslintrc.json`. На весь `*.ts` подряд то же правило вешать нельзя: для `e2e/*.ts` и прочих файлов нет Angular template parser — линт падает. Инлайн-шаблоны в `.ts` закрываются официальной схемой **`self-closing-tags-migration`** (см. п. 10).

**`apps/old/` не трогаем:** ни официальными схемами, ни ручными правками в рамках этих документов — архив вне продуктового контура ([TEMPLATE-AND-MODULE-TRACKER §1.7](./TEMPLATE-AND-MODULE-TRACKER.md#17-архив-appsold)). Любой CLI-прогон — только с явным `--path` по `libs/…` и рабочим `apps/…`, **без** `apps/old`.

---

## Список миграций (как в документации)

**Статус (renwu):** ✅ — цель закрыта **вручную** по [MIGRATION-ANGULAR-21.md](./MIGRATION-ANGULAR-21.md) (CLI-схему не обязательно гонять) · ◐ — **частично** (остатки или только активный контур) · ⬜ — **не делали** целенаправленно (кандидат на схему или ручной дожим).

| # | Статус | Тема (как в доке) | Схема `@angular/core` | Команда (пример) | Для renwu |
|---|--------|-------------------|-------------------------|------------------|-----------|
| 1 | ◐ | [Standalone](https://angular.dev/reference/migrations/standalone) | `standalone-migration` (алиас `standalone`) | `npx ng generate @angular/core:standalone-migration` | Активный контур на standalone ([TEMPLATE-AND-MODULE-TRACKER](./TEMPLATE-AND-MODULE-TRACKER.md)); **`apps/old/` вне объёма**. Повторный прогон схемы — только с `--path` по нужным папкам, не по архиву. |
| 2 | ◐ | [Control Flow](https://angular.dev/reference/migrations/control-flow) | `control-flow-migration` | `npx ng generate @angular/core:control-flow` | `@if` / `@for` уже есть; возможны оставшиеся `*ngIf` / `*ngFor`. Схема или вручную по трекеру, удобно с `--path`. |
| 3 | ✅ | [inject()](https://angular.dev/reference/migrations/inject-function) | `inject-migration` (алиас `inject`) | `nx generate @angular/core:inject-migration --no-interactive` *(опц. `--path=…`)* | **Проверено:** выборочные прогоны (`libs/board`, `libs/components`, `libs/core/src/lib/select`) — **0** правок; в декорированных классах уже `inject()`. ESLint **`prefer-inject`** (`warn`). Схема не трогает классы **без** Angular-декоратора (см. `filters.select.ts` — мёртвый `SelectModelFilter`, не в public API). Повтор: `npm run migrate:inject`. |
| 4 | ⬜ | [Lazy-loaded routes](https://angular.dev/reference/migrations/route-lazy-loading) | `route-lazy-loading-migration` (алиас `route-lazy-loading`) | `npx ng generate @angular/core:route-lazy-loading-migration` | **Оценить**: `routes` / federation; перед прогоном — снимок маршрутов. |
| 5 | ⬜ | [Signal inputs](https://angular.dev/reference/migrations/signal-inputs) | `signal-input-migration` | `npx ng generate @angular/core:signal-input-migration` | **Кандидат**: `@Input()` → `input()`. `--best-effort-mode`, `--insert-todos`, `--analysis-dir`; постепенно. |
| 6 | ⬜ | [Outputs](https://angular.dev/reference/migrations/outputs) | `output-migration` | `npx ng generate @angular/core:output-migration` | **Кандидат**: `@Output()` / `EventEmitter` → `output()`. Порциями + тесты. |
| 7 | ⬜ | [Signal queries](https://angular.dev/reference/migrations/signal-queries) | `signal-queries-migration` | `npx ng generate @angular/core:signal-queries-migration` | **Кандидат**: `@ViewChild` / `@ContentChild` → signal queries; сложные случаи — TODO схемы. |
| 8 | ⬜ | Комбо signals | `signals` | `npx ng generate @angular/core:signals` | **Опционально**: несколько signal-миграций разом (см. CLI). |
| 9 | ✅ | [Cleanup unused imports](https://angular.dev/reference/migrations/cleanup-unused-imports) | `cleanup-unused-imports` | `nx generate @angular/core:cleanup-unused-imports --no-interactive` *(из корня Nx; в чистом Angular CLI — `npx ng generate …`)* | **Сделано:** в tsconfig приложений/библиотек включён **NG8113** как `error`. Прогон схемы: удалено **49** неиспользуемых импортов в **22** файлах (активный контур; `apps/old/` не затронут). Повторять по мере накопления мусора. |
| 10 | ✅ | [Self-closing tags](https://angular.dev/reference/migrations/self-closing-tags) | `self-closing-tags-migration` (алиас `self-closing-tag`) | `nx generate @angular/core:self-closing-tags-migration --no-interactive` | **Сделано:** схема — **292** тега в **83** файлах (`.html` + инлайн в `.ts`, в т.ч. пара `.spec.ts`). **ESLint** `prefer-self-closing-tags` на `*.html` — чтобы не откатывать стиль; `npm run migrate:self-closing-tags` для повторного прогона. |
| 11 | ✅ | [NgClass → class](https://angular.dev/reference/migrations/ngclass-to-class) | `ngclass-to-class-migration` | `npx ng generate @angular/core:ngclass-to-class` | **Сделано** вручную: MIGRATION-ANGULAR-21 §1.2–1.4. Схема — поймать пропуски. |
| 12 | ✅ | [NgStyle → style](https://angular.dev/reference/migrations/ngstyle-to-style) | `ngstyle-to-style-migration` | `npx ng generate @angular/core:ngstyle-to-style` | **Сделано** вручную: §1.1 и курс на `[style.*]`. Схема — пропуски. |
| 13 | ✅ | [RouterTestingModule](https://angular.dev/reference/migrations/router-testing-module-migration) | `router-testing-module-migration` | `npx ng generate @angular/core:router-testing-module-migration` | **Сделано** вручную: §3.1. Схема — дожать оставшиеся `*.spec.ts`. |
| 14 | ✅ | [CommonModule → standalone imports](https://angular.dev/reference/migrations/common-to-standalone) | `common-to-standalone-migration` (алиас `common-to-standalone`) | `nx generate @angular/core:common-to-standalone-migration --no-interactive` | **Закрыто:** ранее §1.5 (точечный `AsyncPipe` и др.); контрольный прогон схемы — **0** оставшихся `CommonModule`. В исходниках только точечные импорты из `@angular/common` (`AsyncPipe`, `NgTemplateOutlet`, …). Повтор: `npm run migrate:common-to-standalone`. |

**Вне таблицы схем** (гайд, не `ng generate`): [миграция анимаций](https://angular.dev/guide/animations/migration) — ✅ **сделано** вручную (MIGRATION-ANGULAR-21 §3.2).

Имена схем сверены с `node_modules/@angular/core/schematics/collection.json` (Angular 21.x).

---

## Что имеет смысл делать дальше (приоритеты)

Во всех пунктах: **`apps/old/` не затрагивать** (см. выше).

1. **`signal-input-migration`** / **`output-migration`** / **`signal-queries-migration`** — по одной библиотеке или приложению, с тестами и ревью; опция `--insert-todos` для граничных случаев.
2. **`control-flow-migration`** — только если ещё есть старый синтаксис и нужна автоматизация; иначе продолжать вручную по [TEMPLATE-AND-MODULE-TRACKER](./TEMPLATE-AND-MODULE-TRACKER.md).
3. **`route-lazy-loading-migration`** — только после явного аудита маршрутов и federation.

**inject():** для активного контура см. п. 3 таблицы (схема дала 0 правок; контроль — **`prefer-inject`** и при необходимости **`npm run migrate:inject`**).

Периодически при крупных рефакторингах: снова **`nx generate @angular/core:cleanup-unused-imports --no-interactive`** — пока NG8113 включён как `error`, сборка не пропустит новые лишние `imports`. При появлении новых инлайн-шаблонов без самозакрытия — **`npm run migrate:self-closing-tags`** (или правки только в `.html` через ESLint `--fix`). Если кто-то снова подтянет **`CommonModule`** в standalone — **`npm run migrate:common-to-standalone`**.

---

## Важно

- Официальные миграции **не заменяют** код-ревью: всегда `git diff`, сборка и тесты после прогона.
- Документация Angular про миграции обновляется; актуальный список — всегда на [angular.dev/reference/migrations](https://angular.dev/reference/migrations).
- **Анимации** (`@angular/animations` → CSS / `animate.enter` / `animate.leave`) описаны в [гайде по миграции анимаций](https://angular.dev/guide/animations/migration), это **не** отдельная схема из таблицы выше — уже отражено в MIGRATION-ANGULAR-21 §3.2.
