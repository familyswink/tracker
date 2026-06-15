#!/usr/bin/env python3
"""Fallback build when node is unavailable — mirrors scripts/build.mjs."""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def strip_exports(src: str) -> str:
    src = re.sub(r"^import\s[\s\S]*?from\s+['\"][^'\"]+['\"];?\s*$", "", src, flags=re.MULTILINE)
    src = re.sub(r"^export const ", "const ", src, flags=re.MULTILINE)
    src = re.sub(r"^export async function ", "async function ", src, flags=re.MULTILINE)
    src = re.sub(r"^export function ", "function ", src, flags=re.MULTILINE)
    src = re.sub(r"^export \{[^}]+\};?\s*$", "", src, flags=re.MULTILINE)
    return src


def read_stripped(rel: str) -> str:
    return strip_exports((ROOT / rel).read_text(encoding="utf-8"))


def main():
    parts = [
        read_stripped("src/core/date.js"),
        read_stripped("src/domain/food.js"),
        read_stripped("src/session/save.js"),
        read_stripped("src/session/commit.js"),
        read_stripped("src/domain/journal-yaml-format.js"),
        read_stripped("src/domain/journal-file.js"),
        read_stripped("src/domain/activity-field.js"),
        read_stripped("src/domain/tabs.js"),
        read_stripped("src/domain/log-store.js"),
        read_stripped("src/domain/note-wiki.js"),
        read_stripped("src/domain/export-schema.js"),
        read_stripped("src/domain/change-report.js"),
    ]
    domain_body = "\n".join(parts)
    journal_part = f"""/* Daily Tracker — journal + domain (dual-writer, Phase 2) */
(function (global) {{
'use strict';
{domain_body}
global.DT = {{
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
  commitGlobalSave,
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
  prevCalendarDay,
  datesInRangeInclusive,
  buildChangeReport,
  filterChangeReportRows,
  formatChangeReportMarkdown,
  formatChangeReportCsv,
  diffSupplementMid,
  collectSupplementLogs,
  pairSupplementLogs,
  formatChangeLogTime,
  isTrackChangeSupp,
  isTrackChangeFood,
  isTrackChangeAct,
  isTrackChangeWater,
}};
}})(typeof globalThis !== 'undefined' ? globalThis : window);
"""

    ver_src = (ROOT / "src/version.js").read_text(encoding="utf-8")
    m = re.search(r"export const APP_VERSION = '([^']+)'", ver_src)
    if not m:
        raise SystemExit("src/version.js must export APP_VERSION")
    app_ver = m.group(1)
    version_banner = f"const APP_VERSION='{app_ver}';\n"
    app_js = (ROOT / "src/app.js").read_text(encoding="utf-8")
    out_body = f"/* Daily Tracker — dist/app.js (generated; npm run build) */\n{version_banner}{journal_part}\n{app_js}"

    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    (dist / "app.js").write_text(out_body, encoding="utf-8")
    (dist / "dt.js").write_text(journal_part.strip() + "\n", encoding="utf-8")

    index_path = ROOT / "index.html"
    index_html = index_path.read_text(encoding="utf-8")
    if not re.search(r'src="dist/app\.js', index_html):
        raise SystemExit("index.html must include dist/app.js script")
    index_html = re.sub(r'src="dist/app\.js[^"]*"', f'src="dist/app.js?v={app_ver}"', index_html)
    index_path.write_text(index_html, encoding="utf-8")

    print(f"Built dist/app.js ({len(out_body)} bytes)")


if __name__ == "__main__":
    main()
