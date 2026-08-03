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
  RwDatePipe,
  RwIconComponent,
  RwTextAreaComponent,
  RwTooltipDirective,
} from '@renwu/components';
import {
  Attachment,
  AttachmentComponent,
  createMentionEditorExtras,
  RwSettingsService,
  RwUserService,
  StateService,
} from '@renwu/core';
import { destroyObservable } from '@renwu/utils';
import { Plugin } from 'prosemirror-state';
import { Subject, merge } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { DestinationType } from '../data/messages.model';
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
  private cd = inject(ChangeDetectorRef);

  destroy = inject(DestroyRef);
  transloco = inject(TranslocoService);
  destinationChange = new Subject<void>();

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
    onActiveChange: (active) => {
      this.messageService.mention = active;
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
    } else {
      this.destination.send(this.text, this.isExternal);
      this.text = '';
    }
    this.messageService.clearTempMessage(this.destination);
    this.setFocus();
  }
  setFocus() {
    if (this.textarea) {
      this.textarea.onFocusIn();
    }
  }
}
