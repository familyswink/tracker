# Daily Tracker — Refactor Specification

**Status:** Active  
**Last updated:** 2026-05-19  
**Storage key:** `dt6` (unchanged unless explicitly versioned in a future phase)

This document is the source of truth for restructuring the tracker codebase. Implementation proceeds in **phases**. Each phase is deployed and used for 1–2 days before the next phase starts. Do not begin phase N+1 until phase N passes its acceptance criteria.

User-facing behavior is documented in [README.md](README.md). This spec covers **architecture, invariants, and engineering workflow**.

---

## 1. Goals

| Goal | Description |
|------|-------------|
| **Maintainability** | One place for dates, log access, and Save/session lifecycle |
| **Fewer regressions** | Automated tests for easy-to-break rules (dates, food session vs daily totals) |
| **Same product** | Personal PWA, offline-first, GitHub Pages deploy, `localStorage` + optional Drive |
| **Incremental delivery** | Small shippable phases; no multi-week “big bang” rewrite |

## 2. Non-goals (unless decided later)

- Backend server or user accounts
- Replacing hybrid Daily Log format (see `.cursor/rules/001-daily-journal-format.md`)
- Full UI framework rewrite in early phases
- Changing `STORAGE_KEY` or breaking backup restore without a documented migration

---

## 3. Current state (baseline)

| Item | Detail |
|------|--------|
| **App shell** | Single `index.html` (~2,000+ lines): HTML, CSS, inline JS |
| **Deploy** | Static hosting + `sw.js` (network-first cache) |
| **State** | Global `S` object + staging globals (`_supSt`, `_otherSt`, `_supAdhoc`, …) |
| **Logs** | Parallel arrays: `S.sl`, `S.wl`, `S.fl`, `S.al`, `S.ind`, `S.notes`, `S.fnotes`, `S.snotes` |
| **Patches** | Ad-hoc `scripts/apply_*.py` string-replace on `index.html` (to be retired) |

### Known pain points

1. **Date logic duplicated** — `isoToLocalYMD`, `onLogDay`, `logEntryDay`, occasional UTC `.slice(0,10)`.
2. **Food quantities dual meaning** — session qty (`gTFQ` + `flSave`) vs daily totals (counters/goals); easy to break on Save.
3. **Save semantics mixed** — supps stage until Save; food persists on each +/-; Other often immediate.
4. **History/export patch many arrays** — bulk edit and export repeat per-type logic.
5. **No automated tests** — regressions found only by manual use.

---

## 4. Core invariants (must always hold)

These rules apply during and after refactor. **Violating any invariant is a bug.**

### 4.1 Calendar and time

- **Log day** for an entry = `isoToLocalYMD(entry.dt)` (local calendar date).
- **Never** use `String(iso).slice(0,10)` on ISO timestamps for grouping or filtering (UTC bug).
- **User-facing date/time pickers** use local YMD + local time via `dateAndTimeToISO(dateStr, timeStr)` (component-based `Date`, not naive `T` string parsing).
- **`gEDt()`** = `S.gdt || now()` for new/edited entries until Save clears `gdt`.

### 4.2 Food: session vs daily (critical)

| Concept | Function / mechanism | Resets after global Save? |
|---------|----------------------|---------------------------|
| **Session qty** | `gTFQ(fid)` — entries with `la >= flSave` (after bump) | **Yes** → +/- wheels show 0 |
| **Daily total** | `gDFQ(fid)` — all `S.fl` for that food on log day | **No** — counters/goals keep total |
| **Week total** | `gWFQ(fid)` | **No** |
| **Section header** (e.g. Vegetables 3/4) | Sum of `gDFQ` for section | **No** |
| **Green check / `gFC`** | Based on `gDFQ` / `gWFQ`, not session | **No** |

- **`bumpFlSave(ts)`** sets `S.flSave` to `ts + 1ms` so entries logged in the just-finished session have `la < flSave`.
- **Load Meal (`cfML`)** and **global Save (`svAll`)** both call `bumpFlSave`.

