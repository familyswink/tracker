/**
 * Bundled modules for Daily Tracker (Phase 1).
 * Exposed on global `DT` for use from index.html until full app bundle.
 */
export {
  composeJournalFile,
  splitJournalFile,
  parseWearableBiometricsReadOnly,
  isWearableOnlyRoot,
} from './domain/journal-file.js';

import * as journal from './domain/journal-file.js';
import * as date from './core/date.js';
import * as food from './domain/food.js';
import * as save from './session/save.js';

if (typeof globalThis !== 'undefined') {
  globalThis.DT = {
    ...journal,
    date,
    food,
    save,
  };
}
