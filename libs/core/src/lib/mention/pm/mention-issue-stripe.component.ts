import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RwDataService } from '../../data/data.service';
import { IssueTypeComponent } from '../../issue/fields/type/type.component';
import { Issue } from '../../issue/issue.model';

@Component({
  selector: 'renwu-mention-issue-stripe',
  standalone: true,
  imports: [IssueTypeComponent],
  template: `
    @if (issue?.type) {
      <renwu-issue-type class="stripe-type" [value]="issue.type" />
    }
    <span class="stripe-key">{{ key }}</span>
    @if (issue?.title) {
      <span class="stripe-title">{{ issue.title }}</span>
    }
  `,
  styleUrl: './mention-issue-stripe.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionIssueStripeComponent implements OnDestroy {
  private router = inject(Router);
  private dataService = inject(RwDataService);
  private cd = inject(ChangeDetectorRef);

  @Input()
  set key(value: string) {
    this._key = (value || '').toUpperCase();
    this.loadIssue();
  }
  get key(): string {
    return this._key;
  }
  private _key = '';

  issue: Issue | null = null;
  private sub?: Subscription;

  @HostBinding('class.rw-mention-issue-stripe')
  hostClass = true;

  @HostBinding('style.border-left-color')
  get statusBorderColor(): string {
    return this.issue?.status?.color || 'var(--gray-400)';
  }

  @HostBinding('attr.title')
  get titleAttr(): string {
    return this.issue?.title ? `${this.key}: ${this.issue.title}` : this.key;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private loadIssue(): void {
    this.sub?.unsubscribe();
    this.issue = null;
    if (!this._key) {
      return;
    }
    this.sub = this.dataService
      .getIssuesByKeyBackgroundBuffered(this._key)
      .subscribe((issue) => {
        this.issue = issue;
        this.cd.markForCheck();
      });
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this._key) {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const open = (id: string) => {
      void this.router.navigate([{ outlets: { section: ['task', id] } }]);
    };
    if (this.issue?.id) {
      open(this.issue.id);
      return;
    }
    this.dataService.getIssuesByKeyBackgroundBuffered(this._key).subscribe((issue) => {
      if (issue?.id) {
        open(issue.id);
      }
    });
  }
}
