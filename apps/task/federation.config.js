const { withNativeFederation } = require('../federation.config.js');

module.exports = withNativeFederation({
  name: 'task',
  exposes: {
    './routes': './apps/task/src/app/remote-entry/entry.routes.ts',
  },
});
