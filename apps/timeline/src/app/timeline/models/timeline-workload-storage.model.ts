/**
 * Persisted under `renwu_workload_settings_${userId}` (same key cleared in RwSettingsService.resetAllSettings).
 */
export interface TimelineWorkloadStorage {
  showWorkforce?: boolean;
  workforceHeight?: { id: string; value: number } | null;
}
