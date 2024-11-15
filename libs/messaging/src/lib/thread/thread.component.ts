import scrollmonitor, { ScrollMonitorContainer, Watcher } from 'scrollmonitor';


import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwButtonComponent, RwIconComponent } from '@renwu/components';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DestinationType } from '../data/messages.model';
import { MessageItemComponent } from '../item/item.component';
import {
  MessageDestination,
  MessageDestinationInfo,
} from '../message-destination';
import { MessageItem } from '../message-item';
@Component({
  selector: 'renwu-messaging-thread',
  standalone: true,
  imports: [
    MessageItemComponent,
    RwButtonComponent,
    RwIconComponent,
    TranslocoPipe
],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MessageThreadComponent implements AfterViewInit, OnDestroy {
  DestinationType = DestinationType;

  destroy: Subject<boolean> = new Subject<boolean>();

  @ViewChildren('scroller')
  scroller: QueryList<ElementRef>;

  @ViewChildren('loadPrev')
  loadPrev: QueryList<ElementRef>;

  @ViewChildren('loadNext')
  loadNext: QueryList<ElementRef>;

  @Input()
  scrollContainer: HTMLElement;

  @Input()
  autoload: boolean;

  @Input()
  pagesize = 30;

  @Input()
  @HostBinding('class.noscroll')
  noScroll = false;

  @Input()
  set destination(value: MessageDestination) {
    if (this.destination && this.destination !== value) {
      this.messages = [];

      this.removeScrollWatchers();
      this.leftMessagesBefore = 0;
      this.leftMessagesAfter = 0;
      this.cd.detectChanges();
      this.destination.hide();
    }
    setTimeout(() => {
      if (value && value.id && value.id !== 'new') {
        this._destination = value;
        this.destination.show(this.pagesize);
        this.setDestination();
        this.setScrollWatchers();
        this.cd.detectChanges();
      }
    }, 100);
  }
  get destination(): MessageDestination {
    return this._destination;
  }

  @Output()
  clickSubDestination = new EventEmitter<MessageDestination>();

  _destination: MessageDestination;

  leftMessagesBefore = 0;
  leftMessagesAfter = 0;
  loadingMessages: boolean;
  fromSidebar: boolean;
  messages: MessageItem[];
  pinnedMessages: MessageItem[];
  threadStartMessage: MessageItem;

  scrollMonitorContainer: ScrollMonitorContainer;
  scrollMonitorNextWatcher: Watcher;
  scrollMonitorPrevWatcher: Watcher;

  action: string;

  constructor(private cd: ChangeDetectorRef) {}
  ngOnDestroy() {
    this.removeScrollWatchers();
  }
  setDestination() {
    if (!this.destination) {
      return;
    }
    this.destination.leftBefore
      .pipe(takeUntil(this.destroy))
      .subscribe((count) => {
        setTimeout(() => {
          this.leftMessagesBefore = count;
          this.setScrollWatchers();
          this.cd.markForCheck();
        });
      });

    this.destination.leftAfter
      .pipe(takeUntil(this.destroy))
      .subscribe((count) => {
        setTimeout(() => {
          this.leftMessagesAfter = count;
          this.setScrollWatchers();
          this.cd.markForCheck();
        });
      });

    this.destination.messages
      .pipe(takeUntil(this.destroy))
      .subscribe((messages) => {
        const initScrollHeight = this.scroller.first.nativeElement.scrollHeight;
        const initScrollTop = this.scroller.first.nativeElement.scrollTop;
        this.messages = messages;
        this.cd.detectChanges();
        if (
          this.destination.scrollTop === undefined ||
          this.destination.latestAction === 'prev' ||
          this.destination.latestAction === 'next'
        ) {
          this.scroller.first.nativeElement.scrollTop =
            initScrollTop +
            this.scroller.first.nativeElement.scrollHeight -
            initScrollHeight;
        } else if (this.destination.latestAction === 'new') {
          this.scroller.first.nativeElement.scrollTop = initScrollHeight;
        } else if (
          this.destination.latestAction === 'show' ||
          this.destination.scrollTop
        ) {
          this.scroller.first.nativeElement.scrollTop =
            this.destination.scrollTop;
        } else if (this.messages.length > 0 && this.scrollMonitorContainer) {
          this.scroller.first.nativeElement.scrollTop = initScrollHeight;
        }
        this.setScrollWatchers();
      });

    this.destination.pinnedMessages
      .pipe(takeUntil(this.destroy))
      .subscribe((messages) => {
        this.pinnedMessages = messages;
        this.cd.markForCheck();
      });

    this.threadStartMessage = undefined;

    if (this.destination.type === DestinationType.MESSAGE) {
      this.threadStartMessage = (
        this.destination.info as MessageDestinationInfo
      ).message;
    }
    this.cd.markForCheck();
  }
  ngAfterViewInit() {
    this.scroller.changes.pipe(takeUntil(this.destroy)).subscribe(() => {
      this.setScrollWatchers();
    });

    this.loadPrev.changes.pipe(takeUntil(this.destroy)).subscribe(() => {
      this.setScrollWatchers();
    });

    this.loadNext.changes.pipe(takeUntil(this.destroy)).subscribe(() => {
      this.setScrollWatchers();
    });
  }
  setScrollWatchers() {
    setTimeout(() => {
      if (this.scroller && this.scroller.length) {
        this.removeScrollWatchers();
        const scroller =
          this.scrollContainer || this.scroller.first.nativeElement;
        this.scrollMonitorContainer = scrollmonitor.createContainer(scroller);
        if (this.autoload) {
          if (this.loadPrev.first) {
            this.scrollMonitorPrevWatcher = this.scrollMonitorContainer.create(
              this.loadPrev.first.nativeElement,
            );
            this.scrollMonitorPrevWatcher.fullyEnterViewport(() => {
              if (this.loadingMessages) {
                return;
              }
              this.loadingMessages = true;
              this.cd.markForCheck();
              this.destination
                .loadPrev(this.pagesize)
                .subscribe(() => (this.loadingMessages = false));
            }, true);
          }
          if (this.loadNext.first) {
            this.scrollMonitorNextWatcher = this.scrollMonitorContainer.create(
              this.loadNext.first.nativeElement,
            );
            this.scrollMonitorNextWatcher.fullyEnterViewport(() => {
              if (this.loadingMessages) {
                return;
              }
              this.loadingMessages = true;
              this.cd.markForCheck();
              this.destination
                .loadNext(this.pagesize)
                .subscribe(() => (this.loadingMessages = false));
            }, true);
          }
        }
        this.cd.markForCheck();
      }
    }, 100);
  }
  onLoadPrev() {
    this.action = 'prev';
    this.loadingMessages = true;
    this.destination
      .loadPrev(this.pagesize)
      .subscribe(() => (this.loadingMessages = false));
  }
  onLoadNext() {
    this.action = 'next';
    this.loadingMessages = true;
    this.destination
      .loadNext(this.pagesize)
      .subscribe(() => (this.loadingMessages = false));
  }
  onScroll() {
    if (this.messages.length > 0 && this.scrollMonitorContainer) {
      this.destination.setScroll(this.scroller.first.nativeElement.scrollTop);
    }
  }
  removeScrollWatchers() {
    this.cd.markForCheck();
    if (this.scrollMonitorContainer) {
      this.scrollMonitorContainer.destroy();
      this.scrollMonitorContainer = undefined;
    }
    if (this.scrollMonitorPrevWatcher) {
      this.scrollMonitorPrevWatcher.destroy();
      this.scrollMonitorPrevWatcher = undefined;
    }
    if (this.scrollMonitorNextWatcher) {
      this.scrollMonitorNextWatcher.destroy();
      this.scrollMonitorNextWatcher = undefined;
    }
  }
  clickedSubDestination(destination: MessageDestination) {
    this.clickSubDestination.next(destination);
  }
}
