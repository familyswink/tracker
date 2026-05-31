/** @module session/save — global Save lifecycle (pure; DOM in resetAfterSave) */

import { bumpFlSave } from '../domain/food.js';
import { now } from '../core/date.js';

export function emptyStaging() {
  return {
    supSt: {},
    supAdhoc: {},
    otherSt: {},
    pendingWater: null,
  };
}

/** Apply pre-persist Save side effects (flSave bump, clear gdt). Returns snapshot for rollback. */
export function prepareGlobalSave(state, saveTs = now()) {
  const snapshot = { prevFlSave: state.flSave ?? null, prevGdt: state.gdt ?? null };
  bumpFlSave(state, saveTs);
  state.gdt = null;
  return snapshot;
}

export function rollbackGlobalSave(state, snapshot) {
  state.flSave = snapshot.prevFlSave;
  state.gdt = snapshot.prevGdt;
}

/** Clear staging maps in place (keeps caller's object references, e.g. global _supSt). */
export function clearStagingAfterSave(staging) {
  if (staging.supSt) {
    for (const k of Object.keys(staging.supSt)) delete staging.supSt[k];
  }
  if (staging.supAdhoc) {
    for (const k of Object.keys(staging.supAdhoc)) delete staging.supAdhoc[k];
  }
  if (staging.otherSt) {
    for (const k of Object.keys(staging.otherSt)) delete staging.otherSt[k];
  }
  staging.pendingWater = null;
}

const NOTE_IDS = ['noteQuick', 'foodNoteQuick', 'suppNoteQuick', 'otherNoteQuick', 'neBd', 'seNt'];

/**
 * @param {(id: string) => { value: string, classList: { remove: (c: string) => void } } | null} getEl
 */
export function resetAfterSave(getEl) {
  NOTE_IDS.forEach((id) => {
    const el = getEl(id);
    if (el) {
      el.value = '';
      el.classList.remove('note-dirty');
    }
  });
}
