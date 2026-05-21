/**
 * Tracker-head fenced `yaml journal` (`daily-log-requirements-v2` §3).
 * Deterministic YAML blocks — browser-safe, zero npm deps.
 */

/** Matches opening fence `\`\`\`yaml journal`. */
export const YAML_JOURNAL_FENCE_MARKER = 'yaml journal';

/**
 * Omit nullish/empty subtrees (sparse emission §8).
 *
 * @param {unknown} v
 * @returns {unknown | undefined}
 */
export function pruneSparseJournalTree(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'string') return v.trim() === '' ? undefined : v;
  if (typeof v !== 'object') return v;
  if (Array.isArray(v)) {
    const out = [];
    for (const el of v) {
      const p = pruneSparseJournalTree(el);
      if (p !== undefined) out.push(p);
    }
    return out.length === 0 ? undefined : out;
  }
  const obj = {};
  for (const k of Object.keys(v)) {
    const p = pruneSparseJournalTree(/** @type {Record<string, unknown>} */ (v)[k]);
    if (p !== undefined) obj[k] = p;
  }
  return Object.keys(obj).length === 0 ? undefined : obj;
}

/**
 * @param {string} k
 */
function yamlKeyScalar(k) {
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k)) return k;
  return JSON.stringify(k);
}

/**
 * @param {unknown} v
 */
function yamlScalar(v) {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
  if (v === null || v === undefined) return 'null';
  return JSON.stringify(String(v));
}

/**
 * YAML list under a key (`key:\n  - …`).
 *
 * @param {unknown[]} arr
 * @param {number} hyphenIndentLevel Indent depth (2 spaces each) where `- ` begins after the parent's key line.
 */
function emitArrayYaml(arr, hyphenIndentLevel) {
  let s = '';
  const hyphenPad = '  '.repeat(hyphenIndentLevel);
  for (const raw of arr) {
    const pr = pruneSparseJournalTree(raw);
    if (pr === undefined) continue;
    if (typeof pr !== 'object' || pr === null || Array.isArray(pr)) {
      if (Array.isArray(pr)) {
        s += `${hyphenPad}-\n`;
        s += emitArrayYaml(
          /** @type {unknown[]} */ (pr),
          hyphenIndentLevel + 1,
        );
        continue;
      }
      s += `${hyphenPad}- ${yamlScalar(pr)}\n`;
      continue;
    }
    const o = /** @type {Record<string, unknown>} */ (pr);
    s += `${hyphenPad}-\n`;
    s += emitMapYaml(o, hyphenIndentLevel + 1);
  }
  return s;
}

/**
 * @param {Record<string, unknown>} obj
 * @param {number} indent nesting level (starts at 0)
 */
function emitMapYaml(obj, indent) {
  const pad = '  '.repeat(indent);
  let s = '';
  for (const rawKey of Object.keys(obj)) {
    const valRaw = /** @type {unknown} */ (obj[rawKey]);
    const k = yamlKeyScalar(rawKey);
    const val = pruneSparseJournalTree(valRaw);
    if (val === undefined) continue;

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      s += `${pad}${k}:\n`;
      s += emitMapYaml(/** @type {Record<string, unknown>} */ (val), indent + 1);
      continue;
    }
    if (Array.isArray(val)) {
      s += `${pad}${k}:\n`;
      s += emitArrayYaml(/** @type {unknown[]} */ (val), indent + 1);
      continue;
    }
    s += `${pad}${k}: ${yamlScalar(val)}\n`;
  }
  return s;
}

/**
 * Produce full `\`\`\`yaml journal … \`\`\`\n` block.
 *
 * @param {Record<string, unknown>} payload
 */
export function formatYamlJournalFenceFromPayload(payload) {
  const prunedRaw = pruneSparseJournalTree(JSON.parse(JSON.stringify(payload)));
  const root =
    typeof prunedRaw === 'object' &&
    prunedRaw !== null &&
    !Array.isArray(prunedRaw)
      ? /** @type {Record<string, unknown>} */ (prunedRaw)
      : {};

  let body =
    Object.keys(root).length === 0
      ? `date: ${yamlScalar(payload?.date)}`
      : emitMapYaml(root, 0).replace(/\s+$/, '');

  if (!body.trim()) body = `date: ${yamlScalar(payload?.date)}`;

  return (
    '`'.repeat(3) + YAML_JOURNAL_FENCE_MARKER + `\n${body}\n` + '`'.repeat(3) + '\n'
  );
}
