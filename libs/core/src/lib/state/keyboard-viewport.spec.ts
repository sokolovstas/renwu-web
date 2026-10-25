import {
  KEYBOARD_INSET_THRESHOLD_PX,
  keyboardViewportState,
} from './keyboard-viewport';

describe('keyboardViewportState', () => {
  const iphone = {
    width: 390,
    innerWidth: 390,
    innerHeight: 844,
  };

  it('opens when a narrow visual viewport loses a keyboard-sized band', () => {
    const state = keyboardViewportState(
      { ...iphone, height: 844 - 336, offsetTop: 0 },
      true,
    );
    expect(state.open).toBe(true);
    expect(state.inset).toBe(336);
    expect(state.height).toBe(508);
    expect(state.offsetTop).toBe(0);
  });

  it('keeps offsetTop when iOS scrolls the visual viewport', () => {
    const state = keyboardViewportState(
      { ...iphone, height: 480, offsetTop: 120 },
      true,
    );
    expect(state.open).toBe(true);
    expect(state.height).toBe(480);
    expect(state.offsetTop).toBe(120);
    expect(state.inset).toBe(844 - 120 - 480);
  });

  it('stays closed for the URL bar and for desktop', () => {
    const urlBar = keyboardViewportState(
      { ...iphone, height: 844 - (KEYBOARD_INSET_THRESHOLD_PX - 1), offsetTop: 0 },
      true,
    );
    expect(urlBar.open).toBe(false);
    expect(urlBar.inset).toBe(0);
    expect(urlBar.offsetTop).toBe(0);

    const desktop = keyboardViewportState(
      {
        width: 1440,
        innerWidth: 1440,
        innerHeight: 900,
        height: 500,
        offsetTop: 40,
      },
      false,
    );
    expect(desktop.open).toBe(false);
    expect(desktop.height).toBe(900);
    expect(desktop.offsetTop).toBe(0);
  });
});
