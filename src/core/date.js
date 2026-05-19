/** @module core/date — local calendar and ISO helpers (source of truth for Phase 1+) */

export function now() {
  return new Date().toISOString();
}

export function localDateYMD(d) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function td() {
  return localDateYMD(new Date());
}

export function wks() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return localDateYMD(d);
}

export function isoToLocalYMD(iso) {
  if (!iso) return localDateYMD(new Date());
  const s = String(iso).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return td();
  return localDateYMD(d);
}

export function isoToTimeLocal(iso) {
  if (!iso) return '12:00';
  const d = new Date(iso);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/** Build ISO from local date + time (never rely on UTC slice of ISO strings). */
export function dateAndTimeToISO(dateStr, timeStr) {
  if (!dateStr) return new Date().toISOString();
  const p = String(dateStr).split('-').map((x) => parseInt(x, 10));
  const tm = (timeStr || '12:00').split(':');
  const hh = parseInt(tm[0], 10) || 0;
  const mm = parseInt(tm[1], 10) || 0;
  const d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1, hh, mm, 0, 0);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

export function logEntryDay(e) {
  return isoToLocalYMD(e && (e.dt || e.la || ''));
}

export function matchesLogDay(eDt, logIso) {
  return !!(eDt && logIso) && isoToLocalYMD(eDt) === isoToLocalYMD(logIso);
}

export function onLogDay(iso, dt) {
  return iso && isoToLocalYMD(iso) === dt;
}

export function getEffectiveLogDt(state) {
  return state.gdt || now();
}

export function logDateKey(state) {
  return isoToLocalYMD(getEffectiveLogDt(state));
}
