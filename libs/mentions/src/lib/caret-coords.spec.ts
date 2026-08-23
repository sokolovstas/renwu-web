import { getCaretCoordinates } from './caret-coords';

describe('getCaretCoordinates', () => {
  let textarea: HTMLTextAreaElement;

  beforeEach(() => {
    textarea = document.createElement('textarea');
    textarea.value = 'Hello world, this is a mention test';
    document.body.appendChild(textarea);
  });

  afterEach(() => {
    document.body.removeChild(textarea);
  });

  it('returns a top/left/height coordinate object', () => {
    const coords = getCaretCoordinates(textarea, 5, null);

    expect(coords).toEqual(
      expect.objectContaining({
        top: expect.any(Number),
        left: expect.any(Number),
        height: expect.any(Number),
      }),
    );
  });

  it('removes the mirror div from the document after measuring', () => {
    getCaretCoordinates(textarea, 5, null);

    expect(
      document.querySelector('#input-textarea-caret-position-mirror-div'),
    ).toBeNull();
  });

  it('keeps the mirror div in the document when debug is true', () => {
    getCaretCoordinates(textarea, 5, { debug: true });

    const mirror = document.querySelector(
      '#input-textarea-caret-position-mirror-div',
    );
    expect(mirror).not.toBeNull();
    mirror.parentNode.removeChild(mirror);
  });

  it('works the same way for an <input> element', () => {
    const input = document.createElement('input');
    input.value = 'short text';
    document.body.appendChild(input);

    const coords = getCaretCoordinates(input, 3, null);

    expect(coords).toEqual(
      expect.objectContaining({
        top: expect.any(Number),
        left: expect.any(Number),
        height: expect.any(Number),
      }),
    );
    document.body.removeChild(input);
  });

  it('handles a caret position at the very end of the value', () => {
    const coords = getCaretCoordinates(
      textarea,
      textarea.value.length,
      null,
    );

    expect(coords).toEqual(
      expect.objectContaining({
        top: expect.any(Number),
        left: expect.any(Number),
        height: expect.any(Number),
      }),
    );
  });
});
