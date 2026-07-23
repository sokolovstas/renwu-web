import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
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
  RwAlertService,
  RwButtonComponent,
  RwSelectComponent,
  RwTextInputComponent,
  RwTimePickerComponent,
  RwToastService,
  RwTooltipDirective,
} from '@renwu/components';
import {
  RwDataService,
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
  defaultIfEmpty,
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
  alertService = inject(RwAlertService);
  dataService = inject(RwDataService);
  stateService = inject(StateService);
  sidebarService = inject(RenwuSidebarService);
  destroy = inject(DestroyRef);
  transloco = inject(TranslocoService);
  settingsService = inject(RwSettingsService);
  taskLayout = inject(TaskDetailVisibilityService);

  fieldSettingsOpen = signal(false);
  jiraBusy = signal(false);
  private creating = false;

  jiraLink = this.issueService.issue.pipe(
    map((issue) => issue?.external_links?.['jira'] || ''),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

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

  @ViewChild('title', { read: ElementRef })
  titleEl: ElementRef<HTMLElement>;

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

  @HostListener('document:keydown', ['$event'])
  onCreateShortcut(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return;
    }
    if (this.issueService.issueForm.getRawValue().id !== 'new') {
      return;
    }
    if (this.creating || this.issueService.issueForm.invalid) {
      return;
    }

    const withModifier = event.metaKey || event.ctrlKey;
    if (withModifier) {
      event.preventDefault();
      void this.create(event.altKey);
      return;
    }

    // Plain Enter while the title is focused only blurs it (rw-text-input).
    // Create on the next Enter, once focus has left the title.
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.shiftKey ||
      this.isEventFromTitle(event.target) ||
      this.shouldIgnorePlainEnter(event.target)
    ) {
      return;
    }

    event.preventDefault();
    void this.create(false);
  }

  async create(another: boolean) {
    if (this.creating || this.issueService.issueForm.invalid) {
      return;
    }
    this.creating = true;
    try {
      const issue = await firstValueFrom(this.issueService.create());
      if (!another) {
        this.router.navigate(['..', issue.key], { relativeTo: this.route });
      } else {
        this.titleInput.setFocus();
      }
      this.toastService.info(
        this.transloco.translate('task.issue-%issue.key%-created-successfully'),
      );
    } finally {
      this.creating = false;
    }
  }

  private isEventFromTitle(target: EventTarget | null): boolean {
    return (
      target instanceof Node &&
      !!this.titleEl?.nativeElement?.contains(target)
    );
  }

  private shouldIgnorePlainEnter(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
      return false;
    }
    const el = target as HTMLElement;
    if (
      el.isContentEditable ||
      el.closest('[contenteditable="true"]') ||
      el.closest('.ProseMirror')
    ) {
      return true;
    }
    const tag = el.localName;
    if (tag === 'textarea' || tag === 'input') {
      return true;
    }
    return !!el.closest('rw-select, rw-button, rw-dropdown, rw-time-picker');
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

  openJiraLink(url: string): void {
    if (!url) {
      return;
    }
    globalThis.open(url, '_blank', 'noopener,noreferrer');
  }

  async syncFromJira(): Promise<void> {
    const issue = await firstValueFrom(this.issueService.issue);
    const id = issue?.id;
    if (!id || id === 'new' || this.jiraBusy()) {
      return;
    }
    if (!issue.external_links?.['jira']) {
      return;
    }
    this.jiraBusy.set(true);
    try {
      const ok = await firstValueFrom(
        this.dataService.jiraImportIssue(id).pipe(defaultIfEmpty(null)),
      );
      if (ok == null) {
        return;
      }
      this.toastService.success(
        this.transloco.translate('task.jira-import-done'),
      );
      this.issueService.key.next(issue.key || id);
    } finally {
      this.jiraBusy.set(false);
      this.cd.markForCheck();
    }
  }

  async syncToJira(): Promise<void> {
    const issue = await firstValueFrom(this.issueService.issue);
    const id = issue?.id;
    if (!id || id === 'new' || this.jiraBusy()) {
      return;
    }
    const mapped = !!issue.external_links?.['jira'];
    let createIfMissing = false;
    if (!mapped) {
      const confirm = await firstValueFrom(
        this.alertService.confirm(
          this.transloco.translate('task.jira-create-confirm-title'),
          this.transloco.translate('task.jira-create-confirm-text'),
          true,
          this.transloco.translate('task.create'),
          this.transloco.translate('core.cancel'),
        ),
      );
      if (!confirm?.affirmative) {
        return;
      }
      createIfMissing = true;
    }
    this.jiraBusy.set(true);
    try {
      const ok = await firstValueFrom(
        this.dataService
          .jiraExportIssue(id, createIfMissing)
          .pipe(defaultIfEmpty(null)),
      );
      if (ok == null) {
        return;
      }
      this.toastService.success(
        this.transloco.translate(
          createIfMissing ? 'task.jira-create-done' : 'task.jira-export-done',
        ),
      );
      this.issueService.key.next(issue.key || id);
    } finally {
      this.jiraBusy.set(false);
      this.cd.markForCheck();
    }
  }
}
