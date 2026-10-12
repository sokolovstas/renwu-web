import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwIconComponent,
  RwToastService,
  RwTooltipDirective,
} from '@renwu/components';
import {
  AvatarComponent,
  Issue,
  MessageCounterComponent,
  RwDataService,
  RwIssueService,
  RwUserService,
  User,
  WorkflowTransition,
} from '@renwu/core';
import {
  Observable,
  Subject,
  catchError,
  firstValueFrom,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { DestinationType } from '../data/messages.model';
import { MessageDestination } from '../message-destination';
import { RwMessageService } from '../message.service';

@Component({
  selector: 'renwu-messaging-destination',
  standalone: true,
  imports: [
    RwIconComponent,
    AvatarComponent,
    MessageCounterComponent,
    RwButtonComponent,
    AsyncPipe,
    RwTooltipDirective,
    TranslocoPipe,
  ],
  templateUrl: './destination.component.html',
  styleUrl: './destination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestinationComponent implements OnChanges {
  messageService = inject(RwMessageService);
  userService = inject(RwUserService);
  router = inject(Router);
  private readonly dataService = inject(RwDataService);
  private readonly issueService = inject(RwIssueService);
  private readonly toast = inject(RwToastService);
  private readonly transloco = inject(TranslocoService);
  private cd = inject(ChangeDetectorRef);

  destroy = inject(DestroyRef);
  update: Subject<boolean> = new Subject<boolean>();
  DestinationType = DestinationType;
  busy = false;

  @Input()
  set destination(value: MessageDestination) {
    this._destination = value;
    if (value) {
      value.updateInfo();
    }
    this.update.next(true);
  }
  get destination(): MessageDestination {
    return this._destination;
  }
  _destination: MessageDestination;

  /** Transition buttons in the messenger header only — not the sidebar list. */
  @Input()
  showStatusActions = false;

  @Input()
  isUser: boolean;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showStatusActions']) {
      this.update.next(true);
    }
  }

  transitions$: Observable<WorkflowTransition[]> = this.update.pipe(
    startWith(true),
    switchMap(() => {
      if (
        !this.showStatusActions ||
        this.destination?.type !== DestinationType.ISSUE
      ) {
        return of([] as WorkflowTransition[]);
      }
      return this.destination.item.pipe(
        switchMap((item) => {
          const issue = item as Issue;
          if (!issue?.id) {
            return of([] as WorkflowTransition[]);
          }
          return this.dataService.getIssueTransitions(issue.id).pipe(
            catchError(() => of([] as WorkflowTransition[])),
          );
        }),
      );
    }),
  );

  user: User;
  issue: Issue;

  displayTooltip: boolean;
  widthTooltip: number;
  itemActive: boolean;

  markForCheck() {
    this.cd.markForCheck();
  }
  onUnreadClick() {
    this.destination.markreadAllUnread();
  }
  onPulseClick() {
    this.destination.markreadAllPulse();
  }

  async transit(issue: Issue, t: WorkflowTransition): Promise<void> {
    if (!issue?.id || !t?.to || this.busy) {
      return;
    }
    this.busy = true;
    this.cd.markForCheck();
    try {
      await firstValueFrom(this.dataService.changeStatusIssue(issue.id, t.to));
      const fresh = await firstValueFrom(this.dataService.getIssue(issue.id));
      if (fresh && this.destination.type === DestinationType.ISSUE) {
        this.destination.item.next(fresh);
        this.destination.info.issue = fresh;
        const loaded = this.issueService.issueForm?.getRawValue();
        if (loaded?.id === issue.id) {
          this.issueService.patchIssue({ status: fresh.status });
        }
      }
      this.toast.success(
        this.transloco.translate('core.issue-saved-successfully'),
      );
      this.update.next(true);
    } catch {
      this.toast.error(this.transloco.translate('core.failed-to-save-issue'));
    } finally {
      this.busy = false;
      this.cd.markForCheck();
    }
  }

  openIssue(issue: Issue) {
    this.router.navigate([{ outlets: { section: ['task', issue.id] } }]);
  }
}
