import { Injectable, computed, inject, signal } from '@angular/core';
import {
  ListOptionsFilters,
  RwUserService,
  TimelineScaleTick,
  TimelineTicksId,
} from '@renwu/core';
import { TimelineSettings } from '../models/timeline-settings.model';

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
    scale: 5000,
    oldScale: 5000,
    scaleValue: 120,

    tableWidth: 250,
    showMilestones: true,
    showWorkforce: false,
    showTitleInside: true,
    showTitleRight: false,

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
  getTimeline(isWorkload: boolean): TimelineSettings {
    const current = this.settingsSignal();
    if (current.showWorkforce !== isWorkload) {
      this.settingsSignal.update((s) => ({
        ...s,
        showWorkforce: isWorkload,
      }));
    }

    // Ensure the current ticks reference is stable for the UI.
    return this.settingsSignal();
  }

  initFromLocalStorage(userId?: string): void {
    const key =
      userId != null
        ? `${STORAGE_PREFIX}${userId}`
        : this.storageKey();
    if (!key) return;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<TimelineSettings>;
      this.settingsSignal.update((prev) => ({
        ...prev,
        ...parsed,
        // Always keep ticks aligned with our local tick set.
        ticks: TICKS,
        open_index: parsed.open_index ?? prev.open_index,
        open_index_group: parsed.open_index_group ?? prev.open_index_group,
      }));
    } catch {
      // ignore broken localStorage
    }
  }

  private persist(): void {
    const key = this.storageKey();
    if (!key) return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify(this.settingsSignal()),
      );
    } catch {
      // ignore storage quota / disabled storage
    }
  }

  get ticks(): TimelineScaleTick[] {
    return this.settingsSignal().ticks;
  }

  getScaleValue(tickId: TimelineTicksId): number {
    return this.ticks.find((t) => t.id === tickId)?.scale ?? this.settingsSignal().scale;
  }

  // --- Mutators (used by timeline UI) ---

  setGrouping(value: string): void {
    this.settingsSignal.update((s) => ({ ...s, grouping: value }));
    this.persist();
  }

  setScaleTick(value: TimelineTicksId): void {
    const nextScale = this.getScaleValue(value);
    this.settingsSignal.update((s) => ({
      ...s,
      oldScale: s.scale,
      scaleTick: value,
      scale: nextScale,
    }));
    this.persist();
  }

  setScaleValue(value: number): void {
    this.settingsSignal.update((s) => ({
      ...s,
      oldScale: s.scale,
      scaleValue: value,
      scale: value,
    }));
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

  setTableWidth(value: number): void {
    this.settingsSignal.update((s) => ({ ...s, tableWidth: value }));
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

