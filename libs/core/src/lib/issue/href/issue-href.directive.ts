import {
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { RwToastService } from '@renwu/components';

@Directive({
  selector: '[renwuIssueHref]',
  standalone: true,
})
export class IssueHrefDirective {
  transloco = inject(TranslocoService);

  @Input()
  set renwuIssueHref(key: string) {
    this.href = `/task/${key}`;
    this.key = key;
  }

  @Input()
  copyOnDoubleClick = false;
  @Input()
  openOnClick = true;

  @Output()
  openIssue = new EventEmitter<string>();

  timer: number;

  @HostBinding('attr.href')
  href: string;

  key: string;

  constructor(
    private toastService: RwToastService,
    private router: Router,
  ) {}

  @HostListener('click', ['$event']) onClick(event: MouseEvent): void {
    if (!this.href) {
      return;
    }
    let mouseKey = event.which;
    clearTimeout(this.timer);
    if (!mouseKey && event.button) {
      // (IE8-)
      if (event.button === 1) {
        mouseKey = 1;
      } else if (event.button === 4) {
        mouseKey = 2;
      } else if (event.button === 2) {
        mouseKey = 3;
      }
    }
    if (
      !event.altKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.metaKey &&
      mouseKey !== 2
    ) {
      event.preventDefault();

      // void this.router.navigate(['/', 'task', this.key], {
      //   queryParamsHandling: 'preserve',
      // });

      // if (this.openOnClick) {
      //   this.timer = globalThis.setTimeout(() => {
      //     this.onOpenIssue();
      //   }, 200);
      // }
      // const clickEvent = new MouseEvent('click', {
      //   view: window,
      //   bubbles: true,
      //   cancelable: true,
      // });
      // window.dispatchEvent(clickEvent);
    }
    event.stopPropagation();
  }

  @HostListener('dblclick', ['$event']) onDblclick(event: MouseEvent): void {
    event.preventDefault();
    clearTimeout(this.timer);
    const textArea = document.createElement('textarea');
    textArea.value = document.baseURI + this.href;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.toastService.success(this.transloco.translate('Link copied'));
    } catch (err) {
      this.toastService.success(
        this.transloco.translate('Unable to copy link'),
      );
      console.log('Unable to copy href', err);
    }
    document.body.removeChild(textArea);
  }
  onOpenIssue(): void {
    this.openIssue.next(this.key);
  }
}
