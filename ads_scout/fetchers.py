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
# CACHING
# ======================

def get_cache_path(keyword: str, source: str) -> str:
    safe_keyword = re.sub(r"[^\w\-_]", "_", keyword.lower())
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

def fetch_meta_ads(keyword: str, region: str = "US") -> List[Dict]:
    """Fetch product-related suggestions via Google Shopping suggest (Meta replacement)."""
    cache_path = get_cache_path(keyword, "meta")
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    # Use Google Shopping suggestions as a proxy for commercial/ad intent data
    url = "https://suggestqueries.google.com/complete/search"
    params = {"client": "firefox", "q": keyword, "hl": "en", "gl": region.lower(), "ds": "sh"}
    resp = make_ethical_request(url, params=params, source="meta")

    if not resp:
        # Fallback to regular Google suggest with ad-related prefixes
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

    try:
        data = resp.json()
        ads: List[Dict] = []
        if isinstance(data, list) and len(data) >= 2 and isinstance(data[1], list):
            for suggestion in data[1][:MIN_ADS_PER_SOURCE]:
                if isinstance(suggestion, str) and suggestion.lower() != keyword.lower():
                    ads.append({
                        "text": suggestion,
                        "type": "shopping_suggestion",
                        "raw_length": len(suggestion),
                    })

        result = ads[:MIN_ADS_PER_SOURCE]
        save_to_cache(result, cache_path)
        logger.info(f"Google Shopping Suggest: Retrieved {len(result)} items for '{keyword}'")
        return result
    except Exception as e:
        logger.error(f"Google Shopping Suggest parsing error: {e}")
        return []


def fetch_google_trends(keyword: str, region: str = "US") -> List[Dict]:
    cache_path = get_cache_path(keyword, "google_trends")
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    # Use the dailytrends or autocomplete endpoint as a more reliable fallback
    url = f"{TREND_SOURCES['google_trends']['base_url']}hottrends/visualize/internal/data"
    params = {"ed": datetime.now().strftime("%Y%m%d"), "geo": region, "cat": "", "q": keyword}

    resp = make_ethical_request(url, params=params, source="google_trends")

    # Fallback: try the autocomplete/suggestions endpoint
    if not resp:
        url = f"https://trends.google.com/trends/api/autocomplete/{quote(keyword)}"
        params = {"hl": "en-US", "tz": "-300"}
        resp = make_ethical_request(url, params=params, source="google_trends")

    if not resp:
        return []

    try:
        # Strip XSSI prefix if present
        text = resp.text
        if text.startswith(")]}'"):
            text = text.split("\n", 1)[-1] if "\n" in text else text[4:]

        data = json.loads(text)
        queries: List[Dict] = []

        # Handle various response shapes
        if isinstance(data, dict):
            # autocomplete response
            if "default" in data and "topics" in data["default"]:
                for topic in data["default"]["topics"][:MIN_ADS_PER_SOURCE]:
                    title = topic.get("title", "")
                    if title:
                        queries.append({"text": title, "type": "related_topic", "value": 0})
            # explore-style response
            for key in ["trendingSearchesDays", "storySummaries"]:
                if key in data:
                    for day_data in data[key][:3]:
                        for search in day_data.get("trendingSearches", [])[:5]:
                            title = search.get("title", {}).get("query", "")
                            if title:
                                queries.append({"text": title, "type": "trending", "value": 0})
        elif isinstance(data, list):
            for item in data[:MIN_ADS_PER_SOURCE]:
                if isinstance(item, str):
                    queries.append({"text": item, "type": "suggestion", "value": 0})
                elif isinstance(item, dict) and "query" in item:
                    queries.append({"text": item["query"], "type": "query", "value": item.get("value", 0)})

        result = queries[:MIN_ADS_PER_SOURCE]
        save_to_cache(result, cache_path)
        logger.info(f"Google Trends: Retrieved {len(result)} queries for '{keyword}'")
        return result
    except Exception as e:
        logger.error(f"Google Trends parsing error: {e}")
        return []


def fetch_answerthepublic(keyword: str, region: str = "us") -> List[Dict]:
    """Fetch search suggestions via Google Suggest API (public, no auth)."""
    cache_path = get_cache_path(keyword, "answerthepublic")
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    items: List[Dict] = []
    prefixes = ["", "how to ", "best ", "why ", "what "]

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
    logger.info(f"Google Suggest: Retrieved {len(result)} suggestions for '{keyword}'")
    return result


def fetch_tiktok_trends(keyword: str, region: str = "US") -> List[Dict]:
    """Fetch suggestions via Bing Suggest API (used as TikTok replacement)."""
    cache_path = get_cache_path(keyword, "tiktok_creative_center")
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    url = "https://api.bing.com/osjson.aspx"
    params = {"query": keyword, "mkt": f"en-{region}", "maxwidth": "10"}
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
        logger.info(f"Bing Suggest: Retrieved {len(result)} trends for '{keyword}'")
        return result
    except Exception as e:
        logger.error(f"Bing Suggest parsing error: {e}")
        return []


def fetch_pinterest_trends(keyword: str, region: str = "US") -> List[Dict]:
    """Fetch suggestions via DuckDuckGo Suggest API (used as Pinterest replacement)."""
    cache_path = get_cache_path(keyword, "pinterest_trends")
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    url = "https://duckduckgo.com/ac/"
    params = {"q": keyword, "kl": f"{region.lower()}-en"}
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
        logger.info(f"DuckDuckGo Suggest: Retrieved {len(result)} suggestions for '{keyword}'")
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
