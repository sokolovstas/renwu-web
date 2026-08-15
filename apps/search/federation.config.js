const { withNativeFederation } = require('../federation.config.js');

module.exports = withNativeFederation({
  name: 'search',
  exposes: {
    './routes': './apps/search/src/app/remote-entry/entry.routes.ts',
    './Spotlight': './apps/search/src/app/spotlight/spotlight.component.ts',
  },
});
