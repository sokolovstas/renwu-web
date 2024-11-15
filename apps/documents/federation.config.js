const { withNativeFederation } = require('../federation.config.js');

module.exports = withNativeFederation({
  name: 'documents',
  exposes: {
    './routes': './apps/documents/src/app/remote-entry/entry.routes.ts',
  },
  skip: ['@renwu/app-ui'],
});
