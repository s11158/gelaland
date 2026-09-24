"""Technical SEO health check for gelaland.ru.

Runs standalone: checks the live site, refreshes sitemap lastmod, appends a row
to docs/seo-history.csv and prints a short report.
"""
import csv
import datetime
import json
import re
import ssl
import urllib.error
import urllib.request
from pathlib import Path

SITE = "https://gelaland.ru"
ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
DOCS.mkdir(exist_ok=True)
HISTORY = DOCS / "seo-history.csv"
UA = {"User-Agent": "Mozilla/5.0 (compatible; gelaland-seo-check/1.0)"}

problems = []
notes = []


def fetch(path, timeout=30):
    url = path if path.startswith("http") else SITE + path
    req = urllib.request.Request(url, headers=UA)
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
        return r.status, r.read(), dict(r.headers)


def head_status(url):
    try:
        req = urllib.request.Request(url, headers=UA, method="GET")
        opener = urllib.request.build_opener(NoRedirect)
        with opener.open(req, timeout=20) as r:
            return r.status, r.headers.get("Location", "")
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Location", "")
    except Exception as e:
        return 0, str(e)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


# --- main page ---
try:
    status, body, headers = fetch("/")
    html = body.decode("utf-8", "ignore")
except Exception as e:
    print("САЙТ НЕДОСТУПЕН:", e)
    raise SystemExit(1)

if status != 200:
    problems.append(f"главная отдаёт {status}")

page_kb = len(body) // 1024

title = re.search(r"<title>(.*?)</title>", html, re.S)
title = title.group(1).strip() if title else ""
desc = re.search(r'<meta name="description" content="(.*?)"', html, re.S)
desc = desc.group(1).strip() if desc else ""
h1 = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
h1 = re.sub(r"<[^>]+>", "", h1.group(1)).strip() if h1 else ""

if not title:
    problems.append("нет title")
elif len(title) < 20:
    notes.append(f"title короткий ({len(title)} симв.): {title}")
if not desc:
    problems.append("нет description")
elif not (60 <= len(desc) <= 180):
    notes.append(f"description {len(desc)} симв., оптимум 60-180")
if not h1:
    problems.append("нет H1")

# --- structured data ---
schema_ok = False
ld = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
if ld:
    try:
        data = json.loads(ld.group(1))
        schema_ok = True
        if "aggregateRating" not in data:
            notes.append("в разметке нет aggregateRating")
    except Exception as e:
        problems.append(f"разметка schema.org не парсится: {e}")
else:
    problems.append("нет разметки schema.org")

# --- robots and sitemap ---
robots_ok = sitemap_ok = False
try:
    s, b, _ = fetch("/robots.txt")
    robots_ok = s == 200 and b"Sitemap:" in b
except Exception:
    pass
if not robots_ok:
    problems.append("robots.txt недоступен или без Sitemap")

try:
    s, b, _ = fetch("/sitemap.xml")
    sitemap_ok = s == 200 and b"<urlset" in b
except Exception:
    pass
if not sitemap_ok:
    problems.append("sitemap.xml недоступен")

# --- redirects ---
for url, label in ((SITE.replace("https", "http"), "http"), ("https://www.gelaland.ru/", "www")):
    code, loc = head_status(url)
    if code not in (301, 308):
        notes.append(f"{label} отдаёт {code}, ожидался 301")

# --- assets referenced by the page ---
assets = sorted({a for a in re.findall(r'(?:src|href)="((?:img|video|data)/[^"]+)"', html)
                 if "$" not in a and "{" not in a})
broken = []
for a in assets[:40]:
    try:
        s, _, _ = fetch("/" + a, timeout=20)
        if s != 200:
            broken.append(f"{a}:{s}")
    except Exception:
        broken.append(a)
if broken:
    problems.append("битые файлы: " + ", ".join(broken[:5]))

# --- content volume ---
try:
    _, b, _ = fetch("/data/content.json")
    C = json.loads(b.decode("utf-8"))
    reviews = [r for r in C.get("reviews", []) if not r.get("hidden")]
    houses = [h for h in C.get("houses", []) if h.get("active") is not False]
    photos = len(set(re.findall(r'"([A-Za-z0-9_.-]+\.(?:webp|jpg|png))"', b.decode("utf-8"))))
    show_prices = C.get("site", {}).get("showPrices", False)
except Exception as e:
    reviews, houses, photos, show_prices = [], [], 0, None
    problems.append(f"content.json не читается: {e}")

words = len(re.sub(r"<[^>]+>", " ", html).split())

# --- refresh sitemap lastmod ---
today = datetime.date.today().isoformat()
sm = ROOT / "sitemap.xml"
if sm.exists():
    text = sm.read_text(encoding="utf-8")
    if "<lastmod>" in text:
        text = re.sub(r"<lastmod>[^<]*</lastmod>", f"<lastmod>{today}</lastmod>", text)
    else:
        text = text.replace("<loc>https://gelaland.ru/</loc>",
                            f"<loc>https://gelaland.ru/</loc>\n    <lastmod>{today}</lastmod>")
    sm.write_text(text, encoding="utf-8")

# --- history ---
row = {
    "date": today,
    "status": status,
    "page_kb": page_kb,
    "words": words,
    "houses": len(houses),
    "reviews": len(reviews),
    "photos": photos,
    "schema": int(schema_ok),
    "robots": int(robots_ok),
    "sitemap": int(sitemap_ok),
    "broken": len(broken),
    "show_prices": int(bool(show_prices)),
    "problems": "; ".join(problems),
}
new = not HISTORY.exists()
with HISTORY.open("a", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(row))
    if new:
        w.writeheader()
    w.writerow(row)

print(f"дата: {today}")
print(f"главная: {status}, {page_kb} КБ, {words} слов")
print(f"title ({len(title)}): {title}")
print(f"description ({len(desc)}): {desc[:90]}")
print(f"H1: {h1}")
print(f"schema.org: {'есть' if schema_ok else 'НЕТ'} | robots: {'есть' if robots_ok else 'НЕТ'} | sitemap: {'есть' if sitemap_ok else 'НЕТ'}")
print(f"домов: {len(houses)} | отзывов: {len(reviews)} | фото: {photos} | цены показаны: {'да' if show_prices else 'нет'}")
print(f"проверено файлов: {len(assets[:40])}, битых: {len(broken)}")
if problems:
    print("\nПРОБЛЕМЫ:")
    for p in problems:
        print(" -", p)
if notes:
    print("\nЗамечания:")
    for n in notes:
        print(" -", n)
if not problems and not notes:
    print("\nВсё в порядке.")
print(f"\nистория: {HISTORY}")
