import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
import { RwDataService, RwDocument } from '@renwu/core';
import { firstValueFrom } from 'rxjs';

import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';
import {
  collab,
  getVersion,
  receiveTransaction,
  sendableSteps,
} from 'prosemirror-collab';
import { Step } from 'prosemirror-transform';

// A plain writing surface (paragraphs, headings, lists, marks) — enough for
// AI job reports / review notes / plans. Extend the node set here if a
// document ever needs tables/images, not by hand-rolling a bespoke schema.
const docSchema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block'),
  marks: basicSchema.spec.marks,
});

/** How long to wait before retrying after a network error in the background sync loop. */
const SYNC_RETRY_DELAY_MS = 3000;

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

  readonly editorHost =
    viewChild<ElementRef<HTMLDivElement>>('editorHost');

  readonly documentId = signal<string | null>(null);
  readonly title = signal('');
  readonly loading = signal(false);
  readonly creating = signal(false);
  /** Surfaced only for genuinely unrecoverable states (e.g. deleted mid-session). */
  readonly fatalError = signal<string | null>(null);

  readonly newTitle = new FormControl('', { nonNullable: true });

  private view: EditorView | null = null;
  private readonly clientID = Math.floor(Math.random() * 0xffffffff);
  private destroyed = false;
  private sending = false;
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
      this.mountEditor(doc);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
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
      if (this.viewReady) {
        this.mountEditor(doc);
      } else {
        this.pendingDoc = doc;
      }
      void this.syncLoop(id, generation);
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

  private mountEditor(doc: RwDocument): void {
    const host = this.editorHost()?.nativeElement;
    if (!host) return;
    this.view?.destroy();
    const pmDoc = docSchema.nodeFromJSON(doc.doc);
    const state = EditorState.create({
      doc: pmDoc,
      plugins: [
        ...exampleSetup({ schema: docSchema, menuBar: true }),
        collab({ version: doc.version, clientID: this.clientID }),
      ],
    });
    this.view = new EditorView(host, {
      state,
      dispatchTransaction: (tr) => this.onDispatch(tr),
    });
  }

  private onDispatch(tr: Transaction): void {
    if (!this.view) return;
    this.view.updateState(this.view.state.apply(tr));
    void this.maybeSend();
  }

  /** Pushes locally-unconfirmed steps to the server, retrying through a rebase on conflict. */
  private async maybeSend(): Promise<void> {
    if (!this.view || this.sending || this.destroyed) return;
    const sendable = sendableSteps(this.view.state);
    if (!sendable) return;
    const id = this.documentId();
    if (!id) return;

    this.sending = true;
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
      if (isHttpStatus(err, 409)) {
        await this.catchUp(id);
      }
      // Other errors: the background syncLoop will retry on its own
      // schedule: leave the unconfirmed steps in place, ProseMirror's
      // collab plugin already has them queued to resend.
    } finally {
      this.sending = false;
      if (this.view && sendableSteps(this.view.state)) {
        void this.maybeSend(); // more edits piled up while we were sending
      }
    }
  }

  private catchingUp = false;
  /** Fetches and applies steps this client is missing. Shared by the conflict-retry path and the background poll. */
  private async catchUp(id: string): Promise<void> {
    if (!this.view || this.catchingUp) return;
    this.catchingUp = true;
    try {
      const version = getVersion(this.view.state);
      const resp = await firstValueFrom(this.data.docsGetSteps(id, version));
      if (!this.view) return;
      if (!resp.ok) {
        // Gap in the step log — the only correct move is a full refetch.
        const fresh = await firstValueFrom(this.data.docsGetDocument(id));
        this.mountEditor(fresh);
        return;
      }
      if (resp.steps.length === 0) return;
      const steps = resp.steps.map((s) => Step.fromJSON(docSchema, s.step));
      const clientIDs = resp.steps.map((s) => s.client_id);
      const tr = receiveTransaction(this.view.state, steps, clientIDs);
      this.view.updateState(this.view.state.apply(tr));
    } finally {
      this.catchingUp = false;
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
      try {
        await this.catchUp(id);
      } catch {
        await new Promise((r) => setTimeout(r, SYNC_RETRY_DELAY_MS));
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
