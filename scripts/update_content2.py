"""One-off: add videos, Instagram gallery and the default WhatsApp text to content.json."""
import json
import pathlib

p = pathlib.Path(__file__).resolve().parent.parent / "data" / "content.json"
C = json.loads(p.read_text(encoding="utf-8"))

C["site"]["waMessage"] = "Добрый день, пишу Вам с сайта можно ли узнать о бронировании"
C["site"].pop("videoUrls", None)

C["videos"] = {
    "title": "Как это выглядит вживую",
    "text": "Два коротких видео с территории: берег, дома и наши животные.",
    "items": [
        {"file": "gelaland1.mp4", "poster": "gelaland1_poster.jpg", "caption": "Прогулка по территории"},
        {"file": "gelaland2.mp4", "poster": "gelaland2_poster.jpg", "caption": "Волга и берег"},
    ],
}

C["instagram"] = {
    "title": "Мы в Instagram",
    "text": "Живая лента: сезоны, животные, гости и новые домики. Заходите и пишите в директ.",
    "handle": "@gela.land",
    "url": "https://www.instagram.com/gela.land/",
    "photos": [f"insta{i}.jpg" for i in range(1, 14)] + [f"ig{i}.jpg" for i in (1, 2, 10, 11, 12)],
}

p.write_text(json.dumps(C, ensure_ascii=False, indent=2), encoding="utf-8")
print("videos:", len(C["videos"]["items"]), "| instagram photos:", len(C["instagram"]["photos"]))
