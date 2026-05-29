# Daily Tracker — Product Requirements

**Status:** Implemented (2026.05.20.5)  
**Last updated:** 2026-05-20 (round 4 — Export/Sync/auto-sync)  

Related: [REFACTOR_SPEC.md](../REFACTOR_SPEC.md), [DAILY_LOG_DUAL_WRITER.md](DAILY_LOG_DUAL_WRITER.md)

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

- **Auto-sync on Save** toggle may be **removed** or **always on** — product default: **always auto-sync** after log commits; confirm during implementation if toggle remains as override.

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

## Implementation notes

1. **Export single file:** build Tracker-only concatenation for range; never call Oura compose.
2. **Export multiple:** reuse `dailyLogContentForSave` / dual-writer per day (same as Sync).
3. **Auto-sync on all saves:** centralize “commit → markMod → syncDrive(affected days)” to avoid duplicate OAuth spam; debounce optional if rapid water taps become noisy.

---

## Revision history

| Date | Change |
|------|--------|
| 2026-05-20 | Round 4: Log has Sync (unchanged) + Export (enhanced); multi export = Oura; single = fresh no Oura; auto-sync all saves; multi-select first-default rule |
