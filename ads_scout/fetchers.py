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
from urllib.parse import quote

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
            "User-Agent": "EthicalAdTracker/4.0 (research; compliant; +https://github.com/ethicaladtracker)"
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
    cache_path = get_cache_path(keyword, "meta")
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    url = TREND_SOURCES["meta"]["base_url"]
    params = {
        "q": keyword, "ad_type": "all", "media_type": "all",
        "search_type": "keyword_unordered", "country": [region], "start": 0,
    }

    resp = make_ethical_request(url, params=params, source="meta")
    if not resp:
        return []

    try:
        ads = []
        ad_patterns = [
            r'<div[^>]*class="[^"]*x[^"]*_[^"]*ad[^"]*"[^>]*>.*?</div>',
            r'<div[^>]*class="[^"]*_._.[^"]*ad[^"]*"[^>]*>.*?</div>',
            r'<div[^>]*data-testid="[^"]*ad-container[^"]*"[^>]*>.*?</div>',
        ]

        ad_cards = []
        for pattern in ad_patterns:
            ad_cards.extend(re.findall(pattern, resp.text, re.DOTALL | re.IGNORECASE))

        seen = set()
        unique_cards = []
        for card in ad_cards:
            if card not in seen:
                seen.add(card)
                unique_cards.append(card)

        for card in unique_cards[: MIN_ADS_PER_SOURCE * 2]:
            text_containers = re.findall(
                r"(?:<span[^>]*>|<div[^>]*>|>)(.*?)(?:</span|</div|<|$)", card, re.DOTALL,
            )
            for text in text_containers:
                clean_text = html.unescape(re.sub(r"<[^>]+>", " ", text)).strip()
                if 20 < len(clean_text) < 400 and not re.match(r"^[^\w\s]*$", clean_text):
                    ads.append({
                        "text": clean_text[:350],
                        "type": "video" if "video" in card.lower() else "image",
                        "raw_length": len(clean_text),
                    })
                    if len(ads) >= MIN_ADS_PER_SOURCE:
                        break

        result = ads[:MIN_ADS_PER_SOURCE]
        save_to_cache(result, cache_path)
        logger.info(f"Meta: Retrieved {len(result)} quality ads for '{keyword}'")
        return result
    except Exception as e:
        logger.error(f"Meta parsing error: {e}")
        return []


def fetch_google_trends(keyword: str, region: str = "US") -> List[Dict]:
    cache_path = get_cache_path(keyword, "google_trends")
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    url = f"{TREND_SOURCES['google_trends']['base_url']}explore"
    params = {"date": f"today {TREND_HISTORY_DAYS}-d", "geo": region, "q": quote(keyword)}

    resp = make_ethical_request(url, params=params, source="google_trends")
    if not resp:
        return []

    try:
        json_text = resp.text.split(")]}'\\n", 1)[-1] if ")]}'\\n" in resp.text else resp.text
        data = json.loads(json_text)

        queries = []
        rising = []

        if "default" in data and "trends" in data["default"]:
            for trend in data["default"]["trends"]:
                if "query" in trend:
                    queries.append({"text": trend["query"], "type": "query", "value": trend.get("value", 0)})

        if "default" in data and "rising" in data["default"]:
            for trend in data["default"]["rising"][:MIN_ADS_PER_SOURCE]:
                if "query" in trend:
                    rising.append({"text": trend["query"], "type": "rising_query", "value": trend.get("value", 0)})

        result = (rising + queries)[:MIN_ADS_PER_SOURCE]
        save_to_cache(result, cache_path)
        logger.info(f"Google Trends: Retrieved {len(result)} queries ({len(rising)} rising) for '{keyword}'")
        return result
    except Exception as e:
        logger.error(f"Google Trends parsing error: {e}")
        return []


