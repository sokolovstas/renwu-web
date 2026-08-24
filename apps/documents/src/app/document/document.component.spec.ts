import { isHttpStatus } from './document.component';

// Component-level ProseMirror + HTTP-long-poll integration is exercised
// manually (see docs/adr/*) rather than through TestBed here — same
// convention as the rest of the AI settings area (apps/settings/src/app/ai),
// none of which carry component specs either, since mocking a full
// EditorView + collab HTTP round trip would test the mocks more than the
// code. isHttpStatus is the one pure, cheaply-testable piece.
describe('isHttpStatus', () => {
  it('matches an HttpErrorResponse-shaped object with the given status', () => {
    expect(isHttpStatus({ status: 409 }, 409)).toBe(true);
  });

  it('does not match a different status', () => {
    expect(isHttpStatus({ status: 500 }, 409)).toBe(false);
  });

  it('does not match non-object values', () => {
    expect(isHttpStatus(null, 409)).toBe(false);
    expect(isHttpStatus(undefined, 409)).toBe(false);
    expect(isHttpStatus('409', 409)).toBe(false);
  });
});
