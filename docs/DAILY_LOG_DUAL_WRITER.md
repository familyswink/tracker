# Daily log dual-writer contract (Tracker + oura_loader)

**Status:** Normative for Tracker save/export/Drive sync  
**Last updated:** 2026-05-19

Daily log files (`YYYY-MM-DD.md` on Google Drive) are co-authored by two systems:

| System | Role |
|--------|------|
| **Daily Tracker** | User-facing journal: prose, meals, structured log in fenced **`yaml journal`** (**not** `wearable_biometrics`) |
| **oura_loader** (`oura_journal_injector.py`) | Reads Oura export JSON from Drive, writes/updates the `wearable_biometrics` JSON block at the bottom of the same file |

Oura ring data is fetched only by **oura-export**, not by Tracker and not by oura_loader talking to Oura’s API. After export + optional GitHub/manual run, the injector updates the journal tail.

Tracker and the injector **must not overwrite each other’s regions** on save.

---

## What Tracker must stop doing

- Do not fetch, merge, or display logic that **rewrites** Oura/wearable JSON inside the journal file.
- Do not run `oura_journal_injector.py`, shell out to oura_loader, or call Oura APIs from the Tracker save path.
- Do not treat the whole `YYYY-MM-DD.md` as a single blob that Tracker regenerates end-to-end when a wearable block already exists.
- Do not “pretty print,” normalize, or re-serialize the `wearable_biometrics` fenced JSON for cleanliness.
- Do not add a second Oura/wearable fence; there must be **at most one** canonical wearable block per file.
- Updating Oura content is **out of band**: oura-export → journal injector (local or GitHub Actions). Tracker only preserves what is already there.

---

## File model: Tracker-head vs Oura-tail

Partition each `YYYY-MM-DD.md` into two byte ranges:

### Tracker-head (Tracker owns)

- **Start:** beginning of file (BOF)
- **End:** last byte before the Oura-tail (if Oura-tail exists)
- **Contains:** Markdown preamble (`gDailyLogMarkdownTop` parity) plus the fenced **`yaml journal`** structured payload (sparse subtree; **omit** empties — same logical content as **`gDailyLogJSON`**).
- On every save, Tracker may **fully regenerate** Tracker-head from its internal state (same logical output as `generate_daily_log()` / `gDailyLogForDate()` parity). It does not need to be byte-identical to the previous save.

### Oura-tail (Tracker must not touch)

- **Start:** the thematic-break line `---` that sits **immediately before** the wearable fenced block
- **End:** EOF
- **Contains:** that `---` line, newline(s), and a single fenced `json` code block whose parsed root object has **only** the top-level key `wearable_biometrics`.
- When Oura-tail is present, Tracker must **copy it verbatim** (byte-for-byte) onto the end of the file after regenerating Tracker-head.

### No Oura-tail yet

If the file has no canonical wearable fence, the entire file is Tracker-head. Tracker saves only regenerated Tracker content. The injector may append Oura-tail later; Tracker must **not** invent placeholder Oura JSON.

---

## How to detect the Oura-tail (canonical wearable fence)

Implement detection by **parse**, not loose regex:

