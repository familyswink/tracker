/**
 * Dual-writer daily journal (.md): Tracker-head + verbatim Oura-tail.
 * @see REFACTOR_SPEC.md § "Dual-writer daily logs" and docs/DAILY_LOG_DUAL_WRITER.md
 */

/**
 * @param {unknown} obj
 * @returns {boolean}
 */
export function isWearableOnlyRoot(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = Object.keys(obj);
  return keys.length === 1 && keys[0] === 'wearable_biometrics';
}

/**
 * @typedef {{ start: number, end: number, raw: string, parsed: unknown }} JsonFence
 */

/**
 * @param {string} content
 * @returns {JsonFence[]}
 */
export function findJsonFences(content) {
  const fences = [];
  if (!content) return fences;
  const re = /(^|\n)```json\s*\n([\s\S]*?)\n```/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const openerLen = m[1] ? m[1].length : 0;
    const start = m.index + openerLen;
    const end = m.index + m[0].length;
    const raw = m[2];
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    fences.push({ start, end, raw, parsed });
  }
  return fences;
}

/**
 * Canonical Oura wearable fence: root { wearable_biometrics } only, typically last in file.
 * @param {string} content
 * @returns {JsonFence[]}
 */
export function findWearableFences(content) {
  return findJsonFences(content).filter(
    (f) =>
      f.parsed &&
      typeof f.parsed === 'object' &&
      !Array.isArray(f.parsed) &&
      f.parsed.wearable_biometrics != null &&
      typeof f.parsed.wearable_biometrics === 'object'
  );
}

/**
 * Line index of the opening ```json for a character offset in content.
 * @param {string} content
 * @param {number} charIndex
 * @returns {number}
 */
function lineIndexAtChar(content, charIndex) {
  const lines = content.split('\n');
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineStart = offset;
    const lineEnd = offset + lines[i].length;
    if (charIndex >= lineStart && charIndex <= lineEnd) return i;
    offset = lineEnd + 1;
  }
  return lines.length - 1;
}

/**
 * Byte index where Oura-tail begins. Prefer `---` above the wearable fence (blank lines OK);
 * if the injector omitted `---`, start at the wearable ```json fence.
 * @param {string} content
 * @param {number} fenceStart index of opening ```json for wearable block
 * @returns {number|null}
 */
export function findOuraTailOpenerIndex(content, fenceStart) {
  const lines = content.split('\n');
  const fenceLineIdx = lineIndexAtChar(content, fenceStart);
  if (fenceLineIdx < 0) return null;

  for (let i = fenceLineIdx - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (t === '') continue;
    if (t === '---') {
      let opener = 0;
      for (let j = 0; j < i; j++) opener += lines[j].length + 1;
      return opener;
    }
    break;
  }
  return fenceStart;
}

/**
 * @typedef {{ ok: true, hasTail: boolean, head: string, tail: string|null, wearableFenceCount: number } | { ok: false, error: string, wearableFenceCount: number }} JournalSplit
 */

/**
 * @param {string|null|undefined} content
 * @returns {JournalSplit}
 */
export function splitJournalFile(content) {
  const text = content == null ? '' : String(content);
  if (!text) {
    return { ok: true, hasTail: false, head: '', tail: null, wearableFenceCount: 0 };
  }
  const wearable = findWearableFences(text);
  if (wearable.length === 0) {
    return { ok: true, hasTail: false, head: text, tail: null, wearableFenceCount: 0 };
  }
  // Canonical tail is the last wearable block (bottom of file after injector).
  const fence = wearable[wearable.length - 1];
  const opener = findOuraTailOpenerIndex(text, fence.start);
  if (opener == null) {
    return {
      ok: false,
      error: 'Daily log has wearable_biometrics JSON but tail boundary could not be determined.',
      wearableFenceCount: wearable.length,
    };
  }
  return {
    ok: true,
    hasTail: true,
    head: text.slice(0, opener),
    tail: text.slice(opener),
    wearableFenceCount: wearable.length,
  };
}

/**
 * @typedef {{ ok: true, file: string } | { ok: false, error: string }} ComposeResult
 */

/**
 * Regenerate Tracker-head only; append verbatim Oura-tail when present.
 * @param {string|null|undefined} existingFile
 * @param {string} trackerHeadNew
 * @returns {ComposeResult}
 */
export function composeJournalFile(existingFile, trackerHeadNew) {
  const headNew = trackerHeadNew == null ? '' : String(trackerHeadNew);
  const split = splitJournalFile(existingFile);
  if (!split.ok) return { ok: false, error: split.error };
  if (!split.hasTail) {
    return { ok: true, file: headNew };
  }
  return { ok: true, file: headNew + split.tail };
}

/**
 * Optional read-only parse of wearable block from file (never re-serialize for save).
 * @param {string} content
 * @returns {object|null}
 */
export function parseWearableBiometricsReadOnly(content) {
  const wearable = findWearableFences(String(content || ''));
  if (wearable.length !== 1) return null;
  const root = wearable[0].parsed;
  return root && typeof root === 'object' ? root.wearable_biometrics : null;
}
