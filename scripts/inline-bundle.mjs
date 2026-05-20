#!/usr/bin/env node
/**
 * Minimal browser bundle (no npm) — journal-file + re-exports for DT global.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

const journal = readFileSync('src/domain/journal-file.js', 'utf8')
  .replace(/^export function /gm, 'function ')
  .replace(/^export \{[^}]+\};?\s*$/gm, '');

const out = `/* Daily Tracker — dist/dt.js (inline-bundle, do not edit) */
(function (global) {
'use strict';
${journal}
global.DT = {
  composeJournalFile,
  splitJournalFile,
  parseWearableBiometricsReadOnly,
  isWearableOnlyRoot,
  findJsonFences,
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
`;

writeFileSync('dist/dt.js', out);
console.log('Wrote dist/dt.js');
