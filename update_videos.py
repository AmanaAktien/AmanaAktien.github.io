import os
import json
import requests
import xml.etree.ElementTree as ET
from dateutil import parser
from typing import List, Dict

# ─────────────────────────────────────────────
# KONFIGURATION
# ─────────────────────────────────────────────
CHANNEL_ID = os.getenv("YOUTUBE_CHANNEL_ID", "UC_DEINE_ECHTE_ID")
VIDEOS_JSON_PATH = "videos.json"
MAX_VIDEOS = 20
REQUEST_TIMEOUT = 10

RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"

# ─────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────
def log(msg: str):
    print(f"[INFO] {msg}")

def log_error(msg: str):
    print(f"[ERROR] {msg}")

# ─────────────────────────────────────────────
# DATEI HANDLING
# ─────────────────────────────────────────────
def load_existing_videos() -> List[Dict]:
    if not os.path.exists(VIDEOS_JSON_PATH):
        log("videos.json nicht gefunden – erstelle neu")
        return []

    try:
        with open(VIDEOS_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            log("Ungültiges Format – wird zurückgesetzt")
            return []
    except Exception as e:
        log_error(f"Fehler beim Laden: {e}")
        return []

def save_videos(videos: List[Dict]):
    try:
        with open(VIDEOS_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(videos, f, indent=2, ensure_ascii=False)
        log(f"{len(videos)} Videos gespeichert")
    except Exception as e:
        log_error(f"Fehler beim Speichern: {e}")
        exit(1)

# ─────────────────────────────────────────────
# RSS FETCH
# ─────────────────────────────────────────────
def fetch_rss() -> str:
    try:
        log(f"Lade RSS Feed für Channel {CHANNEL_ID}")
        response = requests.get(RSS_URL, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        log_error(f"RSS Fehler: {e}")
        exit(1)

# ─────────────────────────────────────────────
# PARSING
# ─────────────────────────────────────────────
def parse_rss(xml_data: str) -> List[Dict]:
    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015"
    }

    videos = []

    try:
        root = ET.fromstring(xml_data)
    except Exception as e:
        log_error(f"XML Parsing Fehler: {e}")
        return []

    for entry in root.findall("atom:entry", ns):
        try:
            vid = entry.find("yt:videoId", ns)
            title = entry.find("atom:title", ns)
            published = entry.find("atom:published", ns)

            if not (vid and title and published):
                continue

            published_dt = parser.parse(published.text)

            videos.append({
                "id": vid.text.strip(),
                "title": title.text.strip(),
                "url": f"https://www.youtube.com/watch?v={vid.text.strip()}",
                "published": published_dt.isoformat()
            })

        except Exception:
            continue

    log(f"{len(videos)} Videos aus RSS geladen")
    return videos

# ─────────────────────────────────────────────
# MERGE & LOGIK
# ─────────────────────────────────────────────
def merge_videos(old: List[Dict], new: List[Dict]) -> (List[Dict], int):
    existing_ids = {v["id"] for v in old}
    added = 0

    for video in new:
        if video["id"] not in existing_ids:
            old.append(video)
            added += 1

    return old, added

def sort_and_limit(videos: List[Dict]) -> List[Dict]:
    videos.sort(key=lambda x: x["published"], reverse=True)
    return videos[:MAX_VIDEOS]

def has_changes(old: List[Dict], new: List[Dict]) -> bool:
    return json.dumps(old, sort_keys=True) != json.dumps(new, sort_keys=True)

# ─────────────────────────────────────────────
# HAUPTPROGRAMM
# ─────────────────────────────────────────────
def main():
    log("Starte Video Update")

    old_videos = load_existing_videos()
    xml_data = fetch_rss()
    new_videos = parse_rss(xml_data)

    if not new_videos:
        log("Keine Videos geladen – Abbruch")
        return

    merged, added = merge_videos(old_videos, new_videos)
    final_videos = sort_and_limit(merged)

    if not has_changes(old_videos, final_videos):
        log("Keine Änderungen erkannt – kein Update nötig")
        return

    save_videos(final_videos)

    log(f"Neue Videos hinzugefügt: {added}")
    log("Update abgeschlossen")

# ─────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    main()
