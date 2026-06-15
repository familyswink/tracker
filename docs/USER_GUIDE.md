# Daily Tracker — user guide

Personal health logging PWA: supplements, food, water, other activities, and notes. Data stays on your phone; optional Google Drive sync.

**Live app:** [familyswink.github.io/tracker](https://familyswink.github.io/tracker)  
**Ecosystem (Oura + labs):** [ECOSYSTEM.md](ECOSYSTEM.md)  
**Product spec (requirements):** [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md)

---

## Quick start

1. Open the app → **Add to Home Screen** on iPhone for full-screen use.
2. Log through the day (water/food/other save immediately; supplements stage until **Save**).
3. Tap header **date/time** (or the bar at the top of any overlay) to backdate entries.
4. Bottom **Save** commits staged supplements and notes.
5. **Settings → Drive Folder IDs** → set Daily Logs + Backups folder IDs.
6. **Log → Sync Drive** once to sign in with Google.

After app updates: close from app switcher and reopen. Check **Settings → About** for version. **Do not clear Safari history** — that wipes your data.

---

## Tabs (summary)

| Tab | How logging works |
|-----|-------------------|
| **Water** | Quick-add or custom entry — saves immediately |
| **Supps** | Check items or use **Search catalog** for one-offs; bottom **Save** commits |
| **Food** | +/- or food overlay — immediate; **Load Meal** for templates |
| **Other** | Inline buttons on simple cards; overlay for multi-field; immediate save |
| **Notes** | Quick note; `[[` for supplement names |
| **Log** | View today’s markdown or **Change report**; **Sync Drive** / **Export** |
| **Settings** | Tabs, Drive, backup, help |

### Supplements (details)

- **Manage Supps** — catalog; set **Qty step (+/−)** for large doses (e.g. 500 mg vitamin C); **Track in change report** (on by default for new supplements).
- **Manage Timing** — group, default qty, on/off for main list (sorted by group, then A–Z); **search** by supplement name or manufacturer.
- **Manage Units** — drag to reorder unit labels.
- **Search catalog** (top of tab) — log supplements not on the main list; off-schedule items save directly when you confirm qty.

### Other (details)

- **Manage** — activity types and fields (numbers use min/max/step/def from Manage); **Track in change report** off by default.
- Card **Save** on list+default cards commits one row immediately.
- Tap a list option on the card (e.g. Cold Plunge), then open the overlay — **defaults from that option pre-fill** Duration, Temperature, etc.
- After saving an overlay, you return to the **Other** tab (not another tab).

### Date/time everywhere

- Header clock opens **Set Date & Time**.
- Overlays show the same clock bar — tap without losing your form.
- Custom date applies until bottom **Save** (then resets to “now”).

---

## Save button (bottom)

Commits: staged supplements, ad hoc catalog supps, staged Other card selections, quick notes. Clears supplement checkboxes and custom date/time. Bumps food session wheels (daily totals unchanged). Triggers auto-sync and once-per-day backup when configured.

---

## Export vs Sync

| | **Sync Drive** | **Export** |
|--|----------------|------------|
| Purpose | Upload daily `.md` to Drive | Download/share files |
| Oura tail (per-day files) | Preserved | Preserved on multi-file export |
| Combined range file | — | Tracker-only; no Oura merge |
| Change report | — | Optional CSV or Markdown (`changes_*.csv` / `.md`) |

Export uses ` ```yaml journal ` for structured data (not legacy bare JSON fence).

---

## Change report (Log tab)

Toggle **Change report** on the Log tab (next to **Daily log**).

- Set **From / To** dates (same idea as Export).
- Each row is one calendar day compared to the **prior day** (data on your phone only).
- Columns: **Added** and **Removed** — supplements show timing group + name + qty; skipped doses appear as **not taken**.
- **Search** filters rows by text in Added/Removed.
- Days with no detected changes still show the date with blank Added/Removed.

**What counts as “no change” for supplements:** same tracked supplement, same total qty that day, and log time within **Change report window** hours of yesterday (Settings → default **4**). Example: Breakfast 2 @ 10:00 one day and Other 2 @ 11:00 the next → no entry; qty or group shift → Removed line (e.g. `went from 2 Other to 1 at Breakfast — …`).

**Track change toggles:** Manage Supplements (default **on**), Manage Food / Manage Other type (default **off**), Settings → Track water (default **off**).

---

## History search

Every tab’s **History** overlay has a **Search all history** box. It finds matching entries across all days. **Filter by day** still works — use both together to search within one day.

| Tab | Matches |
|-----|---------|
| Supps | Name, manufacturer, qty, notes |
| Food | Food name |
| Other | Activity name, list values (e.g. `bowel`, `Loose`), field text |
| Water | Amount, notes |
| Notes | Note body |

---

## Settings reference

| Setting | What it does |
|---------|----------------|
| **Tab visibility** | Hide tabs from bar; past data kept; hidden sections omitted from `.md` |
| **Auto-sync on Save** | Upload affected days after log commits (default on) |
| **Share on Export** | iOS Share sheet for exports |
| **Change report window (hours)** | Same supp + same qty within N hours of yesterday ⇒ no change (default **4**) |
| **Track water in change report** | Compare total oz day-over-day (default off) |
| **Drive Daily Logs ID** | Folder for `YYYY-MM-DD.md` |
| **Drive Backups ID** | Folder for `DT_Backup_*.json` |
| **Backup Now** | Full snapshot (logs + config) to Drive |
| **Restore from Backup** | Paste backup JSON via assistant (not in-app file picker) |
| **Clear logs before today** | Deletes old log entries; keeps catalog |
| **Manage [[ names** | Hide custom names from `[[` picker |
| **About** | Build version |

---

## Google Drive setup

See [README § Google Drive Sync](../README.md#google-drive-sync). Oura data is added by **oura-export** + **oura_loader**; Tracker preserves that block. See [DAILY_LOG_DUAL_WRITER.md](DAILY_LOG_DUAL_WRITER.md).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Tabs/buttons dead after update | Force-quit app; verify **About** version; hard refresh in Safari once |
| Data gone | Usually cleared site data — restore from **DT_Backup_*.json** |
| Sync auth loop | Check OAuth redirect URI includes `https://familyswink.github.io/tracker/` |
| Supplements stay checked after Save | Update app (fixed in 2026.05.20.17+) |
| Wrong tab after Other save | Update app (fixed in 2026.05.20.19+) |

---

## Related tools

- **oura-export** — downloads Oura JSON  
- **oura_loader** — merges wearable block into daily `.md` on Drive  
- **myLabs** — lab PDFs → CSV (separate desktop app)  

Full map: [ECOSYSTEM.md](ECOSYSTEM.md)
