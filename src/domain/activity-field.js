/** Number field schema + Other card Save helpers (REQ-4, REQ-5). */

export function numberFieldSpec(f) {
  const spec = { min: null, max: null, step: null, def: null };
  if (!f || f.t !== 'number') return spec;
  if (f.def === null) spec.def = null;
  for (const k of ['min', 'max', 'step', 'def']) {
    if (f[k] === undefined || f[k] === null || f[k] === '') continue;
    if (k === 'def' && f.def === null) continue;
    const n = Number(f[k]);
    if (Number.isFinite(n)) spec[k] = n;
  }
  return spec;
}

export function shouldUseNumberSelect(spec) {
  if (spec.min == null || spec.max == null || spec.step == null) return false;
  const step = spec.step || 1;
  if (step <= 0) return false;
  const count = Math.floor((spec.max - spec.min) / step) + 1;
  return count >= 1 && count <= 300;
}

export function coalesceNumberValue(val, spec) {
  if (val !== undefined && val !== null && val !== '') {
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
  const listField = a.flds.find((f) => f.t === 'opts');
  if (!listField) return null;
  const valueFields = a.flds.filter((f) => f.t === 'number');
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
  for (const f of valueFields) {
    const raw = defs[f.nm];
    if (raw === undefined || raw === null || raw === '') continue;
    const spec = numberFieldSpec(f);
    const n = coalesceNumberValue(raw, spec);
    if (n !== undefined) flds[f.nm] = n;
  }
  return flds;
}

export function formatOptDefaultsLines(listField, valueFields) {
  if (!listField?.opts?.length || !valueFields?.length) return [];
  return listField.opts
    .map((o) => {
      const parts = valueFields
        .map((f) => {
          const v = o.defaults?.[f.nm];
          if (v === undefined || v === null || v === '') return '';
          return `${f.nm}: ${v}${f.u ? ' ' + f.u : ''}`;
        })
        .filter(Boolean);
      return { label: o.v, text: parts.join(' · ') };
    })
    .filter((x) => x.text);
}

export function formatCardDefaultSummary(profile, selectedVals) {
  if (!profile?.valueFields?.length || !selectedVals?.length) return '';
  const defs = defaultsFromFirstOpt(profile.listField, selectedVals);
  const parts = profile.valueFields
    .map((f) => {
      const v = defs[f.nm];
      if (v === undefined || v === null || v === '') return '';
      return `${f.nm}: ${v}${f.u ? ' ' + f.u : ''}`;
    })
    .filter(Boolean);
  return parts.join(' · ');
}
