#!/usr/bin/env python3
"""Generate hybrid Daily Log .md files from a Daily Tracker backup JSON."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

FOOD_CATEGORY_KEYS = {
    "Betaine Greens": "betaine_greens",
    "Dark Greens / Cruciferous": "dark_greens_cruciferous",
    "Colorful Veg": "colorful_veg",
    "Other Veg": "other_veg",
    "Berries": "berries",
    "Other Fruit": "other_fruit",
    "Eggs": "eggs",
    "Fish": "fish",
    "Fowl": "fowl",
    "Red Meat / Pork": "red_meat_pork",
    "Smart Carbs": "smart_carbs",
    "Refined Grains": "refined_grains",
    "Extra Virgin Olive Oil": "extra_virgin_olive_oil",
    "Legumes": "legumes",
    "Nuts and Seeds": "nuts_and_seeds",
    "Fermented Foods": "fermented_foods",
    "Sunflower Lecithin": "sunflower_lecithin",
}


def on_log_day(iso: str | None, dt: str) -> bool:
    return bool(iso) and str(iso)[:10] == dt


def la_stamp(iso: str) -> str:
    try:
        d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return ""
    return d.strftime("%Y-%m-%d %H:%M")


def f12(iso: str) -> str:
    try:
        d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return "--"
    h = d.hour % 12 or 12
    ap = "AM" if d.hour < 12 else "PM"
    return f"{h}:{d.minute:02d} {ap}"


def day_of_week(dt: str) -> str:
    d = datetime.strptime(dt, "%Y-%m-%d")
    return d.strftime("%A")


def clean_mfr(mfr: str | None) -> str | None:
    if not mfr or mfr.strip() in ("", "--"):
        return None
    return mfr.strip()


def supp_wikilink(mfr: str | None, name: str | None) -> str:
    p = (name or "").strip()
    m = clean_mfr(mfr)
    if m and p:
        return f"[[{m} {p}]]"
    if p:
        return f"[[{p}]]"
    return "[[Unknown]]"


def food_category_key(nm: str | None) -> str:
    if nm and nm in FOOD_CATEGORY_KEYS:
        return FOOD_CATEGORY_KEYS[nm]
    slug = re.sub(r"[^a-z0-9]+", "_", (nm or "").lower()).strip("_")
    return slug or "other"


def empty_food_categories() -> dict[str, float]:
    return {v: 0.0 for v in FOOD_CATEGORY_KEYS.values()}


def time_sort_key(t: str) -> int:
    m = re.match(r"^(\d{1,2}):(\d{2})\s*(AM|PM)$", str(t or ""), re.I)
    if not m:
        return 0
    h, minute, ap = int(m.group(1)), int(m.group(2)), m.group(3).upper()
    if ap == "PM" and h != 12:
        h += 12
    if ap == "AM" and h == 12:
        h = 0
    return h * 60 + minute


def build_payload(state: dict[str, Any], dt: str) -> dict[str, Any]:
    sm = {x["id"]: x for x in state.get("sm", [])}
    sch = {x["id"]: x for x in state.get("sch", [])}
    fd = {x["id"]: x for x in state.get("fd", [])}
    acts = {x["id"]: x for x in state.get("acts", [])}

    sle = sorted(
        [e for e in state.get("sl", []) if on_log_day(e.get("dt"), dt)],
        key=lambda e: e.get("dt", ""),
    )
    supplements_logged = []
    for e in sle:
        sc = sch.get(e.get("sid", ""), {})
        m = sm.get(sc.get("mid", ""), {})
        supplements_logged.append(
            {
                "time": f12(e["dt"]),
                "manufacturer": clean_mfr(m.get("mfr")),
                "name": supp_wikilink(m.get("mfr"), m.get("name")),
                "qty": e.get("qty", 0),
                "units": m.get("units"),
            }
        )

    water_entries = sorted(
        [e for e in state.get("wl", []) if on_log_day(e.get("dt"), dt)],
        key=lambda e: e.get("dt", ""),
    )
    water_logged = [
        {
            "logged_at": la_stamp(e.get("la", e.get("dt", ""))),
            "time": f12(e["dt"]),
            "qty_oz": e.get("qty", 0),
            "notes": (e.get("nt") or None) if e.get("nt") else None,
        }
        for e in water_entries
    ]
    total_water = round(sum(float(e.get("qty") or 0) for e in water_entries))

    food_entries = sorted(
        [
            e
            for e in state.get("fl", [])
            if on_log_day(e.get("dt"), dt) and e.get("fid") != "__meal__"
        ],
        key=lambda e: e.get("dt", ""),
    )
    food_logged = []
    food_categories_served = empty_food_categories()
    for e in food_entries:
        f = fd.get(e.get("fid", ""), {})
        item = f.get("nm", "Unknown")
        qty = float(e.get("qty") or 0)
        food_logged.append(
            {
                "logged_at": la_stamp(e.get("la", e.get("dt", ""))),
                "time": f12(e["dt"]),
                "item": item,
                "servings": qty,
                "notes": (e.get("nt") or None) if e.get("nt") else None,
            }
        )
        key = food_category_key(item)
        food_categories_served.setdefault(key, 0.0)
        food_categories_served[key] = round(food_categories_served[key] + qty, 3)

    gi_events: list[dict[str, Any]] = []
    lifestyle_protocols: list[dict[str, Any]] = []
    for e in sorted(
        [x for x in state.get("al", []) if on_log_day(x.get("dt"), dt)],
        key=lambda x: x.get("dt", ""),
    ):
        act = acts.get(e.get("aid", ""), {})
        typ = act.get("nm", "Other")
        tm = f12(e["dt"])
        ls = la_stamp(e.get("la", e.get("dt", "")))
        flds = e.get("flds") or {}
        if typ == "Bowel Health":
            status = next((v for v in flds.values() if v not in (None, "")), None)
            if status:
                gi_events.append({"time": tm, "logged_at": ls, "status": str(status)})
            continue
        if typ in ("Cold Plunge", "Sauna"):
            lifestyle_protocols.append(
                {
                    "type": typ,
                    "time": tm,
                    "logged_at": ls,
                    "duration_minutes": _num(flds.get("Duration") or flds.get("duration")),
                    "temperature_f": _num(flds.get("Temperature") or flds.get("temperature")),
                }
            )
            continue
        lifestyle_protocols.append(
            {
                "type": typ,
                "time": tm,
                "logged_at": ls,
                "fields": flds,
                "notes": e.get("nt") or None,
            }
        )

    supplement_notes = [
        {
            "time": f12(n["dt"]),
            "logged_at": la_stamp(n.get("la", n.get("dt", ""))),
            "note": n.get("bd", ""),
        }
        for n in state.get("snotes", [])
        if on_log_day(n.get("dt"), dt)
    ]

    meals_executed = [
        (e.get("mnm") or "")
        + (f" -- {e['nt']}" if e.get("nt") else "")
        for e in state.get("fl", [])
        if on_log_day(e.get("dt"), dt) and e.get("fid") == "__meal__"
    ]

    return {
        "date": dt,
        "day_of_week": day_of_week(dt),
        "total_water_intake_oz": total_water,
        "subjective_scores": {
            "cns_fatigue_present": False,
            "racing_mind_present": False,
            "cognitive_clarity_score_1_to_5": None,
        },
        "gastrointestinal_tracking": {
            "total_movements": len(gi_events),
            "highest_bristol_type": None,
            "urgent_or_watery_present": any(
                re.search(r"watery|loose", ev.get("status", ""), re.I) for ev in gi_events
            ),
            "events": gi_events,
        },
        "lifestyle_protocols": lifestyle_protocols,
        "supplement_notes": supplement_notes,
        "meals_executed": meals_executed,
        "supplements_logged": supplements_logged,
        "water_logged": water_logged,
        "food_logged": food_logged,
        "food_categories_served": food_categories_served,
    }


def _num(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def build_markdown_top(state: dict[str, Any], dt: str, payload: dict[str, Any]) -> str:
    lines = [
        f"# {payload['day_of_week']} — {dt}",
        "",
        "## 📝 Subjective Notes & Food Logs",
        "* **Supplement & Food Notes:**",
    ]

    by_time: dict[str, list[str]] = {}
    sm = {x["id"]: x for x in state.get("sm", [])}
    sch = {x["id"]: x for x in state.get("sch", [])}
    for e in sorted(
        [x for x in state.get("sl", []) if on_log_day(x.get("dt"), dt)],
        key=lambda x: x.get("dt", ""),
    ):
        sc = sch.get(e.get("sid", ""), {})
        m = sm.get(sc.get("mid", ""), {})
        tm = f12(e["dt"])
        part = (
            f"{supp_wikilink(m.get('mfr'), m.get('name'))} {e.get('qty')} {m.get('units', '')}"
            + (" (skipped)" if e.get("sk") else "")
        ).strip()
        by_time.setdefault(tm, []).append(part)

    chron: list[tuple[int, str]] = []
    for tm in sorted(by_time, key=time_sort_key):
        chron.append((time_sort_key(tm), f"**{tm}:** " + "; ".join(by_time[tm]) + "."))

    for w in payload["water_logged"]:
        if w.get("notes") and re.search(r"supplement", str(w["notes"]), re.I):
            continue
        chron.append(
            (time_sort_key(w["time"]), f"**{w['time']}:** water {w['qty_oz']} oz.")
        )

    food_by_time: dict[str, list[str]] = {}
    for f in payload["food_logged"]:
        food_by_time.setdefault(f["time"], []).append(f"{f['item']} {f['servings']}")
    for tm, items in food_by_time.items():
        chron.append((time_sort_key(tm), f"**{tm}:** " + ", ".join(items) + "."))

    for n in payload["supplement_notes"]:
        chron.append((time_sort_key(n["time"]), f"**{n['time']}:** {n['note']}"))

    for e in state.get("ind", []):
        if on_log_day(e.get("dt"), dt):
            tm = f12(e["dt"])
            chron.append(
                (
                    time_sort_key(tm),
                    f"**{tm}:** indulgence — {e.get('txt', '')}"
                    + (f" ({e['nt']})" if e.get("nt") else ""),
                )
            )

    for n in state.get("fnotes", []):
        if on_log_day(n.get("dt"), dt):
            tm = f12(n["dt"])
            chron.append((time_sort_key(tm), f"**{tm}:** food note — {n.get('bd', '')}"))

    for n in state.get("notes", []):
        if on_log_day(n.get("dt"), dt):
            tm = f12(n["dt"])
            chron.append((time_sort_key(tm), f"**{tm}:** {n.get('bd', '')}"))

    chron.sort(key=lambda x: x[0])
    if chron:
        lines.extend(f"    * {text}" for _, text in chron)
    else:
        lines.append("    * (none)")

    if payload["total_water_intake_oz"]:
        lines.append(
            f"    * **Water today:** {payload['total_water_intake_oz']} oz total."
        )

    lines.append("* **Meals executed:**")
    if payload["meals_executed"]:
        lines.extend(f"    * {m}" for m in payload["meals_executed"])
    else:
        lines.append("    * (none)")

    lines.extend(
        [
            "",
            "## ⚠️ Internal Triggers & Biometric Realities",
        ]
    )
    bowel = "; ".join(
        f"{e['time']} {e['status']}" for e in payload["gastrointestinal_tracking"]["events"]
    )
    lines.append("* **Bowel Health:**" + (f" {bowel}." if bowel else " (none)"))

    life_parts = []
    for p in payload["lifestyle_protocols"]:
        if p.get("type") in ("Cold Plunge", "Sauna"):
            dur = p.get("duration_minutes")
            temp = p.get("temperature_f")
            seg = p["type"] + " " + p["time"]
            if dur is not None:
                seg += f" — {dur} min"
            if temp is not None:
                seg += f" @ {temp}°F"
            life_parts.append(seg)
        else:
            seg = f"{p['type']} {p['time']}"
            if p.get("notes"):
                seg += f" — {p['notes']}"
            life_parts.append(seg)
    lines.append(
        "* **Lifestyle Elements:**"
        + (" " + "; ".join(life_parts) + "." if life_parts else " (none)")
    )
    return "\n".join(lines)


def generate_daily_log(state: dict[str, Any], dt: str) -> str:
    payload = build_payload(state, dt)
    top = build_markdown_top(state, dt, payload)
    return top + "\n\n---\n\n```json\n" + json.dumps(payload, indent=2) + "\n```\n"


def collect_dates(state: dict[str, Any]) -> list[str]:
    dates: set[str] = set()
    for key in ("sl", "wl", "fl", "al", "ind", "snotes", "fnotes", "notes"):
        for e in state.get(key, []):
            if e.get("dt"):
                dates.add(str(e["dt"])[:10])
    return sorted(dates)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate hybrid Daily Log .md files from a tracker backup."
    )
    parser.add_argument(
        "backup",
        type=Path,
        help="Path to DT_Backup_*.json or raw localStorage export",
    )
    parser.add_argument(
        "--date",
        help="YYYY-MM-DD (default: all dates with log entries)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data"),
        help="Directory for output .md files (default: data/)",
    )
    args = parser.parse_args()

    state = json.loads(args.backup.read_text(encoding="utf-8"))
    dates = [args.date] if args.date else collect_dates(state)
    if not dates:
        print("No log dates found in backup.", file=sys.stderr)
        return 1

    args.output_dir.mkdir(parents=True, exist_ok=True)
    for dt in dates:
        out = args.output_dir / f"{dt}.md"
        out.write_text(generate_daily_log(state, dt), encoding="utf-8")
        print(f"Wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
