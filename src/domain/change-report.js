/**
 * Day-over-day change report (supplements, food, water, other).
 * Compares each calendar day to the prior day using localStorage log data.
 * Supplements use per-log pairing within the change window (Model 1).
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

function formatQty(qty, units) {
  const q = Number(qty);
  const s = Number.isInteger(q) ? String(q) : String(q);
  return units ? s + ' ' + units : s;
}

/** @param {string} iso @param {string} [ymd] optional anchor date for label */
export function formatChangeLogTime(iso, ymd) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const dayYmd = ymd || isoToLocalYMD(iso);
  const p = dayYmd.split('-').map((x) => parseInt(x, 10));
  const mo = MONTHS[(p[1] || 1) - 1] || '';
  const day = p[2] || d.getDate();
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'p' : 'a';
  h = h % 12 || 12;
  const mm = m ? ':' + String(m).padStart(2, '0') : '';
  return mo + ' ' + day + ' ' + h + mm + ap;
}

function formatDaySpan(prevYmd, ymd, prevIso, currIso) {
  if (prevIso && currIso) {
    return formatChangeLogTime(prevIso, prevYmd) + ' → ' + formatChangeLogTime(currIso, ymd);
  }
  if (prevIso) return formatChangeLogTime(prevIso, prevYmd);
  if (currIso) return formatChangeLogTime(currIso, ymd);
  return prevYmd && ymd && prevYmd !== ymd ? prevYmd + ' → ' + ymd : ymd || prevYmd || '—';
}

/** Non-skipped supplement logs for one catalog item on one day. */
export function collectSupplementLogs(state, ymd, mid) {
  const logs = [];
  for (const e of state.sl || []) {
    if (!onLogDay(e.dt, ymd)) continue;
    if (resolveMidFromLog(state, e) !== mid) continue;
    if (isWaterSuppLog(state, e)) continue;
    if (e.sk) continue;
    const qty = parseFloat(e.qty) || 0;
    if (qty <= 0) continue;
    logs.push({
      qty,
      timeMin: minutesOfDayFromIso(e.dt),
      iso: e.dt,
    });
  }
  logs.sort((a, b) => (a.timeMin ?? 0) - (b.timeMin ?? 0));
  return logs;
}

/**
 * Pair yesterday/today logs by closest clock time within window.
 * @returns {Array<{ kind: 'same'|'changed'|'stopped'|'started', prev?: object, curr?: object }>}
 */
export function pairSupplementLogs(prevLogs, currLogs, windowHours) {
  const windowMin = (Number(windowHours) > 0 ? Number(windowHours) : 4) * 60;
  const usedCurr = new Set();
  const pairs = [];

  for (const prev of prevLogs) {
    let bestIdx = -1;
    let bestDist = Infinity;
    currLogs.forEach((curr, idx) => {
      if (usedCurr.has(idx)) return;
      const dist = clockMinutesApart(prev.timeMin, curr.timeMin);
      if (dist <= windowMin && dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    if (bestIdx >= 0) {
      usedCurr.add(bestIdx);
      const curr = currLogs[bestIdx];
      if (prev.qty === curr.qty) pairs.push({ kind: 'same', prev, curr });
      else pairs.push({ kind: 'changed', prev, curr });
    } else {
      pairs.push({ kind: 'stopped', prev });
    }
  }

  currLogs.forEach((curr, idx) => {
    if (!usedCurr.has(idx)) pairs.push({ kind: 'started', curr });
  });

  return pairs;
}

function ymdToSortMs(ymd, iso) {
  const p = String(ymd).split('-').map((x) => parseInt(x, 10));
  const base = new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
  if (iso) {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      base.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), 0);
    }
  } else {
    base.setHours(12, 0, 0, 0);
  }
  return base.getTime();
}

/** Clock time (minutes) when a prior-day dose is considered missed on the comparison day. */
export function doseDeadlineMinutesOnDay(prevTimeMin, windowHours) {
  const wh = Number(windowHours) > 0 ? Number(windowHours) : 4;
  if (prevTimeMin == null) return null;
  return prevTimeMin + wh * 60;
}

