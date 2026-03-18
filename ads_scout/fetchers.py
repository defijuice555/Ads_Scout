"""
Data fetchers for all trend sources with ethical rate-limiting and caching.
"""

import requests
import time
import json
import os
import re
import html
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from urllib.parse import quote  # noqa: F401 — kept for potential custom URL building

from ads_scout.config import (
    TREND_SOURCES, MIN_ADS_PER_SOURCE, REQUEST_DELAY, MAX_RETRIES,
    BACKOFF_FACTOR, OUTPUT_DIR, CACHE_DIR, TREND_HISTORY_DAYS,
)

logger = logging.getLogger(__name__)


# ======================
# DIRECTORY SETUP
# ======================

def setup_directories() -> None:
    for directory in [OUTPUT_DIR, CACHE_DIR]:
        os.makedirs(directory, exist_ok=True)


# ======================
# GEO HELPERS
# ======================

def build_geo_label(state: str = "", city: str = "") -> str:
    """Build a location string from state + city for use in queries and cache keys.

    Examples:
        ("FL", "Miami") -> "Miami FL"
        ("CA", "")      -> "California"
        ("", "Miami")   -> "Miami"
        ("", "")        -> ""
    """
    parts = [p for p in [city.strip(), state.strip()] if p]
    return " ".join(parts)


# ======================
# CACHING
# ======================

def get_cache_path(keyword: str, source: str, geo: str = "") -> str:
    safe_keyword = re.sub(r"[^\w\-_]", "_", keyword.lower())
    if geo:
        safe_geo = re.sub(r"[^\w\-_]", "_", geo.lower())
        return os.path.join(CACHE_DIR, f"{source}_{safe_keyword}_{safe_geo}.json")
    return os.path.join(CACHE_DIR, f"{source}_{safe_keyword}.json")


def is_cache_valid(cache_path: str, max_age_hours: int = 1) -> bool:
    if not os.path.exists(cache_path):
        return False
    file_time = datetime.fromtimestamp(os.path.getmtime(cache_path))
    return datetime.now() - file_time < timedelta(hours=max_age_hours)


