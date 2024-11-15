
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwTooltipDirective } from '@renwu/components';

@Component({
  selector: 'renwu-issue-href',
  standalone: true,
  imports: [RwTooltipDirective, TranslocoPipe],
  templateUrl: './issue-href.component.html',
  styleUrl: './issue-href.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueHrefComponent implements OnInit {
  @Input()
  title: string;
  @Input()
  key: string;
  @Input()
  issue: any;
  @Input()
  class: string;
  @Input()
  firstChild = false;
  @Input()
  linkButton = false;
  @Input()
  copyOnDoubleClick = false;
  @Input()
  updateStatus = true;
  @Input()
  openOnClick = true;

  displayTooltip: boolean;
  timer: any;

  @Output()
  save = new EventEmitter<void>();

  @HostListener('mouseenter') onMouseEnter() {
    this.displayTooltip =
      this.el.nativeElement.scrollWidth <= this.el.nativeElement.offsetWidth;
    this.cd.detectChanges();
  }

  @HostListener('click', ['$event']) onClickListener(eventMouse: MouseEvent) {
    this.onClick(eventMouse);
  }

  @HostListener('dblclick', ['$event']) onDblclickListener(
    eventMouse: MouseEvent,
  ) {
    this.onDblclick(eventMouse);
  }

  constructor(
    private el: ElementRef,
    private cd: ChangeDetectorRef, // private toastService: RwToastService, // private issueService: RwIssueService
  ) {}
  ngOnInit() {
    // if (this.issue && this.issue.id) {
    //   this.issue.id = this.issue.id;
    // }
    return;
  }
  onClick(event: MouseEvent) {
    // if (!this.issue.id && !this.issue.key) {
    //   return false;
    // }
    // let mouseKey = event.which;
    // clearTimeout(this.timer);
    // if (!mouseKey && event.button) {
    //   // (IE8-)
    //   if (event.button === 1) {
    //     mouseKey = 1;
    //   } else if (event.button === 4) {
    //     mouseKey = 2;
    //   } else if (event.button === 2) {
    //     mouseKey = 3;
    //   }
    // }
    // if (
    //   !event.altKey &&
    //   !event.ctrlKey &&
    //   !event.shiftKey &&
    //   !event.metaKey &&
    //   mouseKey !== 2
    // ) {
    //   event.preventDefault();
    //   if (this.openOnClick) {
    //     this.timer = setTimeout(() => {
    //       this.issueService.closed.next(false);
    //       if (this.updateStatus) {
    //         this.issueService.saved = false;
    //       }
    //       this.openIssuePopup();
    //     }, 200);
    //   }
    //   const clickEvent = new MouseEvent('click', {
    //     view: window,
    //     bubbles: true,
    //     cancelable: true,
    //   });
    //   window.dispatchEvent(clickEvent);
    // }
    // event.stopPropagation();
  }
  getHref(): string {
    if (this.issue.key === '') {
      return `task/${this.issue.id}`;
    }
    return `task/${this.issue.key}`;
  }
  getLabel(): string {
    if (this.key && this.title) {
      return `${this.key} | ${this.title}`;
    }
    if (this.key && !this.title) {
      return this.key;
    }
    if (!this.key && this.title) {
      return this.title;
    }
    return '';
  }
  onDblclick(event: MouseEvent) {
    if (this.copyOnDoubleClick) {
      event.preventDefault();
      clearTimeout(this.timer);
      const textArea = document.createElement('textarea');
      textArea.value = document.baseURI + this.getHref();
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        // this.toastService.success('Link copied');
      } catch (err) {
        // this.toastService.success('Unable to copy link');
        console.log('Unable to copy href', err);
      }
      document.body.removeChild(textArea);
    }
    event.stopPropagation();
  }
  openIssuePopup() {
    // this.issueService.openIssue(this.issue);
  }
}
