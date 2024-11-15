const { withNativeFederation } = require('../federation.config.js');

module.exports = withNativeFederation({
  name: 'todos',
  exposes: {
    './routes': './apps/todos/src/app/remote-entry/entry.routes.ts',
  },
  skip: ['@renwu/app-ui'],
});
