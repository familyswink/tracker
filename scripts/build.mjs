#!/usr/bin/env node
/**
 * Phase 1 build: journal helpers + domain modules + app → dist/app.js
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

function stripExports(src) {
  return src
    .replace(/^export const /gm, 'const ')
    .replace(/^export function /gm, 'function ')
    .replace(/^export \{[^}]+\};?\s*$/gm, '');
}

const journalYamlFmt = stripExports(readFileSync('src/domain/journal-yaml-format.js', 'utf8'));
const journalSrc = stripExports(readFileSync('src/domain/journal-file.js', 'utf8'));
const activityFieldSrc = stripExports(readFileSync('src/domain/activity-field.js', 'utf8'));
const tabsSrc = stripExports(readFileSync('src/domain/tabs.js', 'utf8'));
const logStoreSrc = stripExports(readFileSync('src/domain/log-store.js', 'utf8'));

const journalPart = `/* Daily Tracker — journal + domain (dual-writer, Phase 2) */
(function (global) {
'use strict';
${journalYamlFmt}
${journalSrc}
${activityFieldSrc}
${tabsSrc}
${logStoreSrc}
global.DT = {
  composeJournalFile,
  splitJournalFile,
  parseWearableBiometricsReadOnly,
  isWearableOnlyRoot,
  findJsonFences,
  formatYamlJournalFenceFromPayload,
  pruneSparseJournalTree,
  YAML_JOURNAL_FENCE_MARKER,
  numberFieldSpec,
  shouldUseNumberSelect,
  coalesceNumberValue,
  actListCardProfile,
  defaultsFromFirstOpt,
  buildCardActivityFlds,
  formatCardDefaultSummary,
  formatOptDefaultsLines,
  TAB_IDS,
  DEFAULT_TAB_VISIBILITY,
  normalizeTabVisibility,
  isTabVisible,
  visibleTabIds,
  logEntryDay,
  filterByDay,
  listLogs,
  removeLogIds,
  combinedTrackerLogText,
  LOG_TYPES,
  arraysForType,
  getLog,
  updateLogDt,
  updateLogs,
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
`;

const appJs = readFileSync('src/app.js', 'utf8');
const verSrc = readFileSync('src/version.js', 'utf8');
const verMatch = verSrc.match(/export const APP_VERSION = '([^']+)'/);
if (!verMatch) throw new Error('src/version.js must export APP_VERSION');
const versionBanner = `const APP_VERSION='${verMatch[1]}';\n`;

writeFileSync(
  'dist/app.js',
  `/* Daily Tracker — dist/app.js (generated; npm run build) */\n${versionBanner}${journalPart}\n${appJs}`
);

// Legacy path for bookmarks / old SW caches
writeFileSync('dist/dt.js', journalPart.trim() + '\n');

console.log('Built dist/app.js (' + (journalPart.length + appJs.length) + ' bytes)');