1. Find fenced code blocks marked `json` (triple-backtick fences).
2. Parse each block’s JSON.
3. Find the wearable fence (**last** fenced `json` block whose root parses to **`wearable_biometrics`**, or heuristic marker `"wearable_biometrics"` when malformed). Start Oura-tail at the **thematic **`---`** line immediately above** that fence (blank lines between `---` and the fence may exist). **If injector omitted **`---`** before the wearable fence**, the tail starts at the fence’s opening ` ```json ` line.
4. If Oura data is present but the tail cannot be extracted, Tracker **must not** write a head-only file (that would delete Oura).
5. **Zero** wearable markers → save Tracker-head only.
6. **More than one** wearable fenced block ⇒ **reject save/export** (`splitJournalFile` returns an error — don’t splice/silent-repair).

Do not use a loose regex for `script_execution_utc_timestamp` across the whole file.

Other `---` lines in Tracker-head are **not** the Oura-tail boundary unless they match the “immediately before wearable fence” rule.

**Implementation:** `src/domain/journal-file.js` — `splitJournalFile`, `composeJournalFile`.

---

## Normative save algorithm (section replace, not full-file rewrite)

On Save for date `D` → file `YYYY-MM-DD.md`:

1. **READ** current file bytes from Drive (or local export mirror), if it exists.
2. **SPLIT:**
   - If canonical wearable fence found:
     - `tracker_head_original` = bytes from BOF through byte before Oura-tail opener
     - `oura_tail_verbatim` = bytes from Oura-tail opener through EOF (unchanged)
   - Else:
     - `tracker_head_original` = entire file (or empty if new day)
     - `oura_tail_verbatim` = (none)
3. **REGENERATE** `tracker_head_new` from Tracker app state only (meals, pills, Markdown + **`yaml journal`** — **never** regenerate `wearable_biometrics`).
4. **COMPOSE:**
   - If `oura_tail_verbatim` present: `file_out = tracker_head_new + oura_tail_verbatim`
   - Else: `file_out = tracker_head_new`
5. **WRITE** `file_out` to Drive (single atomic upload/replace).

**Critical properties:**

- `oura_tail_verbatim` is never parsed and re-emitted — no `JSON.stringify` round-trip on the wearable block.
- Tracker-head is replaced each save; Oura-tail is appended unchanged when it exists.
- No duplicate `---` or second wearable fence before the preserved tail.

---

## What Tracker still owns

| Section | Owner | On Tracker save |
|---------|-------|-------------------|
| Title / date heading, human Markdown | Tracker | Regenerate |
| Structured log fenced **`yaml journal`** (`gDailyLogForDate` parity) | Tracker | Regenerate |
| Separator + `wearable_biometrics` fenced `json` | oura_loader only | Preserve verbatim if present; omit if absent |

Tracker UI may read wearable JSON for **read-only** display (`parseWearableBiometricsReadOnly`) if product needs it, but must **not** write it back through the save pipeline.

---

## After Tracker save — Oura updates (not Tracker’s job)

- Tracker does **not** trigger the injector on save.
- Oura refresh runs when oura-export finishes a sync (and optionally when the journal injector runs in GitHub Actions or locally).

**Operational expectation:**

- Tracker saves → Tracker-head updated, Oura-tail unchanged.
- Separately, export + injector run → Oura-tail updated or appended.

---

## Edge cases and UX

| Situation | Tracker behavior |
|-----------|------------------|
| User edits only Tracker fields | Regenerate head; preserve tail |
| Injector not run yet for that day | Save head-only file; injector may append tail later |
| User “clears” Oura in UI | Do not delete wearable fence from Tracker save |
| File edited on Drive outside Tracker | On next save, re-read file, re-detect tail, then splice |
| Corrupt file (duplicate wearable fences) | **Refuse save** with clear UI error — user repairs Markdown manually |

---

## Acceptance criteria (QA)

- [ ] With Oura-tail present: Save from Tracker changes Tracker JSON/prose but `wearable_biometrics` bytes (including whitespace inside the fence) are **identical** before and after save.
- [ ] Without Oura-tail: Save produces only Tracker hybrid; **no** empty wearable stub.
- [ ] No injector call on Tracker save (network tab / logs).
- [ ] After injector run: Tracker save again still preserves the new Oura-tail verbatim.
- [ ] No duplicate wearable fences after repeated Tracker saves.
- [ ] Corrupt file (two wearable fences): Tracker **does not splice** silently; save/export/errors surface from `composeJournalFile` / preview.

**Automated:** `test/journal-file.test.js`

---

## Reference layout (after both writers have run)

```markdown
# Monday — 2026-05-19

## 📝 Subjective Notes & Food Logs
…

```yaml journal
date: "2026-05-19"
day_of_week: monday
# …sparse sections only…
```

---                    ← start of Oura-tail

```json
{ "wearable_biometrics": { … } }
```
```


---

## One-line summary

On save: regenerate Tracker-head (Markdown + fenced **`yaml journal`**); when a canonical `wearable_biometrics` fenced `json` block exists, concatenate the existing Oura-tail (from **`---`** before that fence through EOF) verbatim. **Never merge Oura JSON in Tracker.**