/** Hide "stopped" rows on today until the prior dose time + change window has passed. */
export function isStoppedGraceActive(comparisonYmd, prevTimeMin, windowHours, asOf = new Date()) {
  const today = localDateYMD(asOf);
  if (comparisonYmd !== today) return false;
  const deadline = doseDeadlineMinutesOnDay(prevTimeMin, windowHours);
  if (deadline == null) return false;
  const nowMin = asOf.getHours() * 60 + asOf.getMinutes();
  return nowMin < deadline;
}

/** Sort rows by comparison date, then clock time on that day. */
export function sortChangeReportRows(rows) {
  return [...rows].sort((a, b) => {
    const da = String(a.date);
    const db = String(b.date);
    if (da !== db) return da < db ? -1 : 1;
    const ta = a.sortAt ?? ymdToSortMs(a.date);
    const tb = b.sortAt ?? ymdToSortMs(b.date);
    if (ta !== tb) return ta - tb;
    return String(a.item).localeCompare(String(b.item));
  });
}

function totalLogQty(logs) {
  return logs.reduce((s, l) => s + l.qty, 0);
}

/** @returns {Array<{ date, item, was, now, time }>} */
export function diffSupplementMid(state, mid, prevYmd, ymd, windowHours, asOf = new Date()) {
  const prevLogs = collectSupplementLogs(state, prevYmd, mid);
  const currLogs = collectSupplementLogs(state, ymd, mid);
  if (!prevLogs.length && !currLogs.length) return [];

  const totalPrev = totalLogQty(prevLogs);
  const totalCurr = totalLogQty(currLogs);
  // Same daily total: split/merge/time shifts are not dose changes (e.g. 1×2 yesterday → 2×1 today).
  if (totalPrev === totalCurr && totalPrev > 0) return [];

  const item = suppDisplayName(state, mid);
  const units = suppUnits(state, mid);
  const rows = [];

  for (const p of pairSupplementLogs(prevLogs, currLogs, windowHours)) {
    if (p.kind === 'same') continue;
    if (p.kind === 'stopped') {
      if (isStoppedGraceActive(ymd, p.prev.timeMin, windowHours, asOf)) continue;
      rows.push({
        date: ymd,
        item,
        was: formatQty(p.prev.qty, units),
        now: '—',
        time: formatChangeLogTime(p.prev.iso, prevYmd),
        sortAt: ymdToSortMs(ymd, p.prev.iso),
      });
    } else if (p.kind === 'started') {
      rows.push({
        date: ymd,
        item,
        was: '—',
        now: formatQty(p.curr.qty, units),
        time: formatChangeLogTime(p.curr.iso, ymd),
        sortAt: ymdToSortMs(ymd, p.curr.iso),
      });
    } else if (p.kind === 'changed') {
      rows.push({
        date: ymd,
        item,
        was: formatQty(p.prev.qty, units),
        now: formatQty(p.curr.qty, units),
        time: formatDaySpan(prevYmd, ymd, p.prev.iso, p.curr.iso),
        sortAt: ymdToSortMs(ymd, p.curr.iso),
      });
    }
  }
  return rows;
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
  if (prev === curr) return [];
  const f = (state.fd || []).find((x) => x.id === fid);
  const item = f?.nm || 'Unknown';
  if (prev === 0 && curr > 0) {
    return [{ date: ymd, item, was: '—', now: curr + ' servings', time: ymd, sortAt: ymdToSortMs(ymd) }];
  }
  if (prev > 0 && curr === 0) {
    return [{ date: ymd, item, was: prev + ' servings', now: '—', time: prevYmd, sortAt: ymdToSortMs(ymd) }];
  }
  return [
    {
      date: ymd,
      item,
      was: prev + ' servings',
      now: curr + ' servings',
      time: prevYmd + ' → ' + ymd,
      sortAt: ymdToSortMs(ymd),
    },
  ];
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
  if (prev === curr) return [];
  const item = 'Water';
  if (prev === 0 && curr > 0) {
    return [{ date: ymd, item, was: '—', now: curr + ' oz', time: ymd, sortAt: ymdToSortMs(ymd) }];
  }
  if (prev > 0 && curr === 0) {
    return [{ date: ymd, item, was: prev + ' oz', now: '—', time: prevYmd, sortAt: ymdToSortMs(ymd) }];
  }
  return [{ date: ymd, item, was: prev + ' oz', now: curr + ' oz', time: prevYmd + ' → ' + ymd, sortAt: ymdToSortMs(ymd) }];
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
  if (!prevEntries.length && !currEntries.length) return [];
  const act = (state.acts || []).find((x) => x.id === aid);
  const item = act?.nm || 'Other';
  const rows = [];
  const prevS = new Set(prevEntries.map((e) => otherEntryLabel(state, e)));
  const currS = new Set(currEntries.map((e) => otherEntryLabel(state, e)));
  for (const e of prevEntries) {
    const label = otherEntryLabel(state, e);
    if (!currS.has(label)) {
      rows.push({ date: ymd, item, was: label, now: '—', time: prevYmd, sortAt: ymdToSortMs(ymd, e.dt) });
    }
  }
  for (const e of currEntries) {
    const label = otherEntryLabel(state, e);
    if (!prevS.has(label)) {
      rows.push({ date: ymd, item, was: '—', now: label, time: ymd, sortAt: ymdToSortMs(ymd, e.dt) });
    }
  }
  return rows;
}

