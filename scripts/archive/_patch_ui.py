#!/usr/bin/env python3
"""One-off patch script — run once then delete."""
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "index.html"
t = p.read_text()

# --- HTML: supps tab ---
t = t.replace(
    '<motion class="bs" onclick="oH(\'supps\')">History</motion></motion>\n  <motion id="sGrps">',
    '<motion class="bs" onclick="oH(\'supps\')">History</motion><motion class="bs b" onclick="oSuppCatalog()">Search catalog</motion></motion>\n  <motion id="sAdhoc"></motion>\n  <motion id="sGrps">',
)
t = t.replace(
    '<div class="bs" onclick="oH(\'supps\')">History</motion></motion>\n  <motion id="sGrps">',
    '<div class="bs" onclick="oH(\'supps\')">History</motion><motion class="bs b" onclick="oSuppCatalog()">Search catalog</motion></motion>\n  <motion id="sAdhoc"></motion>\n  <motion id="sGrps">',
)
# correct div version
t = t.replace(
    "onclick=\"oH('supps')\">History</div></div>\n  <div id=\"sGrps\">",
    "onclick=\"oH('supps')\">History</motion><motion class=\"bs b\" onclick=\"oSuppCatalog()\">Search catalog</motion></motion>\n  <motion id=\"sAdhoc\"></motion>\n  <motion id=\"sGrps\">",
)
t = t.replace(
    "onclick=\"oH('supps')\">History</motion></motion>\n  <motion id=\"sGrps\">",
    "onclick=\"oH('supps')\">History</motion><motion class=\"bs b\" onclick=\"oSuppCatalog()\">Search catalog</motion></motion>\n  <motion id=\"sAdhoc\"></motion>\n  <motion id=\"sGrps\">",
)
# ACTUAL
t = t.replace(
    "onclick=\"oH('supps')\">History</div></motion>\n  <motion id=\"sGrps\">",
    "onclick=\"oH('supps')\">History</motion><motion class=\"bs b\" onclick=\"oSuppCatalog()\">Search catalog</motion></motion>\n  <motion id=\"sAdhoc\"></motion>\n  <motion id=\"sGrps\">",
)

PY