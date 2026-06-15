# Daily Tracker — Product Requirements

**Status:** Implemented (2026.05.20.20+)  
**Last updated:** 2026-06-15 (REQ-14 change report, search, Other overlay defaults)  

Related: [USER_GUIDE.md](USER_GUIDE.md), [ECOSYSTEM.md](ECOSYSTEM.md), [PRODUCT_SPEC_STANDARD.md](PRODUCT_SPEC_STANDARD.md), [REFACTOR_SPEC.md](../REFACTOR_SPEC.md), [DAILY_LOG_DUAL_WRITER.md](DAILY_LOG_DUAL_WRITER.md)

---

## Log tab: Sync vs Export (locked)

Both buttons remain on **Log**. They are **different** actions.

| | **Sync Drive** | **Export** |
|--|----------------|------------|
| **Change in this project** | **None** — behavior stays exactly as today | **Enhanced** — range, 1 vs N files, destination |
| **Date range picker** | No — modified days or today | Yes — From / To |
| **Oura tail** | **Preserve** per day (dual-writer read/compose/write) | See below |

### Export — Oura rules (locked)

| Export mode | Oura |
|-------------|------|
| **Multiple files** (one `YYYY-MM-DD.md` per day) | **Same as today / Sync** — read existing file when available, **preserve Oura tail verbatim** per day |
| **Single combined file** (`{From}_{To}.md`) | **Always generate fresh Tracker content** for the range — **do not read, merge, or write Oura**; no dual-writer compose for this path |

Single-file export is a **new combined artifact**; Oura is out of scope for that format.

### Export — other locked rules

- **Destination:** default Google Drive Daily Logs; option for other (Share / folder / download).
- **Empty days:** include in range — export empty Tracker log for days with no entries.
- **Single file name:** `YYYY-MM-DD_YYYY-MM-DD.md` (From_To).

### Sync — no change (reference)

- Manual **Sync Drive:** upload `_modDates` or today; per-day Oura preservation.
- (Auto-sync behavior updated separately below — Sync *button* unchanged.)

---

## Auto-sync on all saves (locked — **change**)

**Requirement:** After **every save** that commits log data to the phone, automatically run **Drive sync** for the affected day(s) — same pipeline as today’s auto-sync (per-day compose + Oura preserve when uploading individual daily files).

### Save paths that trigger auto-sync

| Action | Triggers auto-sync |
|--------|-------------------|
| Bottom **Save** (`svAll`) | **Yes** (already when setting on — now **always**, see below) |
| Other **card Save** (REQ-5) | **Yes** |
| Water quick-add / food +/- / overlay saves that call `sv()` | **Yes** — user requested **all saves** |
| Manage screens (edit supp catalog, etc.) | **No** — config-only, not daily log |
| Export | **No** — Export is explicit output, not auto-sync |

### Settings UX

- **Auto-sync on Save** toggle remains in Settings (default **on**). When on, log commits trigger Drive sync for affected days.

### Sync scope after each auto-sync

- Sync **affected day(s)** for that commit (e.g. `logDateKey()` / `markMod` day), same as today’s `_modDates` logic where applicable.

---

## REQ-1: Tab visibility

- Hidden tab → no new logging on that tab.
- **Old data stays** on phone and in History; **hidden tabs are omitted** from daily log `.md` on Sync and Export.

---

## REQ-4: Number ranges (Other + all activity number fields)

Each `t: "number"` field in Manage → Entry type:

- `min`, `max`, `step`, `def` ( `def` may be **null** → omitted on save when not overridden )
- No hardcoded bounds in UI code (remove 32–120 °F, etc.)

---

## REQ-5: Other — list defaults + card Save

### Card Save

- List + defaults on main Other card; **Save on card** commits **one row** immediately.
- **Multi-select:** one `S.al` row, **multiple list values** in that row.
- **Null default:** field **not stored** in `flds`.
- **Conflicting numeric defaults** when multi-select (e.g. Sauna + Cold Plunge): use defaults from **first selected** item; if user needs per-item numbers → **overlay**.

### Auto-sync

- Card Save triggers **auto-sync** for that day (see above).

### Text fields

- Free-form notes in **overlay**; omitted on card Save if no value; see round 3 doc for use cases.

---

## REQ-6: Supplement rename

- Rename in Manage → current name in UI and in `.md` after Sync/Export/auto-sync for that day.

---

## REQ-7: Note wiki `[[` picker

