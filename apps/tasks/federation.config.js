const { withNativeFederation } = require('../federation.config.js');

module.exports = withNativeFederation({
  name: 'tasks',
  exposes: {
    './routes': './apps/tasks/src/app/remote-entry/entry.routes.ts',
  },
});
