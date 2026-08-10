import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  markdownSerializer,
  RwDatePipe,
  RwIconComponent,
  RwTextAreaComponent,
  RwToastService,
  RwTooltipDirective,
} from '@renwu/components';
import {
  Attachment,
  AttachmentComponent,
  ChatCommand,
  createMentionEditorExtras,
  RwDataService,
  RwSettingsService,
  RwUserService,
  StateService,
} from '@renwu/core';
import { destroyObservable } from '@renwu/utils';
import { Plugin } from 'prosemirror-state';
import { firstValueFrom, Subject, merge } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import {
  DestinationType,
  IssueDestinationInfo,
} from '../data/messages.model';
import { MessageDestination } from '../message-destination';
import { MessageItem } from '../message-item';
import { RwMessageService } from '../message.service';

@Component({
  selector: 'renwu-messaging-input',
  standalone: true,
  imports: [
    AttachmentComponent,
    RwTextAreaComponent,
    RwIconComponent,
    RwDatePipe,
    FormsModule,
    AsyncPipe,
    RwTooltipDirective,
    TranslocoPipe
],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MessageInputComponent implements OnInit {
  private el = inject(ElementRef);
  stateService = inject(StateService);
  settingsService = inject(RwSettingsService);
  userService = inject(RwUserService);
  protected messageService = inject(RwMessageService);
  private dataService = inject(RwDataService);
  private toast = inject(RwToastService);
  private cd = inject(ChangeDetectorRef);

  destroy = inject(DestroyRef);
  transloco = inject(TranslocoService);
  destinationChange = new Subject<void>();
  private commandBusy = false;

  @ViewChild('attachments', { static: true })
  attachments: AttachmentComponent;

  @Input()
  set destination(value: MessageDestination) {
    this._destination = value;
    this.destinationChange.next();
    this.initDestination();
  }
  get destination(): MessageDestination {
    return this._destination;
  }

  _destination: MessageDestination;

  @Input()
  fromSidebar: boolean;

  @Input()
  displayButtonChangeType: boolean;

  @Input()
  disableChangeType: boolean;

  @ViewChild('textarea', { static: false })
  textarea: RwTextAreaComponent;

  mentionEditor = createMentionEditorExtras({
    includeSlashCommands: true,
    onActiveChange: (active) => {
      this.messageService.mention = active;
    },
    onCommandSelect: (cmd) => {
      void this.runCommandFromPalette(cmd);
    },
  });

  /** Runs before exampleSetup keymaps so Mod-Enter is not eaten by hard_break. */
  private sendEnterPlugin = new Plugin({
    props: {
      handleKeyDown: (_view, event: KeyboardEvent) =>
        this.trySendOnEnter(event),
    },
  });

  editorPlugins = [...this.mentionEditor.plugins, this.sendEnterPlugin];

  isExternal: boolean;
  sendWithMod: boolean;
  canReceiveFiles: boolean;
  sendWithModifier: boolean;
  disableAttachments: boolean;
  disableSendMessage: boolean;
  displayChangeTypeWithOpacity: boolean;
  text = '';
  editMessage: MessageItem;

  DestinationType = DestinationType;

  prompt = this.messageService.connected.pipe(
    distinctUntilChanged(),
    map((v) => {
      if (v) {
        return this.transloco.translate('messaging.write-a-message');
      } else {
        return this.transloco.translate('messaging.no-connection');
      }
    }),
  );

  // providers: MentionProvider[];

  // CLIPBOARD PASTE FILE
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    if (this.attachments && !this.disableAttachments && this.canReceiveFiles) {
      this.attachments.onPaste(event);
      event.stopImmediatePropagation();
    }
  }

  constructor() {
    this.transloco.translate('messaging.write-a-message');
    // this.stateService.messagingOpened
    //   .pipe(takeUntilDestroyed(this.destroy))
    //   .subscribe((opened) => {
    //     this.canReceiveFiles = opened && this.fromSidebar;
    //     this.cd.markForCheck();
    //   });

    // this.providers = [
    //   mentionProviderService.getUser(el.nativeElement),
    //   mentionProviderService.getIssue(el.nativeElement),
    //   mentionProviderService.getEmoji(el.nativeElement),
    // ];
    this.settingsService.user.updated
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => {
        this.sendWithModifier =
          this.settingsService.user.send_with_modifier_key;
        this.cd.markForCheck();
      });
    this.sendWithModifier = this.settingsService.user.send_with_modifier_key;
  }
  ngOnInit() {
    this.transloco.translate('messaging.write-a-message');
    if (
      this.editMessage &&
      (this.editMessage.subMessageCount || this.editMessage.subMembers)
    ) {
      this.displayChangeTypeWithOpacity = true;
    } else {
      this.displayChangeTypeWithOpacity = false;
    }
    this.canReceiveFiles = true;
    // this.stateService.messagingOpened.getValue() && this.fromSidebar;
    this.cd.markForCheck();
  }

  initDestination() {
    if (!this.destination) {
      return;
    }
    this.destination.editMessage
      .pipe(
        takeUntil(
          merge(destroyObservable(this.destroy), this.destinationChange),
        ),
      )
      .subscribe((messageItem) => {
        this.editMessage = messageItem;
        if (!messageItem) {
          this.text = this.messageService.getTempMessage(this.destination);
          this.cd.markForCheck();
          return;
        }
        this.text = messageItem.message.message;
        this.setFocus();
      });
    this.destination.isExternal
      .pipe(
        takeUntil(
          merge(destroyObservable(this.destroy), this.destinationChange),
        ),
      )
      .subscribe((value) => {
        this.displayButtonChangeType = value;
        this.cd.markForCheck();
      });
  }
  changeTypeExternal() {
    if (this.disableChangeType) {
      return;
    }
    this.isExternal = !this.isExternal;
  }
  selectEmoji(emoji: string) {
    if (emoji && emoji !== ':') {
      let selectionStart = this.text.length;
      const selectionStartTextarea =
        this.textarea.textarea.nativeElement.selectionStart;
      if (
        selectionStartTextarea !== null &&
        selectionStartTextarea !== undefined
      ) {
        selectionStart = selectionStartTextarea;
      }
      this.text =
        this.text.substring(0, selectionStart) +
        emoji +
        this.text.substring(selectionStart);
      this.setFocus();
      setTimeout(() => {
        this.textarea.textarea.nativeElement.selectionStart =
          selectionStart + emoji.length;
        this.textarea.textarea.nativeElement.selectionEnd =
          selectionStart + emoji.length;
      });
    }
  }
  onCancelEdit() {
    this.destination.edit(undefined);
    this.text = '';
    this.messageService.clearTempMessage(this.destination);
  }
  onFileUploaded(file: Attachment) {
    this.destination.postFile(file, this.text);
  }
  onKeyDown(event: KeyboardEvent): void {
    if (!this.editMessage) {
      this.messageService.setTempMessage(this.destination, this.text);
    }
    // Enter-to-send is handled in sendEnterPlugin (before PM hard_break).
    // Mention autocomplete stopPropagates while open; ignore if already consumed.
    if (event.defaultPrevented || this.messageService.mention) {
      return;
    }
    if (event.key === 'ArrowUp' && (!this.text || this.text.length === 0)) {
      event.preventDefault();
      event.stopPropagation();
      this.destination.editLast();
      return;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.onCancelEdit();
      return;
    } else if (event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  }

  /** @returns true when the event was consumed as send. */
  trySendOnEnter(event: KeyboardEvent): boolean {
    if (event.key !== 'Enter') {
      return false;
    }
    if (this.messageService.mention) {
      return false;
    }
    const modifier =
      event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
    if (this.sendWithModifier !== modifier) {
      return false;
    }
    this.sendMessage();
    return true;
  }
  sendMessage() {
    if (this.editMessage) {
      this.destination.update(this.editMessage, this.text);
      this.text = '';
      this.messageService.clearTempMessage(this.destination);
      this.setFocus();
      return;
    }
    const trimmed = this.composerText();
    if (this.isSlashCommand(trimmed)) {
      void this.runSlashCommand(trimmed);
      return;
    }
    this.destination.send(this.text, this.isExternal);
    this.text = '';
    this.messageService.clearTempMessage(this.destination);
    this.setFocus();
  }

  /** Prefer live editor doc — ngModel can lag one tick behind PM. */
  private composerText(): string {
    const editor = this.textarea?.editor;
    if (editor) {
      try {
        return markdownSerializer.serialize(editor.state.doc).trim();
      } catch {
        /* fall through */
      }
    }
    return (this.text || '').trim();
  }

  private isSlashCommand(text: string): boolean {
    return /^\/[a-z][\w-]*/i.test(text);
  }

  private async runCommandFromPalette(cmd: ChatCommand): Promise<void> {
    const name = (cmd?.id || cmd?.command || '')
      .replace(/^\//, '')
      .toLowerCase();
    this.text = '';
    this.messageService.clearTempMessage(this.destination);
    this.cd.markForCheck();
    if (name === 'refresh') {
      await this.runRefreshCommand();
      return;
    }
    this.toast.error(
      this.transloco.translate('messaging.command-unknown', {
        command: cmd?.command || name,
      }),
    );
  }

  private async runSlashCommand(text: string): Promise<void> {
    if (this.commandBusy) {
      return;
    }
    const match = text.match(/^\/([a-z][\w-]*)\b/i);
    const name = (match?.[1] || '').toLowerCase();
    if (name === 'refresh') {
      // Clear before request so it never lands in the chat as a regular message.
      this.text = '';
      this.messageService.clearTempMessage(this.destination);
      this.textarea?.writeValue?.('');
      this.cd.markForCheck();
      await this.runRefreshCommand();
      return;
    }
    this.toast.error(
      this.transloco.translate('messaging.command-unknown', { command: text }),
    );
  }

  private async runRefreshCommand(): Promise<void> {
    const issueId = this.issueDestinationId();
    if (!issueId) {
      this.toast.error(
        this.transloco.translate('messaging.command-refresh-need-issue'),
      );
      return;
    }
    if (this.commandBusy) {
      return;
    }
    this.commandBusy = true;
    try {
      const result = await firstValueFrom(
        this.dataService.aiRefreshIssueSession(issueId),
      );
      if (result?.alive && result.extended) {
        this.toast.success(
          result.message ||
            this.transloco.translate('messaging.command-refresh-ok'),
        );
      } else if (result?.alive) {
        this.toast.success(
          result.message ||
            this.transloco.translate('messaging.command-refresh-alive'),
        );
      } else {
        this.toast.error(
          result?.message ||
            this.transloco.translate('messaging.command-refresh-dead'),
        );
      }
      this.setFocus();
      this.cd.markForCheck();
    } catch (err) {
      // sendToAiAPI usually toasts via catchHandler and completes EMPTY —
      // firstValueFrom then rejects with EmptyError; show a clear fallback.
      const msg =
        (err as { error?: { error?: string }; message?: string })?.error
          ?.error ||
        ((err as Error)?.name === 'EmptyError'
          ? this.transloco.translate('messaging.command-refresh-dead')
          : (err as Error)?.message) ||
        this.transloco.translate('messaging.command-refresh-dead');
      this.toast.error(msg);
    } finally {
      this.commandBusy = false;
      this.cd.markForCheck();
    }
  }

  private issueDestinationId(): string {
    if (!this.destination || this.destination.type !== DestinationType.ISSUE) {
      return '';
    }
    const info = this.destination.info as IssueDestinationInfo;
    // destination.id is the issue id for ISSUE chats.
    return (
      this.destination.id ||
      info?.destination?.id ||
      info?.issue?.id ||
      ''
    );
  }
  setFocus() {
    if (this.textarea) {
      this.textarea.onFocusIn();
    }
  }
}
