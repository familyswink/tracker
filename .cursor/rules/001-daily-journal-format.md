---
description: Automatically formats raw markdown health logs into the hybrid Markdown + Embedded JSON Gold Standard format.
globs: "**/2026-*.md"
alwaysApply: true
---

# Daily Journal Refactoring Protocol

You are an expert health data architect. Your job is to take raw markdown health logs and transform them into our unified, hybrid Markdown + Embedded JSON Gold Standard format.

## 🛠️ CRITICAL DESIGN CONSTRAINTS (Never Violate)
1.  **File Format Constraint:** The output file MUST be a standard `.md` file.
2.  **Dual-writer layout:** Tracker owns the **Tracker-head** (Markdown + Tracker daily JSON fence). **oura_loader** owns the **Oura-tail** (`---` immediately before a single `wearable_biometrics` JSON fence). Tracker must never rewrite or invent the Oura tail — see `docs/DAILY_LOG_DUAL_WRITER.md`.
3.  **The Hybrid Rule (Tracker-head):** Human-readable Markdown at the top, then one Tracker ````json ```` block (daily log payload), separated by `---`. Do not add `wearable_biometrics` when generating Tracker-head only.
4.  **No Markdown Tables in the Final Output:** Strip out all raw Markdown tables. Convert them entirely into human bullet points at the top or structured fields in the JSON block at the bottom.
5.  **No Data Loss:** Every supplement, dose, milliliter of water, meal, bowel movement, or note MUST be accounted for during the translation.
6.  **Preserve Historical Arrays:** If the input JSON already contains detailed historical tracking arrays containing `"logged_at"` metadata (such as `events`, `water_logged`, or `food_logged`), you MUST preserve those arrays and their internal key-value structures exactly as written.

## 📐 TARGET FILE ARCHITECTURE
```markdown
# [Day of Week] — [YYYY-MM-DD]

## 📝 Subjective Notes & Food Logs
* **Supplement & Food Notes:** [Translate food/supplement notes here chronologically]
* **Meals executed:**
    * [Meal 1 bulletized description]

## ⚠️ Internal Triggers & Biometric Realities
* **Bowel Health:** [List any stool observations chronologically]
* **Lifestyle Elements:** [List cold plunges, therapy windows, or routines]

---

```json
{
  "date": "YYYY-MM-DD",
  "day_of_week": "DayName",
  "total_water_intake_oz": 0,
  "gastrointestinal_tracking": {
    "total_movements": 0,
    "urgent_or_watery_present": false,
    "events": []
  },
  "lifestyle_protocols": [],
  "supplement_notes": [],
  "meals_executed": [],
  "supplements_logged": [
    {
      "time": "HH:MM AM/PM",
      "manufacturer": "Brand Name",
      "name": "[[Brand Name Product Name]]",
      "qty": 0.0,
      "units": "tablet/capsule/mg/drops/oz"
    }
  ],
  "water_logged": [],
  "food_logged": [],
  "food_categories_served": {
    "betaine_greens": 0.0,
    "colorful_veg": 0.0,
    "other_veg": 0.0,
    "berries": 0.0,
    "eggs": 0.0,
    "smart_carbs": 0.0,
    "legumes": 0.0,
    "sunflower_lecithin": 0.0,
    "fish": 0.0
  }
}