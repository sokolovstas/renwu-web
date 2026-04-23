/** Runs before the test framework; hoisted mocks apply to all spec files. */
jest.mock('@jsverse/transloco', () => {
  const actual = jest.requireActual('@jsverse/transloco');
  const s = require('./testing/transloco-stub');
  return {
    ...actual,
    TranslocoPipe: s.TranslocoPipeStub,
    TranslocoService: s.TranslocoServiceStub,
  };
});
