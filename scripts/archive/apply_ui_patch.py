#!/usr/bin/env python3
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "index.html"
t = p.read_text()

repls = [
    (
        "<motion class=\"bs\" onclick=\"oH('supps')\">History</motion></motion>",
        "<motion class=\"bs\" onclick=\"oH('supps')\">History</motion><motion class=\"bs b\" onclick=\"oSuppCatalog()\">Search catalog</motion></motion>",
    ),
]
# Fix: use div
repls = [
    (
        "<motion class=\"bs\" onclick=\"oH('supps')\">History</motion></motion>",
        "REPLACEME",
    ),
]

PY