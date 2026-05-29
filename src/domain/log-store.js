/**
 * Phase 2 — unified log list/get/update/delete for history and export helpers.
 * Display labels remain in app UI; this module owns array access + day filter.
 */

import { logEntryDay } from '../core/date.js';

export const LOG_TYPES = ['water', 'supps', 'food', 'other', 'notes'];

/** @returns {{ key: string, arr: unknown[] }[]} */
export function arraysForType(state, type) {
  if (type === 'water') return [{ key: 'wl', arr: state.wl || [] }];
  if (type === 'supps') {
    return [
      { key: 'sl', arr: state.sl || [] },
      { key: 'snotes', arr: state.snotes || [] },
    ];
  }
  if (type === 'food') {
    return [
      { key: 'fl', arr: state.fl || [] },
      { key: 'fnotes', arr: state.fnotes || [] },
    ];
  }
  if (type === 'other') return [{ key: 'al', arr: state.al || [] }];
  if (type === 'notes') return [{ key: 'notes', arr: state.notes || [] }];
  return [];
}

export function filterByDay(entries, day) {
  if (!day) return entries.slice();
  return entries.filter((e) => logEntryDay(e) === day);
}

function sortEntries(entries, sort) {
  const rows = entries.slice();
  if (sort === 'oldest') rows.sort((a, b) => String(a.dt).localeCompare(String(b.dt)));
  else rows.sort((a, b) => String(b.dt).localeCompare(String(a.dt)));
  return rows;
}

export function listLogs(state, type, { day, sort = 'newest' } = {}) {
  let rows = [];
  if (type === 'water') rows = state.wl || [];
  else if (type === 'supps') rows = [...(state.sl || []), ...(state.snotes || [])];
  else if (type === 'food') {
    rows = [
      ...(state.fl || []).filter((e) => e.fid !== '__meal__'),
      ...(state.fnotes || []),
    ];
  } else if (type === 'other') rows = state.al || [];
  else if (type === 'notes') rows = state.notes || [];
  rows = filterByDay(rows, day);
  return sortEntries(rows, sort);
}

export function getLog(state, type, id) {
  for (const { arr } of arraysForType(state, type)) {
    const hit = arr.find((x) => x.id === id);
    if (hit) return hit;
  }
  return null;
}

export function updateLogDt(state, type, ids, newDt) {
  const set = new Set(ids);
  let count = 0;
  for (const { arr } of arraysForType(state, type)) {
    arr.forEach((e) => {
      if (set.has(e.id)) {
        e.dt = newDt;
        count++;
      }
    });
  }
  return count;
}

export function updateLogs(state, type, ids, patch) {
  const set = new Set(ids);
  let count = 0;
  for (const { arr } of arraysForType(state, type)) {
    arr.forEach((e) => {
      if (set.has(e.id)) {
        Object.assign(e, patch);
        count++;
      }
    });
  }
  return count;
}

export function removeLogIds(state, type, ids) {
  const set = new Set(ids);
  if (type === 'water') state.wl = (state.wl || []).filter((x) => !set.has(x.id));
  else if (type === 'supps') {
    state.sl = (state.sl || []).filter((x) => !set.has(x.id));
    state.snotes = (state.snotes || []).filter((x) => !set.has(x.id));
  } else if (type === 'food') {
    state.fl = (state.fl || []).filter((x) => !set.has(x.id));
    state.fnotes = (state.fnotes || []).filter((x) => !set.has(x.id));
  } else if (type === 'other') state.al = (state.al || []).filter((x) => !set.has(x.id));
  else if (type === 'notes') state.notes = (state.notes || []).filter((x) => !set.has(x.id));
  return state;
}

export function combinedTrackerLogText(dates, renderDay) {
  return dates.map((d) => renderDay(d)).join('\n\n');
}
