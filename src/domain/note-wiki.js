/** [[token]] picker: supplement names + custom entries (Notes and all note textareas). */

export function suppWikiToken(mfr, name) {
  const p = String(name || '').trim();
  const m =
    mfr && mfr !== '--' && String(mfr).trim() ? String(mfr).trim() : null;
  if (m && p) return '[[' + m + ' ' + p + ']]';
  if (p) return '[[' + p + ']]';
  return '[[Unknown]]';
}

export function wikiTokenSortKey(token) {
  return String(token || '')
    .replace(/^\[\[|\]\]$/g, '')
    .toLowerCase();
}

/** All tokens for picker: catalog + custom, minus hidden, A–Z. */
export function listWikiTokens(state, query) {
  const hidden = new Set(state.noteWikiHidden || []);
  const custom = state.noteWikiCustom || [];
  const fromSm = (state.sm || []).map((m) => suppWikiToken(m.mfr, m.name));
  const all = [...new Set([...fromSm, ...custom])].filter((t) => t && !hidden.has(t));
  all.sort((a, b) => wikiTokenSortKey(a).localeCompare(wikiTokenSortKey(b)));
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return all;
  return all.filter((t) => wikiTokenSortKey(t).includes(q));
}

/** All tokens for manage screen (includes hidden), A–Z. */
export function listWikiTokensForManage(state) {
  const hidden = new Set(state.noteWikiHidden || []);
  const custom = new Set(state.noteWikiCustom || []);
  const fromSm = (state.sm || []).map((m) => ({
    token: suppWikiToken(m.mfr, m.name),
    fromCatalog: true,
  }));
  const seen = new Set();
  const rows = [];
  for (const row of fromSm) {
    if (seen.has(row.token)) continue;
    seen.add(row.token);
    rows.push({ ...row, hidden: hidden.has(row.token) });
  }
  for (const t of custom) {
    if (!t || seen.has(t)) continue;
    seen.add(t);
    rows.push({ token: t, fromCatalog: false, hidden: hidden.has(t) });
  }
  rows.sort((a, b) =>
    wikiTokenSortKey(a.token).localeCompare(wikiTokenSortKey(b.token))
  );
  return rows;
}

/** If cursor is after [[ or [[]], return { start, query } for replacement. */
export function noteWikiTriggerAt(text, cursor) {
  const before = String(text || '').slice(0, cursor);
  const m = before.match(/\[\[([^\]]*)$/);
  if (!m) return null;
  return { start: cursor - m[0].length, query: m[1] };
}
