/**
 * Phase 3 — unified global Save orchestration.
 * Persist commits are injected from app.js (domain-specific).
 */

import { now } from '../core/date.js';
import { prepareGlobalSave, rollbackGlobalSave, clearStagingAfterSave, resetAfterSave } from './save.js';

/**
 * @typedef {Object} StagedRollback
 * @property {string[]} [addedWl]
 * @property {string[]} [addedSl]
 * @property {string[]} [addedAL]
 * @property {string} [batchDay]
 * @property {boolean} [hadCommits]
 */

/**
 * @typedef {Object} CommitGlobalSaveOptions
 * @property {Record<string, unknown>} state
 * @property {{ supSt: object, supAdhoc: object, otherSt: object, pendingWater: unknown }} staging
 * @property {() => void} [flushQuickNotes]
 * @property {() => StagedRollback} commitStaged
 * @property {() => boolean} persist
 * @property {(staged: StagedRollback) => void} [rollbackStaged]
 * @property {() => void} [resetUi]
 * @property {(staged: StagedRollback) => void | Promise<void>} [afterSuccess]
 */

/**
 * Single Save path: staged commits → bump flSave / clear gdt → persist → clear staging → UI reset.
 * @param {CommitGlobalSaveOptions} opts
 * @returns {Promise<{ ok: boolean, staged?: StagedRollback }>}
 */
export async function commitGlobalSave(opts) {
  opts.flushQuickNotes?.();
  const staged = opts.commitStaged();
  const saveTs = now();
  const snap = prepareGlobalSave(/** @type {any} */ (opts.state), saveTs);
  if (!opts.persist()) {
    rollbackGlobalSave(/** @type {any} */ (opts.state), snap);
    opts.rollbackStaged?.(staged);
    return { ok: false, staged };
  }
  clearStagingAfterSave(opts.staging);
  opts.resetUi?.();
  if (opts.afterSuccess) await opts.afterSuccess(staged);
  return { ok: true, staged };
}
