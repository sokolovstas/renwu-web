import { ROUTES } from './entry.routes';

describe('documents remote ROUTES', () => {
  it('keeps the layout route as a prefix so /document/:documentId can match', () => {
    const layout = ROUTES[0];
    expect(layout.path).toBe('');
    // Host mounts these as path: 'document'. pathMatch: 'full' on this parent
    // rejects leftover segments and yields NG04002 for /document/<uuid>.
    expect(layout.pathMatch).not.toBe('full');
    expect(layout.children?.map((route) => route.path)).toEqual([
      '',
      ':documentId',
    ]);
    expect(layout.children?.[0].pathMatch).toBe('full');
  });
});
