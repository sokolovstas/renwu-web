export type ThreadScrollAction = 'next' | 'prev' | 'new' | 'init' | 'show';

/** Where the thread scroller should sit after a messages update. */
export function nextThreadScrollTop(args: {
  action: ThreadScrollAction | undefined;
  savedScrollTop: number | undefined;
  prevScrollTop: number;
  prevScrollHeight: number;
  nextScrollHeight: number;
}): number {
  const {
    action,
    savedScrollTop,
    prevScrollTop,
    prevScrollHeight,
    nextScrollHeight,
  } = args;

  if (action === 'prev' || action === 'next') {
    return prevScrollTop + nextScrollHeight - prevScrollHeight;
  }

  if (action === 'show' && savedScrollTop !== undefined) {
    return savedScrollTop;
  }

  // First open, new message, or unknown action → stick to latest.
  return nextScrollHeight;
}
