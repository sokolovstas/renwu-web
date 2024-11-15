import { filter, fromEvent, map, merge, tap } from 'rxjs';

interface EventListenerObject<E> {
  handleEvent(evt: E): void;
}

interface HasEventTargetAddRemove<E> {
  addEventListener(
    type: string,
    listener: ((evt: E) => void) | EventListenerObject<E> | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: ((evt: E) => void) | EventListenerObject<E> | null,
    options?: EventListenerOptions | boolean,
  ): void;
}

export function touchAndMouseStart(
  element: HasEventTargetAddRemove<MouseEvent | TouchEvent>,
  opts?: { preventDefault: boolean },
) {
  return _touchAndMouse(element, 'mousedown', 'touchstart', opts);
}

export function touchAndMouseEnd(
  element: HasEventTargetAddRemove<MouseEvent | TouchEvent>,
) {
  return _touchAndMouse(element, 'mouseup', 'touchend');
}

export function touchAndMouseMove(
  element: HasEventTargetAddRemove<MouseEvent | TouchEvent>,
) {
  return _touchAndMouse(element, 'mousemove', 'touchmove');
}

function _touchAndMouse(
  element: HasEventTargetAddRemove<MouseEvent | TouchEvent>,
  mouseEvent: 'mousedown' | 'mouseup' | 'mousemove',
  touchEvent: 'touchstart' | 'touchend' | 'touchmove',
  opts?: { preventDefault: boolean },
) {
  return merge(
    fromEvent<MouseEvent>(element, mouseEvent).pipe(
      filter((e) => e.button != 3),
      tap((e) => {
        if (opts?.preventDefault && e.cancelable) {
          e.preventDefault();
        }
      }),
      map((e) => ({ x: e.pageX, y: e.pageY })),
    ),
    fromEvent<TouchEvent>(element, touchEvent).pipe(
      tap((e) => {
        if (opts?.preventDefault && e.cancelable) {
          e.preventDefault();
        }
      }),
      map((e) => ({ x: e.touches[0]?.pageX, y: e.touches[0]?.pageY })),
    ),
  );
}
