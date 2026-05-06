"""
Amana Aktien – update_videos.py  (Production-Ready v3)
=======================================================
Liest den YouTube RSS-Feed, lädt Thumbnails lokal herunter (DSGVO-konform)
und aktualisiert videos.json atomisch.

Kanal: @AmanaAktien | UCjyerJ_TrauvoltIVCFY5Dw
Autor: Youssef Chafi
"""

import os
import re
import json
import logging
import hashlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import TypedDict, List, Dict

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dateutil import parser

# defusedxml als sicherer XML-Parser (verhindert XXE-Angriffe)
try:
    import defusedxml.ElementTree as ET
except ImportError:
    import xml.etree.ElementTree as ET   # Fallback

# ─────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("AmanaAktien")

# ─────────────────────────────────────────────
# TYPEN
# ─────────────────────────────────────────────
class Video(TypedDict):
    id:          str
    title:       str
    url:         str
    published:   str
    date:        str
    views:       str
    duration:    str
    status:      str
    category:    str
    featured:    bool
    thumb_local: str

# ─────────────────────────────────────────────
# KONFIGURATION
# ─────────────────────────────────────────────
CHANNEL_ID       = os.getenv("YOUTUBE_CHANNEL_ID", "UCjyerJ_TrauvoltIVCFY5Dw")
VIDEOS_JSON_PATH = Path("videos.json")
THUMBS_DIR       = Path("img/thumbnails")
MAX_VIDEOS       = 20
REQUEST_TIMEOUT  = 10
UNKNOWN          = "–"
THUMB_PLACEHOLDER = "img/placeholder.jpg"

RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"

# Kategorie-Regeln (Regex, wortgrenzen-sicher)
CATEGORY_RULES: Dict[str, List[str]] = {
    "etf": [
        r"\bETF\b", r"\bETC\b", r"\bSukuk\b", r"\bFonds\b", r"\bFund\b",
        r"\bMSCI\b", r"\bInvesco\b", r"\biShares\b", r"\bAMAL\b",
        r"\bUMMA\b", r"\bXASB\b", r"\bGold\b", r"\bSilber\b", r"\bSilver\b",
        r"\bPhysical\b",
    ],
    "grundlagen": [
        r"\bAnfänger\b", r"\bGrundlagen\b", r"\bGuide\b", r"\bLeitfaden\b",
        r"\bBroker\b", r"\bEinsteiger\b", r"Was ist", r"\bPart\s*1\b",
        r"\bPart\s*2\b", r"Halal-Check\b", r"Ist .* halal",
    ],
}

# ─────────────────────────────────────────────
# HTTP SESSION MIT RETRY
# ─────────────────────────────────────────────
def _build_session() -> requests.Session:
    """Session mit automatischem Retry bei Server-Fehlern."""
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    session.mount("https://", HTTPAdapter(max_retries=retry))
    session.headers.update({"User-Agent": "AmanaAktien-Bot/3.0"})
    return session

SESSION = _build_session()

# ─────────────────────────────────────────────
# HILFSFUNKTIONEN
# ─────────────────────────────────────────────
def get_category(title: str) -> str:
    """Robuste Kategorisierung per Regex."""
    for cat, patterns in CATEGORY_RULES.items():
        for pat in patterns:
            if re.search(pat, title, re.IGNORECASE):
                return cat
    return "aktien"

def format_date(date_str: str) -> str:
    try:
        return parser.parse(date_str).strftime("%d.%m.%Y")
    except Exception:
        return UNKNOWN

def clean_title_for_alt(title: str) -> str:
    """Bereinigt Titel für alt-Attribute – behält arabische Zeichen."""
    # \u0600-\u06FF = arabischer Unicode-Block
    cleaned = re.sub(r"[^\w\s\-–&|:,().!?/\u0600-\u06FF]", "", title, flags=re.UNICODE)
    return re.sub(r"\s+", " ", cleaned).strip()

