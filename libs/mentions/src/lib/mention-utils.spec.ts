import {
  getCaretPosition,
  getValue,
  insertValue,
  isInputOrTextAreaElement,
  isTextElement,
  setCaretPosition,
} from './mention-utils';

describe('mention-utils', () => {
  describe('isInputOrTextAreaElement', () => {
    it.each([
      ['input', document.createElement('input'), true],
      ['textarea', document.createElement('textarea'), true],
      ['div', document.createElement('div'), false],
      ['null', null, false],
    ])('%s returns %p', (_label, el, expected) => {
      expect(isInputOrTextAreaElement(el as HTMLElement)).toBe(expected);
    });
  });

  describe('isTextElement', () => {
    it.each([
      ['input', document.createElement('input'), true],
      ['textarea', document.createElement('textarea'), true],
      ['div', document.createElement('div'), false],
      ['null', null, false],
    ])('%s returns %p', (_label, el, expected) => {
      expect(isTextElement(el as HTMLElement)).toBe(expected);
    });

    it('treats a text node as a text element', () => {
      const textNode = document.createTextNode('hello');
      expect(isTextElement(textNode as unknown as HTMLElement)).toBe(true);
    });
  });

  describe('getValue', () => {
    it('reads .value from an input', () => {
      const input = document.createElement('input');
      input.value = 'hello';
      expect(getValue(input)).toBe('hello');
    });

    it('reads .value from a textarea', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'hello world';
      expect(getValue(textarea as unknown as HTMLInputElement)).toBe(
        'hello world',
      );
    });

    it('falls back to textContent for a non-input element', () => {
      const div = document.createElement('div');
      div.textContent = 'plain text';
      expect(getValue(div as unknown as HTMLInputElement)).toBe('plain text');
    });

    it('returns empty string when textContent is null', () => {
      const div = document.createElement('div');
      expect(getValue(div as unknown as HTMLInputElement)).toBe('');
    });
  });

  describe('insertValue on input/textarea elements', () => {
    it('inserts text at the given range', () => {
      const input = document.createElement('input');
      input.value = 'hello world';
      document.body.appendChild(input);

      insertValue(input, 6, 11, 'there');

      expect(input.value).toBe('hello there');
      document.body.removeChild(input);
    });

    it('replaces a selection range with the given text', () => {
      const input = document.createElement('input');
      input.value = '@jo test';
      document.body.appendChild(input);

      insertValue(input, 0, 3, '@john ');

      expect(input.value).toBe('@john  test');
      document.body.removeChild(input);
    });

    it('moves the caret to the end of the inserted text', () => {
      const input = document.createElement('input');
      input.value = 'ab';
      document.body.appendChild(input);

      insertValue(input, 2, 2, 'cd');

      expect(input.value).toBe('abcd');
      expect(input.selectionStart).toBe(4);
      document.body.removeChild(input);
    });
  });

  describe('setCaretPosition / getCaretPosition on input elements', () => {
    it('round-trips a caret position', () => {
      const input = document.createElement('input');
      input.value = 'hello world';
      document.body.appendChild(input);

      setCaretPosition(input, 5);

      expect(getCaretPosition(input)).toBe(5);
      document.body.removeChild(input);
    });

    it('returns 0 for an empty/unfocused element outside the DOM', () => {
      const input = document.createElement('input');
      input.value = '';
      // selectionStart is 0 for an empty, unfocused input, so
      // setCaretPosition falls through to the contenteditable branch;
      // reading it back still resolves via selectionStart.
      expect(getCaretPosition(input)).toBe(0);
    });
  });
});
