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
    issueRowHeightPx: 37,
    milestoneRowHeightPx: 22,
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
      userId != null
        ? `${STORAGE_PREFIX}${userId}`
        : this.storageKey();
    if (!key) return;

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TimelineSettings> & {
          hoursPerDay?: number;
          displayHoursPerDay?: boolean;
        };
        const {
          hoursPerDay: _omitHours,
          displayHoursPerDay: _omitDisplay,
          ...timelineRest
        } = parsed;
        const scaleTick =
          timelineRest.scaleTick ?? this.initialSettings.scaleTick;
        const scaleValue =
          timelineRest.scaleValue ?? this.initialSettings.scaleValue;
        const scale = this.computeActualScale(scaleTick, scaleValue);
        this.settingsSignal.update((prev) => ({
          ...prev,
          ...timelineRest,
          ticks: TICKS,
          scale,
          oldScale: scale,
          issueRowHeightPx:
            timelineRest.issueRowHeightPx ?? prev.issueRowHeightPx,
          milestoneRowHeightPx:
            timelineRest.milestoneRowHeightPx ?? prev.milestoneRowHeightPx,
          open_index: timelineRest.open_index ?? prev.open_index,
          open_index_group: timelineRest.open_index_group ?? prev.open_index_group,
        }));
      }
      this.mergeWorkloadFromLocalStorage(userId);
    } catch {
      // ignore broken localStorage
    }
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
        ...(w.showWorkforce !== undefined ? { showWorkforce: w.showWorkforce } : {}),
        ...(w.workforceHeight !== undefined ? { workforceHeight: w.workforceHeight } : {}),
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
      localStorage.setItem(key, JSON.stringify(state));
      localStorage.setItem(
        workloadKey,
        JSON.stringify(this.pickWorkloadForStorage(state)),
      );
    } catch {
      // ignore storage quota / disabled storage
    }
  }

  get ticks(): TimelineScaleTick[] {
    return this.settingsSignal().ticks;
  }

  /**
   * Compute seconds-per-pixel from tick base scale and zoom percentage.
   * Formula from the old codebase: `actualScale = tickBaseScale * 50 / scaleValue`
   * where scaleValue is a percentage (50 = most zoomed out, 200 = most zoomed in).
   */
  private computeActualScale(tickId: TimelineTicksId, scaleValue: number): number {
    const tick = TICKS.find((t) => t.id === tickId);
    if (!tick || !tick.scale || !scaleValue) return 5000;
    return Math.max(1, Math.round(tick.scale * 50 / scaleValue));
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

  setFontSize(value: number): void {
    this.settingsSignal.update((s) => ({ ...s, fontSize: value }));
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

  /** Clamp 24–96 px; updates `--timeline-issue-row-height` via settings snapshot. */
  setIssueRowHeightPx(value: number): void {
    const v = Math.max(24, Math.min(96, Math.round(value)));
    this.settingsSignal.update((s) => ({ ...s, issueRowHeightPx: v }));
    this.persist();
  }

  /** Clamp 18–48 px; height of each milestone track in the roadmap strip. */
  setMilestoneRowHeightPx(value: number): void {
    const v = Math.max(18, Math.min(48, Math.round(value)));
    this.settingsSignal.update((s) => ({ ...s, milestoneRowHeightPx: v }));
    this.persist();
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

