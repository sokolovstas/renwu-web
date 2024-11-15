const { withNativeFederation } = require('../federation.config.js');

module.exports = withNativeFederation({
  name: 'profile',
  exposes: {
    './routes': './apps/profile/src/app/remote-entry/entry.routes.ts',
  },
});
