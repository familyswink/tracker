# Daily Tracker

A personal health tracking app for supplements, food, water, activity, and daily notes. Runs entirely in the browser — no account required. Data lives in your browser's local storage and can be synced to Google Drive.

---

## Getting Started

Open the app at [familyswink.github.io/tracker](https://familyswink.github.io/tracker) on any device. On iPhone, tap the Share button → **Add to Home Screen** to install it as a full-screen app.

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
Log activities (Cold Plunge, Sauna, Meditation) and bowel health.

- Tap any card to open the log overlay for that activity
- Each activity saves directly when you tap **Save** inside its overlay — no global Save needed on this tab
- **Manage** — add, edit, enable/disable, or reorder activity types; configure bowel health status options
- **History** — view all past Other and Bowel Health entries

### Notes
Write a quick note for the day. Tap **History** to browse and edit past notes.

### Log
View today's full log as a formatted Markdown document.

- **Sync Drive** — push today's MD and JSON files to Google Drive (signs in with Google on first use)
- **Export** — export files locally via Share sheet (iPhone/iPad) or save to a linked folder (Mac)

### Settings
Configure the app behavior and integrations.

- **Auto-sync on Save** — automatically push to Google Drive every time you press Save
- **Drive Folder IDs** — set the Google Drive folder IDs for MD, JSON, and backup files. Copy only the ID from the folder URL (the part after `/folders/` and before any `?`)
- **Help** — links to this README
- **Backup Now** — save a full JSON backup of all your data to Drive
- **Restore from Backup** — instructions for restoring from a backup

---

## Save Button

The global **Save** button (bottom of screen) commits pending supplement entries and resets the food tab quantities to zero for the next meal. It does not appear on the Other tab since each activity saves directly.

---

## Google Drive Sync

1. In [Google Cloud Console](https://console.cloud.google.com), create an OAuth 2.0 Web Client ID
2. Add your app's URL to **Authorized JavaScript origins** and **Authorized redirect URIs**
3. Enable the **Google Drive API** in your project
4. Create folders in Google Drive for MD logs, JSON logs, and backups
5. In Settings → Drive Folder IDs, paste each folder's ID (the string after `/folders/` in the URL)
6. Go to Log tab → **Sync Drive** to authenticate and push your first files

The token lasts one hour. After expiry, the next sync will prompt for sign-in again.

---

## Sharing with Family Members

Each person runs the app independently with their own Google account and their own Drive folders. To share Drive folders with another person, right-click the folder in Google Drive → Share → add their Google account with Editor access. They enter those folder IDs in their own app's Drive Settings.

---

## Exporting Files

**On iPhone/iPad:** Log tab → Export → Share sheet → Save to Files (iCloud Drive or local)

**On Mac (Chrome/Edge):** Settings → Choose parent folder → pick a local or synced folder → Export will write files there automatically on each export

---

## Resetting the App

All data is in your browser's `localStorage` under the key `dt6`. Clearing site data in browser settings resets the app to defaults. Use **Backup Now** before doing this.
