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
| 2.1 | Поднять `@angular-eslint/*` до линейки 21.x под Angular 21 | ⬜ |

## Фаза 3: дожим (тесты и мелочи)

| Шаг | Описание | Статус |
|-----|----------|--------|
| 3.1 | Заменить `RouterTestingModule` на `provideRouter` + `provideLocationMocks` в unit-тестах | ⬜ |

## Дальше (вне текущих коммитов)

- Миграция `@angular/animations` → CSS / `animate.enter` / `animate.leave` ([руководство](https://angular.dev/guide/animations/migration)).
- Опционально: standalone для оставшихся `AppModule`, control flow, signal `input()` / `output()`, схемы из [Migrations](https://angular.dev/reference/migrations).
