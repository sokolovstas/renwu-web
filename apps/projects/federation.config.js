const { withNativeFederation } = require('../federation.config.js');

module.exports = withNativeFederation({
  name: 'projects',
  exposes: {
    './routes': './apps/projects/src/app/remote-entry/entry.routes.ts',
  },
});