def fetch_answerthepublic(keyword: str, region: str = "us") -> List[Dict]:
    cache_path = get_cache_path(keyword, "answerthepublic")
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    url = f"{TREND_SOURCES['answerthepublic']['base_url']}{region}/search"
    params = {"terms": quote(keyword)}

    resp = make_ethical_request(url, params=params, source="answerthepublic")
    if not resp:
        return []

    try:
        data = resp.json()
        items = []
        sections = [
            ("questions", "question", 1.0), ("prepositions", "preposition", 0.8),
            ("comparisons", "comparison", 0.9), ("alphabeticals", "alphabetical", 0.6),
            ("related", "related", 0.7),
        ]

        for section, item_type, weight in sections:
            if section in data and isinstance(data[section], list):
                for item in data[section][: MIN_ADS_PER_SOURCE // 2]:
                    if isinstance(item, dict) and "phrase" in item:
                        items.append({"text": item["phrase"], "type": item_type, "engagement_potential": weight})

        items.sort(key=lambda x: x["engagement_potential"], reverse=True)
        result = items[:MIN_ADS_PER_SOURCE]
        save_to_cache(result, cache_path)
        logger.info(f"AnswerThePublic: Retrieved {len(result)} items for '{keyword}'")
        return result
    except Exception as e:
        logger.error(f"AnswerThePublic parsing error: {e}")
        return []


def fetch_tiktok_trends(keyword: str, region: str = "US") -> List[Dict]:
    cache_path = get_cache_path(keyword, "tiktok_creative_center")
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    url = f"{TREND_SOURCES['tiktok_creative_center']['base_url']}trend/hashtag"
    params = {"keyword": quote(keyword), "region": region.upper(), "period": "7"}

    resp = make_ethical_request(url, params=params, source="tiktok_creative_center")
    if not resp:
        return []

    try:
        data = resp.json()
        trends = []
        if "data" in data and "list" in data["data"]:
            for trend in data["data"]["list"][:MIN_ADS_PER_SOURCE]:
                name = trend.get("display", "")
                if name and len(name) > 3:
                    trends.append({
                        "text": name, "type": "hashtag_trend",
                        "growth": trend.get("growth", 0), "video_count": trend.get("video_count", 0),
                    })

        result = trends[:MIN_ADS_PER_SOURCE]
        save_to_cache(result, cache_path)
        logger.info(f"TikTok: Retrieved {len(result)} trends for '{keyword}'")
        return result
    except Exception as e:
        logger.error(f"TikTok parsing error: {e}")
        return []


def fetch_pinterest_trends(keyword: str, region: str = "US") -> List[Dict]:
    cache_path = get_cache_path(keyword, "pinterest_trends")
    cached = load_from_cache(cache_path)
    if cached is not None:
        return cached

    url = f"{TREND_SOURCES['pinterest_trends']['base_url']}trends/"
    params = {"term": quote(keyword), "region": region.lower()}

    resp = make_ethical_request(url, params=params, source="pinterest_trends")
    if not resp:
        return []

    try:
        data = resp.json()
        trends = []
        if "data" in data and "trends" in data["data"]:
            for trend in data["data"]["trends"][:MIN_ADS_PER_SOURCE]:
                trends.append({
                    "text": trend.get("keyword", ""), "type": "pin_trend",
                    "score": trend.get("score", 0), "growth": trend.get("growth", 0),
                })

        result = [t for t in trends if t["text"] and len(t["text"]) > 2][:MIN_ADS_PER_SOURCE]
        save_to_cache(result, cache_path)
        logger.info(f"Pinterest: Retrieved {len(result)} trends for '{keyword}'")
        return result
    except Exception as e:
        logger.error(f"Pinterest parsing error: {e}")
        return []


FETCHER_MAP = {
    "meta": fetch_meta_ads,
    "google_trends": fetch_google_trends,
    "answerthepublic": fetch_answerthepublic,
    "tiktok_creative_center": fetch_tiktok_trends,
    "pinterest_trends": fetch_pinterest_trends,
}
