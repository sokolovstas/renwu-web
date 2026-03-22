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

Детали 3.2: из кода приложения и библиотек убраны `trigger` / `[@…]`; пакет `@angular/animations` удалён из зависимостей. В `apps/federation.config.js` в `skip` добавлены `@angular/platform-browser/animations` и `…/animations/async`, чтобы Native Federation не бандлил вторичные entry points, которые тянут `@angular/animations/browser`.

## Дальше (вне текущих коммитов)

- Опционально: signal `input()` / `output()`, схемы из [Migrations](https://angular.dev/reference/migrations).
- **Шаблоны и bootstrap (активный контур):** очередь в [TEMPLATE-AND-MODULE-TRACKER.md](./TEMPLATE-AND-MODULE-TRACKER.md) закрыта (§1.1–§1.4, §2); `apps/old/` в миграцию шаблонов не входит — под переписывание.
