#!/usr/bin/env node
/**
 * Phase 1 build: journal helpers + app → dist/app.js
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

const journalSrc = readFileSync('src/domain/journal-file.js', 'utf8')
  .replace(/^export function /gm, 'function ')
  .replace(/^export \{[^}]+\};?\s*$/gm, '');

const journalPart = `/* Daily Tracker — journal (dual-writer) */
(function (global) {
'use strict';
${journalSrc}
global.DT = {
  composeJournalFile,
  splitJournalFile,
  parseWearableBiometricsReadOnly,
  isWearableOnlyRoot,
  findJsonFences,
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
`;

const appJs = readFileSync('src/app.js', 'utf8');

writeFileSync(
  'dist/app.js',
  `/* Daily Tracker — dist/app.js (generated; npm run build) */\n${journalPart}\n${appJs}`
);

// Legacy path for bookmarks / old SW caches
writeFileSync('dist/dt.js', journalPart.trim() + '\n');

console.log('Built dist/app.js (' + (journalPart.length + appJs.length) + ' bytes)');
