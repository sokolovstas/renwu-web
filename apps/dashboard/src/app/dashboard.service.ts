import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  Dashboard,
  ResponseOk,
  RwDataService,
  RwUserService,
} from '@renwu/core';
import { Observable, map, of, switchMap, tap } from 'rxjs';
import { defaultWidgets } from './dashboard.defaults';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private dataService = inject(RwDataService);
  private userService = inject(RwUserService);
  private transloco = inject(TranslocoService);

  dashboards = signal<Dashboard[]>([]);
  activeId = signal<string | null>(null);

  currentUserId(): string {
    return this.userService.currentUserValue?.id || '';
  }

  isOwner(dashboard: Dashboard | null | undefined): boolean {
    const uid = this.currentUserId();
    return !!dashboard && !!uid && dashboard.author_id === uid;
  }

  loadAll(): Observable<Dashboard[]> {
    return this.dataService.getDashboards().pipe(
      map((list) => list || []),
      tap((list) => this.dashboards.set(list)),
    );
  }

  get(id: string): Observable<Dashboard> {
    return this.dataService.getDashboard(id).pipe(
      tap((dashboard) => this.upsertLocal(dashboard)),
    );
  }

  /** First owned dashboard, or create one from profile leftovers / defaults. */
  ensureMine(): Observable<Dashboard> {
    return this.loadAll().pipe(
      switchMap((list) => {
        const mine = list.find((d) => this.isOwner(d));
        if (mine) {
          return of(mine);
        }
        return this.create({
          title: this.transloco.translate('dashboard.my-day'),
          shared: false,
          widgets: defaultWidgets(),
        });
      }),
    );
  }

  create(partial: Partial<Dashboard> = {}): Observable<Dashboard> {
    const dashboard: Dashboard = {
      title: partial.title || this.transloco.translate('dashboard.new-dashboard'),
      shared: !!partial.shared,
      widgets: partial.widgets?.length ? partial.widgets : defaultWidgets(),
    };
    return this.dataService.addDashboard(dashboard).pipe(
      tap((created) => this.upsertLocal(created)),
    );
  }

  save(dashboard: Dashboard): Observable<Dashboard> {
    return this.dataService.saveDashboard(dashboard).pipe(
      tap((saved) => this.upsertLocal(saved)),
    );
  }

  delete(id: string): Observable<ResponseOk> {
    return this.dataService.deleteDashboard(id).pipe(
      tap(() => {
        this.dashboards.set(this.dashboards().filter((d) => d.id !== id));
      }),
    );
  }

  private upsertLocal(dashboard: Dashboard): void {
    const list = this.dashboards();
    const index = list.findIndex((d) => d.id === dashboard.id);
    if (index >= 0) {
      const next = [...list];
      next[index] = dashboard;
      this.dashboards.set(next);
      return;
    }
    this.dashboards.set([...list, dashboard]);
  }
}
