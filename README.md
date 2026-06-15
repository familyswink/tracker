# Daily Tracker

A personal health tracking app for supplements, food, water, activity, and daily notes. Runs entirely in the browser — no account required. Data lives in your browser's local storage and can be synced to Google Drive.

**Ecosystem (all four tools):** [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md) · **User guide:** [docs/USER_GUIDE.md](docs/USER_GUIDE.md) · **Spec standard:** [docs/PRODUCT_SPEC_STANDARD.md](docs/PRODUCT_SPEC_STANDARD.md)  
**Refactor plan:** see [REFACTOR_SPEC.md](REFACTOR_SPEC.md) for phased architecture work, invariants, and acceptance criteria.  
**Developers:** Edit `src/app.js`, bump **`src/version.js`** on every release, run `npm run build`, then `npm test`. Settings → About shows the deployed version. See [ARCHITECTURE.md](ARCHITECTURE.md). Daily log dual-writer rules: [docs/DAILY_LOG_DUAL_WRITER.md](docs/DAILY_LOG_DUAL_WRITER.md).  
**Sibling `oura_loader` repo:** hub [INTEGRATION](../oura_loader/docs/INTEGRATION.md) · [`PRODUCT_SPEC`](../oura_loader/PRODUCT_SPEC.md) · [spec cheat sheet](../oura_loader/docs/spec-locations.md) · [daily log format v2 (MD)](../oura_loader/docs/daily-log-requirements-v2.md) — relative links work when `oura_loader` is cloned beside this repo.

---

## Getting Started

