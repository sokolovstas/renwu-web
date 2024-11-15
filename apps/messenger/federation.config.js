const { withNativeFederation } = require('../federation.config.js');

module.exports = withNativeFederation({
  name: 'messenger',
  exposes: {
    './routes': './apps/messenger/src/app/remote-entry/entry.routes.ts',
  },
});
