#!/usr/bin/env python3
"""Generate Daily Log Markdown from a Tracker backup (# daily-log-requirements-v2 fenced `yaml journal`)."""

from __future__ import annotations

import argparse
import json
import re
import sys
import yaml
from datetime import datetime, timezone
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


FOOT_FENCE_MARKER = "yaml journal"  # synced with tracker/src/domain/journal-yaml-format.js


def la_stamp(iso: str | None, fallback_iso: str = "") -> str:
    raw = str(iso or fallback_iso).strip()
    if not raw:
        return ""
    try:
        d = datetime.fromisoformat(raw.replace("Z", "+00:00").replace(" ", "T", 1))
    except ValueError:
        return ""
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def prune_sparse_journal(v: Any) -> Any | None:
    """Subset of tracker sparse rule — omit empties before YAML fencing."""
    if v is None:
        return None
    if isinstance(v, str):
        return None if not v.strip() else v
    if isinstance(v, (bool, int, float)):
        return v
    if isinstance(v, list):
        out = []
        for x in v:
            px = prune_sparse_journal(x)
            if px is not None:
                out.append(px)
        return out if out else None
    if isinstance(v, dict):
        out_d: dict[str, Any] = {}
        for k, x in v.items():
            px = prune_sparse_journal(x)
            if px is not None:
                out_d[k] = px
        return out_d if out_d else None
    return None


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


UNIT_SUFFIX = {
    "minutes": "min",
    "minute": "min",
    "mins": "min",
    "min": "min",
    "hours": "hr",
    "hour": "hr",
    "hr": "hr",
    "h": "hr",
    "f": "f",
    "°f": "f",
    "fahrenheit": "f",
}


def tab_visible(tabs: dict[str, Any] | None, tab_id: str) -> bool:
    if tab_id == "settings":
        return True
    t = tabs or {}
    return t.get(tab_id, True) is not False


def export_field_key(field: dict[str, Any]) -> str:
    base = re.sub(r"[^a-z0-9]+", "_", (field.get("nm") or "field").lower()).strip("_")
    u = (field.get("u") or "").strip().lower()
    suf = UNIT_SUFFIX.get(u) or (re.sub(r"[^a-z0-9]+", "_", u).strip("_") if u else "")
    return f"{base}_{suf}" if suf else base


def _slug(nm: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (nm or "").lower()).strip("_")


