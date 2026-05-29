#!/usr/bin/env node
/**
 * Phase 1 build: journal helpers + domain modules + app → dist/app.js
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

mkdirSync('dist', { recursive: true });

function stripExports(src) {
  return src
    .replace(/^import\s.+$/gm, '')
    .replace(/^export const /gm, 'const ')
    .replace(/^export function /gm, 'function ')
    .replace(/^export \{[^}]+\};?\s*$/gm, '');
}

const dateSrc = stripExports(readFileSync('src/core/date.js', 'utf8'));
const foodSrc = stripExports(readFileSync('src/domain/food.js', 'utf8'));
const saveSrc = stripExports(readFileSync('src/session/save.js', 'utf8'));
const journalYamlFmt = stripExports(readFileSync('src/domain/journal-yaml-format.js', 'utf8'));
const journalSrc = stripExports(readFileSync('src/domain/journal-file.js', 'utf8'));
const activityFieldSrc = stripExports(readFileSync('src/domain/activity-field.js', 'utf8'));
const tabsSrc = stripExports(readFileSync('src/domain/tabs.js', 'utf8'));
const logStoreSrc = stripExports(readFileSync('src/domain/log-store.js', 'utf8'));
const noteWikiSrc = stripExports(readFileSync('src/domain/note-wiki.js', 'utf8'));
const exportSchemaSrc = stripExports(readFileSync('src/domain/export-schema.js', 'utf8'));

const journalPart = `/* Daily Tracker — journal + domain (dual-writer, Phase 2) */
(function (global) {
'use strict';
${dateSrc}
${foodSrc}
${saveSrc}
${journalYamlFmt}
${journalSrc}
${activityFieldSrc}
${tabsSrc}
${logStoreSrc}
${noteWikiSrc}
${exportSchemaSrc}
global.DT = {
  now,
  td,
  wks,
  localDateYMD,
  isoToLocalYMD,
  isoToTimeLocal,
  dateAndTimeToISO,
  logEntryDay,
  matchesLogDay,
  onLogDay,
  getEffectiveLogDt,
  logDateKey,
  gDFQ,
  gTFQ,
  gWFQ,
  bumpFlSave,
  prepareGlobalSave,
  rollbackGlobalSave,
  clearStagingAfterSave,
  resetAfterSave,
  emptyStaging,
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
  formatFieldDefLines,
  isColonStepField,
  fieldStepSpec,
  colonSelectOptions,
  coalesceColonValue,
  formatFieldDefaultValue,
  stepFieldHelpText,
  parseStepSpec,
  withEmptyNumberOption,
  NUMBER_SELECT_EMPTY,
  suppWikiToken,
  listWikiTokens,
  listWikiTokensForManage,
  noteWikiTriggerAt,
  exportFieldKey,
  normalizeActivityExport,
  exportValueForField,
  pruneExportPayload,
  tabVisibleForExport,
  TAB_IDS,
  DEFAULT_TAB_VISIBILITY,
  normalizeTabVisibility,
  isTabVisible,
  visibleTabIds,
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
const appVer = verMatch[1];

const indexPath = 'index.html';
let indexHtml = readFileSync(indexPath, 'utf8');
const scriptRe = /src="dist\/app\.js[^"]*"/;
if (!scriptRe.test(indexHtml)) throw new Error('index.html must include dist/app.js script');
indexHtml = indexHtml.replace(scriptRe, `src="dist/app.js?v=${appVer}"`);
writeFileSync(indexPath, indexHtml);

const outPath = 'dist/app.js';
const outBody = `/* Daily Tracker — dist/app.js (generated; npm run build) */\n${versionBanner}${journalPart}\n${appJs}`;
writeFileSync(outPath, outBody);

// Legacy path for bookmarks / old SW caches
writeFileSync('dist/dt.js', journalPart.trim() + '\n');

try {
  execSync(`node --check ${outPath}`, { stdio: 'pipe' });
} catch (e) {
  console.error('dist/app.js failed syntax check — fix bundle before deploy');
  throw e;
}

console.log('Built dist/app.js (' + outBody.length + ' bytes)');
