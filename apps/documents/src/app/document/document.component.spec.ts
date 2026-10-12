import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RwDataService, RwDocument, RwDocumentStepsResponse } from '@renwu/core';
import { NEVER, Observable, of, throwError } from 'rxjs';

import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { collab, getVersion, sendableSteps } from 'prosemirror-collab';

import { DocumentComponent, docSchema, isHttpStatus } from './document.component';

function paragraphDoc(text: string) {
  return docSchema.node('doc', null, [
    docSchema.node('paragraph', null, text ? [docSchema.text(text)] : []),
  ]);
}

function stateAt(version: number, clientID: number, text = 'hello') {
  return EditorState.create({
    doc: paragraphDoc(text),
    plugins: [collab({ version, clientID })],
  });
}

function firstSendableStepJSON(state: EditorState) {
  const sendable = sendableSteps(state);
  if (!sendable) {
    throw new Error('expected unconfirmed steps');
  }
  return sendable.steps[0].toJSON();
}

/** Minimal EditorView stand-in: only `.state`/`.updateState()`/`.destroy()`
 * are used by the private methods under test (and by ngOnDestroy), so a
 * real (jsdom-mounted) EditorView — fragile in this ProseMirror version
 * under jsdom — is unnecessary. */
function fakeView(state: EditorState): EditorView {
  const view = {
    state,
    updateState(next: EditorState) {
      view.state = next;
    },
    destroy() {
      /* no-op */
    },
  };
  return view as unknown as EditorView;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Priv = any;

describe('DocumentComponent collab sync', () => {
  let component: DocumentComponent;
  let docsSubmitSteps: jest.Mock;
  let docsGetSteps: jest.Mock;
  let docsGetDocument: jest.Mock;

  beforeEach(() => {
    docsSubmitSteps = jest.fn();
    docsGetSteps = jest.fn();
    docsGetDocument = jest.fn();

    TestBed.configureTestingModule({
      imports: [DocumentComponent],
      providers: [
        {
          provide: ActivatedRoute,
          // Never emits: the constructor subscribes but openDocument/syncLoop
          // never start, so tests can drive maybeSend/catchUp directly
          // without a background poll loop racing them.
          useValue: { paramMap: NEVER },
        },
        { provide: Router, useValue: { navigate: jest.fn() } },
        {
          provide: RwDataService,
          useValue: { docsSubmitSteps, docsGetSteps, docsGetDocument },
        },
      ],
    });
    component = TestBed.createComponent(DocumentComponent).componentInstance;
    (component as Priv).documentId.set('doc-1');
  });

  afterEach(() => {
    (component as Priv).ngOnDestroy();
  });

  it('onDispatch applies the transaction locally and kicks off a send', () => {
    const view = fakeView(stateAt(0, 42));
    (component as Priv).view = view;
    const maybeSend = jest
      .spyOn(component as Priv, 'maybeSend')
      .mockResolvedValue(undefined);

    const tr = view.state.tr.insertText('!', view.state.doc.content.size - 1);
    (component as Priv).onDispatch(tr);

    expect(view.state.doc.textContent).toBe('hello!');
    expect(maybeSend).toHaveBeenCalledTimes(1);
  });

  it('maybeSend submits sendable steps and confirms them on success', async () => {
    const view = fakeView(stateAt(0, 42));
    (component as Priv).view = view;
    docsSubmitSteps.mockReturnValue(of({} as RwDocument));

    const tr = view.state.tr.insertText('!', view.state.doc.content.size - 1);
    view.updateState(view.state.apply(tr));

    await (component as Priv).maybeSend();

    expect(docsSubmitSteps).toHaveBeenCalledTimes(1);
    const [id, body] = docsSubmitSteps.mock.calls[0];
    expect(id).toBe('doc-1');
    expect(body.expected_version).toBe(0);
    expect(body.client_id).toBe('42');
    expect(body.steps).toHaveLength(1);

    // Server accepted → the collab plugin has nothing left to send.
    expect(sendableSteps(view.state)).toBeNull();
    expect(getVersion(view.state)).toBe(1);
  });

  it('catchUp does not double-count own steps already confirmed on submit', async () => {
    const view = fakeView(stateAt(0, 42));
    (component as Priv).view = view;
    docsSubmitSteps.mockReturnValue(of({} as RwDocument));

    const tr = view.state.tr.insertText('!', view.state.doc.content.size - 1);
    view.updateState(view.state.apply(tr));
    const stepJSON = firstSendableStepJSON(view.state);

    await (component as Priv).maybeSend();
    expect(getVersion(view.state)).toBe(1);

    // Long-poll started at version 0 still returns the step this client
    // just posted. Applying it again would inflate local version past the
    // server and every later POST would 409.
    docsGetSteps.mockReturnValue(
      of({
        ok: true,
        version: 1,
        steps: [{ version: 1, client_id: '42', step: stepJSON }],
      } as RwDocumentStepsResponse),
    );

    await (component as Priv).catchUp('doc-1');

    expect(getVersion(view.state)).toBe(1);
    expect(view.state.doc.textContent).toBe('hello!');
    expect(sendableSteps(view.state)).toBeNull();
  });

  it('maybeSend does not confirm again if catchUp already applied the same steps', async () => {
    const view = fakeView(stateAt(0, 42));
    (component as Priv).view = view;

    const tr = view.state.tr.insertText('!', view.state.doc.content.size - 1);
    view.updateState(view.state.apply(tr));
    const stepJSON = firstSendableStepJSON(view.state);

    docsGetSteps.mockReturnValue(
      of({
        ok: true,
        version: 1,
        steps: [{ version: 1, client_id: '42', step: stepJSON }],
      } as RwDocumentStepsResponse),
    );
    docsSubmitSteps.mockImplementation(
      () =>
        new Observable((subscriber) => {
          void (component as Priv).catchUp('doc-1').then(() => {
            subscriber.next({} as RwDocument);
            subscriber.complete();
          });
        }),
    );

    await (component as Priv).maybeSend();

    expect(getVersion(view.state)).toBe(1);
    expect(sendableSteps(view.state)).toBeNull();
  });

  it('409 rebase is not skipped while the background long-poll is in flight', async () => {
    const view = fakeView(stateAt(0, 42));
    (component as Priv).view = view;

    const otherState = stateAt(0, 99, 'hello');
    const otherTr = otherState.tr.insertText(
      '?',
      otherState.doc.content.size - 1,
    );
    const otherStep = otherTr.steps[0];

    docsGetSteps
      .mockReturnValueOnce(NEVER)
      .mockReturnValueOnce(
        of({
          ok: true,
          version: 1,
          steps: [{ version: 1, client_id: '99', step: otherStep.toJSON() }],
        } as RwDocumentStepsResponse),
      );
    docsSubmitSteps
      .mockReturnValueOnce(throwError(() => ({ status: 409 })))
      .mockReturnValueOnce(of({} as RwDocument));

    void (component as Priv).catchUp('doc-1');

    const localTr = view.state.tr.insertText(
      '!',
      view.state.doc.content.size - 1,
    );
    view.updateState(view.state.apply(localTr));

    await (component as Priv).maybeSend();

    expect(docsGetSteps).toHaveBeenCalledTimes(2);
    expect(docsGetSteps.mock.calls[1][2]).toEqual({ wait: false });
    expect(docsSubmitSteps).toHaveBeenCalledTimes(2);
    expect(docsSubmitSteps.mock.calls[1][1].expected_version).toBe(1);
    expect(view.state.doc.textContent).toBe('hello?!');
    expect(sendableSteps(view.state)).toBeNull();
  });

  it('409 with nothing to rebase does not stall maybeSend', async () => {
    const view = fakeView(stateAt(0, 42));
    (component as Priv).view = view;
    docsSubmitSteps.mockReturnValue(throwError(() => ({ status: 409 })));
    docsGetSteps.mockReturnValue(
      of({ ok: true, version: 0, steps: [] } as RwDocumentStepsResponse),
    );

    const tr = view.state.tr.insertText('!', view.state.doc.content.size - 1);
    view.updateState(view.state.apply(tr));

    const started = Date.now();
    await (component as Priv).maybeSend();

    expect(Date.now() - started).toBeLessThan(500);
    expect(docsSubmitSteps).toHaveBeenCalledTimes(1);
    expect(sendableSteps(view.state)).not.toBeNull();
  });

  it('maybeSend rebases and resends on a 409 version conflict', async () => {
    const view = fakeView(stateAt(0, 42));
    (component as Priv).view = view;

    // A different client's already-confirmed step, generated the same way
    // the real server would have stored it (a real Step, not a hand-built
    // JSON blob).
    const otherState = stateAt(0, 99, 'hello');
    const otherTr = otherState.tr.insertText('?', otherState.doc.content.size - 1);
    const otherStep = otherTr.steps[0];

    docsSubmitSteps
      .mockReturnValueOnce(throwError(() => ({ status: 409 })))
      .mockReturnValueOnce(of({} as RwDocument));
    docsGetSteps.mockReturnValue(
      of({
        ok: true,
        version: 1,
        steps: [{ version: 1, client_id: '99', step: otherStep.toJSON() }],
      } as RwDocumentStepsResponse),
    );

    const localTr = view.state.tr.insertText('!', view.state.doc.content.size - 1);
    view.updateState(view.state.apply(localTr));

    await (component as Priv).maybeSend();

    // Rebased onto the remote step, then resubmitted at the new version.
    expect(docsGetSteps).toHaveBeenCalledWith('doc-1', 0, { wait: false });
    expect(docsSubmitSteps).toHaveBeenCalledTimes(2);
    expect(docsSubmitSteps.mock.calls[1][1].expected_version).toBe(1);
    expect(view.state.doc.textContent).toBe('hello?!');
    expect(sendableSteps(view.state)).toBeNull();
  });

  it('catchUp refetches the whole document when the server reports a step-log gap', async () => {
    const view = fakeView(stateAt(3, 42));
    (component as Priv).view = view;
    const fresh: RwDocument = {
      id: 'doc-1',
      title: 'Doc',
      doc: paragraphDoc('resynced').toJSON(),
      version: 9,
      created_at: '',
      updated_at: '',
    };
    docsGetSteps.mockReturnValue(
      of({ ok: false, version: 9, steps: [] } as RwDocumentStepsResponse),
    );
    docsGetDocument.mockReturnValue(of(fresh));

    await (component as Priv).catchUp('doc-1');

    expect(docsGetSteps).toHaveBeenCalledWith('doc-1', 3);
    expect(docsGetDocument).toHaveBeenCalledWith('doc-1');
  });

  it('catchUp applies steps other clients committed while idle', async () => {
    const view = fakeView(stateAt(0, 42));
    (component as Priv).view = view;

    const otherState = stateAt(0, 7, 'hello');
    const otherTr = otherState.tr.insertText(' world', otherState.doc.content.size - 1);
    docsGetSteps.mockReturnValue(
      of({
        ok: true,
        version: 1,
        steps: [{ version: 1, client_id: '7', step: otherTr.steps[0].toJSON() }],
      } as RwDocumentStepsResponse),
    );

    await (component as Priv).catchUp('doc-1');

    expect(view.state.doc.textContent).toBe('hello world');
    expect(getVersion(view.state)).toBe(1);
    expect(docsGetDocument).not.toHaveBeenCalled();
  });
});

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