def _file_hash(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest() if path.exists() else ""

# ─────────────────────────────────────────────
# THUMBNAIL DOWNLOAD (DSGVO-konform, parallel)
# ─────────────────────────────────────────────
def download_thumbnail(video_id: str) -> str:
    """
    Lädt Thumbnail lokal herunter (einmalig, DSGVO-konform).
    Gibt den lokalen Pfad oder THUMB_PLACEHOLDER zurück.
    """
    THUMBS_DIR.mkdir(parents=True, exist_ok=True)
    local_path = THUMBS_DIR / f"{video_id}.jpg"

    if local_path.exists():
        return str(local_path)   # bereits vorhanden

    thumb_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
    try:
        resp = SESSION.get(thumb_url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        local_path.write_bytes(resp.content)
        return str(local_path)
    except Exception as e:
        log.warning(f"  ⚠️  Thumbnail {video_id}: {e}")
        return THUMB_PLACEHOLDER   # sicherer Fallback


def download_thumbnails_parallel(videos: List[Video]) -> None:
    """Lädt alle Thumbnails parallel herunter (schneller)."""
    ids_needing_thumb = [v["id"] for v in videos
                         if not v.get("thumb_local") or not Path(v["thumb_local"]).exists()]
    if not ids_needing_thumb:
        return

    log.info(f"📥 Lade {len(ids_needing_thumb)} Thumbnails parallel…")
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(download_thumbnail, vid_id): vid_id
                   for vid_id in ids_needing_thumb}
        results: Dict[str, str] = {}
        for future in as_completed(futures):
            vid_id = futures[future]
            try:
                results[vid_id] = future.result()
            except Exception as e:
                log.warning(f"  ⚠️  {vid_id}: {e}")
                results[vid_id] = THUMB_PLACEHOLDER

    # Ergebnisse in Videos zurückschreiben
    for video in videos:
        if video["id"] in results:
            video["thumb_local"] = results[video["id"]]

# ─────────────────────────────────────────────
# DATEI HANDLING (atomisches Schreiben)
# ─────────────────────────────────────────────
def load_existing_videos() -> List[Video]:
    if not VIDEOS_JSON_PATH.exists():
        log.info("videos.json nicht gefunden – starte leer")
        return []
    try:
        data = json.loads(VIDEOS_JSON_PATH.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            flat: List[Video] = []
            for cat_videos in data.values():
                if isinstance(cat_videos, list):
                    flat.extend(cat_videos)
            return flat
        log.warning("Unbekanntes JSON-Format – starte leer")
        return []
    except Exception as e:
        log.error(f"Fehler beim Laden: {e}")
        return []


def save_videos(videos: List[Video]) -> None:
    """Atomisches Speichern: erst .tmp, dann rename (kein Datenverlust)."""
    categorized: Dict[str, List[Video]] = {"etf": [], "aktien": [], "grundlagen": []}

    for video in videos:
        cat = video.get("category") or get_category(video.get("title", ""))
        target = cat if cat in categorized else "aktien"
        categorized[target].append(video)

    for cat in ["etf", "aktien"]:
        for v in categorized[cat]:
            v["featured"] = False
        if categorized[cat]:
            categorized[cat][0]["featured"] = True

    # Atomisch schreiben
    tmp_path = VIDEOS_JSON_PATH.with_suffix(".json.tmp")
    try:
        tmp_path.write_text(
            json.dumps(categorized, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        os.replace(tmp_path, VIDEOS_JSON_PATH)
        total = sum(len(v) for v in categorized.values())
        log.info(
            f"✅ {total} Videos gespeichert "
            f"(ETF={len(categorized['etf'])}, "
            f"Aktien={len(categorized['aktien'])}, "
            f"Grundlagen={len(categorized['grundlagen'])})"
        )
    except Exception as e:
        log.error(f"Fehler beim Speichern: {e}")
        tmp_path.unlink(missing_ok=True)
        raise SystemExit(1)

# ─────────────────────────────────────────────
# RSS FETCH
# ─────────────────────────────────────────────
def fetch_rss() -> str:
    log.info(f"📡 Lade RSS: {RSS_URL}")
    try:
        resp = SESSION.get(RSS_URL, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        log.info(f"   RSS OK ({len(resp.text):,} Zeichen)")
        return resp.text
    except requests.RequestException as e:
        log.error(f"RSS Fehler: {e}")
        raise SystemExit(1)

# ─────────────────────────────────────────────
# PARSING
# ─────────────────────────────────────────────
def parse_rss(xml_data: str) -> List[Video]:
    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt":   "http://www.youtube.com/xml/schemas/2015",
    }
    # Namespace-Fallback für robustheit
    YT_NS = "http://www.youtube.com/xml/schemas/2015"

    videos: List[Video] = []
    seen: set = set()

    try:
        root = ET.fromstring(xml_data)
    except Exception as e:
        log.error(f"XML Parsing Fehler: {e}")
        return []

    for entry in root.findall("atom:entry", ns):
        try:
            # Primärer Namespace-Lookup + Fallback
            vid = (entry.find("yt:videoId", ns)
                   or entry.find(f"{{{YT_NS}}}videoId"))
            title_el  = entry.find("atom:title", ns)
            published = entry.find("atom:published", ns)

            if not (vid is not None and title_el is not None and published is not None):
                continue

            video_id = vid.text.strip()
            if video_id in seen:
                continue
            seen.add(video_id)

            title = title_el.text.strip()

            videos.append({
                "id":          video_id,
                "title":       title,
                "url":         f"https://www.youtube.com/watch?v={video_id}",
                "published":   published.text,
                "date":        format_date(published.text),
                "views":       UNKNOWN,
                "duration":    UNKNOWN,
                "status":      "halal",
                "category":    get_category(title),
                "featured":    False,
                "thumb_local": "",   # wird nach dem Parse befüllt
            })

        except Exception as e:
            log.warning(f"Eintrag übersprungen: {e}")
            continue

    log.info(f"📹 {len(videos)} Videos aus RSS")
    return videos

# ─────────────────────────────────────────────
# MERGE & CHANGE DETECTION
# ─────────────────────────────────────────────
def merge_videos(old: List[Video], new: List[Video]) -> tuple[List[Video], int]:
    existing: Dict[str, Video] = {v["id"]: v for v in old}
    added = 0

    for video in new:
        vid_id = video["id"]
        if vid_id not in existing:
            existing[vid_id] = video
            added += 1
            log.info(f"  🆕 {video['title'][:60]}…")
        else:
            # Manuelle Metadaten und Thumbnail beibehalten
            prev = existing[vid_id]
            video["views"]       = prev.get("views", UNKNOWN)
            video["duration"]    = prev.get("duration", UNKNOWN)
            video["thumb_local"] = prev.get("thumb_local", "")
            existing[vid_id] = video

    result = sorted(existing.values(), key=lambda x: x.get("published", ""), reverse=True)
    return result[:MAX_VIDEOS], added


def has_changes(old: List[Video], new: List[Video]) -> bool:
    """
    MD5-Hash-Vergleich: erkennt auch Titeländerungen,
    nicht nur neue Video-IDs.
    """
    def _hash(lst: List[Video]) -> str:
        # thumb_local aus Vergleich ausschließen (ändert sich lokal)
        stripped = [{k: v for k, v in video.items() if k != "thumb_local"}
                    for video in lst]
        return hashlib.md5(
            json.dumps(stripped, sort_keys=True).encode()
        ).hexdigest()

    return _hash(old) != _hash(new)

# ─────────────────────────────────────────────
# HAUPTPROGRAMM
# ─────────────────────────────────────────────
def main() -> None:
    log.info("=" * 55)
    log.info("🕌  Amana Aktien – Video Auto-Update v3")
    log.info(f"📺  Channel: {CHANNEL_ID}")
    log.info("=" * 55)

    old_videos = load_existing_videos()
    xml_data   = fetch_rss()
    new_videos = parse_rss(xml_data)

    if not new_videos:
        log.warning("Keine Videos aus RSS – Abbruch")
        raise SystemExit(0)

    merged, added = merge_videos(old_videos, new_videos)

    # Thumbnails parallel laden (DSGVO-konform)
    download_thumbnails_parallel(merged)

    if not has_changes(old_videos, merged):
        log.info("ℹ️  Keine Änderungen – kein Update nötig")
        raise SystemExit(0)

    save_videos(merged)
    log.info(f"🎉 Fertig! {added} neue Video(s) hinzugefügt.")


if __name__ == "__main__":
    main()
