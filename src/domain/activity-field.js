/** Number field schema + Other card Save helpers (REQ-4, REQ-5). */

export function isHourUnit(u) {
  const x = String(u || '').toLowerCase();
  return x === 'hour' || x === 'hours' || x === 'hr' || x === 'h';
}

export function isMinuteUnit(u) {
  const x = String(u || '').toLowerCase();
  return x === 'minutes' || x === 'minute' || x === 'min' || x === 'mins';
}

/** Step: number / decimal, or `:N` for colon-stepped UI (:N = seconds if unit is minutes, else minutes if unit is hours). */
export function parseStepSpec(step, unit) {
  if (step === undefined || step === null || step === '') {
    return { mode: 'number', step: null, colonKind: null };
  }
  const s = String(step).trim();
  if (s.startsWith(':')) {
    const n = parseFloat(s.slice(1));
    if (!Number.isFinite(n) || n <= 0) return { mode: 'number', step: null, colonKind: null };
    if (isHourUnit(unit)) return { mode: 'colon', colonKind: 'hour_minutes', step: n };
    return { mode: 'colon', colonKind: 'minute_seconds', step: n };
  }
  const n = parseFloat(s);
  if (Number.isFinite(n)) return { mode: 'number', step: n, colonKind: null };
  return { mode: 'number', step: null, colonKind: null };
}

export function fieldStepSpec(f) {
  return parseStepSpec(f?.step, f?.u);
}

export function isColonStepField(f) {
  return fieldStepSpec(f).mode === 'colon';
}

export function numberFieldSpec(f) {
  const spec = {
    min: null,
    max: null,
    step: null,
    def: null,
    stepSpec: null,
    colon: false,
  };
  if (!f || f.t !== 'number') return spec;
  if (f.def === null) spec.def = null;
  for (const k of ['min', 'max', 'def']) {
    if (f[k] === undefined || f[k] === null || f[k] === '') continue;
    if (k === 'def' && f.def === null) continue;
    const n = Number(f[k]);
    if (Number.isFinite(n)) spec[k] = n;
  }
  if (f.step !== undefined && f.step !== null && f.step !== '') {
    const ss = String(f.step).trim();
    if (ss.startsWith(':')) spec.step = ss;
    else {
      const n = Number(f.step);
      if (Number.isFinite(n)) spec.step = n;
    }
  }
  spec.stepSpec = fieldStepSpec(f);
  spec.colon = spec.stepSpec.mode === 'colon';
  return spec;
}

