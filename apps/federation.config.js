const {
  shareAll,
  withNativeFederation,
} = require('@angular-architects/native-federation/config');

function withNativeFederationCommon(config) {
  return withNativeFederation({
    name: config.name,

    exposes: {
      ...config.exposes,
    },

    shared: {
      ...shareAll({
        singleton: true,
        strictVersion: true,
        requiredVersion: 'auto',
      }),
      'date-fns/locale/en-GB': {},
      'date-fns/locale/en-US': {},
      'date-fns/locale/ru': {},
      'date-fns/locale/zh-CN': {},
      ...config.shared,
    },
    skip: [
      '@renwu/board',
      '@renwu/todos',
      '@renwu/documents',
      'antlr4',
      'prosemirror-commands/import',
      'prosemirror-commands/require',
      'prosemirror-dropcursor/import',
      'prosemirror-dropcursor/require',
      'prosemirror-example/import',
      'prosemirror-example/require',
      'prosemirror-gapcursor/import',
      'prosemirror-gapcursor/require',
      'prosemirror-history/import',
      'prosemirror-history/require',
      'prosemirror-inputrules/import',
      'prosemirror-inputrules/require',
      'prosemirror-keymap/import',
      'prosemirror-keymap/require',
      'prosemirror-markdown/import',
      'prosemirror-markdown/require',
      'prosemirror-menu/import',
      'prosemirror-menu/require',
      'prosemirror-model/import',
      'prosemirror-model/require',
      'prosemirror-schema/import',
      'prosemirror-schema/require',
      'prosemirror-schema-basic/import',
      'prosemirror-schema-basic/require',
      'prosemirror-schema-list/import',
      'prosemirror-schema-list/require',
      'prosemirror-state/import',
      'prosemirror-state/require',
      'prosemirror-view/import',
      'prosemirror-view/require',
      'mermaid',
      ...(config.skip || []),
    ],
  });
}
exports.withNativeFederation = withNativeFederationCommon;
