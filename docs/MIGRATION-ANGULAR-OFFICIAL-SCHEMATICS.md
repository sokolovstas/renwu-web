# Официальные миграции Angular (CLI / `@angular/core`)

Сводка по схемам из **[Migrations • Angular](https://angular.dev/reference/migrations)** — что делают, как запускать, и **оценка для репозитория renwu** относительно уже сделанного в [MIGRATION-ANGULAR-21.md](./MIGRATION-ANGULAR-21.md).

Команды ниже предполагают Angular CLI и пакет `@angular/core` с встроенными схемами. В **Nx** обычно из корня воркспейса:

```bash
npx ng generate @angular/core:<имя-схемы>
```

У многих схем есть **`--path`** (ограничить папку) и другие флаги — смотрите страницу конкретной миграции и `ng generate @angular/core:<name> --help`.

---

## Список миграций (как в документации)

| # | Тема (как в доке) | Схема `@angular/core` | Команда (пример) | Для renwu |
|---|-------------------|-------------------------|------------------|-----------|
| 1 | [Standalone](https://angular.dev/reference/migrations/standalone) | `standalone-migration` (алиас `standalone`) | `npx ng generate @angular/core:standalone-migration` | **Скорее сделано**: библиотеки и приложения на standalone; остатки NgModule — точечно ([TEMPLATE-AND-MODULE-TRACKER](./TEMPLATE-AND-MODULE-TRACKER.md), `apps/old/`). Повторный прогон — только после инвентаризации. |
| 2 | [Control Flow](https://angular.dev/reference/migrations/control-flow) | `control-flow-migration` | `npx ng generate @angular/core:control-flow` | **Частично / риск**: новый синтаксис `@if` / `@for` уже используется; схема может трогать оставшиеся `*ngIf` / `*ngFor`. Имеет смысл по **подпапке** (`--path`) или вручную по трекеру. |
| 3 | [inject()](https://angular.dev/reference/migrations/inject-function) | `inject-migration` (алиас `inject`) | `npx ng generate @angular/core:inject-migration` | **Кандидат**: массовая замена DI в конструкторе на `inject()` — улучшает типы и совместимость с будущими API. Большой дифф; лучше **по библиотекам** (`--path=libs/...`). |
| 4 | [Lazy-loaded routes](https://angular.dev/reference/migrations/route-lazy-loading) | `route-lazy-loading-migration` (алиас `route-lazy-loading`) | `npx ng generate @angular/core:route-lazy-loading-migration` | **Оценить отдельно**: зависит от текущих `routes` / federation; может конфликтовать с уже настроенным lazy loading. Перед прогоном — снимок маршрутов. |
| 5 | [Signal inputs](https://angular.dev/reference/migrations/signal-inputs) | `signal-input-migration` | `npx ng generate @angular/core:signal-input-migration` | **Кандидат**: `@Input()` → `input()`. Есть `--best-effort-mode`, `--insert-todos`, `--analysis-dir`. Рекомендуется **постепенно** по проекту/либе. |
| 6 | [Outputs](https://angular.dev/reference/migrations/outputs) | `output-migration` | `npx ng generate @angular/core:output-migration` | **Кандидат**: `@Output()` / `EventEmitter` → `output()`. Аналогично — порциями + тесты. |
| 7 | [Signal queries](https://angular.dev/reference/migrations/signal-queries) | `signal-queries-migration` | `npx ng generate @angular/core:signal-queries-migration` | **Кандидат**: `@ViewChild` / `@ContentChild` и т.д. → signal queries. Чувствительно к сложным сценариям; смотреть TODO схемы. |
| 8 | Комбо signals | `signals` | `npx ng generate @angular/core:signals` | **Опционально**: объединяет несколько signal-связанных миграций (см. описание схемы в CLI). |
| 9 | [Cleanup unused imports](https://angular.dev/reference/migrations/cleanup-unused-imports) | `cleanup-unused-imports` | `npx ng generate @angular/core:cleanup-unused-imports` | **Низкий риск / полезно**: чистка `imports` у standalone. Можно периодически гонять по `libs/` и `apps/` (с `--path`). |
| 10 | [Self-closing tags](https://angular.dev/reference/migrations/self-closing-tags) | `self-closing-tags-migration` (алиас `self-closing-tag`) | `npx ng generate @angular/core:self-closing-tags-migration` | **Косметика**: единообразие шаблонов. Низкий риск; крупный дифф по строкам. |
| 11 | [NgClass → class](https://angular.dev/reference/migrations/ngclass-to-class) | `ngclass-to-class-migration` | `npx ng generate @angular/core:ngclass-to-class` | **Скорее уже не нужно**: фаза 1 в MIGRATION-ANGULAR-21 — вручную. Повторный прогон поймает пропуски. |
| 12 | [NgStyle → style](https://angular.dev/reference/migrations/ngstyle-to-style) | `ngstyle-to-style-migration` | `npx ng generate @angular/core:ngstyle-to-style` | **Скорее уже не нужно**: то же. |
| 13 | [RouterTestingModule](https://angular.dev/reference/migrations/router-testing-module-migration) | `router-testing-module-migration` | `npx ng generate @angular/core:router-testing-module-migration` | **Скорее сделано** вручную (§3.1). Схема — дожать оставшиеся `*.spec.ts`. |
| 14 | [CommonModule → standalone imports](https://angular.dev/reference/migrations/common-to-standalone) | `common-to-standalone-migration` | `npx ng generate @angular/core:common-to-standalone` | **Частично**: §1.5 и трекер — уже ужимали `CommonModule`. Схема добьёт остатки `NgIf`/`NgFor`/pipes по месту. |

Имена схем сверены с `node_modules/@angular/core/schematics/collection.json` (Angular 21.x).

---

## Что имеет смысл делать дальше (приоритеты)

1. **`cleanup-unused-imports`** и при необходимости **`self-closing-tags-migration`** — мало логических рисков, удобно ограничивать `--path`.
2. **`signal-input-migration`** / **`output-migration`** / **`signal-queries-migration`** — по одной библиотеке или приложению, с тестами и ревью; опция `--insert-todos` для граничных случаев.
3. **`inject-migration`** — после стабилизации signal API или параллельно по модулям.
4. **`control-flow-migration`** — только если ещё есть старый синтаксис и нужна автоматизация; иначе продолжать вручную по [TEMPLATE-AND-MODULE-TRACKER](./TEMPLATE-AND-MODULE-TRACKER.md).
5. **`route-lazy-loading-migration`** — только после явного аудита маршрутов и federation.

---

## Важно

- Официальные миграции **не заменяют** код-ревью: всегда `git diff`, сборка и тесты после прогона.
- Документация Angular про миграции обновляется; актуальный список — всегда на [angular.dev/reference/migrations](https://angular.dev/reference/migrations).
- **Анимации** (`@angular/animations` → CSS / `animate.enter` / `animate.leave`) описаны в [гайде по миграции анимаций](https://angular.dev/guide/animations/migration), это **не** отдельная схема из таблицы выше — уже отражено в MIGRATION-ANGULAR-21 §3.2.
