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

# Commercial intent patterns — match common search suggestion phrases
COMMERCIAL_PATTERNS = {
    "purchase_intent": r"(buy|shop|order|price|cost|cheap|affordable|deal|discount|sale|coupon|best|top|review|gift\s*set)",
    "product_research": r"(how to|what is|which|where to|when to|can you|should i|worth|recommend|vs\b|or\b)",
    "product_attributes": r"(size|color|weight|material|thick|thin|large|small|portable|foldable|durable|eco|organic|natural|korean|anti.?aging|sensitive|oily|dry|combination)",
    "product_bundle": r"(set|kit|bundle|combo|pack|collection|system|routine|regimen|starter|essentials|basics)",
    "use_case": r"(for beginners|for kids|for home|for gym|for travel|for exercise|for workout|at home|outdoor|indoor|for men|for women|for oily skin|for dry skin|for acne|for wrinkle|for face|for body)",
    "brand_comparison": r"(amazon|walmart|target|nike|lululemon|manduka|gaiam|brand|store|sephora|ulta|cerave|retinol|niacinamide|hyaluronic)",
    "accessory_interest": r"(bag|strap|towel|block|bolster|wheel|mat\s*cleaner|carrier|holder|rack|stand|serum|cream|moisturizer|cleanser|toner|sunscreen|mask|wand|roller|tool)",
}

TREND_PATTERNS = {**EMOTION_FRAMEWORK, **FORMAT_PATTERNS, **COMMERCIAL_PATTERNS}

# ======================
# TREND DISPLAY NAMES
# ======================

TREND_DISPLAY_NAMES = {
    "purchase_intent": "Buy-Ready Signals",
    "product_research": "Comparison Shopping",
    "product_attributes": "Feature Interest",
    "product_bundle": "Bundle Demand",
    "use_case": "Solution Seeking",
    "accessory_interest": "Cross-Sell Opportunity",
    "brand_comparison": "Brand Awareness",
    "joy_engagement": "Positive Emotion",
    "joy_conversion": "Positive Emotion",
    "trust_conversion": "Trust Signal",
    "trust_engagement": "Trust Signal",
    "surprise_engagement": "Surprise Factor",
    "anticipation_engagement": "Anticipation",
    "urgency_scarcity_conversion": "Urgency",
    "risk_reversal_conversion": "Risk Reversal",
    "risk_reversal_engagement": "Risk Reversal",
    "social_proof_conversion": "Social Proof",
    "specificity_conversion": "Specificity",
    "specificity_engagement": "Specificity",
    "curiosity_gap_engagement": "Curiosity Gap",
    "format_video": "Video Format",
    "format_image": "Image Format",
    "format_carousel": "Carousel Format",
    "format_text": "Text Format",
    "power_words": "Power Words",
    "comparative_language": "Comparative Language",
}

DIMENSION_TOOLTIPS = {
    "engagement": {
        "label": "Engagement",
        "tooltip": "Measures attention-grabbing power of current messaging. Low = hooks are generic. Fix: add curiosity gaps, surprising stats, or power words.",
        "low_action": "Your hook needs work. Test: surprising question or stat in first 3 seconds.",
        "high_action": "Strong engagement signals. Your hook resonates — scale this angle."
    },
    "conversion": {
        "label": "Purchase Readiness",
        "tooltip": "How strong are buy-now signals. Low = audience isn't ready to purchase yet. Fix: add urgency, social proof, or risk-reversal.",
        "low_action": "Audience needs education first. Run awareness before conversion campaigns.",
        "high_action": "High purchase intent. Push conversion campaigns with strong CTAs."
    },
    "emotional_valence": {
        "label": "Sentiment",
        "tooltip": "Positive vs negative emotional tone in market signals. Low = messaging may feel fear-based. Fix: balance with positive/aspirational language.",
        "low_action": "Current tone is neutral/negative. Add aspirational messaging.",
        "high_action": "Positive sentiment. Audience responds to joy/optimism angles."
    },
    "attention_grab": {
        "label": "Hook Strength",
        "tooltip": "How well the ad hooks viewers in first 3 seconds. Low = opening is boring/generic. Fix: lead with surprise, question, or bold claim.",
        "low_action": "Opening hook is weak. Test: 'Did you know...?' or bold stat opener.",
        "high_action": "Strong hook potential. Use curiosity-gap openers."
    },
    "trust_building": {
        "label": "Trust Score",
        "tooltip": "How much the audience values proof and credibility. High = they need to see evidence before buying. Lead with certifications, lab tests, reviews.",
        "low_action": "Trust isn't a key driver here. Focus on engagement and urgency instead.",
        "high_action": "Trust is critical for this audience. Add proof: certifications, lab tests, 3rd-party validation."
    },
    "urgency_pressure": {
        "label": "Urgency",
        "tooltip": "How much FOMO/time-pressure exists in the market. Low = no reason to act now. Fix: add ethical scarcity (limited stock, early-bird offers).",
        "low_action": "No urgency detected. Add ethical scarcity: limited offers, seasonal angle.",
        "high_action": "Market has urgency signals. Capitalize with time-limited offers."
    }
}

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
