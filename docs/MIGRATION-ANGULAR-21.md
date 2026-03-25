# Миграция Angular 17 → 21 (рабочий лог)

Документ фиксирует выполненные шаги и оставшуюся работу. Каждый завершённый пункт в истории git отмечен отдельным коммитом.

## Фаза 1: стили шаблонов (NgStyle / NgClass → привязки `class` / `style`)

| Шаг | Описание | Статус |
|-----|----------|--------|
| 1.1 | Удалить неиспользуемый `NgStyle` из компонентов (шаблоны уже на `[style.*]`) | ✅ |
| 1.2 | `NgClass` → `[class.*]`: shell приложений (`apps/app`, `apps/projects`) | ✅ |
| 1.3 | `NgClass` → `[class.*]`: `RenwuPageComponent` (Tailwind `md:…` — привязки вида `[class.md:px-6]`) | ✅ |
| 1.4 | `NgClass` → `[class.*]`: sidebar, messaging destinations, projects summary | ✅ |
| 1.5 | Заменить `CommonModule` на точечный `AsyncPipe` там, где остался только async в шаблоне | ✅ |

## Фаза 2: ESLint

| Шаг | Описание | Статус |
|-----|----------|--------|
| 2.1 | Поднять `@angular-eslint/*` до линейки 21.x под Angular 21 | ✅ |

Детали 2.1: `@angular-eslint/*` **21.2.0**, `eslint` **8.57.1**, `@typescript-eslint/*` **8.57.1** (диапазон TypeScript до 6.x, совместимо с TS 5.9). В корне добавлен `.npmrc` с `legacy-peer-deps=true` из‑за жёсткого разрешения peer-зависимостей npm при смеси Nx и eslint-стека. Во всех `apps/*/.eslintrc.json` исправлен путь к корневому конфигу: было `../../../.eslintrc.json` (на уровень выше репозитория), стало `../../.eslintrc.json`.

## Фаза 3: дожим (тесты и мелочи)

