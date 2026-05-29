# Daily Tracker — Architecture

This app is a client-only PWA: `index.html` (shell), `styles.css`, `dist/app.js` (built from `src/app.js` + journal helpers), and `sw.js`. Refactor work is governed by **[REFACTOR_SPEC.md](REFACTOR_SPEC.md)**.

**Build before deploy:** `npm run build` (writes `dist/app.js`). Edit app logic in `src/app.js`, then rebuild.

**Daily log files** on Drive are co-authored with **oura_loader**. Tracker regenerates only the Tracker-head and preserves the Oura-tail verbatim — see **[docs/DAILY_LOG_DUAL_WRITER.md](docs/DAILY_LOG_DUAL_WRITER.md)**.

## Invariants (summary)

Read **§4** in `REFACTOR_SPEC.md` before changing dates, food counts, or Save behavior.

| Topic | Rule |
|-------|------|
| **Log day** | `isoToLocalYMD(entry.dt)` — never `iso.slice(0,10)` |
| **Food +/- wheels** | `gTFQ` — session since `flSave`; **resets** after Save |
| **Food counters / goals** | `gDFQ` — full day total; **does not reset** after Save |
| **Global Save** | Clears staging, `gdt`, note fields; bumps `flSave` |
| **Water** | `S.wl` only, not supplement logs |

## Code layout (Phase 0+)

| Path | Role |
|------|------|
| `src/core/date.js` | Calendar / ISO helpers (on `DT` in bundle) |
| `src/domain/food.js` | `gTFQ`, `gDFQ`, `gWFQ`, `bumpFlSave` |
| `src/domain/log-store.js` | History list / update / delete by type |
| `src/session/save.js` | Save prepare / rollback / staging / reset |
| `test/*.test.js` | Node test runner — run `npm test` |
| `index.html` | Shell markup; loads `dist/app.js` |

## Tests

```bash
npm test
```

Requires Node 18+. Optional timezone matrix: `npm run test:tz`
