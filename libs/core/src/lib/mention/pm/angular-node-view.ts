import {
  ApplicationRef,
  EnvironmentInjector,
  Type,
  createComponent,
} from '@angular/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';

export type MentionNodeViewInputs = Record<string, unknown>;

/**
 * Mounts an Angular standalone component as a ProseMirror NodeView.
 */
export function createAngularNodeView<T extends object>(options: {
  component: Type<T>;
  environmentInjector: EnvironmentInjector;
  applicationRef: ApplicationRef;
  inputs: (node: ProseMirrorNode) => MentionNodeViewInputs;
}): (
  node: ProseMirrorNode,
  view: EditorView,
  getPos: () => number | undefined,
) => NodeView {
  const { component, environmentInjector, applicationRef, inputs } = options;

  return (node) => {
    const host = document.createElement('span');
    host.className = `rw-mention-host rw-mention-host--${node.type.name}`;
    host.contentEditable = 'false';
    host.setAttribute('draggable', 'false');
    // Sizing/alignment via .rw-mention-host CSS (1rem, vertical-align: middle).
    host.style.userSelect = 'none';

    let componentRef: ReturnType<typeof createComponent<T>> | null = null;
    try {
      componentRef = createComponent(component, { environmentInjector });
      for (const [key, value] of Object.entries(inputs(node))) {
        componentRef.setInput(key, value);
      }
      host.appendChild(componentRef.location.nativeElement);

      applicationRef.attachView(componentRef.hostView);
      componentRef.changeDetectorRef.detectChanges();
    } catch (err) {
      console.error('mention NodeView failed, falling back to text', err);
      host.textContent =
        node.type.name === 'mention_issue'
          ? `#${node.attrs['key']}`
          : `@${node.attrs['username']}`;
      componentRef = null;
    }

    return {
      dom: host,
      update: (updated: ProseMirrorNode) => {
        if (updated.type !== node.type) {
          return false;
        }
        node = updated;
        if (!componentRef) {
          return true;
        }
        try {
          for (const [key, value] of Object.entries(inputs(updated))) {
            componentRef.setInput(key, value);
          }
          componentRef.changeDetectorRef.detectChanges();
        } catch (err) {
          console.error('mention NodeView update failed', err);
        }
        return true;
      },
      selectNode: () => {
        host.classList.add('ProseMirror-selectednode');
      },
      deselectNode: () => {
        host.classList.remove('ProseMirror-selectednode');
      },
      stopEvent: () => true,
      ignoreMutation: () => true,
      destroy: () => {
        if (!componentRef) {
          return;
        }
        try {
          applicationRef.detachView(componentRef.hostView);
          componentRef.destroy();
        } catch {
          /* ignore */
        }
        componentRef = null;
      },
    };
  };
}
