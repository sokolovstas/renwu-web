module.exports = {
  langs: ['ru', 'en', 'zh'],
  keysManager: {
    output: 'i18n',
    addMissingKeys: true,
    removeExtraKeys: true,
    defaultValue: '{{key}}',
  },
  scopePathMap: {
    board: 'libs/board/src/i18n',
    components: 'libs/components/src/i18n',
    core: 'libs/core/src/i18n',
    mentions: 'libs/mentions/src/i18n',
    messaging: 'libs/messaging/src/i18n',
    renwu: 'libs/app-ui/src/i18n',
  },
};
