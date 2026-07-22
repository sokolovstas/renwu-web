import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ListOptionsFilters,
  RwIssueDateTimeService,
  RwSettingsService,
  RwUserService,
  TimelineHierarchyMode,
  TimelineProfileSettings,
  TimelineScaleTick,
  TimelineTicksId,
} from '@renwu/core';
import { TimelineSettings } from '../models/timeline-settings.model';

const STORAGE_PREFIX = 'renwu_timeline_settings_';

const TICKS: TimelineScaleTick[] = [
  { id: TimelineTicksId.FIT, title: 'Fit', scale: 0, min: 0 },
  { id: TimelineTicksId.DAY, title: 'Day', scale: 5000, min: 0 },
  { id: TimelineTicksId.WEEK, title: 'Week', scale: 33000, min: 5000 },
  { id: TimelineTicksId.QUARTER, title: 'Quarter', scale: 100000, min: 33000 },
];

/** Zoom ladder fine → coarse (excludes Fit). */
const ZOOM_TICKS: TimelineTicksId[] = [
  TimelineTicksId.DAY,
  TimelineTicksId.WEEK,
  TimelineTicksId.QUARTER,
];

const DEFAULT_SORT: ListOptionsFilters['sort'] = {
  field: 'status',
  direction: 'down',
};

/** Issue/graph row height bounds (px). Bars and table text scale with this. */
export const TIMELINE_ROW_HEIGHT_MIN_PX = 22;
export const TIMELINE_ROW_HEIGHT_MAX_PX = 56;
export const TIMELINE_ROW_HEIGHT_STEP_PX = 2;

