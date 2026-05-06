#!/usr/bin/env python3
"""
Amana Aktien – update_videos.py
================================
Liest den YouTube RSS-Feed und aktualisiert videos.json automatisch.
Wird von GitHub Actions alle 2 Stunden ausgeführt.

Autor: Youssef Chafi / Amana Aktien
"""

import json
import re
import requests
from datetime import datetime, timezone
from dateutil import parser as dateparser

# ── Konfiguration ──────────────────────────────────────────
# Deine YouTube Channel ID (aus youtube.com/@AmanaAktien → Info → Kanal ID)
# Oder direkt: youtube.com/channel/CHANNEL_ID
CHANNEL_ID = "UCAmanaAktien"  # ← HIER DEINE ECHTE CHANNEL ID EINTRAGEN

# YouTube RSS Feed URL (kein API-Key nötig!)
RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"

# Pfad zu videos.json
VIDEOS_JSON_PATH = "videos.json"

# Maximale Anzahl Videos pro Kategorie
MAX_VIDEOS_PER_CATEGORY = 15

# Halal-Status Keywords (erkennt anhand des Titels)
STATUS_RULES = {
    "halal": ["HALAL", "Halal", "halal", "✅", "Scharia-konform", "scharia"],
    "pruefen": ["PRÜFEN", "Prüfen", "⚠️", "grenzwertig", "Grenzwertig"],
    "analyse": ["ANALYSE", "Analyse", "🔍", "Check", "check"],
}

# Kategorie-Erkennung anhand von Titeln
CATEGORY_RULES = {
    "etf": ["ETF", "ETC", "Sukuk", "Fonds", "Fund", "MSCI", "Invesco", "iShares", "AMAL", "UMMA", "XASB"],
    "gold": ["Gold", "Silber", "Silver", "Edelmetall"],
    "aktien": ["Aktie", "Aktien", "Stock", "Networks", "NOW", "Apple", "Novo", "Nemetschek", "Deckers", "Krones", "Dividenden", "ZINSFREI"],
    "grundlagen": ["Anfänger", "Grundlagen", "Guide", "Leitfaden", "Broker", "Einsteiger", "Was ist", "Wie"],
}
# ──────────────────────────────────────────────────────────

def get_video_status(title):
    """Erkennt den Halal-Status anhand des Titels."""
    for status, keywords in STATUS_RULES.items():
        for kw in keywords:
            if kw in title:
                return status
    return "halal"  # Standard: halal

def get_video_category(title):
    """Ordnet ein Video einer Kategorie zu."""
    for cat, keywords in CATEGORY_RULES.items():
        for kw in keywords:
            if kw.lower() in title.lower():
                return cat
    return "aktien"  # Standard: Aktien

def format_date(date_str):
    """Formatiert Datum zu deutschen Format."""
    try:
        dt = dateparser.parse(date_str)
        return dt.strftime("%d.%m.%Y")
    except:
        return datetime.now().strftime("%d.%m.%Y")

def fetch_youtube_videos():
    """Ruft Videos vom YouTube RSS-Feed ab."""
    print(f"📡 Rufe YouTube RSS-Feed ab: {RSS_URL}")
    
    try:
        resp = requests.get(RSS_URL, timeout=15, headers={
            "User-Agent": "AmanaAktien/1.0 (GitHub Actions Bot)"
        })
        resp.raise_for_status()
        xml = resp.text
        print(f"✅ RSS-Feed erfolgreich abgerufen ({len(xml)} Zeichen)")
    except Exception as e:
        print(f"❌ Fehler beim Abrufen des RSS-Feeds: {e}")
        return []

    # Videos aus XML parsen (ohne externe XML-Bibliothek)
    videos = []
    entries = re.split(r'<entry>', xml)[1:]  # Skip header
    
    for entry in entries:
        # Video ID
        vid_match = re.search(r'<yt:videoId>([^<]+)</yt:videoId>', entry)
        if not vid_match:
            continue
        video_id = vid_match.group(1).strip()
        
        # Titel
        title_match = re.search(r'<title>([^<]+)</title>', entry)
        title = title_match.group(1).strip() if title_match else "Ohne Titel"
        # Decode HTML entities
        title = title.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
        
        # Datum
        date_match = re.search(r'<published>([^<]+)</published>', entry)
        date_str = date_match.group(1).strip() if date_match else ""
        date_formatted = format_date(date_str)
        
        # Views (nicht im RSS, daher Platzhalter)
        views = "–"
        
        videos.append({
            "id": video_id,
            "title": title,
            "views": views,
            "duration": "–",
            "date": date_formatted,
            "status": get_video_status(title),
            "category": get_video_category(title),
        })
    
    print(f"📹 {len(videos)} Videos gefunden")
    return videos

def update_videos_json(new_videos):
    """Aktualisiert videos.json mit neuen Videos."""
    # Aktuelle videos.json laden
    try:
        with open(VIDEOS_JSON_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)
    except FileNotFoundError:
        existing = {"etf": [], "gold": [], "aktien": [], "grundlagen": []}
    
    # Bestehende Video-IDs sammeln (mit ihren manuellen Metadaten)
    existing_ids = {}
    for cat, videos in existing.items():
        for v in videos:
            existing_ids[v["id"]] = v
    
    # Neue Videos kategorisieren
    updated = {"etf": [], "gold": [], "aktien": [], "grundlagen": []}
    new_count = 0
    
    for video in new_videos:
        cat = video["category"]
        vid_id = video["id"]
        
        if vid_id in existing_ids:
            # Bestehendes Video: manuelle Daten (views, duration) beibehalten
            existing_video = existing_ids[vid_id]
            video["views"] = existing_video.get("views", "–")
            video["duration"] = existing_video.get("duration", "–")
            video["featured"] = existing_video.get("featured", False)
        else:
            new_count += 1
            print(f"  🆕 Neues Video: {video['title'][:60]}...")
        
        if cat in updated:
            updated[cat].append(video)
    
    # Auf MAX_VIDEOS_PER_CATEGORY begrenzen
    for cat in updated:
        updated[cat] = updated[cat][:MAX_VIDEOS_PER_CATEGORY]
    
    # Sicherstellen dass Featured-Videos vorhanden bleiben
    for cat in ["etf", "aktien"]:
        if updated[cat] and not any(v.get("featured") for v in updated[cat]):
            updated[cat][0]["featured"] = True  # Erstes Video als Featured
    
    # Speichern
    with open(VIDEOS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(updated, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ videos.json aktualisiert!")
    print(f"   ETF: {len(updated['etf'])} Videos")
    print(f"   Gold: {len(updated['gold'])} Videos")
    print(f"   Aktien: {len(updated['aktien'])} Videos")
    print(f"   Grundlagen: {len(updated['grundlagen'])} Videos")
    if new_count > 0:
        print(f"   🆕 {new_count} neue Videos hinzugefügt!")
    else:
        print(f"   ℹ️  Keine neuen Videos")
    
    return new_count

def main():
    print("=" * 50)
    print("🕌 Amana Aktien – Video Auto-Update")
    print(f"⏰ {datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')}")
    print("=" * 50)
    
    # Videos abrufen
    videos = fetch_youtube_videos()
    
    if not videos:
        print("⚠️  Keine Videos abgerufen. Beende ohne Änderungen.")
        return
    
    # JSON aktualisieren
    new_count = update_videos_json(videos)
    
    print("\n🎉 Fertig!")
    if new_count > 0:
        print(f"   → {new_count} neue Videos werden jetzt auf der Webseite angezeigt")
    
if __name__ == "__main__":
    main()