### 4.3 Global Save (`svAll`)

After a successful Save:

| Clears / resets | Preserves |
|-----------------|-----------|
| `_supSt`, `_supAdhoc`, `_otherSt`, `_pendingWater` | All committed log arrays |
| `S.gdt` | Daily/weekly food counters |
| Quick note textareas + `note-dirty` class | Water today total, history data |
| Food +/- session display (via `bumpFlSave`) | Config (catalog, schedule, meals, settings) |

Commits on Save (when non-empty):

- Staged supplements → `S.sl` / `S.wl` (water supps)
- Staged ad hoc supps → `S.sl` / `S.wl`
- Staged Other → `S.al`
- Non-empty quick notes → `S.notes` / `S.fnotes` / `S.snotes`

### 4.4 Water

- Water intake logs live in **`S.wl` only**, not `S.sl`.
- `isWaterSuppLog(e)` excludes water from supplement export/history where applicable.

### 4.5 History

- Group and filter by **`logEntryDay(e)`** (= `isoToLocalYMD(e.dt || e.la)`).
- Bulk **Edit date/time** updates **`dt` only** (not `la` unless explicitly specified later).
- If day filter is active and entry moves to another day, **clear day filter** and toast the new day.

### 4.6 Storage and migrations

- **`STORAGE_KEY`** remains `dt6` through phases 0–3 unless a phase explicitly adds `dt7` migration.
- One-time migrations run in `migrateStoredLogsOnce()` (or successor), idempotent, flagged in `S.cfg`.
- **No destructive migration** without user confirm (except existing “Clear logs before today” setting).

### 4.7 Dual-writer daily logs (Tracker + oura_loader)

Normative detail: **[docs/DAILY_LOG_DUAL_WRITER.md](docs/DAILY_LOG_DUAL_WRITER.md)**.

- **Tracker-head:** Markdown + Tracker daily JSON (`gDailyLogForDate` / `generate_daily_log.py` parity). Regenerated on every Drive sync / export save.
- **Oura-tail:** `---` immediately before a single fenced JSON block whose root is **only** `{ "wearable_biometrics": … }`. Preserved **byte-for-byte** when present; never invented by Tracker.
- **Save path:** `driveRead` → `composeJournalFile(existing, trackerHeadNew)` → `driveWrite`. No Oura API, no injector, no `JSON.stringify` on wearable bytes.
- **Corrupt file** (two wearable fences): refuse save; surface error (no silent repair).
- **Read-only:** `parseWearableBiometricsReadOnly` for UI display only.

---

## 5. Target architecture (end state)

```
tracker/
  REFACTOR_SPEC.md          # this file
  README.md
  index.html                # shell: markup + overlays only
  styles.css                # app styles (extracted phase 1)
  dist/app.js               # built bundle (journal + app; npm run build)
  sw.js
  package.json              # phase 1+: esbuild
  src/
    core/
      date.js               # isoToLocalYMD, dateAndTimeToISO, f12, fDT, …
      id.js                 # uid
      store.js              # ld, sv, normalizeS, migrations
    domain/
      food.js               # gTFQ, gDFQ, gWFQ, gFC, bumpFlSave, qF, meal helpers
      supps.js
      water.js
      other.js
      notes.js
      log-store.js          # phase 2: unified list/update/delete by type
      export.js             # gDailyLogJSON, daily log markdown
    session/
      commit.js             # phase 3: commitGlobalSave / resetAfterSave
    ui/
      overlays.js
      history.js
      tabs/                 # optional phase 4
    app.js                  # init, tab switch, wire DOM
  test/
    date.test.js
    food-session.test.js
    log-store.test.js       # phase 2+
  scripts/
    generate_daily_log.py   # keep
    # apply_*.py            # retire after phase 1
```

**Build:** esbuild → single `dist/app.js` (or `tracker/app.js`) referenced from `index.html`. Deploy artifact stays static-hosting compatible.

---

## 6. Phased implementation

### Workflow (every phase)