def load_from_cache(cache_path: str) -> Optional[Any]:
    if is_cache_valid(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Cache load failed for {cache_path}: {e}")
    return None


def save_to_cache(data: Any, cache_path: str) -> None:
    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Failed to save cache {cache_path}: {e}")


# ======================
# HTTP REQUEST
# ======================

def make_ethical_request(
    url: str,
    params: Optional[Dict] = None,
    headers: Optional[Dict] = None,
    source: str = "unknown",
) -> Optional[requests.Response]:
    if headers is None:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }

    for attempt in range(MAX_RETRIES):
        try:
            logger.debug(f"Request attempt {attempt + 1}/{MAX_RETRIES} for {source}: {url}")
            resp = requests.get(url, params=params, headers=headers, timeout=20)
            resp.raise_for_status()
            time.sleep(REQUEST_DELAY)
            return resp
        except requests.exceptions.RequestException as e:
            logger.warning(f"Request failed for {source} (attempt {attempt + 1}): {e}")
            if attempt < MAX_RETRIES - 1:
                wait_time = REQUEST_DELAY * (BACKOFF_FACTOR ** attempt)
                logger.info(f"Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            else:
                logger.error(f"Max retries exceeded for {source}")
                return None
    return None


# ======================
# SOURCE FETCHERS
# ======================

def fetch_meta_ads(keyword: str, region: str = "US", geo: str = "") -> List[Dict]:
    """Fetch product-related suggestions via Google Shopping suggest (Meta replacement)."""
    cache_path = get_cache_path(keyword, "meta", geo)
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    url = "https://suggestqueries.google.com/complete/search"
    queries = [keyword]
    if geo:
        queries.append(f"{keyword} {geo}")

    all_items: List[Dict] = []
    for q in queries:
        params = {"client": "firefox", "q": q, "hl": "en", "gl": region.lower(), "ds": "sh"}
        resp = make_ethical_request(url, params=params, source="meta")
        if resp:
            try:
                data = resp.json()
                if isinstance(data, list) and len(data) >= 2 and isinstance(data[1], list):
                    for suggestion in data[1][:MIN_ADS_PER_SOURCE]:
                        if isinstance(suggestion, str) and suggestion.lower() != q.lower():
                            all_items.append({
                                "text": suggestion,
                                "type": "shopping_suggestion",
                                "raw_length": len(suggestion),
                            })
            except Exception:
                pass

    if not all_items:
        items: List[Dict] = []
        for prefix in [f"{keyword} ad", f"{keyword} deal", f"buy {keyword}"]:
            fallback_params = {"client": "firefox", "q": prefix, "hl": "en", "gl": region.lower()}
            fb_resp = make_ethical_request(url, params=fallback_params, source="meta")
            if fb_resp:
                try:
                    data = fb_resp.json()
                    if isinstance(data, list) and len(data) >= 2 and isinstance(data[1], list):
                        for s in data[1][:2]:
                            if isinstance(s, str):
                                items.append({"text": s, "type": "commercial_suggestion", "raw_length": len(s)})
                except Exception:
                    pass
        result = items[:MIN_ADS_PER_SOURCE]
        save_to_cache(result, cache_path)
        return result

    # Deduplicate
    seen: set = set()
    unique: List[Dict] = []
    for item in all_items:
        key = item["text"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(item)

    result = unique[:MIN_ADS_PER_SOURCE]
    save_to_cache(result, cache_path)
    logger.info(f"Google Shopping Suggest: Retrieved {len(result)} items for '{keyword}'{f' ({geo})' if geo else ''}")
    return result


def fetch_google_trends(keyword: str, region: str = "US", geo: str = "") -> List[Dict]:
    """Fetch trending suggestions via Google Suggest with trend-oriented prefixes."""
    cache_path = get_cache_path(keyword, "google_trends", geo)
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    items: List[Dict] = []
    prefixes = [f"trending {keyword}", f"popular {keyword}", f"{keyword} 2026", keyword]
    if geo:
        prefixes.append(f"{keyword} {geo}")
        prefixes.append(f"best {keyword} {geo}")
    url = "https://suggestqueries.google.com/complete/search"

    for prefix in prefixes:
        params = {"client": "firefox", "q": prefix, "hl": "en", "gl": region.lower()}
        resp = make_ethical_request(url, params=params, source="google_trends")
        if resp:
            try:
                data = resp.json()
                if isinstance(data, list) and len(data) >= 2 and isinstance(data[1], list):
                    for suggestion in data[1][:3]:
                        if isinstance(suggestion, str) and suggestion.lower() != prefix.lower():
                            items.append({"text": suggestion, "type": "trending", "value": 0})
            except Exception as e:
                logger.warning(f"Google Suggest parse error for '{prefix}': {e}")

    # Deduplicate
    seen: set = set()
    unique: List[Dict] = []
    for item in items:
        key = item["text"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(item)

    result = unique[:MIN_ADS_PER_SOURCE]
    save_to_cache(result, cache_path)
    logger.info(f"Google Trends (Suggest): Retrieved {len(result)} queries for '{keyword}'{f' ({geo})' if geo else ''}")
    return result


def fetch_answerthepublic(keyword: str, region: str = "us", geo: str = "") -> List[Dict]:
    """Fetch search suggestions via Google Suggest API (public, no auth)."""
    cache_path = get_cache_path(keyword, "answerthepublic", geo)
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    items: List[Dict] = []
    prefixes = ["", "how to ", "best ", "why ", "what "]
    if geo:
        prefixes.append(f"{geo} ")

    for prefix in prefixes:
        query = f"{prefix}{keyword}".strip()
        url = "https://suggestqueries.google.com/complete/search"
        params = {"client": "firefox", "q": query, "hl": "en", "gl": region.lower()}
        resp = make_ethical_request(url, params=params, source="answerthepublic")
        if resp:
            try:
                data = resp.json()
                if isinstance(data, list) and len(data) >= 2 and isinstance(data[1], list):
                    item_type = "question" if prefix.strip() in ("how to", "why", "what") else "suggestion"
                    for suggestion in data[1][:3]:
                        if isinstance(suggestion, str) and suggestion.lower() != query.lower():
                            items.append({
                                "text": suggestion,
                                "type": item_type,
                                "engagement_potential": 0.9 if item_type == "question" else 0.7,
                            })
            except Exception as e:
                logger.warning(f"Google Suggest parse error for '{query}': {e}")

    # Deduplicate
    seen: set = set()
    unique: List[Dict] = []
    for item in items:
        key = item["text"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(item)

    unique.sort(key=lambda x: x["engagement_potential"], reverse=True)
    result = unique[:MIN_ADS_PER_SOURCE]
    save_to_cache(result, cache_path)
    logger.info(f"Google Suggest: Retrieved {len(result)} suggestions for '{keyword}'{f' ({geo})' if geo else ''}")
    return result


def fetch_tiktok_trends(keyword: str, region: str = "US", geo: str = "") -> List[Dict]:
    """Fetch suggestions via Bing Suggest API (used as TikTok replacement)."""
    cache_path = get_cache_path(keyword, "tiktok_creative_center", geo)
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    query = f"{keyword} {geo}".strip() if geo else keyword
    url = "https://api.bing.com/osjson.aspx"
    params = {"query": query, "mkt": f"en-{region}", "maxwidth": "10"}
    resp = make_ethical_request(url, params=params, source="tiktok_creative_center")
    if not resp:
        return []

    try:
        data = resp.json()
        trends: List[Dict] = []
        if isinstance(data, list) and len(data) >= 2 and isinstance(data[1], list):
            for suggestion in data[1][:MIN_ADS_PER_SOURCE]:
                if isinstance(suggestion, str) and suggestion.lower() != keyword.lower():
                    trends.append({
                        "text": suggestion,
                        "type": "search_trend",
                        "growth": 0,
                        "video_count": 0,
                    })

        result = trends[:MIN_ADS_PER_SOURCE]
        save_to_cache(result, cache_path)
        logger.info(f"Bing Suggest: Retrieved {len(result)} trends for '{keyword}'{f' ({geo})' if geo else ''}")
        return result
    except Exception as e:
        logger.error(f"Bing Suggest parsing error: {e}")
        return []


def fetch_pinterest_trends(keyword: str, region: str = "US", geo: str = "") -> List[Dict]:
    """Fetch suggestions via DuckDuckGo Suggest API (used as Pinterest replacement)."""
    cache_path = get_cache_path(keyword, "pinterest_trends", geo)
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    query = f"{keyword} {geo}".strip() if geo else keyword
    url = "https://duckduckgo.com/ac/"
    params = {"q": query, "kl": f"{region.lower()}-en"}
    resp = make_ethical_request(url, params=params, source="pinterest_trends")
    if not resp:
        return []

    try:
        data = resp.json()
        trends: List[Dict] = []
        if isinstance(data, list):
            for item in data[:MIN_ADS_PER_SOURCE]:
                phrase = item.get("phrase", "") if isinstance(item, dict) else str(item)
                if phrase and len(phrase) > 2 and phrase.lower() != keyword.lower():
                    trends.append({
                        "text": phrase,
                        "type": "search_suggestion",
                        "score": 0,
                        "growth": 0,
                    })

        result = trends[:MIN_ADS_PER_SOURCE]
        save_to_cache(result, cache_path)
        logger.info(f"DuckDuckGo Suggest: Retrieved {len(result)} suggestions for '{keyword}'{f' ({geo})' if geo else ''}")
        return result
    except Exception as e:
        logger.error(f"DuckDuckGo Suggest parsing error: {e}")
        return []


FETCHER_MAP = {
    "meta": fetch_meta_ads,
    "google_trends": fetch_google_trends,
    "answerthepublic": fetch_answerthepublic,
    "tiktok_creative_center": fetch_tiktok_trends,
    "pinterest_trends": fetch_pinterest_trends,
}
