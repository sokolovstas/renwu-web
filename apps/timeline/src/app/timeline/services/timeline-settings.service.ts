import { Injectable, computed, inject, signal } from '@angular/core';
import {
  ListOptionsFilters,
  RW_WORKLOAD_SETTINGS_STORAGE_PREFIX,
  RwUserService,
  TimelineScaleTick,
  TimelineTicksId,
} from '@renwu/core';
import { TimelineSettings } from '../models/timeline-settings.model';
import { TimelineWorkloadStorage } from '../models/timeline-workload-storage.model';

const STORAGE_PREFIX = 'renwu_timeline_settings_';

// Minimal tick set required by the migrated timeline UI.
// Values will be fine-tuned once scale behavior is fully integrated.
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
  private userService = inject(RwUserService);

  private readonly storageKey = computed(() => {
    const id = this.userService.currentUserValue?.id;
    return id ? `${STORAGE_PREFIX}${id}` : null;
  });

  private readonly initialSettings: TimelineSettings = {
    fontSize: 12,
    grouping: 'none',

    scaleTick: TimelineTicksId.DAY,
    scale: this.computeActualScale(TimelineTicksId.DAY, 100),
    oldScale: this.computeActualScale(TimelineTicksId.DAY, 100),
    scaleValue: 100,

    tableWidth: 380,
    /** Issue row height (px); not persisted — only `initialSettings` / deploy. */
    issueRowHeightPx: 30,
    milestoneRowHeightPx: 24,
    showMilestones: true,
    showWorkforce: true,
    showTitleInside: true,
    showTitleRight: true,

    workforceHeight: null,

    sort: DEFAULT_SORT,

    open_index: {},
    open_index_group: {},

    ticks: TICKS,
  };

  private settingsSignal = signal<TimelineSettings>(this.initialSettings);

  /** Use in `computed()` so templates react when settings change (not only via `getTimeline()`). */
  readonly timelineSettings = this.settingsSignal.asReadonly();

  /**
   * Mutably exposed "settings timeline" snapshot for the feature UI.
   * Later phases can switch to signals-aware templates if needed.
   */
  getTimeline(): TimelineSettings {
    return this.settingsSignal();
  }

  syncWorkforceMode(isWorkload: boolean): void {
    const current = this.settingsSignal();
    if (current.showWorkforce === isWorkload) {
      return;
    }
    this.settingsSignal.update((s) => ({
      ...s,
      showWorkforce: isWorkload,
    }));
    this.persist();
  }

  initFromLocalStorage(userId?: string): void {
    const key =
      userId != null ? `${STORAGE_PREFIX}${userId}` : this.storageKey();
    if (!key) return;

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TimelineSettings> & {
          hoursPerDay?: number;
          displayHoursPerDay?: boolean;
        };
        const {
          hoursPerDay,
          displayHoursPerDay,
          ...timelineRest
        } = parsed;
        void hoursPerDay;
        void displayHoursPerDay;
        this.settingsSignal.set(this.mergePersistedPartial(timelineRest));
      }
      this.mergeWorkloadFromLocalStorage(userId);
    } catch {
      // ignore broken localStorage
    }
  }

  /**
   * Rebuild full settings: code-only fields from `initialSettings`, user fields from persisted partial.
   * Ignores legacy keys in storage that are no longer persisted (e.g. `issueRowHeightPx`).
   */
  private mergePersistedPartial(
    parsed: Partial<TimelineSettings>,
  ): TimelineSettings {
    const i = this.initialSettings;
    const scaleTick = parsed.scaleTick ?? i.scaleTick;
    const scaleValue = parsed.scaleValue ?? i.scaleValue;
    const scale = this.computeActualScale(scaleTick, scaleValue);
    const rowH = i.issueRowHeightPx;

    return {
      ...i,
      grouping: parsed.grouping ?? i.grouping,
      scaleTick,
      scaleValue,
      scale,
      oldScale: scale,
      showMilestones: parsed.showMilestones ?? i.showMilestones,
      showTitleInside: parsed.showTitleInside ?? i.showTitleInside,
      showTitleRight: parsed.showTitleRight ?? i.showTitleRight,
      showWorkforce: parsed.showWorkforce ?? i.showWorkforce,
      tableWidth: parsed.tableWidth ?? i.tableWidth,
      open_index: parsed.open_index ?? i.open_index,
      open_index_group: parsed.open_index_group ?? i.open_index_group,
      sort: parsed.sort ?? i.sort,
      ticks: TICKS,
      issueRowHeightPx: rowH,
      fontSize: this.deriveTimelineTableFontSizePx(rowH),
      milestoneRowHeightPx: i.milestoneRowHeightPx,
      workforceHeight: i.workforceHeight,
    };
  }

  private mergeWorkloadFromLocalStorage(userId?: string): void {
    const uid = userId ?? this.userService.currentUserValue?.id;
    if (!uid) return;
    const wkey = `${RW_WORKLOAD_SETTINGS_STORAGE_PREFIX}${uid}`;
    try {
      const raw = localStorage.getItem(wkey);
      if (!raw) return;
      const w = JSON.parse(raw) as TimelineWorkloadStorage;
      this.settingsSignal.update((prev) => ({
        ...prev,
        ...(w.showWorkforce !== undefined
          ? { showWorkforce: w.showWorkforce }
          : {}),
        ...(w.workforceHeight !== undefined
          ? { workforceHeight: w.workforceHeight }
          : {}),
      }));
    } catch {
      // ignore
    }
  }

  private pickWorkloadForStorage(s: TimelineSettings): TimelineWorkloadStorage {
    return {
      showWorkforce: s.showWorkforce,
      workforceHeight: s.workforceHeight,
    };
  }

  private persist(): void {
    const key = this.storageKey();
    if (!key) return;
    const state = this.settingsSignal();
    const userId = key.slice(STORAGE_PREFIX.length);
    const workloadKey = `${RW_WORKLOAD_SETTINGS_STORAGE_PREFIX}${userId}`;
    try {
      localStorage.setItem(key, JSON.stringify(this.pickPersistableSettings(state)));
      localStorage.setItem(
        workloadKey,
        JSON.stringify(this.pickWorkloadForStorage(state)),
      );
    } catch {
      // ignore storage quota / disabled storage
    }
  }

  /** Only user-controlled fields; layout/code defaults (`issueRowHeightPx`, `fontSize`, …) stay in code. */
  private pickPersistableSettings(s: TimelineSettings): Record<string, unknown> {
    return {
      grouping: s.grouping,
      scaleTick: s.scaleTick,
      scaleValue: s.scaleValue,
      showMilestones: s.showMilestones,
      showTitleInside: s.showTitleInside,
      showTitleRight: s.showTitleRight,
      showWorkforce: s.showWorkforce,
      tableWidth: s.tableWidth,
      open_index: s.open_index,
      open_index_group: s.open_index_group,
      sort: s.sort,
    };
  }

  get ticks(): TimelineScaleTick[] {
    return this.settingsSignal().ticks;
  }

  /**
   * Compute seconds-per-pixel from tick base scale and zoom percentage.
   * Formula from the old codebase: `actualScale = tickBaseScale * 50 / scaleValue`
   * where scaleValue is a percentage (50 = most zoomed out, 200 = most zoomed in).
   */
  private computeActualScale(
    tickId: TimelineTicksId,
    scaleValue: number,
  ): number {
    const tick = TICKS.find((t) => t.id === tickId);
    if (!tick || !tick.scale || !scaleValue) return 5000;
    return Math.max(1, Math.round((tick.scale * 50) / scaleValue));
  }

  getTickBaseScale(tickId: TimelineTicksId): number {
    return TICKS.find((t) => t.id === tickId)?.scale ?? 5000;
  }

  // --- Mutators (used by timeline UI) ---

  setGrouping(value: string): void {
    this.settingsSignal.update((s) => ({ ...s, grouping: value }));
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

  setShowTitleInside(value: boolean): void {
    this.settingsSignal.update((s) => ({ ...s, showTitleInside: value }));
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

  /** Table label font (px): same scale as legacy 12px text in a 37px row. */
  private deriveTimelineTableFontSizePx(issueRowHeightPx: number): number {
    return Math.max(10, Math.round((issueRowHeightPx * 12) / 37));
  }

  setOpenIndex(issueId: string, opened: boolean): void {
    this.settingsSignal.update((s) => ({
      ...s,
      open_index: {
        ...s.open_index,
        [issueId]: opened,
      },
    }));
    this.persist();
  }

  setOpenGroupIndex(groupId: string, opened: boolean): void {
    this.settingsSignal.update((s) => ({
      ...s,
      open_index_group: {
        ...s.open_index_group,
        [groupId]: opened,
      },
    }));
    this.persist();
  }
}
