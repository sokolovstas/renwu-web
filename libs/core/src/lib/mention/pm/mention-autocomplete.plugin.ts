import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  createComponent,
} from '@angular/core';
import {
  VirtualElement,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
} from '@floating-ui/dom';
import { mySchema } from '@renwu/components';
import { Mentions } from '@renwu/mentions';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Subscription } from 'rxjs';
import { Issue } from '../../issue/issue.model';
import { User } from '../../user/user.model';
import { MentionAutocompleteComponent } from './mention-autocomplete.component';

export interface MentionAutocompleteOptions {
  providers: Mentions<unknown>[];
  environmentInjector: EnvironmentInjector;
  applicationRef: ApplicationRef;
  onActiveChange?: (active: boolean) => void;
}

interface MentionRange {
  from: number;
  to: number;
  trigger: string;
  query: string;
  provider: Mentions<unknown>;
}

interface PluginState {
  active: boolean;
  range: MentionRange | null;
}

const key = new PluginKey<PluginState>('rwMentionAutocomplete');

const QUERY_RE = /^([^\s@#]*)$/;

function resolveRange(
  state: EditorState,
  providers: Mentions<unknown>[],
): MentionRange | null {
  const { $from } = state.selection;
  if (!$from.parent.isTextblock) {
    return null;
  }
  const textBefore = $from.parent.textBetween(
    0,
    $from.parentOffset,
    undefined,
    '\ufffc',
  );
  let best = -1;
  let trigger = '';
  for (const p of providers) {
    for (const ch of p.triggerChars) {
      const idx = textBefore.lastIndexOf(ch);
      if (idx > best) {
        best = idx;
        trigger = ch;
      }
    }
  }
  if (best < 0) {
    return null;
  }
  if (best > 0 && !/\s/.test(textBefore[best - 1])) {
    return null;
  }
  const query = textBefore.slice(best + 1);
  if (!QUERY_RE.test(query)) {
    return null;
  }
  const provider = providers.find((p) => p.triggerChars.includes(trigger));
  if (!provider) {
    return null;
  }
  const from = $from.start() + best;
  const to = $from.pos;
  return { from, to, trigger, query, provider };
}

function insertMention(
  view: EditorView,
  range: MentionRange,
  item: unknown,
): void {
  let node: ProseMirrorNode | null = null;
  if (range.trigger === '@') {
    const user = item as User;
    if (!user?.username) {
      return;
    }
    node = mySchema.nodes['mention_user'].create({ username: user.username });
  } else {
    const issue = item as Issue;
    if (!issue?.key) {
      return;
    }
    node = mySchema.nodes['mention_issue'].create({
      key: String(issue.key).toUpperCase(),
    });
  }
  let tr = view.state.tr.replaceWith(range.from, range.to, node);
  const afterMention = tr.mapping.map(range.from) + node.nodeSize;
  // Trailing space doubles as the text node that prevents ProseMirror-separator.
  tr = tr.insertText(' ', afterMention);
  const caret = afterMention + 1;
  tr = tr
    .setSelection(TextSelection.create(tr.doc, caret))
    .scrollIntoView();
  view.dispatch(tr);
  // Angular NodeView mount can steal DOM selection — restore after paint.
  const restore = () => {
    if (view.isDestroyed) {
      return;
    }
    const max = view.state.doc.content.size;
    const sel = TextSelection.near(view.state.doc.resolve(Math.min(caret, max)), 1);
    if (!view.state.selection.eq(sel)) {
      view.dispatch(view.state.tr.setSelection(sel));
    }
    view.focus();
  };
  queueMicrotask(restore);
  requestAnimationFrame(restore);
}

function caretVirtualElement(view: EditorView, from: number): VirtualElement {
  return {
    getBoundingClientRect() {
      const coords = view.coordsAtPos(from);
      const height = Math.max(1, coords.bottom - coords.top);
      return {
        width: 0,
        height,
        x: coords.left,
        y: coords.top,
        top: coords.top,
        left: coords.left,
        right: coords.left,
        bottom: coords.top + height,
      };
    },
    contextElement: view.dom,
  };
}

export function createMentionAutocompletePlugin(
  options: MentionAutocompleteOptions,
): Plugin {
  const { providers, environmentInjector, applicationRef, onActiveChange } =
    options;

  let popupRef: ComponentRef<MentionAutocompleteComponent> | null = null;
  let popupHost: HTMLElement | null = null;
  let itemsSub: Subscription | null = null;
  let lastQueryKey = '';
  let floatingCleanup: (() => void) | null = null;
  let anchorFrom = -1;

  const stopFloating = () => {
    floatingCleanup?.();
    floatingCleanup = null;
    anchorFrom = -1;
  };

  const destroyPopup = () => {
    itemsSub?.unsubscribe();
    itemsSub = null;
    lastQueryKey = '';
    stopFloating();
    if (popupRef) {
      applicationRef.detachView(popupRef.hostView);
      popupRef.destroy();
      popupRef = null;
    }
    popupHost?.remove();
    popupHost = null;
    onActiveChange?.(false);
  };

  const ensurePopup = (view: EditorView) => {
    if (popupRef && popupHost) {
      return popupRef;
    }
    popupRef = createComponent(MentionAutocompleteComponent, {
      environmentInjector,
    });
    popupHost = popupRef.location.nativeElement as HTMLElement;
    popupHost.classList.add('rw-mention-ac-popup');
    document.body.appendChild(popupHost);

    popupRef.instance.pick.subscribe((item) => {
      const st = key.getState(view.state);
      if (st?.range) {
        insertMention(view, st.range, item);
      }
      destroyPopup();
      view.dispatch(view.state.tr.setMeta(key, { close: true }));
    });
    applicationRef.attachView(popupRef.hostView);
    onActiveChange?.(true);
    return popupRef;
  };

  const positionPopup = (view: EditorView, from: number) => {
    if (!popupHost) {
      return;
    }
    if (floatingCleanup && anchorFrom === from) {
      return;
    }
    stopFloating();
    anchorFrom = from;
    const reference = caretVirtualElement(view, from);
    const floating = popupHost;

    const compute = () =>
      computePosition(reference, floating, {
        placement: 'bottom-start',
        strategy: 'fixed',
        middleware: [
          offset(4),
          flip({ fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] }),
          shift({ padding: 8 }),
          size({
            padding: 8,
            apply({ availableHeight, elements }) {
              Object.assign(elements.floating.style, {
                maxHeight: `${Math.min(240, Math.max(120, availableHeight))}px`,
              });
            },
          }),
        ],
      }).then(({ x, y }) => {
        Object.assign(floating.style, {
          position: 'fixed',
          left: `${x}px`,
          top: `${y}px`,
        });
      });

    floatingCleanup = autoUpdate(reference, floating, compute);
    void compute();
  };

  const syncPopup = (view: EditorView, range: MentionRange | null) => {
    if (!range) {
      destroyPopup();
      return;
    }
    const ref = ensurePopup(view);
    ref.instance.itemComponent = range.provider.itemComponent;
    positionPopup(view, range.from);
    const qkey = `${range.trigger}:${range.query}`;
    if (qkey !== lastQueryKey) {
      lastQueryKey = qkey;
      itemsSub?.unsubscribe();
      itemsSub = range.provider.getItems(range.query).subscribe((items) => {
        if (popupRef) {
          popupRef.instance.items = items as unknown[];
          popupRef.instance.activeIndex = 0;
          popupRef.changeDetectorRef.detectChanges();
        }
      });
    }
    ref.changeDetectorRef.detectChanges();
  };

  return new Plugin<PluginState>({
    key,
    state: {
      init: () => ({ active: false, range: null }),
      apply: (tr, value, _old, state) => {
        if (tr.getMeta(key)?.close) {
          return { active: false, range: null };
        }
        if (!tr.docChanged && !tr.selectionSet) {
          return value;
        }
        const range = resolveRange(state, providers);
        return { active: !!range, range };
      },
    },
    props: {
      handleKeyDown(view, event) {
        const st = key.getState(view.state);
        if (!st?.active || !popupRef) {
          return false;
        }
        const consume = () => {
          // ProseMirror only preventDefault's — stop bubbling so messaging
          // Enter-to-send (parent keydown) does not also fire.
          event.stopPropagation();
          return true;
        };
        if (event.key === 'ArrowDown') {
          popupRef.instance.move(1);
          popupRef.changeDetectorRef.detectChanges();
          return consume();
        }
        if (event.key === 'ArrowUp') {
          popupRef.instance.move(-1);
          popupRef.changeDetectorRef.detectChanges();
          return consume();
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          // While the popup is open, never let Enter fall through to send.
          const item = popupRef.instance.activeItem();
          if (item && st.range) {
            insertMention(view, st.range, item);
            destroyPopup();
            // Don't dispatch an extra tr here — insertMention already
            // updated the doc; another tr can disturb the restored caret.
          }
          return consume();
        }
        if (event.key === 'Escape') {
          destroyPopup();
          view.dispatch(view.state.tr.setMeta(key, { close: true }));
          return consume();
        }
        return false;
      },
    },
    view: () => {
      return {
        update: (v) => {
          const st = key.getState(v.state);
          syncPopup(v, st?.range ?? null);
        },
        destroy: () => destroyPopup(),
      };
    },
  });
}

export function isMentionAutocompleteActive(state: EditorState): boolean {
  return !!key.getState(state)?.active;
}
