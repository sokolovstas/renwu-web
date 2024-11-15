import { AsyncPipe, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Injector,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { createCustomElement } from '@angular/elements';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { RenwuSidebarService } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwIconComponent,
  RwSelectComponent,
  RwTextAreaComponent,
  RwTextInputComponent,
  RwTimePickerComponent,
  RwToastService,
} from '@renwu/components';
import {
  IssueStatusComponent,
  RwFormatUserPipe,
  RwIssueService,
  SelectModelMilestones,
  SelectModelTransition,
  StateService,
  WorkflowTransition,
} from '@renwu/core';
import {
  DestinationType,
  MessageInputComponent,
  MessageSubDestinationsComponent,
  MessageThreadComponent,
  RwMessageService,
} from '@renwu/messaging';
import {
  distinctUntilChanged,
  firstValueFrom,
  from,
  map,
  merge,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { AttachmentsComponent } from '../attachments/attachments.component';
import { DescriptionComponent } from '../description/description.component';
import { LinksComponent } from '../links/links.component';
import { RelatedComponent } from '../related/related.component';
import { SectionWrapperComponent } from '../section-wrapper/section-wrapper.component';
import { SubTaskComponent } from '../sub-task/sub-task.component';
import { TimeLogComponent } from '../time-log/time-log.component';
import { TodoComponent } from '../todo/todo.component';

@Component({
  selector: 'renwu-task-detail',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    RwTextAreaComponent,
    RwTextInputComponent,
    RwTimePickerComponent,
    IssueStatusComponent,
    RwIconComponent,
    RwButtonComponent,
    RwSelectComponent,
    MessageThreadComponent,
    MessageSubDestinationsComponent,
    MessageInputComponent,
    NgStyle,
    RwFormatUserPipe,
    TranslocoPipe,
    SectionWrapperComponent,
    DescriptionComponent,
  ],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
  // providers: [RwIssueService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailComponent implements OnDestroy {
  route = inject(ActivatedRoute);
  cd = inject(ChangeDetectorRef);
  router = inject(Router);
  injector = inject(Injector);
  issueService = inject(RwIssueService);
  messageServce = inject(RwMessageService);
  toastService = inject(RwToastService);
  stateService = inject(StateService);
  sidebarService = inject(RenwuSidebarService);
  destroy = inject(DestroyRef);
  transloco = inject(TranslocoService);

  transitionSelectModel = new SelectModelTransition();
  milestoneSelectModel = new SelectModelMilestones();

  thread = this.issueService.issue.pipe(
    switchMap((t) =>
      t?.id && t?.id !== 'new'
        ? this.messageServce.getDestination(t.id, DestinationType.ISSUE)
        : of(null),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  @ViewChild('title')
  titleInput: RwTextInputComponent;

  sections = fromFetch('assets/task.json').pipe(
    switchMap((v) => from(v.json())),
    map((v) => v.sections),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  constructor() {
    customElements.define(
      'renwu-task-todo',
      createCustomElement(TodoComponent, { injector: this.injector }),
    );

    customElements.define(
      'renwu-task-description',
      createCustomElement(DescriptionComponent, { injector: this.injector }),
    );

    customElements.define(
      'renwu-task-related',
      createCustomElement(RelatedComponent, { injector: this.injector }),
    );

    customElements.define(
      'renwu-task-links',
      createCustomElement(LinksComponent, { injector: this.injector }),
    );

    customElements.define(
      'renwu-task-attachments',
      createCustomElement(AttachmentsComponent, { injector: this.injector }),
    );

    customElements.define(
      'renwu-task-sub-task',
      createCustomElement(SubTaskComponent, { injector: this.injector }),
    );
    customElements.define(
      'renwu-task-time-log',
      createCustomElement(TimeLogComponent, { injector: this.injector }),
    );

    merge(this.issueService.issueForm.valueChanges, this.issueService.issue)
      .pipe(
        tap((issue) => {
          this.transitionSelectModel.id = issue?.id;
          this.milestoneSelectModel.containerId = issue?.container?.id;
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe();

    this.issueService.issue
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((t) => this.sidebarService.currentTask.next(t));

    this.route.paramMap
      .pipe(
        map((m) => m.get('key')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((key) => {
        this.issueService.key.next(key);
      });
  }
  ngOnDestroy(): void {
    return;
  }
  close() {
    this.router.navigate(['../..'], { relativeTo: this.route });
    this.sidebarService.currentTask.next(null);
    // this.issueService.key.next(null);
  }
  async create(another: boolean) {
    const issue = await firstValueFrom(this.issueService.create());
    if (!another) {
      this.router.navigate(['..', issue.key], { relativeTo: this.route });
    } else {
      this.titleInput.setFocus();
    }
    this.toastService.info(
      this.transloco.translate('task.issue-%issue.key%-created-successfully'),
    );
  }
  transit(t: WorkflowTransition) {
    this.issueService.changeIssueStatus(t.step, t.to);
  }
  async remove() {
    const deleted = await firstValueFrom(this.issueService.delete());
    if (deleted) {
      this.router.navigate(['../..'], { relativeTo: this.route });
      this.sidebarService.currentTask.next(null);
    }
    return;
  }
  async addToFav() {
    await firstValueFrom(this.issueService.setFavorite(true));
  }
  async removeFromFav() {
    await firstValueFrom(this.issueService.setFavorite(false));
  }
}