@Injectable({
  providedIn: 'root',
})
export class TimelineSettingsService {
  private readonly userService = inject(RwUserService);
  private readonly rwSettings = inject(RwSettingsService);
  private readonly issueDateTimeSvc = inject(RwIssueDateTimeService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly storageKey = computed(() => {
    const id = this.userService.currentUserValue?.id;
    return id ? `${STORAGE_PREFIX}${id}` : null;
  });

  private profileSyncBound = false;

  private readonly initialSettings: TimelineSettings = {
    fontSize: 12,
    grouping: 'none',
    hierarchyMode: 'subtasks',
    scaleTick: TimelineTicksId.DAY,
    scale: this.computeActualScale(TimelineTicksId.DAY, 100),
    oldScale: this.computeActualScale(TimelineTicksId.DAY, 100),
    scaleValue: 100,
    tableWidth: 380,
    issueRowHeightPx: 30,
    milestoneRowHeightPx: 24,
    showMilestones: true,
    showWorkforce: true,
    showTable: true,
    showTitleRight: false,
    workforceHeight: null,
    sort: DEFAULT_SORT,
    open_index: {},
    open_index_group: {},
    ticks: TICKS,
  };

  private settingsSignal = signal<TimelineSettings>(this.initialSettings);

  readonly timelineSettings = this.settingsSignal.asReadonly();

  /** Narrow selectors so consumers do not refetch on unrelated setting changes. */
  readonly grouping = computed(
    () => this.settingsSignal().grouping || 'none',
  );
  readonly hierarchyMode = computed(
    () => this.settingsSignal().hierarchyMode || 'subtasks',
  );

  getTimeline(): TimelineSettings {
    return this.settingsSignal();
  }

  initSettings(userId?: string): void {
    this.bindProfileSync();

    const stored = this.readMergedSettings(userId);
    if (stored) {
      this.applyStoredSettings(stored);
      return;
    }

    this.applyHours24InDay(true);
  }

  syncWorkforceMode(isWorkload: boolean): void {
    const current = this.settingsSignal();
    if (current.showWorkforce === isWorkload) {
      return;
    }
    this.settingsSignal.update((s) => ({ ...s, showWorkforce: isWorkload }));
    this.persist();
  }

  setHours24InDay(hours24InDay: boolean): void {
    this.applyHours24InDay(hours24InDay);
    this.persist();
  }

  setGrouping(value: string): void {
    this.settingsSignal.update((s) => ({ ...s, grouping: value }));
    this.persist();
  }

  setHierarchyMode(value: TimelineHierarchyMode): void {
    this.settingsSignal.update((s) => ({ ...s, hierarchyMode: value }));
    this.persist();
  }

  setScaleTick(value: TimelineTicksId): void {
    this.settingsSignal.update((s) => {
      const nextScale = this.computeActualScale(value, s.scaleValue);
      return {
        ...s,
        oldScale: s.scale,
        scaleTick: value,
        scale: nextScale,
      };
    });
    this.persist();
  }

  setScaleValue(value: number, options?: { persist?: boolean }): void {
    this.settingsSignal.update((s) => {
      const clamped = Math.max(50, Math.min(200, Math.round(value)));
      const nextScale = this.computeActualScale(s.scaleTick, clamped);
      return {
        ...s,
        oldScale: s.scale,
        scaleValue: clamped,
        scale: nextScale,
      };
    });
    if (options?.persist !== false) {
      this.persist();
    }
  }

  /**
   * Pinch / ctrl+wheel zoom. Keeps integer percent; at 50%/200% switches Day↔Week↔Quarter.
   * @returns false when nothing changed (already at hard limit).
   */
  applyGestureZoomFactor(
    factor: number,
    options?: { persist?: boolean },
  ): boolean {
    const s = this.settingsSignal();
    let tick = s.scaleTick;
    let value = Math.round(s.scaleValue);

    let next = Math.round(value * factor);
    if (next === value && Math.abs(factor - 1) > 0.001) {
      next = factor > 1 ? value + 1 : value - 1;
    }

    let idx = ZOOM_TICKS.indexOf(tick);
    if (idx < 0) idx = 0;

    while (next > 200 && idx > 0) {
      idx -= 1;
      tick = ZOOM_TICKS[idx];
      next = 50 + (next - 200);
    }
    if (next > 200) next = 200;

    while (next < 50 && idx < ZOOM_TICKS.length - 1) {
      idx += 1;
      tick = ZOOM_TICKS[idx];
      next = 200 - (50 - next);
    }
    if (next < 50) next = 50;

    next = Math.max(50, Math.min(200, Math.round(next)));
    tick = ZOOM_TICKS[idx] ?? tick;

    if (tick === s.scaleTick && next === Math.round(s.scaleValue)) {
      return false;
    }

    this.settingsSignal.update((cur) => ({
      ...cur,
      oldScale: cur.scale,
      scaleTick: tick,
      scaleValue: next,
      scale: this.computeActualScale(tick, next),
    }));
    if (options?.persist !== false) {
      this.persist();
    }
    return true;
  }

  /** Flush pending settings after a gesture zoom burst. */
  persistScale(): void {
    this.persist();
  }

  setShowMilestones(value: boolean): void {
    this.settingsSignal.update((s) => ({ ...s, showMilestones: value }));
    this.persist();
  }

  setShowTitleRight(value: boolean): void {
    this.settingsSignal.update((s) => ({ ...s, showTitleRight: value }));
    this.persist();
  }

  setShowWorkforce(value: boolean): void {
    this.settingsSignal.update((s) => ({ ...s, showWorkforce: value }));
    this.persist();
  }

  setShowTable(value: boolean): void {
    this.settingsSignal.update((s) => ({ ...s, showTable: value }));
    this.persist();
  }

  setTableWidth(value: number): void {
    this.settingsSignal.update((s) => ({
      ...s,
      tableWidth: value,
      showTable: true,
    }));
    this.persist();
  }

  setIssueRowHeightPx(value: number): void {
    const rowH = this.clampIssueRowHeightPx(value);
    this.settingsSignal.update((s) => ({
      ...s,
      issueRowHeightPx: rowH,
      fontSize: this.deriveTimelineTableFontSizePx(rowH),
    }));
    this.persist();
  }

  setOpenIndex(issueId: string, opened: boolean): void {
    this.settingsSignal.update((s) => ({
      ...s,
      open_index: { ...s.open_index, [issueId]: opened },
    }));
    this.persist();
  }

  setOpenGroupIndex(groupId: string, opened: boolean): void {
    this.settingsSignal.update((s) => ({
      ...s,
      open_index_group: { ...s.open_index_group, [groupId]: opened },
    }));
    this.persist();
  }

  get ticks(): TimelineScaleTick[] {
    return this.settingsSignal().ticks;
  }

  getTickBaseScale(tickId: TimelineTicksId): number {
    return TICKS.find((t) => t.id === tickId)?.scale ?? 5000;
  }

  private bindProfileSync(): void {
    if (this.profileSyncBound || !this.rwSettings.user?.updated) {
      return;
    }
    this.profileSyncBound = true;
    this.rwSettings.user.updated
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const profile = this.readProfileTimeline();
        if (profile) {
          this.applyStoredSettings(profile);
        }
      });
  }

  private readMergedSettings(userId?: string): TimelineProfileSettings | null {
    const local = this.readLocalSettings(userId);
    const profile = this.readProfileTimeline();
    if (!local && !profile) {
      return null;
    }
    return { ...local, ...profile };
  }

  private readLocalSettings(userId?: string): TimelineProfileSettings | null {
    const key =
      userId != null ? `${STORAGE_PREFIX}${userId}` : this.storageKey();
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as TimelineProfileSettings) : null;
    } catch {
      return null;
    }
  }

  private readProfileTimeline(): TimelineProfileSettings | undefined {
    return this.rwSettings.user?.settings?.timeline;
  }

  private applyStoredSettings(stored: TimelineProfileSettings): void {
    const { hours24InDay, ...timelineFields } = stored;
    this.settingsSignal.set(this.mergePersistedPartial(timelineFields));
    this.applyHours24InDay(hours24InDay ?? true);
  }

  private applyHours24InDay(hours24InDay: boolean): void {
    this.issueDateTimeSvc.issueDateTime.hours24InDay = hours24InDay;
  }

  private mergePersistedPartial(
    parsed: Partial<TimelineProfileSettings>,
  ): TimelineSettings {
    const i = this.initialSettings;
    const scaleTick = parsed.scaleTick ?? i.scaleTick;
    const scaleValue = parsed.scaleValue ?? i.scaleValue;
    const scale = this.computeActualScale(scaleTick, scaleValue);
    const rowH = this.clampIssueRowHeightPx(
      parsed.issueRowHeightPx ?? i.issueRowHeightPx,
    );

    const hierarchyMode =
      parsed.hierarchyMode === 'leaves' || parsed.hierarchyMode === 'subtasks'
        ? parsed.hierarchyMode
        : i.hierarchyMode;

    return {
      ...i,
      grouping: parsed.grouping ?? i.grouping,
      hierarchyMode,
      scaleTick,
      scaleValue,
      scale,
      oldScale: scale,
      showMilestones: parsed.showMilestones ?? i.showMilestones,
      showTitleRight: parsed.showTitleRight ?? i.showTitleRight,
      showWorkforce: parsed.showWorkforce ?? i.showWorkforce,
      showTable: parsed.showTable ?? i.showTable,
      tableWidth: parsed.tableWidth ?? i.tableWidth,
      open_index: parsed.open_index ?? i.open_index,
      open_index_group: parsed.open_index_group ?? i.open_index_group,
      sort: (parsed.sort as TimelineSettings['sort']) ?? i.sort,
      workforceHeight:
        parsed.workforceHeight !== undefined
          ? parsed.workforceHeight
          : i.workforceHeight,
      ticks: TICKS,
      issueRowHeightPx: rowH,
      fontSize: this.deriveTimelineTableFontSizePx(rowH),
      milestoneRowHeightPx: i.milestoneRowHeightPx,
    };
  }

  private persist(): void {
    const key = this.storageKey();
    const payload = this.buildPersistedSettings();
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(payload));
      } catch {
        // ignore
      }
    }
    this.persistToProfile(payload);
  }

  private persistToProfile(payload: TimelineProfileSettings): void {
    if (!this.rwSettings.userID || !this.rwSettings.user) {
      return;
    }
    this.rwSettings.user.settings.timeline = payload;
    this.rwSettings.user.saveInlocalStorage();
    this.rwSettings.saveSettings().subscribe();
  }

  private buildPersistedSettings(): TimelineProfileSettings {
    const s = this.settingsSignal();
    return {
      grouping: s.grouping,
      hierarchyMode: s.hierarchyMode,
      scaleTick: s.scaleTick,
      scaleValue: s.scaleValue,
      showMilestones: s.showMilestones,
      showTitleRight: s.showTitleRight,
      showWorkforce: s.showWorkforce,
      showTable: s.showTable,
      tableWidth: s.tableWidth,
      issueRowHeightPx: s.issueRowHeightPx,
      open_index: s.open_index,
      open_index_group: s.open_index_group,
      sort: s.sort,
      hours24InDay: this.issueDateTimeSvc.issueDateTime.hours24InDay,
      workforceHeight: s.workforceHeight,
    };
  }

  private computeActualScale(
    tickId: TimelineTicksId,
    scaleValue: number,
  ): number {
    const tick = TICKS.find((t) => t.id === tickId);
    if (!tick || !tick.scale || !scaleValue) return 5000;
    return Math.max(1, Math.round((tick.scale * 50) / scaleValue));
  }

  private deriveTimelineTableFontSizePx(issueRowHeightPx: number): number {
    return Math.max(10, Math.round((issueRowHeightPx * 12) / 37));
  }

  private clampIssueRowHeightPx(value: number): number {
    if (!Number.isFinite(value)) {
      return this.initialSettings.issueRowHeightPx;
    }
    const stepped =
      Math.round(value / TIMELINE_ROW_HEIGHT_STEP_PX) *
      TIMELINE_ROW_HEIGHT_STEP_PX;
    return Math.min(
      TIMELINE_ROW_HEIGHT_MAX_PX,
      Math.max(TIMELINE_ROW_HEIGHT_MIN_PX, stepped),
    );
  }
}
