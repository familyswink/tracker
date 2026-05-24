/** Tab visibility config (REQ-1). */

export const TAB_IDS = ['water', 'supps', 'food', 'other', 'notes', 'log', 'settings'];

export const DEFAULT_TAB_VISIBILITY = {
  water: true,
  supps: true,
  food: true,
  other: true,
  notes: true,
  log: true,
  settings: true,
};

export function normalizeTabVisibility(tabs) {
  const out = { ...DEFAULT_TAB_VISIBILITY, ...(tabs || {}) };
  out.settings = true;
  for (const id of TAB_IDS) {
    if (typeof out[id] !== 'boolean') out[id] = DEFAULT_TAB_VISIBILITY[id];
  }
  return out;
}

export function isTabVisible(tabs, id) {
  if (id === 'settings') return true;
  return normalizeTabVisibility(tabs)[id] !== false;
}

export function visibleTabIds(tabs) {
  return TAB_IDS.filter((id) => isTabVisible(tabs, id));
}
