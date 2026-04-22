/** Runs before the test framework; hoisted mocks apply to all spec files. */
jest.mock('@jsverse/transloco', () => {
  const s = require('./testing/transloco-stub');
  return {
    TranslocoPipe: s.TranslocoPipeStub,
    TranslocoService: s.TranslocoServiceStub,
  };
});
