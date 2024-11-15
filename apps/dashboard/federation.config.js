const { withNativeFederation } = require('../federation.config.js');

module.exports = withNativeFederation({
  name: 'dashboard',
  exposes: {
    './routes': './apps/dashboard/src/app/remote-entry/entry.routes.ts',
  },
});
