import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Injector,
  OnDestroy,
  signal,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RenwuSidebarService } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwIconComponent,
  RwSelectComponent,
  RwTextInputComponent,
  RwTimePickerComponent,
  RwToastService,
  RwTooltipDirective,
} from '@renwu/components';
import {
  RwFormatUserPipe,
  RwIssueService,
  RwSettingsService,
  SelectModelMilestones,
  SelectModelTransition,
  StateService,
  WorkflowTransition,
} from '@renwu/core';
import {
  DestinationType,
  MessageInputComponent,
  MessageThreadComponent,
  RwMessageService
} from '@renwu/messaging';
import {
  combineLatest,
  distinctUntilChanged,
  firstValueFrom,
  from,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { TaskDetailFieldSettingsComponent } from '../task-detail-layout/task-detail-field-settings.component';
import { TaskDetailVisibilityService } from '../task-detail-layout/task-detail-visibility.service';
import { registerTaskSectionElements } from '../task-sections/register-task-section-elements';
import { TaskLayoutConfig, TaskSectionConfig } from '../task-sections/task-section.model';
import { SectionWrapperComponent } from '../section-wrapper/section-wrapper.component';

@Component({
  selector: 'renwu-task-detail',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    RwTextInputComponent,
    RwTimePickerComponent,
    RwButtonComponent,
    RwSelectComponent,
    MessageThreadComponent,
    MessageInputComponent,
    RwFormatUserPipe,
    RwIconComponent,
    RwTooltipDirective,
    TranslocoPipe,
    SectionWrapperComponent,
    TaskDetailFieldSettingsComponent,
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
  settingsService = inject(RwSettingsService);
  taskLayout = inject(TaskDetailVisibilityService);

  fieldSettingsOpen = signal(false);

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

  private readonly layoutRefresh$ = merge(
    this.issueService.issue,
    this.issueService.issueForm.valueChanges.pipe(startWith(null)),
    this.settingsService.user.updated,
  );

  /** Full ordered sections from `task.json` (after registering custom elements). */
  readonly sectionsConfig = fromFetch('assets/task.json').pipe(
    switchMap((v) => from(v.json() as Promise<TaskLayoutConfig>)),
    switchMap((cfg) => {
      const sorted = [...(cfg.sections ?? [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      );
      const tags = sorted.map((s) => s.element);
      return from(registerTaskSectionElements(this.injector, tags)).pipe(
        map(() => sorted),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  sections = combineLatest([this.sectionsConfig, this.layoutRefresh$]).pipe(
    map(([sorted]) => this.taskLayout.filterSections(sorted)),
  );

  sectionElementTags(sections: TaskSectionConfig[]): string[] {
    return sections.map((s) => s.element);
  }

  constructor() {
    merge(
      this.issueService.issueForm.valueChanges,
      this.issueService.issue,
      this.settingsService.user.updated,
    )
      .pipe(
        tap((issue) => {
          if (issue && typeof issue === 'object') {
            this.transitionSelectModel.id = (issue as { id?: string }).id;
            this.milestoneSelectModel.containerId = (
              issue as { container?: { id?: string } }
            ).container?.id;
          }
          this.cd.markForCheck();
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

  async toggleWatch(): Promise<void> {
    await firstValueFrom(this.issueService.toggleWatchingSelf());
    this.cd.markForCheck();
  }

  toggleFieldSettingsPanel(): void {
    this.fieldSettingsOpen.update((open) => !open);
  }
}
