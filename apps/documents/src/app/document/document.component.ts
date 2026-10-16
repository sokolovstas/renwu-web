import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewEncapsulation,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwButtonComponent, RwTextInputComponent } from '@renwu/components';
import {
  RwDataService,
  RwDocument,
  RwDocumentRevision,
  RwDocumentStepsResponse,
} from '@renwu/core';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';

import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { exampleSetup } from 'prosemirror-example-setup';
import {
  collab,
  getVersion,
  receiveTransaction,
  sendableSteps,
} from 'prosemirror-collab';
import { Step } from 'prosemirror-transform';

import { docSchema, documentFromJSON } from './markdown-doc';

export { docSchema } from './markdown-doc';

/** How long to wait before retrying after a network error in the background sync loop. */
const SYNC_RETRY_DELAY_MS = 3000;
/** Conflict rebase must not sit on the long-poll (~25s) — that freezes sending. */
const CATCHUP_NOW_TIMEOUT_MS = 4000;
/** After a 409 with nothing to apply, wait before POSTing the same version again. */
const SEND_RETRY_COOLDOWN_MS = 1000;

@Component({
  selector: 'renwu-documents-document',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    RwButtonComponent,
    RwTextInputComponent,
    TranslocoPipe,
  ],
  templateUrl: './document.component.html',
  styleUrl: './document.component.scss',
  // prosemirror-view mounts DOM nodes imperatively (outside Angular's
  // template), so they never get Angular's emulated-encapsulation
  // scoping attribute — this component's CSS (incl. the imported
  // prosemirror-*/style/*.css) must stay unscoped to actually reach them.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(RwDataService);
  private readonly ngZone = inject(NgZone);

  readonly editorHost =
    viewChild<ElementRef<HTMLDivElement>>('editorHost');

  readonly documentId = signal<string | null>(null);
  readonly title = signal('');
  readonly loading = signal(false);
  readonly creating = signal(false);
  /** Surfaced only for genuinely unrecoverable states (e.g. deleted mid-session). */
  readonly fatalError = signal<string | null>(null);
  readonly revisions = signal<RwDocumentRevision[]>([]);
  /** Set while an older snapshot is open. Null means the live document. */
  readonly viewingRevision = signal<number | null>(null);

  readonly newTitle = new FormControl('', { nonNullable: true });
  private historyMode = false;

  private view: EditorView | null = null;
  private readonly clientID = Math.floor(Math.random() * 0xffffffff);
  private destroyed = false;
  private sending = false;
  private sendNotBefore = 0;
  private sendRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private syncGeneration = 0;
  private viewReady = false;
  private pendingDoc: RwDocument | null = null;

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('documentId');
      this.documentId.set(id);
      this.syncGeneration++; // invalidate any in-flight loop for the previous document
      this.view?.destroy();
      this.view = null;
      this.revisions.set([]);
      this.viewingRevision.set(null);
      this.historyMode = false;
      if (id) {
        void this.openDocument(id, this.syncGeneration);
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.pendingDoc) {
      const doc = this.pendingDoc;
      this.pendingDoc = null;
      this.mountEditor(doc, this.historyMode);
      const id = this.documentId();
      if (id && this.view) {
        this.ngZone.runOutsideAngular(() => {
          void this.syncLoop(id, this.syncGeneration);
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.sendRetryTimer !== null) {
      clearTimeout(this.sendRetryTimer);
      this.sendRetryTimer = null;
    }
    this.view?.destroy();
  }

  async createDocument(): Promise<void> {
    const title = this.newTitle.value.trim();
    if (!title || this.creating()) return;
    this.creating.set(true);
    try {
      const doc = await firstValueFrom(this.data.docsCreateDocument({ title }));
      await this.router.navigate(['..', doc.id], { relativeTo: this.route });
    } finally {
      this.creating.set(false);
    }
  }

  private async openDocument(id: string, generation: number): Promise<void> {
    this.loading.set(true);
    this.fatalError.set(null);
    try {
      const doc = await firstValueFrom(this.data.docsGetDocument(id));
      if (generation !== this.syncGeneration) return; // navigated away meanwhile
      this.title.set(doc.title);
      await this.loadRevisions(id);
      const historical = await this.historicalSnapshot(id, doc);
      const toShow = historical ?? doc;
      this.historyMode = historical !== null;
      if (this.viewReady) {
        this.mountEditor(toShow, this.historyMode);
      } else {
        this.pendingDoc = toShow;
      }
      // Do not poll until the editor exists — catchUp no-ops without a
      // view, and a tight while() around that freezes the tab.
      if (this.view) {
        this.ngZone.runOutsideAngular(() => {
          void this.syncLoop(id, generation);
        });
      }
    } catch {
      if (generation === this.syncGeneration) {
        this.fatalError.set('not-found');
      }
    } finally {
      if (generation === this.syncGeneration) {
        this.loading.set(false);
      }
    }
  }

  private mountEditor(doc: RwDocument, readonly = false): void {
    const host = this.editorHost()?.nativeElement;
    if (!host) return;
    this.view?.destroy();
    // Markdown source stored as plain paragraphs is shown as the rendered
    // document (headings, lists, tables, marks) and edited in place.
    // The collab version stays the server's: the parsed tree is deterministic,
    // and the first real edit persists that tree as the new snapshot.
    const pmDoc = documentFromJSON(doc.doc);
    const plugins = [
      ...exampleSetup({
        schema: docSchema,
        menuBar: !readonly,
        floatingMenu: false,
      }),
    ];
    if (!readonly) {
      plugins.push(collab({ version: doc.version, clientID: this.clientID }));
    }
    this.view = new EditorView(host, {
      state: EditorState.create({ doc: pmDoc, plugins }),
      editable: () => !readonly,
      dispatchTransaction: (tr) => {
        if (!this.view) return;
        if (readonly || this.historyMode) {
          this.view.updateState(this.view.state.apply(tr));
          return;
        }
        this.onDispatch(tr);
      },
    });
  }

  isRevisionActive(number: number): boolean {
    const viewing = this.viewingRevision();
    if (viewing !== null) return viewing === number;
    return number === this.latestRevision();
  }

  async showRevision(number: number): Promise<void> {
    const id = this.documentId();
    if (!id) return;
    const latest = this.latestRevision();
    if (!latest || number === latest) {
      this.historyMode = false;
      this.viewingRevision.set(null);
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { revision: null },
        queryParamsHandling: 'merge',
      });
      const doc = await firstValueFrom(this.data.docsGetDocument(id));
      this.ngZone.run(() => this.mountEditor(doc, false));
      return;
    }
    this.historyMode = true;
    this.viewingRevision.set(number);
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { revision: number },
      queryParamsHandling: 'merge',
    });
    const snapshot = await firstValueFrom(this.data.docsGetRevision(id, number));
    const doc: RwDocument = {
      id,
      title: this.title(),
      doc: snapshot.doc ?? { type: 'doc', content: [] },
      version: 0,
      created_at: snapshot.created_at,
      updated_at: snapshot.created_at,
    };
    this.ngZone.run(() => this.mountEditor(doc, true));
  }

  private latestRevision(): number {
    return this.revisions().reduce((max, rev) => Math.max(max, rev.number), 0);
  }

  private requestedRevision(): number | null {
    const raw = this.route.snapshot?.queryParamMap?.get('revision');
    if (!raw) return null;
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
  }

  private async loadRevisions(id: string): Promise<void> {
    try {
      const list = await firstValueFrom(this.data.docsListRevisions(id));
      this.revisions.set(list ?? []);
    } catch {
      this.revisions.set([]);
    }
  }

  /** Older snapshot requested via ?revision=, or null to show the live document. */
  private async historicalSnapshot(id: string, live: RwDocument): Promise<RwDocument | null> {
    const requested = this.requestedRevision();
    const latest = this.latestRevision();
    if (!requested || !latest || requested === latest) {
      this.viewingRevision.set(null);
      return null;
    }
    try {
      const snapshot = await firstValueFrom(this.data.docsGetRevision(id, requested));
      this.viewingRevision.set(requested);
      return {
        ...live,
        doc: snapshot.doc ?? live.doc,
        version: 0,
      };
    } catch {
      this.viewingRevision.set(null);
      return null;
    }
  }

  private onDispatch(tr: Transaction): void {
    if (!this.view) return;
    this.view.updateState(this.view.state.apply(tr));
    void this.maybeSend();
  }

  /** Pushes locally-unconfirmed steps to the server, retrying through a rebase on conflict. */
  private async maybeSend(): Promise<void> {
    if (!this.view || this.sending || this.destroyed || this.historyMode) return;
    if (Date.now() < this.sendNotBefore) {
      this.scheduleSendRetry(this.sendNotBefore - Date.now());
      return;
    }
    const sendable = sendableSteps(this.view.state);
    if (!sendable) return;
    const id = this.documentId();
    if (!id) return;

    this.sending = true;
    const endVersion = sendable.version + sendable.steps.length;
    try {
      await firstValueFrom(
        this.data.docsSubmitSteps(id, {
          expected_version: sendable.version,
          steps: sendable.steps.map((s) => s.toJSON()),
          client_id: String(sendable.clientID),
          doc: this.view.state.doc.toJSON(),
        }),
      );
      if (!this.view) return;
      // The background long-poll (GET /steps) often echoes the same steps
      // this POST just committed. If catchUp already applied them, confirming
      // again would inflate local version past the server and every later
      // POST would 409.
      if (getVersion(this.view.state) >= endVersion) return;
      // Server accepted at exactly sendable.version — tell the collab
      // plugin these steps are now confirmed by "receiving" them back
      // tagged with our own clientID (the documented prosemirror-collab
      // pattern for a successful submit).
      const confirmTr = receiveTransaction(
        this.view.state,
        sendable.steps,
        sendable.steps.map(() => sendable.clientID),
      );
      this.view.updateState(this.view.state.apply(confirmTr));
    } catch (err: unknown) {
      if (isHttpStatus(err, 409) && this.view) {
        const before = getVersion(this.view.state);
        await this.catchUp(id, { wait: false });
        if (this.view && getVersion(this.view.state) <= before) {
          this.sendNotBefore = Date.now() + SEND_RETRY_COOLDOWN_MS;
        }
      }
      // Other errors: the background syncLoop will retry on its own
      // schedule: leave the unconfirmed steps in place, ProseMirror's
      // collab plugin already has them queued to resend.
    } finally {
      this.sending = false;
      if (this.view && sendableSteps(this.view.state) && !this.destroyed) {
        if (Date.now() < this.sendNotBefore) {
          this.scheduleSendRetry(this.sendNotBefore - Date.now());
        } else {
          void this.maybeSend();
        }
      }
    }
  }

  private scheduleSendRetry(delayMs: number): void {
    if (this.sendRetryTimer !== null || this.destroyed) return;
    this.sendRetryTimer = setTimeout(() => {
      this.sendRetryTimer = null;
      void this.maybeSend();
    }, Math.max(0, delayMs));
  }

  private catchingUp = false;
  /** Fetches and applies steps this client is missing. Shared by the conflict-retry path and the background poll. */
  private async catchUp(
    id: string,
    options?: { wait?: boolean },
  ): Promise<void> {
    if (!this.view || this.historyMode) return;
    const wait = options?.wait !== false;
    if (wait) {
      if (this.catchingUp) return;
      this.catchingUp = true;
    }
    try {
      const version = getVersion(this.view.state);
      const get$ = wait
        ? this.data.docsGetSteps(id, version)
        : this.data.docsGetSteps(id, version, { wait: false }).pipe(
            timeout({ first: CATCHUP_NOW_TIMEOUT_MS }),
            catchError(() =>
              of({
                ok: true,
                version,
                steps: [],
              } as RwDocumentStepsResponse),
            ),
          );
      const resp = await firstValueFrom(get$);
      if (!this.view || this.historyMode) return;
      if (!resp.ok) {
        if (!wait) return;
        // Gap in the step log — the only correct move is a full refetch.
        const fresh = await firstValueFrom(this.data.docsGetDocument(id));
        this.ngZone.run(() => this.mountEditor(fresh, false));
        return;
      }
      // Re-read version after the await: maybeSend may have confirmed the
      // same steps while this GET (often a long-poll started at an older
      // version) was in flight.
      const localVersion = getVersion(this.view.state);
      const incoming = (resp.steps ?? []).filter((s) => s.version > localVersion);
      if (incoming.length === 0) return;
      const steps = incoming.map((s) => Step.fromJSON(docSchema, s.step));
      const clientIDs = incoming.map((s) => s.client_id);
      const tr = receiveTransaction(this.view.state, steps, clientIDs);
      this.view.updateState(this.view.state.apply(tr));
    } finally {
      if (wait) this.catchingUp = false;
    }
  }

  /**
   * Background catch-up loop for steps other clients committed. The server
   * endpoint itself long-polls (~25s), so this is not a busy loop — each
   * iteration blocks server-side until there's something new or the budget
   * expires, then immediately asks again.
   */
  private async syncLoop(id: string, generation: number): Promise<void> {
    while (!this.destroyed && generation === this.syncGeneration) {
      if (!this.view || this.historyMode) {
        await new Promise((r) => setTimeout(r, this.historyMode ? 400 : 50));
        continue;
      }
      const versionBefore = getVersion(this.view.state);
      const started = Date.now();
      try {
        await this.catchUp(id);
      } catch {
        await new Promise((r) => setTimeout(r, SYNC_RETRY_DELAY_MS));
        continue;
      }
      if (!this.view || this.destroyed || generation !== this.syncGeneration) {
        return;
      }
      // If GET /steps returned immediately with nothing to apply (up to
      // date, or steps we already confirmed), do not spin.
      const elapsed = Date.now() - started;
      if (getVersion(this.view.state) === versionBefore && elapsed < 1000) {
        await new Promise((r) => setTimeout(r, 1000 - elapsed));
      }
    }
  }
}

export function isHttpStatus(err: unknown, status: number): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as { status?: unknown }).status === status
  );
}
