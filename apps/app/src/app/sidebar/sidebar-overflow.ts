export interface SidebarNavItem {
  path?: string;
  tour?: string;
}

export interface SidebarNavSplit<T> {
  visible: T[];
  overflow: T[];
}

/** Newest visits kept for the mobile row. Not used for credentials. */
export const SIDEBAR_RECENTS_STORAGE_KEY = 'renwu-sidebar-recents';
export const SIDEBAR_RECENT_LIMIT = 12;

export function isPinnedSidebarSection(section: {
  path?: string;
}): boolean {
  return (
    section.path === '' ||
    section.path === 'dashboard' ||
    section.path === 'messenger'
  );
}

/** Stable id. Dashboard is path `''`. Sections without a path use their tour. */
export function sidebarSectionStorageKey(section: {
  path?: string;
  tour?: string;
}): string | null {
  if (typeof section.path === 'string') {
    return section.path;
  }
  if (section.tour) {
    return `tour:${section.tour}`;
  }
  return null;
}

export function rememberSidebarSection(
  recents: readonly string[],
  section: { path?: string; tour?: string } | null | undefined,
): string[] {
  if (!section || isPinnedSidebarSection(section)) {
    return [...recents];
  }
  const key = sidebarSectionStorageKey(section);
  if (!key) {
    return [...recents];
  }
  return [key, ...recents.filter((item) => item !== key)].slice(
    0,
    SIDEBAR_RECENT_LIMIT,
  );
}

export function loadSidebarRecents(
  storage: Pick<Storage, 'getItem'> | null = browserStorage(),
): string[] {
  try {
    const raw = storage?.getItem(SIDEBAR_RECENTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is string => typeof item === 'string')
      .slice(0, SIDEBAR_RECENT_LIMIT);
  } catch {
    return [];
  }
}

export function saveSidebarRecents(
  recents: readonly string[],
  storage: Pick<Storage, 'setItem'> | null = browserStorage(),
): void {
  try {
    storage?.setItem(
      SIDEBAR_RECENTS_STORAGE_KEY,
      JSON.stringify(recents.slice(0, SIDEBAR_RECENT_LIMIT)),
    );
  } catch {
    // Storage can be unavailable in private mode.
  }
}

function browserStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function pinRank(section: { path?: string }): number {
  if (section.path === '' || section.path === 'dashboard') {
    return 0;
  }
  if (section.path === 'messenger') {
    return 1;
  }
  return 2;
}

/** Phone row, including the more button when something is in «Ещё». */
export const MOBILE_NAV_SLOT_COUNT = 6;

/**
 * `slotCount` >= section count keeps the desktop order and hides More.
 * On a phone the row is at most 6: Dashboard, Chat, then recents with the
 * newest at the right. Overflow drops the oldest recent into More.
 * With overflow the recent slots are 3; without it, up to 4.
 */
export function partitionSidebarSections<T extends SidebarNavItem>(
  sections: readonly T[],
  slotCount: number,
  activeKey: string | null | undefined,
  recentKeys: readonly string[] = [],
): SidebarNavSplit<T> {
  if (
    sections.length === 0 ||
    !Number.isFinite(slotCount) ||
    slotCount >= sections.length
  ) {
    return { visible: [...sections], overflow: [] };
  }

  const pinned = sections
    .filter((section) => isPinnedSidebarSection(section))
    .sort((a, b) => pinRank(a) - pinRank(b));
  const pinnedKeys = new Set(
    pinned
      .map((section) => sidebarSectionStorageKey(section))
      .filter((key): key is string => key != null),
  );

  const byKey = new Map<string, T>();
  for (const section of sections) {
    const key = sidebarSectionStorageKey(section);
    if (key && !pinnedKeys.has(key)) {
      byKey.set(key, section);
    }
  }

  const recentOrdered: T[] = [];
  const seen = new Set<string>();
  const pushKey = (key: string | null | undefined): void => {
    if (!key || seen.has(key) || pinnedKeys.has(key)) {
      return;
    }
    const section = byKey.get(key);
    if (!section) {
      return;
    }
    seen.add(key);
    recentOrdered.push(section);
  };

  pushKey(activeKey);
  for (const key of recentKeys) {
    pushKey(key);
  }

  const others = sections.filter((section) => {
    const key = sidebarSectionStorageKey(section);
    return key == null || !pinnedKeys.has(key);
  });
  const allOthersFitWithoutMore =
    others.length <= 4 &&
    others.every((section) => {
      const key = sidebarSectionStorageKey(section);
      return key != null && seen.has(key);
    });
  const recentTake = allOthersFitWithoutMore
    ? recentOrdered.length
    : Math.min(3, recentOrdered.length);
  // Stored newest-first; the row shows the newest on the right.
  const recentVisible = recentOrdered.slice(0, recentTake).reverse();
  const visible = [...pinned, ...recentVisible];
  const visibleKeys = new Set(
    visible
      .map((section) => sidebarSectionStorageKey(section))
      .filter((key): key is string => key != null),
  );
  const overflow = sections.filter((section) => {
    const key = sidebarSectionStorageKey(section);
    return key == null || !visibleKeys.has(key);
  });
  return { visible, overflow };
}
