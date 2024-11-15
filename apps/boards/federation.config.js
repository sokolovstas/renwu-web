const { withNativeFederation } = require('../federation.config.js');

module.exports = withNativeFederation({
  name: 'boards',
  exposes: {
    './routes': './apps/boards/src/app/remote-entry/entry.routes.ts',
  },
  skip: ['@renwu/app-ui', '@renwu/messaging'],
});