export function secondsToMmSs(totalSec) {
  const sec = Math.max(0, Math.round(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

export function parseMmSs(str) {
  if (str === undefined || str === null || str === '') return null;
  if (typeof str === 'number' && Number.isFinite(str)) return Math.round(str * 60);
  const s = String(str).trim();
  if (!s.includes(':')) {
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 60) : null;
  }
  const parts = s.split(':');
  const m = parseInt(parts[0], 10) || 0;
  const sec = parseInt(parts[1], 10) || 0;
  return m * 60 + sec;
}

export function minutesToHourMin(totalMin) {
  const min = Math.max(0, Math.round(totalMin));
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h + ':' + String(m).padStart(2, '0');
}

export function parseHourMin(str) {
  if (str === undefined || str === null || str === '') return null;
  if (typeof str === 'number' && Number.isFinite(str)) return Math.round(str * 60);
  const s = String(str).trim();
  if (!s.includes(':')) {
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 60) : null;
  }
  const parts = s.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export function colonSelectOptions(f) {
  const spec = fieldStepSpec(f);
  if (spec.mode !== 'colon') return [];
  const min = f.min != null ? Number(f.min) : 0;
  const max = f.max != null ? Number(f.max) : null;
  const opts = [];
  if (spec.colonKind === 'minute_seconds') {
    const minSec = min * 60;
    const maxSec = max != null ? max * 60 : minSec + 3600;
    for (let t = minSec; t <= maxSec + 1e-9; t += spec.step) {
      const v = secondsToMmSs(t);
      opts.push({ value: v, label: v });
      if (opts.length >= 300) break;
    }
  } else {
    const startMin = min * 60;
    const endMin = (max != null ? max : min + 4) * 60;
    for (let t = startMin; t <= endMin + 1e-9; t += spec.step) {
      const v = minutesToHourMin(t);
      opts.push({ value: v, label: v });
      if (opts.length >= 300) break;
    }
  }
  return opts;
}

/** First option for logging UI: omit field on save when selected. */
export const NUMBER_SELECT_EMPTY = { value: '', label: '\u2014' };

export function withEmptyNumberOption(opts) {
  return [NUMBER_SELECT_EMPTY, ...(opts || [])];
}

export function shouldUseNumberSelect(spec, f) {
  if (spec.colon || (f && isColonStepField(f))) {
    return colonSelectOptions(f).length >= 1 && colonSelectOptions(f).length <= 300;
  }
  if (spec.min == null || spec.max == null || spec.step == null) return false;
  const step = spec.step || 1;
  if (step <= 0) return false;
  const count = Math.floor((spec.max - spec.min) / step) + 1;
  return count >= 1 && count <= 300;
}

export function formatFieldDefaultValue(f, raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (isColonStepField(f)) {
    if (typeof raw === 'string' && String(raw).includes(':')) return String(raw);
    const n = Number(raw);
    if (!Number.isFinite(n)) return undefined;
    const kind = fieldStepSpec(f).colonKind;
    if (kind === 'minute_seconds') return secondsToMmSs(Math.round(n * 60));
    if (kind === 'hour_minutes') return minutesToHourMin(Math.round(n * 60));
  }
  const spec = numberFieldSpec(f);
  return coalesceNumberValue(raw, spec);
}

export function coalesceColonValue(val, f) {
  if (val !== undefined && val !== null && val !== '') {
    if (typeof val === 'string' && val.includes(':')) return val;
    const formatted = formatFieldDefaultValue(f, val);
    if (formatted !== undefined) return formatted;
  }
  if (f.def !== undefined && f.def !== null && f.def !== '') {
    return formatFieldDefaultValue(f, f.def);
  }
  return undefined;
}

export function coalesceNumberValue(val, spec) {
  if (val !== undefined && val !== null && val !== '') {
    if (typeof val === 'string' && val.includes(':')) return val;
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  }
  if (spec.def !== null && spec.def !== undefined && Number.isFinite(Number(spec.def))) {
    return Number(spec.def);
  }
  return undefined;
}

/** Activity with list field suitable for card Save (list first, optional number siblings). */
export function actListCardProfile(a) {
  if (!a || a.inline === false || !Array.isArray(a.flds) || !a.flds.length) return null;
  const listField = a.flds.find((ff) => ff.t === 'opts');
  if (!listField) return null;
  const valueFields = a.flds.filter((ff) => ff.t === 'number');
  return { listField, valueFields };
}

export function defaultsFromFirstOpt(listField, selectedVals) {
  if (!listField?.opts?.length || !selectedVals?.length) return {};
  const first = String(selectedVals[0]);
  const opt = listField.opts.find((o) => String(o.v) === first);
  if (!opt?.defaults || typeof opt.defaults !== 'object') return {};
  return { ...opt.defaults };
}

/** Build flds for card Save; null/undefined numeric defaults are omitted. */
export function buildCardActivityFlds(profile, pending) {
  const flds = {};
  if (!profile?.listField || !pending) return flds;
  const { listField, valueFields } = profile;
  const vals =
    pending.multi && Array.isArray(pending.vals)
      ? pending.vals.map(String).filter(Boolean)
      : pending.val !== undefined && pending.val !== null && String(pending.val) !== ''
        ? [String(pending.val)]
        : [];
  if (!vals.length) return flds;
  flds[listField.nm] = listField.multi ? vals : vals[0];
  const defs = defaultsFromFirstOpt(listField, vals);
  for (const ff of valueFields) {
    let raw = defs[ff.nm];
    if (raw === undefined || raw === null || raw === '') {
      if (ff.def !== undefined && ff.def !== null && ff.def !== '') {
        raw = ff.def;
      }
    }
    if (raw === undefined || raw === null || raw === '') continue;
    const v = formatFieldDefaultValue(ff, raw);
    if (v !== undefined) flds[ff.nm] = v;
  }
  return flds;
}

export function formatOptDefaultsLines(listField, valueFields) {
  if (!listField?.opts?.length || !valueFields?.length) return [];
  return listField.opts
    .map((o) => {
      const parts = valueFields
        .map((ff) => {
          const v = o.defaults?.[ff.nm];
          if (v === undefined || v === null || v === '') return '';
          const disp = isColonStepField(ff) ? formatFieldDefaultValue(ff, v) : v;
          return `${ff.nm}: ${disp}${ff.u && !isColonStepField(ff) ? ' ' + ff.u : ''}`;
        })
        .filter(Boolean);
      return { label: o.v, text: parts.join(' · ') };
    })
    .filter((x) => x.text);
}

/** Field-level def on number siblings (when list opts have no per-option defaults). */
export function formatFieldDefLines(valueFields) {
  if (!valueFields?.length) return [];
  return valueFields
    .filter((ff) => ff.def !== null && ff.def !== undefined && ff.def !== '')
    .map((ff) => {
      const disp = isColonStepField(ff) ? formatFieldDefaultValue(ff, ff.def) : ff.def;
      return { text: `${ff.nm}: ${disp}${ff.u && !isColonStepField(ff) ? ' ' + ff.u : ''}` };
    });
}

export function formatCardDefaultSummary(profile, selectedVals) {
  if (!profile?.valueFields?.length || !selectedVals?.length) return '';
  const defs = defaultsFromFirstOpt(profile.listField, selectedVals);
  const parts = profile.valueFields
    .map((ff) => {
      const v = defs[ff.nm];
      if (v === undefined || v === null || v === '') return '';
      const disp = isColonStepField(ff) ? formatFieldDefaultValue(ff, v) : v;
      return `${ff.nm}: ${disp}${ff.u && !isColonStepField(ff) ? ' ' + ff.u : ''}`;
    })
    .filter(Boolean);
  return parts.join(' · ');
}

export function stepFieldHelpText(unit) {
  if (isHourUnit(unit)) {
    return 'Step: number = hours, or :15 = 15-minute steps (saves H:MM, e.g. 1:30)';
  }
  if (isMinuteUnit(unit)) {
    return 'Step: number = minutes, or :30 = 30-second steps (saves M:SS, e.g. 5:30)';
  }
  return 'Step: number = field units, or :N = colon steps (seconds for minutes, minutes for hours)';
}
