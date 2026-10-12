import { nextThreadScrollTop } from './thread-scroll';

describe('nextThreadScrollTop', () => {
  it('jumps to the new bottom on first show (no saved position)', () => {
    expect(
      nextThreadScrollTop({
        action: 'show',
        savedScrollTop: undefined,
        prevScrollTop: 0,
        prevScrollHeight: 400,
        nextScrollHeight: 2400,
      }),
    ).toBe(2400);
  });

  it('jumps to the new bottom when a message is sent', () => {
    expect(
      nextThreadScrollTop({
        action: 'new',
        savedScrollTop: 100,
        prevScrollTop: 100,
        prevScrollHeight: 800,
        nextScrollHeight: 900,
      }),
    ).toBe(900);
  });

  it('keeps relative offset when loading older messages', () => {
    expect(
      nextThreadScrollTop({
        action: 'prev',
        savedScrollTop: 0,
        prevScrollTop: 0,
        prevScrollHeight: 800,
        nextScrollHeight: 1400,
      }),
    ).toBe(600);
  });

  it('restores saved position when reopening a shown destination', () => {
    expect(
      nextThreadScrollTop({
        action: 'show',
        savedScrollTop: 320,
        prevScrollTop: 0,
        prevScrollHeight: 400,
        nextScrollHeight: 2400,
      }),
    ).toBe(320);
  });
});
