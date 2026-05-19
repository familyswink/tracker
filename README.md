# Daily Tracker

A personal health tracking app for supplements, food, water, activity, and daily notes. Runs entirely in the browser — no account required. Data lives in your browser's local storage and can be synced to Google Drive.

**Refactor plan:** see [REFACTOR_SPEC.md](REFACTOR_SPEC.md) for phased architecture work, invariants, and acceptance criteria.  
**Developers:** `npm install && npm test` — see [ARCHITECTURE.md](ARCHITECTURE.md).

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
- **Manage Timing** — define which supplement appears in which group and at what default quantity
- **Manage Groups** — add, rename, reorder, or delete supplement groups
- **History** — view and edit all past supplement log entries

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
- **Multi-field items (e.g. Cold Plunge with Duration + Temperature):** tap the card to open the log overlay
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
Write a quick note for the day. Tap **History** to browse and edit past notes.

### Log
View today's full log as a formatted Markdown document.

- **Sync Drive** — push today's Daily Log (.md with embedded JSON) to Google Drive (signs in with Google on first use)
- **Export** — export files for a selected date range

### Settings
Configure the app behavior and integrations.

- **Auto-sync on Save** — automatically push today's Daily Log to Google Drive every time you press Save
- **Drive Folder IDs** — set the Google Drive folder IDs for Daily Logs and backups. Copy only the ID from the folder URL (the part after `/folders/` and before any `?`)
- **Help** — links to this README
- **Backup Now** — save a full JSON backup of all your data (logs + config) to the Drive backups folder
- **Restore from Backup** — instructions for restoring from a backup

---

## Save Button

The global **Save** button (bottom of screen) commits pending supplement entries and resets the food tab quantities to zero for the next meal. It does not appear on the Other tab since each activity saves directly.

---

## Export

Log tab → **Export** opens a dialog where you can:
- Set a **date range** (From / To) — defaults to your modified dates but can be any range
- Choose file types: Daily Log (.md, hybrid markdown + embedded JSON), Config snapshot (.json)

**On iPhone/iPad:** Uses the Share sheet → Save to Files (iCloud Drive or local)

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

The token lasts one hour. After expiry, the next sync will redirect to Google sign-in and return automatically.

### Backup vs. Config Export
- **Backup Now** (Drive) — saves one `DT_Backup_YYYY-MM-DD.json` file per day to your backups folder containing **all log history + all configuration**. Use this to fully restore the app.
- **Config snapshot** (Export) — saves only setup data (supplement list, food protocol, activity types, settings) with no log history. Use this to transfer your protocol to a new device.

---

## Sharing with Family Members

Each person runs the app independently with their own Google account and their own Drive folders. To share Drive folders with another person, right-click the folder in Google Drive → Share → add their Google account with Editor access. They enter those folder IDs in their own app's Drive Settings.

---

## PWA Updates

The app uses a service worker with a network-first caching strategy:
- When online, it always fetches the latest version from GitHub Pages
- When offline, it serves the cached version
- When a new version is deployed, you will see an "App updated" toast on next open

**Never clear Safari history to force a PWA update** — this deletes your `localStorage` data. If you need to force a refresh, close the app from the app switcher and reopen it while connected to the internet.

---

## Resetting the App

All data is in your browser's `localStorage` under the key `dt6`. Clearing site data in browser settings resets the app to defaults. **Use Backup Now before doing this.**