def normalize_activity_export(flds: dict[str, Any], act: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for ff in act.get("flds") or []:
        nm = ff.get("nm")
        if ff.get("t") == "opts":
            v = flds.get(nm)
            if v not in (None, ""):
                key = _slug(nm) or "activity"
                out[key] = v
            continue
        if ff.get("t") == "number":
            raw = flds.get(nm)
            if raw is None or raw == "":
                for k, val in flds.items():
                    if _slug(k) == _slug(nm):
                        raw = val
                        break
            if raw is None or raw == "":
                continue
            try:
                out[export_field_key(ff)] = float(raw) if not isinstance(raw, str) or ":" not in str(raw) else raw
            except (TypeError, ValueError):
                out[export_field_key(ff)] = raw
    return out


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
    tabs = (state.get("cfg") or {}).get("tabs")

    payload: dict[str, Any] = {"date": dt, "day_of_week": day_of_week(dt)}

    if tab_visible(tabs, "supps"):
        sle = sorted(
            [e for e in state.get("sl", []) if on_log_day(e.get("dt"), dt)],
            key=lambda e: e.get("dt", ""),
        )
        payload["supplements_logged"] = []
        for e in sle:
            sc = sch.get(e.get("sid", ""), {})
            m = sm.get(sc.get("mid", ""), {})
            payload["supplements_logged"].append(
                {
                    "time": f12(e["dt"]),
                    "manufacturer": clean_mfr(m.get("mfr")),
                    "name": supp_wikilink(m.get("mfr"), m.get("name")),
                    "qty": e.get("qty", 0),
                    "units": m.get("units"),
                }
            )
        payload["supplement_notes"] = [
            {
                "time": f12(n["dt"]),
                "logged_at": la_stamp(n.get("la", n.get("dt", ""))),
                "note": n.get("bd", ""),
            }
            for n in state.get("snotes", [])
            if on_log_day(n.get("dt"), dt)
        ]

    if tab_visible(tabs, "water"):
        water_entries = sorted(
            [e for e in state.get("wl", []) if on_log_day(e.get("dt"), dt)],
            key=lambda e: e.get("dt", ""),
        )
        payload["water_logged"] = [
            {
                "logged_at": la_stamp(e.get("la", e.get("dt", ""))),
                "time": f12(e["dt"]),
                "qty_oz": e.get("qty", 0),
                "notes": (e.get("nt") or None) if e.get("nt") else None,
            }
            for e in water_entries
        ]
        total_water = round(sum(float(e.get("qty") or 0) for e in water_entries))
        if total_water:
            payload["total_water_intake_oz"] = total_water

    if tab_visible(tabs, "food"):
        food_entries = sorted(
            [
                e
                for e in state.get("fl", [])
                if on_log_day(e.get("dt"), dt) and e.get("fid") != "__meal__"
            ],
            key=lambda e: e.get("dt", ""),
        )
        payload["food_logged"] = []
        food_categories_served = empty_food_categories()
        for e in food_entries:
            f = fd.get(e.get("fid", ""), {})
            item = f.get("nm", "Unknown")
            qty = float(e.get("qty") or 0)
            payload["food_logged"].append(
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
        payload["food_categories_served"] = food_categories_served
        payload["meals_executed"] = [
            (e.get("mnm") or "")
            + (f" -- {e['nt']}" if e.get("nt") else "")
            for e in state.get("fl", [])
            if on_log_day(e.get("dt"), dt) and e.get("fid") == "__meal__"
        ]

    if tab_visible(tabs, "other"):
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
            row = {"type": typ, "time": tm, "logged_at": ls, **normalize_activity_export(flds, act)}
            if e.get("nt"):
                row["notes"] = e.get("nt")
            lifestyle_protocols.append(row)
        if gi_events:
            payload["gastrointestinal_tracking"] = {
                "total_movements": len(gi_events),
                "urgent_or_watery_present": any(
                    re.search(r"watery|loose", ev.get("status", ""), re.I) for ev in gi_events
                ),
                "events": gi_events,
            }
        payload["lifestyle_protocols"] = lifestyle_protocols

    return payload


def _num(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _lifestyle_md_line(p: dict[str, Any]) -> str:
    skip = {"type", "time", "logged_at", "notes"}
    parts = [p.get("type", ""), p.get("time", "")]
    extras = []
    for k in sorted(p.keys()):
        if k in skip:
            continue
        v = p.get(k)
        if v is None or v == "":
            continue
        extras.append(f"{k.replace('_', ' ')}: {v}")
    seg = " ".join(parts)
    if extras:
        seg += " — " + ", ".join(extras)
    if p.get("notes"):
        seg += " — " + str(p["notes"])
    return seg.strip()


def build_markdown_top(state: dict[str, Any], dt: str, payload: dict[str, Any]) -> str:
    tabs = (state.get("cfg") or {}).get("tabs")
    lines: list[str] = [f"# {payload['day_of_week']} — {dt}", ""]
    chron: list[tuple[int, str]] = []

    if tab_visible(tabs, "supps"):
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
        for tm in sorted(by_time, key=time_sort_key):
            chron.append((time_sort_key(tm), f"**{tm}:** " + "; ".join(by_time[tm]) + "."))
        for n in payload.get("supplement_notes") or []:
            chron.append((time_sort_key(n["time"]), f"**{n['time']}:** {n['note']}"))

    if tab_visible(tabs, "water"):
        for w in payload.get("water_logged") or []:
            if w.get("notes") and re.search(r"supplement", str(w["notes"]), re.I):
                continue
            chron.append(
                (time_sort_key(w["time"]), f"**{w['time']}:** water {w['qty_oz']} oz.")
            )

    if tab_visible(tabs, "food"):
        food_by_time: dict[str, list[str]] = {}
        for f in payload.get("food_logged") or []:
            food_by_time.setdefault(f["time"], []).append(f"{f['item']} {f['servings']}")
        for tm, items in food_by_time.items():
            chron.append((time_sort_key(tm), f"**{tm}:** " + ", ".join(items) + "."))
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

    if tab_visible(tabs, "notes"):
        for n in state.get("notes", []):
            if on_log_day(n.get("dt"), dt):
                tm = f12(n["dt"])
                chron.append((time_sort_key(tm), f"**{tm}:** {n.get('bd', '')}"))

    chron.sort(key=lambda x: x[0])
    has_top = (
        tab_visible(tabs, "supps")
        or tab_visible(tabs, "food")
        or tab_visible(tabs, "notes")
        or tab_visible(tabs, "water")
    )
    if has_top:
        lines.append("## 📝 Subjective Notes & Food Logs")
        lines.append("* **Supplement & Food Notes:**")
        if chron:
            lines.extend(f"    * {text}" for _, text in chron)
        else:
            lines.append("    * (none)")
        if tab_visible(tabs, "water") and payload.get("total_water_intake_oz"):
            lines.append(
                f"    * **Water today:** {payload['total_water_intake_oz']} oz total."
            )
        if tab_visible(tabs, "food"):
            lines.append("* **Meals executed:**")
            meals = payload.get("meals_executed") or []
            if meals:
                lines.extend(f"    * {m}" for m in meals)
            else:
                lines.append("    * (none)")
        lines.append("")

    gi = payload.get("gastrointestinal_tracking")
    life = payload.get("lifestyle_protocols")
    if tab_visible(tabs, "other") and (gi or life):
        lines.append("## ⚠️ Internal Triggers & Biometric Realities")
        if gi and gi.get("events"):
            bowel = "; ".join(f"{e['time']} {e['status']}" for e in gi["events"])
            lines.append(f"* **Bowel Health:** {bowel}.")
        if life:
            life_parts = [_lifestyle_md_line(p) for p in life]
            lines.append("* **Lifestyle Elements:** " + "; ".join(life_parts) + ".")

    return "\n".join(lines).rstrip() + "\n"


def generate_daily_log(state: dict[str, Any], dt: str) -> str:
    payload = build_payload(state, dt)
    top = build_markdown_top(state, dt, payload)
    pruned_raw = prune_sparse_journal(payload)
    pruned = pruned_raw if isinstance(pruned_raw, dict) else {}
    dumped = yaml.safe_dump(
        pruned,
        default_flow_style=False,
        sort_keys=False,
        allow_unicode=True,
    ).rstrip("\n")
    fence = f"```{FOOT_FENCE_MARKER}\n{dumped}\n```\n"
    return top.rstrip() + "\n\n" + fence


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
