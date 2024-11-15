import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  RwAlertService,
  RwDatePipe,
  RwIconComponent,
  RwToastService,
  RwTooltipDirective,
  mySchema,
} from '@renwu/components';
import {
  AvatarComponent,
  IssueHistoryItemComponent,
  MessageCounterComponent,
  RwFormatUserPipe,
  RwSettingsService,
  RwUserService,
  StateService,
} from '@renwu/core';
import { copyToClipboard } from '@renwu/utils';
import { defaultMarkdownParser } from 'prosemirror-markdown';
import { DOMSerializer } from 'prosemirror-model';
import { Subscription, filter, first } from 'rxjs';
import { ScrollMonitorContainer, Watcher } from 'scrollmonitor';
import { MessageType } from '../data/messages.model';
import { MessageDestination } from '../message-destination';
import { MessageItem } from '../message-item';
import { RwMessageService } from '../message.service';
// import { PersonalPageHrefComponent } from '../../user/personal-page-href/personal-page-href.component';
@Component({
  selector: 'renwu-messaging-item',
  standalone: true,
  imports: [
    AvatarComponent,
    RwIconComponent,
    RwDatePipe,
    RwFormatUserPipe,
    RwTooltipDirective,
    IssueHistoryItemComponent,
    MessageCounterComponent,
    MessageItemComponent,
    AsyncPipe,
    TranslocoPipe
],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('readedTransition', [
      state(
        'void',
        style({
          opacity: '0',
        }),
      ),
      state(
        '*',
        style({
          opacity: '0.5',
        }),
      ),
      transition('* => void', animate('3000ms ease')),
    ]),
    trigger('setCheck', [
      state(
        'void',
        style({
          opacity: '0',
          transform: 'scale(2)',
        }),
      ),
      state(
        '*',
        style({
          opacity: '1',
          transform: 'scale(1)',
        }),
      ),
      transition('* => void', animate('500ms ease')),
      transition('void => *', animate('500ms ease')),
    ]),
    trigger('newMessage', [
      state(
        'void',
        style({
          opacity: '0',
        }),
      ),
      state(
        '*',
        style({
          opacity: '1',
        }),
      ),
      transition('* => void', animate('200ms ease')),
      transition('void => *', animate('200ms ease')),
    ]),
  ],
})
export class MessageItemComponent implements OnDestroy {
  protected settingsService = inject(RwSettingsService);
  destroy = inject(DestroyRef);
  MessageType = MessageType;

  @Input()
  set destination(value: MessageDestination) {
    this._destination = value;
  }
  get destination(): MessageDestination {
    return this._destination;
  }

  _destination: MessageDestination;

  @Input()
  set message(value: MessageItem) {
    this._message = value;
    this.message.updated
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => {
        this.updateMonitor();
        this.cd.detectChanges();
      });

    this.message.text
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((text) => {
        this.updateFormatted(text);
        this.cd.detectChanges();
      });
  }
  get message(): MessageItem {
    return this._message;
  }
  _message: MessageItem;

  @Input()
  set scrollMonitorContainer(value: ScrollMonitorContainer) {
    this._scrollMonitorContainer = value;
    this.updateMonitor();
  }
  get scrollMonitorContainer(): ScrollMonitorContainer {
    return this._scrollMonitorContainer;
  }
  _scrollMonitorContainer: ScrollMonitorContainer;

  @Input()
  textOnly: boolean;

  @Input()
  threadStarter: boolean;

  @Output()
  clickSubDestination = new EventEmitter<MessageDestination>();

  deleting: boolean;
  displayChilds: boolean;

  formatted: SafeHtml;
  monitor: Watcher;
  readSubscribe: Subscription;

  currentUserId = inject(RwUserService).getId();

  constructor(
    private el: ElementRef,
    private alertService: RwAlertService,
    private toastService: RwToastService,
    public messageService: RwMessageService,
    private stateService: StateService,
    private sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef,
  ) {}
  // ngOnInit() {
  //   // this.state = 'in';
  // }
  ngOnDestroy() {
    if (this.monitor) {
      this.monitor.destroy();
    }
    if (this.readSubscribe) {
      this.readSubscribe.unsubscribe();
      this.readSubscribe = undefined;
    }
  }
  onDelete() {
    this.deleting = true;
    this.cd.markForCheck();
    this.alertService
      .confirm('Are you sure you want to delete message?', '', true)
      .subscribe((data: any) => {
        this.deleting = false;
        this.cd.markForCheck();
        if (data && data.affirmative) {
          this.destination.delete(this.message);
        }
      });
  }
  onEdit() {
    this.destination.edit(this.message);
  }
  onOpenThread() {
    this.displayChilds = !this.displayChilds;
    this.destination
      .loadThread(this.message)
      .subscribe(() => this.cd.markForCheck());
  }
  onGotoThread() {
    const sub = this.messageService.createMessageSubDestination(this.message);
    this.clickSubDestination.next(sub);
  }
  removeMessage() {
    this.destination.remove(this.message);
  }
  resendMessage() {
    this.destination.remove(this.message);
    this.destination.send(
      this.message.text.getValue(),
      this.message.isExternal,
    );
  }
  updateMonitor() {
    if (this.monitor) {
      this.monitor.destroy();
    }

    if (this.readSubscribe) {
      this.readSubscribe.unsubscribe();
      this.readSubscribe = undefined;
    }

    if (this.scrollMonitorContainer && !this.message.isRead) {
      this.monitor = this.scrollMonitorContainer.create(this.el.nativeElement);
      this.monitor.fullyEnterViewport(() => {
        if (this.readSubscribe) {
          this.readSubscribe.unsubscribe();
          this.readSubscribe = undefined;
        }
        this.readSubscribe = this.stateService.focused
          .pipe(
            filter((v) => v),
            first(),
          )
          .subscribe(() => {
            this.messageService.addInQueueForMarkread(this.message);
          });
      }, true);
      this.scrollMonitorContainer.recalculateLocations();
    }
  }
  prepareLinks() {
    // this.markdownService.prepareLinks(this.el.nativeElement, this);
  }
  cleanupLinks() {
    // this.markdownService.cleanupLinks(this);
  }
  updateFormatted(text: string) {
    this.cleanupLinks();

    const div = document.createElement('div');
    const fragment = DOMSerializer.fromSchema(mySchema).serializeFragment(
      defaultMarkdownParser.parse(text || '').content,
    );

    div.appendChild(fragment);

    this.formatted = this.sanitizer.bypassSecurityTrustHtml(div.innerHTML);
    this.cd.detectChanges();
    this.cd.markForCheck();
    this.prepareLinks();
  }
  getHref(): string {
    return `${document.baseURI}message/${this.message.destination.id}/${this.message.destination.type}/${this.message.id}`;
  }
  copyLink() {
    if (copyToClipboard(this.getHref())) {
      this.toastService.success('Link copied');
      return;
    }
    this.toastService.success('Unable to copy link');
  }
}
