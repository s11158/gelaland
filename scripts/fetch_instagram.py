"""One-off: download full-size cover images for GelaLand Instagram posts.

Uses the public /p/<code>/media/?size=l endpoint, which redirects to the
CDN without any signed query string.
"""
import pathlib
import urllib.request

CODES = [
    "DDmS5pFNPM-", "CwhROy-rUgN", "CnZnYUSN6ug", "CllJGi9AwA4",
    "CkLV5uvjQug", "Cj276HqjYD5", "Cj24oUZjwNb", "CiUb5cugg3L",
    "CiUUIjADmKf", "CaT1E8HK1dM", "CZ4TE5Wqwm1", "CZ1L2nBr7GF",
    "CZjhO67r5sM",
]
OUT = pathlib.Path(__file__).resolve().parent.parent / "img"

for n, code in enumerate(CODES, 1):
    dest = OUT / f"insta{n}.jpg"
    if dest.exists() and dest.stat().st_size > 20000:
        continue
    url = f"https://www.instagram.com/p/{code}/media/?size=l"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=40).read()
        if len(data) < 5000:
            print("too small", code, len(data))
            continue
        dest.write_bytes(data)
        print(f"insta{n}.jpg  {len(data) // 1024} KB  {code}")
    except Exception as ex:
        print("fail", code, ex)
