/**
 * Day-over-day change report (supplements, food, water, other).
 * Compares each calendar day to the prior day using localStorage log data.
 */

import { isoToLocalYMD, localDateYMD, onLogDay } from '../core/date.js';

export function prevCalendarDay(ymd) {
  const p = String(ymd).split('-').map((x) => parseInt(x, 10));
  const d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
  d.setDate(d.getDate() - 1);
  return localDateYMD(d);
}

export function datesInRangeInclusive(startYmd, endYmd) {
  const a = String(startYmd);
  const b = String(endYmd);
  if (!a || !b) return [];
  let s = a;
  let e = b;
  if (s > e) [s, e] = [e, s];
  const out = [];
  const cur = s.split('-').map((x) => parseInt(x, 10));
  let dt = new Date(cur[0], cur[1] - 1, cur[2]);
  const endParts = e.split('-').map((x) => parseInt(x, 10));
  const endDt = new Date(endParts[0], endParts[1] - 1, endParts[2]);
  while (dt <= endDt) {
    out.push(localDateYMD(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return out;
}

export function minutesOfDayFromIso(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

/** Shortest distance between two clock times on a 24h circle. */
export function clockMinutesApart(a, b) {
  if (a == null || b == null) return Infinity;
  const diff = Math.abs(a - b);
  return Math.min(diff, 1440 - diff);
}

export function isTrackChangeSupp(m) {
  return m && m.trackChange !== false;
}

export function isTrackChangeFood(f) {
  return !!(f && f.trackChange === true);
}

export function isTrackChangeAct(a) {
  return !!(a && a.trackChange === true);
}

export function isTrackChangeWater(cfg) {
  return !!(cfg && cfg.trackWaterChange === true);
}

function groupLabel(state, grpId) {
  const g = (state.suppGroups || []).find((x) => x.id === grpId);
  return g?.lb || grpId || 'Other';
}

function suppDisplayName(state, mid) {
  const m = (state.sm || []).find((x) => x.id === mid);
  if (!m) return 'Unknown';
  const mfr = m.mfr && m.mfr !== '--' ? m.mfr + ' — ' : '';
  return mfr + (m.name || 'Unknown');
}

function suppUnits(state, mid) {
  const m = (state.sm || []).find((x) => x.id === mid);
  return m?.units || '';
}

function resolveMidFromLog(state, entry) {
  const sc = (state.sch || []).find((x) => x.id === entry.sid);
  return sc?.mid;
}

function isWaterSuppLog(state, entry) {
  const mid = resolveMidFromLog(state, entry);
  const m = (state.sm || []).find((x) => x.id === mid);
  return !!(m && m.name === 'Water');
}

/** @returns {Record<string, { qty: number, timeMin: number|null, skipped: boolean, hasTaken: boolean }>} */
export function aggregateSupplementDay(state, ymd, mid) {
  const byGroup = {};
  for (const e of state.sl || []) {
    if (!onLogDay(e.dt, ymd)) continue;
    if (resolveMidFromLog(state, e) !== mid) continue;
    if (isWaterSuppLog(state, e)) continue;
    const sc = (state.sch || []).find((x) => x.id === e.sid);
    const grp = sc?.grp || 'other';
    if (!byGroup[grp]) byGroup[grp] = { qty: 0, timeMin: null, skipped: false, hasTaken: false };
    if (e.sk) {
      byGroup[grp].skipped = true;
    } else {
      byGroup[grp].hasTaken = true;
      byGroup[grp].qty += parseFloat(e.qty) || 0;
      const tm = minutesOfDayFromIso(e.dt);
      if (tm != null && (byGroup[grp].timeMin == null || tm < byGroup[grp].timeMin)) {
        byGroup[grp].timeMin = tm;
      }
    }
  }
  return byGroup;
}

function totalTakenQty(byGroup) {
  return Object.values(byGroup).reduce((s, g) => s + (g.hasTaken ? g.qty : 0), 0);
}

function anchorTime(byGroup) {
  let min = null;
  for (const g of Object.values(byGroup)) {
    if (g.hasTaken && g.timeMin != null) {
      if (min == null || g.timeMin < min) min = g.timeMin;
    }
  }
  return min;
}

function takenSlots(byGroup) {
  return Object.entries(byGroup)
    .filter(([, g]) => g.hasTaken && g.qty > 0)
    .map(([grpId, g]) => ({ grpId, qty: g.qty, timeMin: g.timeMin }));
}

function skippedGroupLabels(state, byGroup) {
  return Object.entries(byGroup)
    .filter(([, g]) => g.skipped && !g.hasTaken)
    .map(([grpId]) => groupLabel(state, grpId));
}

export function supplementDaysEquivalent(prevByGroup, currByGroup, windowHours) {
  const prevQty = totalTakenQty(prevByGroup);
  const currQty = totalTakenQty(currByGroup);
  if (prevQty === 0 && currQty === 0) {
    const prevSkip = skippedGroupLabels({ suppGroups: [] }, prevByGroup);
    const currSkip = skippedGroupLabels({ suppGroups: [] }, currByGroup);
    return prevSkip.length === 0 && currSkip.length === 0;
  }
  if (prevQty !== currQty) return false;
  const pt = anchorTime(prevByGroup);
  const ct = anchorTime(currByGroup);
  if (pt == null || ct == null) return prevQty === currQty;
  return clockMinutesApart(pt, ct) <= windowHours * 60;
}

function formatSuppLine(state, mid, grpId, qty, suffix) {
  const units = suppUnits(state, mid);
  const u = units ? ' ' + units : '';
  return groupLabel(state, grpId) + ' — ' + suppDisplayName(state, mid) + ' — ' + qty + u + (suffix || '');
}

/**
 * Compare one tracked supplement between two days.
 * @returns {{ added: string[], removed: string[] }}
 */
export function diffSupplementMid(state, mid, prevYmd, ymd, windowHours) {
  const prev = aggregateSupplementDay(state, prevYmd, mid);
  const curr = aggregateSupplementDay(state, ymd, mid);
  const added = [];
  const removed = [];

  if (supplementDaysEquivalent(prev, curr, windowHours)) {
    return { added, removed };
  }

  const name = suppDisplayName(state, mid);
  const prevTaken = takenSlots(prev);
  const currTaken = takenSlots(curr);

  for (const grpId of Object.keys(prev)) {
    const g = prev[grpId];
    if (g.skipped && !g.hasTaken) {
      const c = curr[grpId];
      if (!c || (!c.hasTaken && !c.skipped)) {
        removed.push(formatSuppLine(state, mid, grpId, 0, ' (skipped — not taken)'));
      }
    }
  }
  for (const grpId of Object.keys(curr)) {
    const g = curr[grpId];
    if (g.skipped && !g.hasTaken) {
      const p = prev[grpId];
      if (p && p.hasTaken) {
        removed.push(formatSuppLine(state, mid, grpId, p.qty, ''));
        added.push(formatSuppLine(state, mid, grpId, 0, ' (skipped — not taken)'));
      }
    }
  }

  if (prevTaken.length === 0 && currTaken.length === 0) {
    return { added, removed };
  }

  if (prevTaken.length === 0 && currTaken.length > 0) {
    currTaken.forEach((c) => added.push(formatSuppLine(state, mid, c.grpId, c.qty, '')));
    return { added, removed };
  }

  if (prevTaken.length > 0 && currTaken.length === 0) {
    prevTaken.forEach((p) => removed.push(formatSuppLine(state, mid, p.grpId, p.qty, ' (not taken)')));
    return { added, removed };
  }

  if (prevTaken.length === 1 && currTaken.length === 1) {
    const p = prevTaken[0];
    const c = currTaken[0];
    if (p.grpId !== c.grpId || p.qty !== c.qty) {
      removed.push(
        'went from ' +
          p.qty +
          ' ' +
          groupLabel(state, p.grpId) +
          ' to ' +
          c.qty +
          ' at ' +
          groupLabel(state, c.grpId) +
          ' — ' +
          name,
      );
      return { added, removed };
    }
  }

  const prevMap = new Map(prevTaken.map((x) => [x.grpId, x]));
  const currMap = new Map(currTaken.map((x) => [x.grpId, x]));
  for (const [grpId, p] of prevMap) {
    if (!currMap.has(grpId)) removed.push(formatSuppLine(state, mid, grpId, p.qty, ' (not taken)'));
    else if (currMap.get(grpId).qty !== p.qty) {
      removed.push(formatSuppLine(state, mid, grpId, p.qty, ''));
      added.push(formatSuppLine(state, mid, grpId, currMap.get(grpId).qty, ''));
    }
  }
  for (const [grpId, c] of currMap) {
    if (!prevMap.has(grpId)) added.push(formatSuppLine(state, mid, grpId, c.qty, ''));
  }
  return { added, removed };
}

function aggregateFoodDay(state, ymd, fid) {
  let qty = 0;
  for (const e of state.fl || []) {
    if (!onLogDay(e.dt, ymd)) continue;
    if (e.fid !== fid || e.fid === '__meal__') continue;
    qty += parseFloat(e.qty) || 0;
  }
  return qty;
}

function diffFoodItem(state, fid, prevYmd, ymd) {
  const prev = aggregateFoodDay(state, prevYmd, fid);
  const curr = aggregateFoodDay(state, ymd, fid);
  if (prev === curr) return { added: [], removed: [] };
  const f = (state.fd || []).find((x) => x.id === fid);
  const name = f?.nm || 'Unknown';
  if (prev === 0 && curr > 0) return { added: [name + ' — ' + curr + ' servings'], removed: [] };
  if (prev > 0 && curr === 0) return { added: [], removed: [name + ' — ' + prev + ' servings (not logged)'] };
  return {
    added: [name + ' — ' + curr + ' servings'],
    removed: [name + ' — ' + prev + ' servings'],
  };
}

function aggregateWaterDay(state, ymd) {
  let total = 0;
  for (const e of state.wl || []) {
    if (onLogDay(e.dt, ymd)) total += parseFloat(e.qty) || 0;
  }
  return Math.round(total * 10) / 10;
}

function diffWater(state, prevYmd, ymd) {
  const prev = aggregateWaterDay(state, prevYmd);
  const curr = aggregateWaterDay(state, ymd);
  if (prev === curr) return { added: [], removed: [] };
  if (prev === 0 && curr > 0) return { added: ['Water — ' + curr + ' oz'], removed: [] };
  if (prev > 0 && curr === 0) return { added: [], removed: ['Water — ' + prev + ' oz (not logged)'] };
  return { added: ['Water — ' + curr + ' oz'], removed: ['Water — ' + prev + ' oz'] };
}

function otherEntryLabel(state, entry) {
  const act = (state.acts || []).find((x) => x.id === entry.aid);
  const type = act?.nm || 'Other';
  const parts = [type];
  for (const [k, v] of Object.entries(entry.flds || {})) {
    if (v === '' || v == null || (Array.isArray(v) && !v.length)) continue;
    parts.push(k + ': ' + (Array.isArray(v) ? v.join(', ') : String(v)));
  }
  if (entry.nt && String(entry.nt).trim()) parts.push('notes: ' + entry.nt.trim());
  return parts.join(' — ');
}

function diffOtherActivity(state, aid, prevYmd, ymd) {
  const prevEntries = (state.al || []).filter((e) => e.aid === aid && onLogDay(e.dt, prevYmd));
  const currEntries = (state.al || []).filter((e) => e.aid === aid && onLogDay(e.dt, ymd));
  if (!prevEntries.length && !currEntries.length) return { added: [], removed: [] };
  if (!prevEntries.length && currEntries.length) {
    return { added: currEntries.map((e) => otherEntryLabel(state, e)), removed: [] };
  }
  if (prevEntries.length && !currEntries.length) {
    return { added: [], removed: prevEntries.map((e) => otherEntryLabel(state, e) + ' (not logged)') };
  }
  const prevS = new Set(prevEntries.map((e) => otherEntryLabel(state, e)));
  const currS = new Set(currEntries.map((e) => otherEntryLabel(state, e)));
  const added = [...currS].filter((x) => !prevS.has(x));
  const removed = [...prevS].filter((x) => !currS.has(x));
  return { added, removed };
}

export function diffDay(state, prevYmd, ymd, windowHours) {
  const added = [];
  const removed = [];
  const wh = Number(windowHours) > 0 ? Number(windowHours) : 4;

  for (const m of state.sm || []) {
    if (!isTrackChangeSupp(m)) continue;
    if (m.name === 'Water') continue;
    const d = diffSupplementMid(state, m.id, prevYmd, ymd, wh);
    added.push(...d.added);
    removed.push(...d.removed);
  }

  for (const f of state.fd || []) {
    if (!isTrackChangeFood(f)) continue;
    const d = diffFoodItem(state, f.id, prevYmd, ymd);
    added.push(...d.added);
    removed.push(...d.removed);
  }

  if (isTrackChangeWater(state.cfg)) {
    const d = diffWater(state, prevYmd, ymd);
    added.push(...d.added);
    removed.push(...d.removed);
  }

  for (const a of state.acts || []) {
    if (!isTrackChangeAct(a)) continue;
    const d = diffOtherActivity(state, a.id, prevYmd, ymd);
    added.push(...d.added);
    removed.push(...d.removed);
  }

  return { added, removed };
}

export function buildChangeReport(state, startYmd, endYmd, windowHours) {
  const days = datesInRangeInclusive(startYmd, endYmd);
  const wh = Number(windowHours) > 0 ? Number(windowHours) : 4;
  return days.map((date) => {
    const prev = prevCalendarDay(date);
    const { added, removed } = diffDay(state, prev, date, wh);
    return { date, added, removed };
  });
}

export function filterChangeReportRows(rows, query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const blob = (row.added.join(' ') + ' ' + row.removed.join(' ')).toLowerCase();
    return blob.includes(q) || row.date.includes(q);
  });
}

export function formatChangeReportMarkdown(rows) {
  const lines = ['# Change report', '', '| Date | Added | Removed |', '| --- | --- | --- |'];
  for (const row of rows) {
    const a = row.added.length ? row.added.join('; ') : '';
    const r = row.removed.length ? row.removed.join('; ') : '';
    lines.push('| ' + row.date + ' | ' + a.replace(/\|/g, '\\|') + ' | ' + r.replace(/\|/g, '\\|') + ' |');
  }
  return lines.join('\n');
}

export function formatChangeReportCsv(rows) {
  const esc = (s) => {
    const t = String(s ?? '');
    if (/[",\n]/.test(t)) return '"' + t.replace(/"/g, '""') + '"';
    return t;
  };
  const lines = ['date,Added,Removed'];
  for (const row of rows) {
    lines.push([esc(row.date), esc(row.added.join('; ')), esc(row.removed.join('; '))].join(','));
  }
  return lines.join('\n');
}
