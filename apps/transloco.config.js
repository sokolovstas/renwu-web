module.exports = {
  langs: ['ru', 'en', 'zh'],
  keysManager: {
    output: 'i18n',
    addMissingKeys: true,
    removeExtraKeys: true,
    defaultValue: '{{key}}',
  },
  scopePathMap: {
    app: 'apps/app/src/i18n',
    boards: 'apps/boards/src/i18n',
    dashboard: 'apps/dashboard/src/i18n',
    documents: 'apps/documents/src/i18n',
    messenger: 'apps/messenger/src/i18n',
    profile: 'apps/profile/src/i18n',
    projects: 'apps/projects/src/i18n',
    settings: 'apps/settings/src/i18n',
    task: 'apps/task/src/i18n',
    tasks: 'apps/tasks/src/i18n',
    todos: 'apps/todos/src/i18n',
  },
  scopedLibs: [
    './libs/core',
    './libs/components',
    './libs/app-ui',
    './libs/boards',
    './libs/messaging',
    './libs/mentions',
  ],
};