Open the app at [familyswink.github.io/tracker](https://familyswink.github.io/tracker) on any device. On iPhone, tap the Share button → **Add to Home Screen** to install it as a full-screen app.

The app installs a service worker that caches it for offline use and updates automatically when new code is deployed. After an update, close the app from the app switcher and reopen it — you will see an "App updated" toast. **Never clear Safari history to force an update** — this erases all your data.

---

## Tabs

### Supps
Track your supplement schedule. Each group (Wake-up, Breakfast, Lunch, Bed, etc.) shows the supplements for that time of day with a quantity input and a skip button.

- Tap a supplement name to open the detail/edit overlay
- Adjust quantity with the +/− buttons
- Tap **Skip** to mark as skipped instead of taken
- Press **Save** at the bottom to commit all pending supplement entries to history
- **Manage Supps** — add, edit, or reorder supplements
- **Manage Timing** — define which supplement appears in which group and at what default quantity; **search** by supplement or manufacturer
- **Manage Groups** — add, rename, reorder, or delete supplement groups
- **Manage Units** — add, delete, or drag-reorder unit labels (e.g. mg, capsule)
- **Search catalog** — log a supplement not shown on the main list (top search field on Supps tab)
- **History** — view and edit all past supplement log entries; **search** across all days (combines with day filter)

### Food
Track daily food servings against your protocol goals. Each food shows today's count and colors green when the daily goal is met.

- Tap **+/−** to log servings directly from the food tab
- Tap the food name to open a detail overlay with a precise quantity entry
- **Load Meal** — apply a saved meal template (pre-fills quantities for all foods in that meal)
- **Manage Food** — add, edit, enable/disable, or reorder food items
- **Manage Meals** — create and edit meal templates with per-food quantities
- **Manage Groups** — add, rename, reorder food groups (Vegetables, Fruit, Protein, etc.)
- **History** — view and edit all past food log entries; tap a row to edit quantity or delete

### Water
Track water intake in ounces. Quick-add buttons let you log common amounts instantly.

- Tap a quick-add button (+8, +16, +20, etc.) to log water immediately
- Tap any logged entry to edit quantity or notes
- **Edit Buttons** — customize the quick-add button amounts

### Other
Log activities, symptoms, and observations. Cards with a single Yes/No or list field show inline buttons so you can log with a single tap — no overlay required.

- **Single-field items (Yes/No or short list):** tap the button directly on the card to log instantly. The button highlights to show your selection. Tap the item name to open the full overlay to edit or delete.
- Multi-field cards: tap a list option on the card, then open the overlay — **option defaults pre-fill** (e.g. Cold Plunge duration/temperature)
- Each activity saves immediately when logged — no global Save needed on this tab
- **Manage** — add, edit, enable/disable, or reorder activity types; configure bowel health status options
- **History** — view all past Other and Bowel Health entries

#### Setting up a quick-log item (e.g. "Arm Numb")
1. Other tab → Manage → + Add New Type
2. Name: `Arm Numb`
3. Add Field → select **Y/N**
4. Field name: `Occurred`
5. Save — the card now shows Yes/No buttons inline

### Notes
Write a quick note for the day. Type `[[` in any note field (Notes, Food, Supps, Other, overlays) to insert supplement or custom wiki names. **Manage [[ names** hides entries from the picker only (catalog supplements still appear when you add them). Tap **History** to browse and edit past notes.

### Log
View today's daily log as formatted Markdown, or switch to **Change report** (day-over-day Added/Removed for tracked supplements, food, other, and optional water).

- **Daily log** — today's hybrid `.md` preview
- **Change report** — From/To range, search, compares each day to the prior day (see [USER_GUIDE § Change report](docs/USER_GUIDE.md))
- **Sync Drive** — push Daily Log (`.md` with embedded JSON) to Google Drive (signs in with Google on first use). If the file already has Oura `wearable_biometrics` data at the bottom (from oura_loader), Tracker updates only its own sections and leaves that block unchanged.
- **Export** — daily logs, config snapshot, and optional **change report** (CSV or Markdown) for a date range

### Settings
Configure the app behavior and integrations.

- **Tab visibility** — hide Water, Supps, Food, Other, Notes, or Log from the tab bar. Hidden tabs keep all past data on the phone and in History; they are **omitted** from daily log `.md` on Sync and Export (Settings tab always stays visible).
- **Auto-sync:** after **every log commit** (bottom Save, Other card Save, water/food immediate saves) → Drive sync for affected day(s), same Oura-per-day rules as Sync. Log → **Sync Drive** button unchanged. See [docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md).
- **Share on Export** — on iPhone/iPad, Export uses the Share sheet (single `.md` export avoids bogus extra files from the share title).
- **Change report window (hours)** — supplements with same qty logged within this many hours of yesterday count as unchanged (default 4)
- **Track water in change report** — include total water oz in day-over-day report (default off)
- **Drive Folder IDs** — set the Google Drive folder IDs for Daily Logs and backups. Copy only the ID from the folder URL (the part after `/folders/` and before any `?`)
- **About** — shows deployed build version (bump `src/version.js` each release).
- **Help** — links to [USER_GUIDE](docs/USER_GUIDE.md) on GitHub
- **Backup Now** — save a full JSON backup of all your data (logs + config) to `DT_Backup_YYYY-MM-DD.json` on Drive
- **Restore from Backup** — instructions for restoring from a backup
- **Clear logs before today** — removes log entries before today; keeps catalog, schedule, and settings

---

## Save Button

The global **Save** button (bottom of every tab) commits everything staged for that session:

| Commits (when non-empty) | Clears / resets after success |
|--------------------------|-------------------------------|
| Staged supplements → `S.sl` / `S.wl` (water supps) | Supplement checkboxes and ad hoc staging |
| Staged ad hoc catalog supps | Other multi-field **card** staging (`_otherSt`) |
| Staged Other card selections → `S.al` | Custom date/time (`S.gdt`) |
| Non-empty quick notes (Notes / Food / Supps) | Quick note textareas |
| | Food **+/- session** wheels → 0 (via `flSave` bump) |
| | **Daily / weekly food counters and goals unchanged** |

Other **inline** one-tap logs and **overlay Save** on an activity still commit immediately (no bottom Save needed for those). After bottom Save, the app attempts **once-per-day** `DT_Backup_*.json` to Drive when a backups folder ID is set (modal if Drive is not connected).

Load Meal also bumps `flSave` so food wheels reset the same way as bottom Save.

---

## Export

Log tab → **Export** opens a dialog where you can:
- Set a **date range** (From / To) — defaults to your modified dates but can be any range
- Choose file types: Daily Log (.md), Config snapshot (.json), **Change report** (CSV or Markdown)
- **Single combined `.md`** for the range, or **one file per day** (per-day export preserves Oura tail when the file already exists on Drive — see [docs/DAILY_LOG_DUAL_WRITER.md](docs/DAILY_LOG_DUAL_WRITER.md))

Embedded JSON uses flat lifestyle field keys (e.g. `duration_min`, `temperature_f`) and omits empty or hidden-tab sections. Legacy fields such as `subjective_scores` are no longer written.

**On iPhone/iPad:** Share sheet when enabled in Settings (prefer save picker for single-file export)

**On Mac (Chrome/Edge):** Save-file picker or linked folder if one was set up

---

## Google Drive Sync

### First-time setup
1. In [Google Cloud Console](https://console.cloud.google.com), create an OAuth 2.0 Web Client ID
2. Under **Authorized JavaScript origins**, add:
   - `https://familyswink.github.io`
   - `http://localhost:8766` (for local testing)
3. Under **Authorized redirect URIs**, add:
   - `https://familyswink.github.io/tracker/` ← **important: include the trailing slash and `/tracker/` path**
   - `http://localhost:8766` (for local testing)
4. Enable the **Google Drive API** in your project
5. Create folders in Google Drive for MD logs, JSON logs, and backups
6. In Settings → Drive Folder IDs, paste your **Daily Logs** folder ID and **Backups** folder ID (the string after `/folders/` in the URL — stop before any `?`)
7. Go to Log tab → **Sync Drive** to authenticate and push your first daily log file

**Oura / wearable data:** Tracker does not fetch or merge Oura ring data. A separate **oura-export** + **oura_loader** pipeline may append a `wearable_biometrics` JSON section at the bottom of the same `.md` file; Tracker preserves that section on sync. See [docs/DAILY_LOG_DUAL_WRITER.md](docs/DAILY_LOG_DUAL_WRITER.md).

The token lasts one hour. After expiry, the next sync will redirect to Google sign-in and return automatically.

### Backup vs. Config Export
- **Backup Now** (Drive) — saves one `DT_Backup_YYYY-MM-DD.json` file per day to your backups folder containing **all log history + all configuration**. Use this to fully restore the app.
- **Config snapshot** (Export) — saves only setup data (supplement list, food protocol, activity types, settings) with no log history. Use this to transfer your protocol to a new device.

---

## Sharing with Family Members

Each person runs the app independently with their own Google account and their own Drive folders. To share Drive folders with another person, right-click the folder in Google Drive → Share → add their Google account with Editor access. They enter those folder IDs in their own app's Drive Settings.

---

## PWA Updates

The app uses a service worker: shell assets are cached; **`dist/app.js` is always fetched fresh** when online (version query on the script URL). After deploy, confirm **Settings → About** shows the new version; close from the app switcher and reopen if tabs or buttons stop responding (stale bundle).

**Never clear Safari history to force a PWA update** — this deletes your `localStorage` data (`dt6`). If the app fails to load, open [familyswink.github.io/tracker](https://familyswink.github.io/tracker) in Safari, wait for it to load, then re-add to Home Screen.

---

## Resetting the App

All data is in your browser's `localStorage` under the key `dt6`. Clearing site data in browser settings resets the app to defaults. **Use Backup Now before doing this.**
