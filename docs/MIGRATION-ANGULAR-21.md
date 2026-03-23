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

## Дальше (что осталось)

- **Шаблоны / bootstrap:** активный контур закрыт по [TEMPLATE-AND-MODULE-TRACKER.md](./TEMPLATE-AND-MODULE-TRACKER.md) (§1.1–§1.4, §2). Вне плана: `apps/old/` — под отдельное переписывание.
- **Опционально по Angular:** signal `input()` / `output()` и прочие схемы из [Migrations](https://angular.dev/reference/migrations).
- **Опционально жёсткая выкладка бандла:** снова убрать `@angular/animations` из зависимостей можно только осознанно (иначе federation снова не соберёт shared для `…/animations*`) — в гайде по миграции анимаций это про отказ от **legacy API**, а не обязательное удаление пакета из `node_modules`.
