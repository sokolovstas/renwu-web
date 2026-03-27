const { withNativeFederation } = require('../federation.config.js');

module.exports = withNativeFederation({
  name: 'timeline',
  exposes: {
    './routes': './apps/timeline/src/app/remote-entry/entry.routes.ts',
  },
  shared: {
    '@angular/common/http': { singleton: true, strictVersion: true },
  },
  skip: ['@renwu/app-ui'],
});

