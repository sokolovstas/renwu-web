# Renwu Web — инструкции для агентов

Фронтенд: Angular + Nx, микрофронты в `apps/`, общие библиотеки в `libs/`.

## `rw-select`: только через отдельные модели

Вся логика загрузки, поиска и отображения опций для `<rw-select>` реализуется **отдельными классами-моделями**, а не в компонентах, сервисах или шаблонах.

### Обязательно

1. **Новый источник данных** → новый класс `SelectModel*` в `libs/core/src/lib/select/` (или рядом, если специфичен для одного app).
2. **Регистрация** → добавить фабрику в `initSelectorModels()` (`libs/core/src/lib/providers.ts`):

   ```ts
   MyEntity: () => new SelectModelMyEntity(),
   ```

3. **Использование в UI** → только через `modelName`:

   ```html
   <rw-select modelName="MyEntity" [(ngModel)]="value" />
   ```

4. **Базовые классы** (по ситуации):
   - `SelectModelBase<T>` — произвольный API, поиск, пагинация (`dataHandler`, `convertDataToItemHandler`);
   - `SelectModelDictionary` — словари `/dictionary/...` с клиентским фильтром;
   - `SelectModelString` — статический список.

5. **Пустой поиск** — если бэкенд отдаёт дефолт (например recent issues в `GET /issue/options`), модель **не блокирует** запрос при `searchString === ''`.

### Запрещено

- Вызывать `RwDataService` / `getDictionaryOptions` напрямую из компонента ради `<rw-select>`.
- Дублировать одну и ту же логику в нескольких местах (отдельные «data provider»-сервисы под select).
- Передавать `[model]` с инлайн-объектом вместо зарегистрированной `modelName` (кроме редких тестов).

### Примеры в репозитории

| `modelName`   | Класс                 | Файл                          |
|---------------|-----------------------|-------------------------------|
| `Issue`       | `SelectModelIssue`    | `libs/core/src/lib/select/issue.ts` |
| `IssueLink`   | `SelectModelIssue`    | то же (алиас в providers)     |
| `Milestone`   | `SelectModelMilestones` | `libs/core/src/lib/select/milestone.ts` |
| `Assignee`    | `SelectModelUser`     | `libs/core/src/lib/select/user.ts` |
| `Container`   | `SelectModelContainer`| `libs/core/src/lib/select/container.ts` |

### Исключения

- **Mentions** (`#`, `@`) — не `rw-select`; допустим прямой вызов API в `RwMentionsProviderService`.
- **Тесты** — мок `RW_SELECT_MODELS` с нужной фабрикой модели.

### Чеклист при добавлении пикера

1. Создать `SelectModel…` с `dataHandler` и конвертерами item ↔ data.
2. Зарегистрировать в `initSelectorModels()`.
3. В шаблоне — `modelName="…"`, без лишней логики в компоненте.
4. При необходимости — переиспользовать существующую модель (`Issue` / `IssueLink` для поиска задач).
