"""Convert site photos to WebP and rewrite the references in content.json and index.html.

JPEG originals are removed once a smaller WebP exists, so the repository keeps
one copy of each photo.
"""
import json
import pathlib
import re

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "img"
MAX_SIDE = 1600
QUALITY = 82

renamed = {}
saved_before = saved_after = 0

for src in sorted(IMG.glob("*.jpg")) + sorted(IMG.glob("*.jpeg")) + sorted(IMG.glob("*.png")):
    dest = src.with_suffix(".webp")
    if dest.exists():
        continue
    try:
        im = Image.open(src)
        im = im.convert("RGB")
        if max(im.size) > MAX_SIDE:
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        im.save(dest, "WEBP", quality=QUALITY, method=6)
    except Exception as ex:
        print("fail", src.name, ex)
        continue
    before, after = src.stat().st_size, dest.stat().st_size
    if after >= before:
        dest.unlink()
        continue
    saved_before += before
    saved_after += after
    renamed[src.name] = dest.name
    src.unlink()

# rewrite references
content = ROOT / "data" / "content.json"
text = content.read_text(encoding="utf-8")
for old, new in renamed.items():
    text = text.replace(f'"{old}"', f'"{new}"')
content.write_text(text, encoding="utf-8")

index = ROOT / "index.html"
html = index.read_text(encoding="utf-8")
for old, new in renamed.items():
    html = html.replace(f"img/{old}", f"img/{new}")
index.write_text(html, encoding="utf-8")

left = [p.name for p in IMG.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png")]
print(f"конвертировано: {len(renamed)}")
print(f"было {saved_before // 1024} KB, стало {saved_after // 1024} KB")
if left:
    print("не тронуты:", left)