- All note textareas (Notes, Food, Supps, Other quick notes, relevant overlays) support `[[` autocomplete for supplements + custom names.
- **Manage [[ names** — hide from picker only; hidden catalog supplements reappear when added via Manage Supps.
- Stored/exported form: `[[Manufacturer Product]]` (Obsidian-style); `[[]]` is UI trigger only.

---

## REQ-8: Daily log JSON export shape

- Lifestyle activities: **flat** keys from field name + unit (`duration_min`, `temperature_f`, etc.) — no nested `fields`, no Sauna/Cold-only special cases.
- Omit `subjective_scores`, `cns_fatigue_present`, `racing_mind_present`, and other UI-less placeholders.
- Omit `highest_bristol_type` when never set; keep `urgent_or_watery_present` when derived from bowel events.
- Hidden tabs (REQ-1): omit that tab’s sections from `.md` JSON and markdown summary.

---

## REQ-9: Backup on Save

- **Backup Now** writes `DT_Backup_YYYY-MM-DD.json` to Drive backups folder.
- After successful bottom **Save**, attempt the same once per calendar day if backups folder ID is set and Drive token valid; modal if backup fails or Drive not connected.
- `S.cfg.backupSavedYmd` records successful daily backup date.

---

## REQ-10: Supplement catalog search and staging

- **Search catalog** on Supps tab lists all catalog supplements; off-schedule picks open qty overlay and can log immediately without enabling on main list.
- Bottom **Save** clears staged supplement checkboxes (`_supSt`, `_supAdhoc`) in place after successful commit.

---

## REQ-11: Per-supplement quantity step

- **Manage Supplements → Edit → Qty step (+/−)** sets overlay increment (e.g. 500 for mg doses). Default behavior unchanged when blank.

---

## REQ-12: Overlay date/time and tab restore

- Overlays inject a tappable date/time bar; opening date/time from an overlay **pushes** on top (does not discard the form).
- **closeAllOv** restores the tab active when the overlay stack opened.
- Other overlay save does **not** clear custom `S.gdt` (only bottom Save / global save lifecycle).

---

## REQ-13: Manage Timing sort order

- **Manage Timing** list sorted by supplement **group order**, then **A–Z** by supplement name within group.

---

## REQ-14: Change report, search, Other overlay defaults

### Change tracking flags

| Item | Default | Where |
|------|---------|--------|
| Supplements (`S.sm`) | **On** | Manage Supplements → Edit |
| Food (`S.fd`) | Off | Manage Food → Edit |
| Other activity (`S.acts`) | Off | Manage Other → Edit type |
| Water | Off | Settings → Track water in change report |

New catalog items inherit the default for their type.

### Comparison rules (supplements)

- Compare each **tracked catalog item** day **D** vs prior calendar day **D−1** (local TZ, `localStorage`).
- **Per timing group per day:** sum qty for multiple logs in the same group.
- **4-hour window** (`S.cfg.changeWindowHours`, default **4**): same total qty and anchor log times within window ⇒ **no change**, even if group moves (e.g. Breakfast 2 @ 10a → Other 2 @ 11a).
- Qty or group/qty change outside equivalence ⇒ **Removed** narrative (e.g. `went from 2 Other to 1 at Breakfast — …`).
- **Skipped** logs ⇒ **not taken** in report.
- Empty day after prior logs ⇒ prior items **removed**.

### Change report UI

- **Log tab:** toggle **Daily log** ↔ **Change report**; **From/To** date range; search filters report text.
- Always show a row per day in range (blank Added/Removed when no changes).

### Export

- Optional **Change report** file (CSV or Markdown), same From/To as Export.

### Manage Timing search

- Filter by supplement **name** and **manufacturer**.

### History search

- Search box filters entries (works **with** day filter — AND).
- Food: name; Supps: name/mfg; Other: activity name and list field values; Water/Notes: relevant text.

### Other overlay defaults

- Opening overlay from card with list selection pre-fills **option defaults** (all quick-log Other cards).

---

## Runtime configuration (summary)

See [ECOSYSTEM.md § Tool 1](ECOSYSTEM.md#tool-1--daily-tracker) for the full settings table (`localStorage` `dt6`, `S.cfg`, Drive IDs, tab visibility, `S.gdt`, `S.flSave`).

---

## Implementation notes

1. **Export single file:** build Tracker-only concatenation for range; never call Oura compose.
2. **Export multiple:** reuse `dailyLogContentForSave` / dual-writer per day (same as Sync).
3. **Auto-sync on all saves:** centralize “commit → markMod → syncDrive(affected days)” to avoid duplicate OAuth spam; debounce optional if rapid water taps become noisy.

---

## Revision history

| Date | Change |
|------|--------|
| 2026-05-20 | Round 4: Log has Sync (unchanged) + Export (enhanced); multi export = Oura; single = fresh no Oura; auto-sync all saves; multi-select first-default rule |
| 2026-05-20 | Round 5: flat export keys; note wiki; backup-on-save; Phase 3 `commitGlobalSave`; SW fresh bundle fetch |
| 2026-06-12 | REQ-10–13: catalog search, qty step, overlay date/time, tab restore, Manage Timing sort, staging clear fix |
| 2026-06-15 | REQ-14: change report, track-change flags, History/Manage Timing search, Other overlay defaults |
