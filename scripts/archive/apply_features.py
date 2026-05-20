#!/usr/bin/env python3
from pathlib import Path

p = Path(__file__).resolve().parent.parent / "index.html"
t = p.read_text()
T = "motion"
T = "motion"  # noqa — real tag below
T = chr(100) + chr(105) + chr(118)  # div


def sub(old, new, name):
    global t
    if old not in t:
        raise SystemExit(f"MISSING [{name}]")
    t = t.replace(old, new, 1)
    print("ok", name)


# Settings purge
sub(
    f'  <{T} class="sh"><{T} class="sl">Backup and Restore</{T}></{T}>\n  <{T} class="card">',
    f'  <{T} class="sh"><{T} class="sl">Data</{T}></{T}>\n  <{T} class="card">\n'
    f'    <{T} class="set-row" onclick="purgeLogsBeforeToday()" style="cursor:pointer"><{T} class="mii"><{T} class="mn">Clear logs before today</{T}>'
    f'<{T} class="mm">Removes water, supplements, food, other, and notes for past days. Keeps catalog, schedule, and settings.</{T}></{T}>'
    f'<{T} style="color:var(--rd);font-size:18px">&#8250;</{T}></{T}>\n  </{T}>\n'
    f'  <{T} class="sh"><{T} class="sl">Backup and Restore</{T}></{T}>\n  <{T} class="card">',
    "settings-purge",
)

lp = (
    f'<{T} class="ov" id="ovListPick"><{T} class="sht"><{T} class="sht-body"><{T} class="hdl"></{T}>'
    f'<{T} class="stl" id="lpT">Choose</{T}><input type="text" class="srch-inp" id="lpSrch" placeholder="Search..." autocomplete="off">'
    f'<{T} id="lpL"></{T}><{T} style="height:8px"></{T}></{T}><{T} class="sa">'
    f'<button class="bcn" style="width:100%;flex:1" onclick="popOv()">Cancel</button></{T}></{T}></{T}>\n\n'
)
sub(f'<{T} class="ov" id="ovSetDrive">', lp + f'<{T} class="ov" id="ovSetDrive">', "ovListPick")

sub(
    f'<{T} class="ov" id="ovMS"><{T} class="sht"><{T} class="sht-body"><{T} class="hdl"></{T}><{T} class="stl">Manage Supplements</{T}>'
    f'<{T} class="ssb">Tap a row to edit</{T}><{T} id="msL"></{T}><{T} class="adr" onclick="oESM(null)">+ Add Supplement</{T}>',
    f'<{T} class="ov" id="ovMS"><{T} class="sht"><{T} class="sht-body"><{T} class="hdl"></{T}><{T} class="stl">Manage Supplements</{T}>'
    f'<{T} class="ssb">Tap a row to edit · sorted A–Z</{T}><{T} class="adr" onclick="oESM(null)">+ Add Supplement</{T}>'
    f'<input type="text" class="srch-inp" id="msSearch" placeholder="Search supplements..." oninput="rMSL()" autocomplete="off">'
    f'<{T} id="msL"></{T}>',
    "ovMS",
)

for lid, onclick, label in [
    ("mscL", "oESC(null)", "+ Add Entry"),
    ("mfgrpL", "addFoodGroup()", "+ Add Group"),
    ("msgrpL", "addSuppGroup()", "+ Add Group"),
    ("mfL", "oEFI(null)", "+ Add Food Item"),
    ("mmL", "oEM(null)", "+ Add Meal"),
    ("maL", "oEAT(null)", "+ Add New Type"),
]:
    sub(
        f'<{T} id="{lid}"></{T}><{T} class="adr" onclick="{onclick}">{label}</{T}>',
        f'<{T} class="adr" onclick="{onclick}">{label}</{T}><{T} id="{lid}"></{T}>',
        f"adr-{lid}",
    )

esc_old = (
    f'<{T} class="fld"><{T} class="fl">Supplement</{T}><select id="escSI" onchange="rEscUnitsHint()"></select>'
    f'<{T} class="mm" id="escUnitsHint" style="margin-top:4px;min-height:14px"></{T}></{T}>'
    f'<{T} class="fld"><{T} class="fl">Group</{T}><select id="escGr"></select></{T}>'
)
esc_new = (
    f'<{T} class="fld"><{T} class="fl">Supplement</{T}><button type="button" class="pick-btn" id="escSIBtn" onclick="pickEscSupp()">'
    f'<span id="escSILbl">— select supplement —</span></button><input type="hidden" id="escSI">'
    f'<{T} class="mm" id="escUnitsHint" style="margin-top:4px;min-height:14px"></{T}></{T}>'
    f'<{T} class="fld"><{T} class="fl">Group</{T}><button type="button" class="pick-btn" id="escGrBtn" onclick="pickEscGrp()">'
    f'<span id="escGrLbl">— select group —</span></button><input type="hidden" id="escGr"></{T}>'
)
sub(esc_old, esc_new, "ovESC")

sub(
    f'<{T} class="fld"><{T} class="fl">Group</{T}><select id="efiSc"></select></{T}>',
    f'<{T} class="fld"><{T} class="fl">Group</{T}><button type="button" class="pick-btn" id="efiScBtn" onclick="pickEfiGrp()">'
    f'<span id="efiScLbl">— select group —</span></button><input type="hidden" id="efiSc"></{T}>',
    "ovEFI",
)

p.write_text(t)
print("HTML patches done", len(t))
