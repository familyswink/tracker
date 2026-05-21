#!/usr/bin/env node
/**
 * Minimal browser bundle (no npm) — journal-file + re-exports for DT global.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

const yamlFmt = readFileSync('src/domain/journal-yaml-format.js', 'utf8')
  .replace(/^export const /gm, 'const ')
  .replace(/^export function /gm, 'function ');
const journal = readFileSync('src/domain/journal-file.js', 'utf8')
  .replace(/^export function /gm, 'function ')
  .replace(/^export \{[^}]+\};?\s*$/gm, '');

const out = `/* Daily Tracker — dist/dt.js (inline-bundle, do not edit) */
(function (global) {
'use strict';
${yamlFmt}
${journal}
global.DT = {
  composeJournalFile,
  splitJournalFile,
  parseWearableBiometricsReadOnly,
  isWearableOnlyRoot,
  findJsonFences,
  formatYamlJournalFenceFromPayload,
  pruneSparseJournalTree,
  YAML_JOURNAL_FENCE_MARKER,
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
`;

writeFileSync('dist/dt.js', out);
console.log('Wrote dist/dt.js');