1. Implement phase on `main` (or a short-lived branch merged quickly).
2. Run automated tests (`npm test`).
3. Deploy / push; hard-refresh or PWA restart to pick up bundle.
4. **Soak test 1–2 days** of normal use (see checklist §8).
5. Mark phase complete in §7 status table; start next phase only after sign-off.

---

### Phase 0 — Guardrails

**Purpose:** Document invariants and lock them with tests before moving code.

**Deliverables**

- [x] This file committed (`REFACTOR_SPEC.md`)
- [x] `ARCHITECTURE.md` — short pointer to invariants §4
- [x] `package.json` + Node built-in test runner (`node --test`)
- [x] `test/date.test.js` — `isoToLocalYMD`, `dateAndTimeToISO` (local TZ cases)
- [x] `test/food-session.test.js` — `gTFQ` / `gDFQ` / `bumpFlSave` behavior with fixture `S.fl`
- [x] `test/save-reset.test.js` — staging cleared, `flSave` bumped, `gdt` null after commit (mock DOM minimal)
- [x] README link to this spec

**Acceptance criteria**

- All tests pass in CI or locally (`npm test`).
- No change required to production `index.html` behavior (tests may import extracted copies of functions until phase 1).

**Soak test:** Same day smoke OK; full 1–2 days optional.

---

### Phase 1 — Module extraction + bundle

**Purpose:** Split monolith without changing UX; enable real imports and dead-code visibility; enforce dual-writer daily log saves.

**Deliverables**

- [x] Extract `src/core/date.js`, `src/domain/food.js`, `src/domain/journal-file.js`, `src/session/save.js` (minimum set)
- [x] Bundle `dist/app.js` via `npm run build` (`scripts/build.mjs`); `index.html` shell loads it
- [x] Dual-writer save: `driveRead` + `composeJournalFile` on Drive sync, export, local folder export
- [x] `test/journal-file.test.js` + `docs/DAILY_LOG_DUAL_WRITER.md`
- [x] Archive `scripts/apply_*.py`, `scripts/_patch_ui.py` → `scripts/archive/` (keep `generate_daily_log.py`)
- [x] App logic in `src/app.js`; CSS in `styles.css`; `index.html` is markup + overlays only
- [ ] Wire `src/app.js` to import `date` / `food` / `save` (remove duplicate helpers in app — Phase 1.1 or Phase 2)

**Acceptance criteria**

- App loads at `/tracker/` online and offline (SW).
- All §8 smoke items pass.
- Bundle size reasonable (<250KB gzipped target; inform if exceeded).

**Soak test:** **1–2 days** — daily logging, Save, PWA update toast.

---

### Phase 2 — Log store

**Purpose:** Single API for history, bulk edit, export filters.

**Deliverables**

- [ ] `src/domain/log-store.js`:
  - `list(type, { day?, sort? })`
  - `get(id)`, `update(id, patch)`, `remove(ids)`
  - `types`: `water`, `supps`, `food`, `other`, `notes` (incl. fnotes/snotes as today)
- [ ] History UI uses `LogStore` only (no direct `patch(S.sl)` loops)
- [ ] `gDailyLogJSON` uses shared day filter helpers
- [ ] `test/log-store.test.js`

**Acceptance criteria**

- History: view, filter by day, bulk edit date/time, delete — all types.
- Export daily log matches pre-phase output for fixture days (snapshot or manual diff).

**Soak test:** **1–2 days** — include history edit across midnight boundary.

---

### Phase 3 — Unified session commit

**Purpose:** One code path for global Save and reset; impossible to “forget” food bump or note clear.

**Deliverables**

- [ ] `src/session/commit.js`:
  - `commitGlobalSave({ persistNotes: true })`
  - Calls domain persist helpers, `bumpFlSave`, `resetAfterSave`, `sv()`, tab refresh
- [ ] `svAll()` in app is a thin wrapper
- [ ] Align README § Save Button with §4.3 (update README if needed)
- [ ] Extend `test/save-reset.test.js` for full commit path

**Acceptance criteria**

- After Save: §4.3 table holds for supps, food, notes, gdt, Other staging.
- No regression in auto-sync / backup-on-first-save logic.