export function diffDay(state, prevYmd, ymd, windowHours, asOf = new Date()) {
  const rows = [];
  const wh = Number(windowHours) > 0 ? Number(windowHours) : 4;

  for (const m of state.sm || []) {
    if (!isTrackChangeSupp(m)) continue;
    if (m.name === 'Water') continue;
    rows.push(...diffSupplementMid(state, m.id, prevYmd, ymd, wh, asOf));
  }

  for (const f of state.fd || []) {
    if (!isTrackChangeFood(f)) continue;
    rows.push(...diffFoodItem(state, f.id, prevYmd, ymd));
  }

  if (isTrackChangeWater(state.cfg)) {
    rows.push(...diffWater(state, prevYmd, ymd));
  }

  for (const a of state.acts || []) {
    if (!isTrackChangeAct(a)) continue;
    rows.push(...diffOtherActivity(state, a.id, prevYmd, ymd));
  }

  return rows;
}

/** Only rows where something changed (no quiet days). */
export function buildChangeReport(state, startYmd, endYmd, windowHours, asOf = new Date()) {
  const days = datesInRangeInclusive(startYmd, endYmd);
  const wh = Number(windowHours) > 0 ? Number(windowHours) : 4;
  const asOfDate = asOf instanceof Date && !isNaN(asOf.getTime()) ? asOf : new Date();
  const rows = [];
  for (const date of days) {
    const prev = prevCalendarDay(date);
    rows.push(...diffDay(state, prev, date, wh, asOfDate));
  }
  return sortChangeReportRows(rows);
}

export function filterChangeReportRows(rows, query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const blob = [row.date, row.item, row.was, row.now, row.time].join(' ').toLowerCase();
    return blob.includes(q);
  });
}

export function formatChangeReportMarkdown(rows) {
  const lines = ['# Change report', '', '| Date | Item | Was | Now | Time |', '| --- | --- | --- | --- | --- |'];
  for (const row of rows) {
    const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
    lines.push(
      '| ' +
        [esc(row.date), esc(row.item), esc(row.was), esc(row.now), esc(row.time)].join(' | ') +
        ' |',
    );
  }
  return lines.join('\n');
}

export function formatChangeReportCsv(rows) {
  const esc = (s) => {
    const t = String(s ?? '');
    if (/[",\n]/.test(t)) return '"' + t.replace(/"/g, '""') + '"';
    return t;
  };
  const lines = ['date,item,was,now,time'];
  for (const row of rows) {
    lines.push([esc(row.date), esc(row.item), esc(row.was), esc(row.now), esc(row.time)].join(','));
  }
  return lines.join('\n');
}
