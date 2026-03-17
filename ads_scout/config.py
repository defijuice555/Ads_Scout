"""
Configuration constants for EthicalAdTracker v4.0.
All trend sources, emotion frameworks, demographic maps, and conversion models.
"""

import os
import logging

# ======================
# GENERAL SETTINGS
# ======================

MIN_SOURCES_FOR_TREND = 2
MIN_ADS_PER_SOURCE = 5
REQUEST_DELAY = 1.5
MAX_RETRIES = 3
BACKOFF_FACTOR = 2
OUTPUT_DIR = "ethical_ad_insights"
CACHE_DIR = os.path.join(OUTPUT_DIR, "cache")
LOG_LEVEL = logging.INFO
TREND_HISTORY_DAYS = 30

# ======================
# TREND SOURCES
# ======================

TREND_SOURCES = {
    "meta": {"enabled": True, "weight": 0.3, "base_url": "https://www.facebook.com/ads/library/"},
    "google_trends": {"enabled": True, "weight": 0.25, "base_url": "https://trends.google.com/trends/api/"},
    "answerthepublic": {"enabled": True, "weight": 0.2, "base_url": "https://answerthepublic.com/api/"},
    "tiktok_creative_center": {"enabled": True, "weight": 0.15, "base_url": "https://ads.tiktok.com/creative_radar/api/"},
    "pinterest_trends": {"enabled": True, "weight": 0.1, "base_url": "https://trends.pinterest.com/"},
}

# ======================
# EMOTION FRAMEWORK (Plutchik + Fogg Behavior Model)
# ======================

EMOTION_FRAMEWORK = {
    "joy": {
        "words": r"(happy|joy|delight|thrilled|excited|pleased|content|satisfied|cheerful|ecstatic|elated)",
        "engagement_weight": 0.7, "conversion_weight": 0.5,
        "description": "Positive affective state driving shareability and brand affinity",
    },
    "trust": {
        "words": r"(trusted|reliable|secure|safe|guaranteed|certified|endorsed|approved|verified|authentic)",
        "engagement_weight": 0.6, "conversion_weight": 0.9,
        "description": "Foundation for reducing perceived risk and increasing purchase intent",
    },
    "anticipation": {
        "words": r"(coming soon|upcoming|prepare|get ready|launch|announcing|soon|about to|expecting|awaiting)",
        "engagement_weight": 0.85, "conversion_weight": 0.4,
        "description": "Future-oriented excitement driving pre-launch engagement",
    },
    "surprise": {
        "words": r"(amazing|astonishing|unexpected|shocking|wow|incredible|unbelievable|mind-blowing|stunning)",
        "engagement_weight": 0.9, "conversion_weight": 0.3,
        "description": "Attention-grabbing novelty that increases ad recall",
    },
    "optimism": {
        "words": r"(hopeful|confident|positive|encouraging|promising|bright|hope|faith|belief)",
        "engagement_weight": 0.65, "conversion_weight": 0.6,
        "description": "Future-focused positivity increasing willingness to try",
    },
    "vigilance": {
        "words": r"(alert|aware|cautious|careful|watchful|vigilant|attentive|observant)",
        "engagement_weight": 0.5, "conversion_weight": 0.7,
        "description": "Heightened awareness increasing responsiveness to threats/solutions",
    },
    "curiosity_gap": {
        "words": r"(secret|hidden|unknown|mystery|revealed|exposed|uncovered|what they don't want you to know|behind the scenes)",
        "engagement_weight": 0.95, "conversion_weight": 0.4,
        "description": "Information gap creating psychological tension needing resolution",
    },
    "urgency_scarcity": {
        "words": r"(limited|expires|ending soon|last chance|only|hurry|deadline|countdown|running out|few left)",
        "engagement_weight": 0.7, "conversion_weight": 0.95,
        "description": "Time/quantity pressure triggering fear of missing out (FOMO)",
    },
    "social_proof": {
        "words": r"(everyone|everybody|millions|thousands|joined|trusted|recommended|approved|certified|bestseller|#1)",
        "engagement_weight": 0.6, "conversion_weight": 0.85,
        "description": "Validation through others reducing perceived risk",
    },
    "specificity": {
        "words": r"\d+%|\d+x|\d+\s*(days|weeks|months|years|hours|minutes|seconds)\s*(off|discount|save|faster|longer|better|stronger|more|less)",
        "engagement_weight": 0.5, "conversion_weight": 0.8,
        "description": "Concrete details increasing credibility and reducing uncertainty",
    },
    "risk_reversal": {
        "words": r"(free|trial|sample|guarantee|warranty|refund|money.back|no risk|cancel anytime|money back guarantee)",
        "engagement_weight": 0.4, "conversion_weight": 0.9,
        "description": "Eliminating purchase barriers through safety nets",
    },
}

FORMAT_PATTERNS = {
    "format_video": r"(video|watch|see|footage|clip|movie|demo|tutorial|live|reel|story)",
    "format_image": r"(image|photo|picture|graphic|visual|illustration|screenshot|infographic|meme)",
    "format_carousel": r"(carousel|swipe|slide|multiple|series|steps|guide|tips|ways)",
    "format_text": r"(post|update|article|blog|guide|tips|advice|news|announcement)",
    "power_words": r"(discover|unlock|master|transform|revolutionize|breakthrough|proven|expert|secret|hidden|exclusive)",
    "comparative_language": r"(vs|versus|compared to|better than|unlike|instead of|rather than|alternative|superior|inferior)",
}

TREND_PATTERNS = {**EMOTION_FRAMEWORK, **FORMAT_PATTERNS}

# ======================
# CONVERSION MODEL
# ======================

CONVERSION_MODEL = {
    "urgency_scarcity": 0.25,
    "risk_reversal": 0.20,
    "social_proof": 0.15,
    "specificity": 0.12,
    "trust": 0.10,
    "benefit_clarity": 0.08,
    "emotional_valence": 0.05,
    "attention_grab": 0.05,
}

# ======================
# DEMOGRAPHIC TRIGGER MAP
# ======================

DEMOGRAPHIC_TRIGGER_MAP = {
    "age_groups": {
        "18-24": {
            "surprise_engagement": 1.3, "joy_conversion": 1.1,
            "urgency_scarcity_conversion": 0.7, "social_proof_conversion": 1.4,
        },
        "25-34": {
            "risk_reversal_conversion": 1.5, "specificity_conversion": 1.3,
            "anticipation_engagement": 1.2,
        },
        "35-54": {
            "trust_conversion": 1.6, "vigilance_conversion": 1.2,
            "format_video": 1.1,
        },
        "55+": {
            "risk_reversal_conversion": 1.8, "specificity_conversion": 1.5,
            "format_image": 1.3,
        },
    },
    "interest_layers": {
        "eco_friendly": {
            "joy_conversion": 1.2, "trust_conversion": 1.4,
            "urgency_scarcity_conversion": 0.6,
        },
        "yoga_practitioners": {
            "anticipation_engagement": 1.3, "social_proof_conversion": 1.5,
        },
    },
}
