const { withNativeFederation } = require('../federation.config.js');

module.exports = withNativeFederation({
  name: 'settings',
  exposes: {
    './routes': './apps/settings/src/app/remote-entry/entry.routes.ts',
  },
});
