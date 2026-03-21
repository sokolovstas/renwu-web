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

Детали 3.1: во всех затронутых `*.spec.ts` удалён `RouterTestingModule`; в `TestBed` добавлены `provideRouter(...)` (пустой конфиг или те же маршруты, что были в `withRoutes`) и `provideLocationMocks()` из `@angular/common/testing`.

## Дальше (вне текущих коммитов)

- Миграция `@angular/animations` → CSS / `animate.enter` / `animate.leave` ([руководство](https://angular.dev/guide/animations/migration)).
- Опционально: standalone для оставшихся `AppModule`, control flow, signal `input()` / `output()`, схемы из [Migrations](https://angular.dev/reference/migrations).
- Актуальный чеклист по шаблонам (`*ngTemplateOutlet`, `@switch`, инвентарь `.html`) и по `AppModule` / bootstrap: [TEMPLATE-AND-MODULE-TRACKER.md](./TEMPLATE-AND-MODULE-TRACKER.md).
