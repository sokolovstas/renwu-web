import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RwPageComponent, RwSidebarService } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwIconComponent,
} from '@renwu/components';
import {
  Dashboard,
  DashboardWidget,
  Issue,
  RwQueryBuilderService,
  RwSearchService,
} from '@renwu/core';
import { Subject, catchError, debounceTime, of, switchMap } from 'rxjs';
import {
  createQueryWidget,
  defaultWidgets,
  reorderWidgets,
} from '../dashboard.defaults';
import { DashboardService } from '../dashboard.service';
import { DashboardWidgetComponent } from '../widget/widget.component';

@Component({
  selector: 'renwu-dashboard-main',
  standalone: true,
  imports: [
    FormsModule,
    RwPageComponent,
    RwButtonComponent,
    RwCheckboxComponent,
    RwIconComponent,
    TranslocoPipe,
    DashboardWidgetComponent,
  ],
  providers: [RwQueryBuilderService, RwSearchService],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements AfterViewInit {
  private sidebarService = inject(RwSidebarService);
  private dashboardService = inject(DashboardService);
  private transloco = inject(TranslocoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  dashboard = signal<Dashboard | null>(null);
  widgets = signal<DashboardWidget[]>([]);
  titleDraft = signal('');
  dragFrom = signal<number | null>(null);
  dropOver = signal<number | null>(null);
  canEdit = computed(() => this.dashboardService.isOwner(this.dashboard()));

  private persist$ = new Subject<Dashboard>();

  constructor() {
    this.persist$
      .pipe(
        debounceTime(400),
        switchMap((dashboard) =>
          this.dashboardService.save(dashboard).pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          const source$ = id
            ? this.dashboardService.get(id)
            : this.dashboardService.ensureMine();
          return source$.pipe(
            catchError(() => {
              if (id) {
                void this.router.navigate(['/']);
              }
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((dashboard) => {
        this.dashboard.set(dashboard);
        this.widgets.set(dashboard?.widgets || []);
        this.titleDraft.set(dashboard?.title || '');
        this.dashboardService.activeId.set(dashboard?.id || null);
      });
  }

  ngAfterViewInit(): void {
    this.sidebarService.scrollToMain();
  }

  issueClick(issue: Issue): void {
    this.sidebarService.currentTask.next(issue);
  }

  onWidgetChange(index: number, widget: DashboardWidget): void {
    if (!this.canEdit()) {
      return;
    }
    const next = [...this.widgets()];
    next[index] = widget;
    this.persist(next);
  }

  removeWidget(index: number): void {
    if (!this.canEdit()) {
      return;
    }
    const next = this.widgets().filter((_, i) => i !== index);
    this.persist(next.length ? next : defaultWidgets());
  }

  addWidget(): void {
    if (!this.canEdit()) {
      return;
    }
    this.persist([...this.widgets(), createQueryWidget()]);
  }

  resetLayout(): void {
    if (!this.canEdit()) {
      return;
    }
    this.persist(defaultWidgets());
    this.dragFrom.set(null);
    this.dropOver.set(null);
  }

  setShared(shared: boolean): void {
    const current = this.dashboard();
    if (!current || !this.canEdit()) {
      return;
    }
    const next = { ...current, shared };
    this.dashboard.set(next);
    this.persist$.next(next);
  }

  commitTitle(): void {
    const current = this.dashboard();
    if (!current || !this.canEdit()) {
      return;
    }
    const title =
      this.titleDraft().trim() ||
      current.title ||
      this.transloco.translate('dashboard.my-day');
    this.titleDraft.set(title);
    if (title === current.title) {
      return;
    }
    const next = { ...current, title };
    this.dashboard.set(next);
    this.persist$.next(next);
  }

  onTitleEnter(event: Event): void {
    (event.target as HTMLInputElement).blur();
  }

  onDragStart(index: number, event: DragEvent): void {
    if (!this.canEdit()) {
      return;
    }
    this.dragFrom.set(index);
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(index: number, event: DragEvent): void {
    if (!this.canEdit()) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dropOver.set(index);
  }

  onDrop(index: number, event: DragEvent): void {
    event.preventDefault();
    const from = this.dragFrom();
    this.dragFrom.set(null);
    this.dropOver.set(null);
    if (from === null || !this.canEdit()) {
      return;
    }
    this.persist(reorderWidgets(this.widgets(), from, index));
  }

  onDragEnd(): void {
    this.dragFrom.set(null);
    this.dropOver.set(null);
  }

  private persist(widgets: DashboardWidget[]): void {
    const current = this.dashboard();
    if (!current || !this.canEdit()) {
      return;
    }
    this.widgets.set(widgets);
    const title =
      this.titleDraft().trim() ||
      current.title ||
      this.transloco.translate('dashboard.my-day');
    this.titleDraft.set(title);
    const next = { ...current, title, widgets };
    this.dashboard.set(next);
    this.persist$.next(next);
  }
}