**Soak test:** **1–2 days** — multi-meal day, custom GDT, Save between meals.

---

### Phase 4 — UI layer (optional)

**Purpose:** Reduce `innerHTML` / `eval` risk in History and Manage screens.

**Do only if** Phases 0–3 still leave painful duplication.

**Deliverables**

- [ ] Replace history row `eval()` with data attributes + delegated handlers
- [ ] Shared list-row component or template helper for Manage * screens
- [ ] (Optional) Consider Svelte/Vue for overlay-heavy flows — **decision gate required**

**Acceptance criteria**

- §8 smoke + no new XSS surfaces (no `eval` in history).

**Soak test:** **1–2 days**.

---

## 7. Phase status

| Phase | Status | Completed | Notes |
|-------|--------|-----------|-------|
| 0 | Complete | 2026-05-19 | `src/` modules + `node --test` |
| 1 | Complete | 2026-05-19 | `styles.css`, `src/app.js`, `dist/app.js`; dual-writer on Drive save |
| 2 | Not started | — | |
| 3 | Not started | — | |
| 4 | Not started | — | Optional |

*Update this table as phases complete.*

---

## 8. Smoke test checklist (manual)

Run after every phase deploy:

- [ ] **Supps:** stage items → Save → checkboxes cleared; entries in History
- [ ] **Food:** +/- → Save → wheels **0**; section **Today X/Y** still shows logged totals
- [ ] **Load Meal:** apply meal → Save → food tab reset; counters updated
- [ ] **Water:** quick-add; total increases; not in supplement history
- [ ] **Other:** inline quick-log; Save clears staged multi-field if any
- [ ] **GDT:** set custom date → log → Save → GDT indicator cleared
- [ ] **History:** select entry → Edit date/time → entry under correct day
- [ ] **Notes:** quick note survives Save; empty fields after Save
- [ ] **Log tab:** today’s markdown renders
- [ ] **Dual-writer:** file with Oura tail on Drive → Sync → wearable JSON bytes unchanged (§4.7)
- [ ] **Offline:** airplane mode → app still opens (cached shell)

---

## 9. Testing strategy

| Layer | Tool | Covers |
|-------|------|--------|
| Unit | Node `node:test` | date, food session/daily, log-store, commit |
| Manual | §8 checklist | PWA, overlays, Drive (optional) |
| Regression | Fixture `S` JSON in `test/fixtures/` | Known bad days (timezone edge) |

**Timezone:** Run tests with `TZ=America/Chicago` and `TZ=UTC` in CI matrix when available.

---

## 10. Deployment and cache

- Push to `main` → GitHub Pages updates.
- Service worker: network-first for shell; users may need **close app + reopen** after deploy.
- **Never** tell users to clear Safari history (wipes `dt6`).
- After phase 1, bump `CACHE` version in `sw.js` when bundle path changes.

---

## 11. Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-19 | Phased refactor, not big-bang | Reduce regression risk; soak test between phases |
| 2026-05-19 | Keep `dt6` through phase 3 | Backups and user data unchanged |
| 2026-05-19 | Split `gTFQ` / `gDFQ` | Session reset vs daily counters are distinct concepts |
| 2026-05-19 | esbuild, no framework in phase 1 | Smallest step off monolith |

*Add rows as phases introduce new decisions.*

---

## 12. References

- [README.md](README.md) — user guide
- [.cursor/rules/001-daily-journal-format.md](.cursor/rules/001-daily-journal-format.md) — Daily Log markdown + JSON
- `scripts/generate_daily_log.py` — offline log generation

---

## 13. Agent / contributor instructions

When implementing a phase:

1. Read **§4 invariants** first; if the phase conflicts, update this spec before coding.
2. Implement **only** the current phase scope.
3. Add or update tests listed for that phase.
4. Update **§7 phase status** when done.
5. Do not reintroduce `scripts/apply_*.py` for production changes.
6. Prefer extending `LogStore` / `commitGlobalSave` over new one-off array patches.
