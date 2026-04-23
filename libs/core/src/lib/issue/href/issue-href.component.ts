import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwTooltipDirective } from '@renwu/components';

@Component({
  selector: 'renwu-issue-href',
  standalone: true,
  imports: [RwTooltipDirective, TranslocoPipe],
  templateUrl: './issue-href.component.html',
  styleUrl: './issue-href.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueHrefComponent {
  private el = inject(ElementRef);
  private cd = inject(ChangeDetectorRef);
  private router = inject(Router);

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

  /** Key used in `/…(section:task/:key)` — same as legacy `task/${key}` paths. */
  private taskOutletKey(): string {
    const issue = this.issue;
    if (!issue) {
      return '';
    }
    if (issue.key === '') {
      return String(issue.id ?? '');
    }
    return String(issue.key ?? this.key ?? '').trim();
  }

  /**
   * Absolute app path for `<a href>` so middle‑click / copy work next to
   * `task/list/…(section:task/…)`; left‑click uses Router to update only the
   * `section` outlet without breaking the primary `task/list/…` route.
   */
  getHref(): string {
    const k = this.taskOutletKey();
    if (!k) {
      return '#';
    }
    const url = this.router.url ?? '';
    const normalized = url.startsWith('/') ? url : `/${url}`;
    const sectionMatch = normalized.match(/^(.*)\(section:task\/[^)]+\)/);
    if (sectionMatch) {
      return `${sectionMatch[1]}(section:task/${encodeURIComponent(k)})`;
    }
    return `/task/list/(section:task/${encodeURIComponent(k)})`;
  }

  onClick(event: MouseEvent): void {
    if (!this.openOnClick) {
      return;
    }
    if (event.defaultPrevented) {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    const k = this.taskOutletKey();
    if (!k) {
      return;
    }
    event.preventDefault();
    void this.router.navigate([{ outlets: { section: ['task', k] } }]);
  }

  private absoluteHrefForCopy(): string {
    const p = this.getHref();
    if (p.startsWith('/')) {
      return `${globalThis.location.origin}${p}`;
    }
    return new URL(p, document.baseURI).href;
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
      textArea.value = this.absoluteHrefForCopy();
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
