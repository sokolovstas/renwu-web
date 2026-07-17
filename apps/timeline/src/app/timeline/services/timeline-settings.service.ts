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

const DEFAULT_SORT: ListOptionsFilters['sort'] = {
  field: 'status',
  direction: 'down',
};

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

  setScaleValue(value: number): void {
    this.settingsSignal.update((s) => {
      const clamped = Math.max(50, Math.min(200, value));
      const nextScale = this.computeActualScale(s.scaleTick, clamped);
      return {
        ...s,
        oldScale: s.scale,
        scaleValue: clamped,
        scale: nextScale,
      };
    });
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

  setTableWidth(value: number): void {
    this.settingsSignal.update((s) => ({ ...s, tableWidth: value }));
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
    const rowH = i.issueRowHeightPx;

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
      tableWidth: s.tableWidth,
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
}
