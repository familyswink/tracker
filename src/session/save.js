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

export function clearStagingAfterSave(staging) {
  staging.supSt = {};
  staging.supAdhoc = {};
  staging.otherSt = {};
  staging.pendingWater = null;
}

const NOTE_IDS = ['noteQuick', 'foodNoteQuick', 'suppNoteQuick'];

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
