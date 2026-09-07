"""Fetch iCal feeds (RealtyCalendar, Avito, Sutochno etc.) for every house
in data/content.json and write occupied nights to data/bookings.json.

Nights are stored as YYYY-MM-DD strings: a night is the date of check-in
through the day before check-out (DTEND in iCal is exclusive).
"""
import json
import re
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
content = json.loads((ROOT / "data" / "content.json").read_text(encoding="utf-8"))
out_path = ROOT / "data" / "bookings.json"
old = {}
if out_path.exists():
    try:
        old = json.loads(out_path.read_text(encoding="utf-8")).get("houses", {})
    except Exception:
        old = {}


def parse_date(v):
    v = v.strip()
    m = re.match(r"(\d{4})(\d{2})(\d{2})", v)
    if not m:
        return None
    return date(int(m[1]), int(m[2]), int(m[3]))


def nights_from_ical(text):
    nights = set()
    text = text.replace("\r\n ", "").replace("\n ", "")
    for block in re.findall(r"BEGIN:VEVENT(.*?)END:VEVENT", text, re.S):
        s = re.search(r"DTSTART[^:]*:(\S+)", block)
        e = re.search(r"DTEND[^:]*:(\S+)", block)
        if not s or not e:
            continue
        ds, de = parse_date(s[1]), parse_date(e[1])
        if not ds or not de:
            continue
        if re.search(r"STATUS:CANCELLED", block):
            continue
        d = ds
        while d < de:
            nights.add(d.isoformat())
            d += timedelta(days=1)
    return nights


result = {}
cutoff = (date.today() - timedelta(days=7)).isoformat()
for h in content.get("houses", []):
    hid = h["id"]
    urls = [u.strip() for u in re.split(r"[\s,]+", h.get("icalUrl") or "") if u.strip()]
    if not urls:
        continue
    nights = set()
    ok = False
    for u in urls:
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "gelaland-sync/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                nights |= nights_from_ical(r.read().decode("utf-8", "ignore"))
            ok = True
        except Exception as ex:  # keep old data for this house on failure
            print(f"{hid}: failed {u}: {ex}")
    if ok:
        result[hid] = sorted(n for n in nights if n >= cutoff)
    elif hid in old:
        result[hid] = old[hid]

out = {"updated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"), "houses": result}
out_path.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print(json.dumps({k: len(v) for k, v in result.items()}))