| Шаг | Описание | Статус |
|-----|----------|--------|
| 3.1 | Заменить `RouterTestingModule` на `provideRouter` + `provideLocationMocks` в unit-тестах | ✅ |
| 3.2 | Legacy `@angular/animations` (триггеры в компонентах) → CSS transitions / keyframes + `animate.enter` / `animate.leave` ([руководство](https://angular.dev/guide/animations/migration)) | ✅ |

Детали 3.1: во всех затронутых `*.spec.ts` удалён `RouterTestingModule`; в `TestBed` добавлены `provideRouter(...)` (пустой конфиг или те же маршруты, что были в `withRoutes`) и `provideLocationMocks()` из `@angular/common/testing`.

Детали 3.2: из кода приложения и библиотек убраны `trigger` / `[@…]`; анимации переведены на CSS и `animate.enter` / `animate.leave` ([миграция](https://angular.dev/guide/animations/migration)). В `apps/federation.config.js` **нет** `skip` / `skipList` для `platform-browser/animations` — это не из документации Angular, а был бы обход отсутствующего пакета. **`@angular/animations`** снова в `package.json`: у `@angular/platform-browser` он в `peerDependenciesMeta` как **optional**; Native Federation при `shareAll` подхватывает вторичные `exports` (`…/animations`, `…/animations/async`), которым нужен резолв `@angular/animations/browser`. В **исходниках приложения** пакет не импортируется.

## Фаза 4: лишние записи в `imports` у standalone (NG8113)

| Шаг | Описание | Статус |
|-----|----------|--------|
| 4.1 | Во всех `apps/**/tsconfig.json`, `libs/**/tsconfig.json` и связанных `tsconfig.lib.prod.json` включена расширенная диагностика **[NG8113](https://angular.dev/extended-diagnostics/NG8113)** (`unusedStandaloneImports`: `error`) | ✅ |
| 4.2 | Официальная схема `cleanup-unused-imports`: `nx generate @angular/core:cleanup-unused-imports --no-interactive` (удалено 49 неиспользуемых импортов в 22 компонентах активного контура) | ✅ |

Детали 4.x: в `@angular-eslint` 21.x отдельного ESLint-правила под это нет — контроль через компилятор Angular. Повторный прогон схемы и `npm run cleanup-unused-imports` — см. [MIGRATION-ANGULAR-OFFICIAL-SCHEMATICS.md](./MIGRATION-ANGULAR-OFFICIAL-SCHEMATICS.md) (п. 9).

## Фаза 5: самозакрывающиеся теги в шаблонах

| Шаг | Описание | Статус |
|-----|----------|--------|
| 5.1 | ESLint **`@angular-eslint/template/prefer-self-closing-tags`** (`error`) в override для **`*.html`** во всех `apps/*/.eslintrc.json` и `libs/*/.eslintrc.json` | ✅ |
| 5.2 | Схема **`self-closing-tags-migration`**: `nx generate @angular/core:self-closing-tags-migration --no-interactive` (292 тега в 83 файлах активного контура) | ✅ |

Детали 5.x: правило на весь `*.ts` не ставили — для `e2e` и прочих файлов нет Angular template parser. Инлайн-шаблоны закрывает схема; для `.html` дальше достаточно `nx run-many -t lint --all --fix`. См. [MIGRATION-ANGULAR-OFFICIAL-SCHEMATICS.md](./MIGRATION-ANGULAR-OFFICIAL-SCHEMATICS.md) (п. 10).

## Фаза 6: `CommonModule` → точечные импорты (официальная схема)

| Шаг | Описание | Статус |
|-----|----------|--------|
| 6.1 | Схема **`common-to-standalone-migration`**: `nx generate @angular/core:common-to-standalone-migration --no-interactive` — подтверждение отсутствия `CommonModule` в активном контуре (**0** правок) | ✅ |

Детали 6.x: база уже была в фазе 1.5; схема дублирует миграцию из [доки Angular](https://angular.dev/reference/migrations/common-to-standalone). Повторный прогон — `npm run migrate:common-to-standalone`. См. [MIGRATION-ANGULAR-OFFICIAL-SCHEMATICS.md](./MIGRATION-ANGULAR-OFFICIAL-SCHEMATICS.md) (п. 14).

## Фаза 7: `inject()` вместо конструкторного DI

| Шаг | Описание | Статус |
|-----|----------|--------|
| 7.1 | Контрольные прогоны **`inject-migration`** (`libs/board`, `libs/components`, `libs/core/src/lib/select`) — **0** правок; в `@Component` / `@Injectable` / `@Directive` / `@Pipe` уже `inject()` | ✅ |
| 7.2 | ESLint **`@angular-eslint/prefer-inject`**: `warn` во всех `apps/*` и `libs/*` (подсказка на регресс с параметрами конструктора) | ✅ |

Детали 7.x: схема не меняет классы **без** Angular-декоратора. В репозитории остался неиспользуемый `SelectModelFilter` в `libs/core/src/lib/select/filters.select.ts` с `constructor(private dataService: …)` — вне объёма схемы; при желании удалить файл или перевести на фабрику/DI осознанно. Повторный прогон — `npm run migrate:inject` с `--path` при необходимости. См. [MIGRATION-ANGULAR-OFFICIAL-SCHEMATICS.md](./MIGRATION-ANGULAR-OFFICIAL-SCHEMATICS.md) (п. 3).

## Дальше (что осталось)

- **Шаблоны / bootstrap:** активный контур закрыт по [TEMPLATE-AND-MODULE-TRACKER.md](./TEMPLATE-AND-MODULE-TRACKER.md) (§1.1–§1.4, §2). **`apps/old/` не трогаем** (ни шаблоны, ни standalone, ни CLI-схемы) — отдельное переписывание, вне этого плана.
- **Официальные CLI-миграции Angular:** полный список схем, команд и оценка для репозитория — [MIGRATION-ANGULAR-OFFICIAL-SCHEMATICS.md](./MIGRATION-ANGULAR-OFFICIAL-SCHEMATICS.md) (источник: [Migrations](https://angular.dev/reference/migrations)).
- **Опционально жёсткая выкладка бандла:** снова убрать `@angular/animations` из зависимостей можно только осознанно (иначе federation снова не соберёт shared для `…/animations*`) — в гайде по миграции анимаций это про отказ от **legacy API**, а не обязательное удаление пакета из `node_modules`.
