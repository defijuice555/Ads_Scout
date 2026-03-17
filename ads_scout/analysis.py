"""
Trend analysis, validation, demographic weighting, conversion prediction,
creative generation, and insight export.
"""

import csv
import copy
import json
import os
import re
import logging
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Any, Optional

from ads_scout.config import (
    TREND_SOURCES, TREND_PATTERNS, EMOTION_FRAMEWORK, FORMAT_PATTERNS,
    CONVERSION_MODEL, DEMOGRAPHIC_TRIGGER_MAP, MIN_SOURCES_FOR_TREND, OUTPUT_DIR,
)

logger = logging.getLogger(__name__)


# ======================
# TREND EXTRACTION
# ======================

def extract_generalized_trends(ads_list: List[Dict], source_name: str) -> Dict[str, float]:
    trends: Dict[str, float] = defaultdict(float)
    total_weight = 0.0

    for ad in ads_list:
        text = ad["text"].lower()
        source_weight = ad.get("engagement_potential", 1.0)

        for trend_name, pattern_data in TREND_PATTERNS.items():
            if isinstance(pattern_data, dict):
                pattern = pattern_data["words"]
                weight = source_weight
            else:
                pattern = pattern_data
                weight = source_weight * 0.7

            if re.search(pattern, text, re.IGNORECASE):
                if isinstance(pattern_data, dict) and "engagement_weight" in pattern_data:
                    trends[f"{trend_name}_engagement"] += weight * pattern_data["engagement_weight"]
                    trends[f"{trend_name}_conversion"] += weight * pattern_data["conversion_weight"]
                else:
                    trends[trend_name] += weight

        total_weight += source_weight

    if total_weight > 0:
        for key in trends:
            trends[key] /= total_weight

    logger.debug(f"{source_name} trends: {dict(trends)}")
    return dict(trends)


# ======================
# TREND VALIDATION
# ======================

def validate_trends(source_trends: Dict[str, Dict]) -> Dict[str, Dict]:
    validated = {}
    all_sources = [s for s in TREND_SOURCES if TREND_SOURCES[s]["enabled"]]

    all_trend_keys: set = set()
    for source in all_sources:
        all_trend_keys.update(source_trends.get(source, {}).keys())

    for trend in all_trend_keys:
        sources_present = []
        total_score = 0.0

        for source in all_sources:
            if trend in source_trends.get(source, {}):
                sources_present.append(source)
                total_score += source_trends[source][trend] * TREND_SOURCES[source]["weight"]

        if len(sources_present) >= MIN_SOURCES_FOR_TREND:
            max_possible = sum(TREND_SOURCES[s]["weight"] for s in all_sources)
            confidence = round((total_score / max_possible) * 100) if max_possible > 0 else 0
            validated[trend] = {
                "count": len(sources_present),
                "weighted_score": total_score,
                "confidence": confidence,
                "sources": sources_present,
            }

    return validated


# ======================
# DEMOGRAPHIC WEIGHTING
# ======================

def apply_demographic_weighting(validated_trends: Dict, audience: str, region: str) -> Dict:
    weighted_trends = copy.deepcopy(validated_trends)
    audience_lower = audience.lower()

    if "yogi" in audience_lower or "yoga" in audience_lower:
        age_group = "25-34"
    elif "teen" in audience_lower or "gen z" in audience_lower:
        age_group = "18-24"
    elif "senior" in audience_lower or "retire" in audience_lower:
        age_group = "55+"
    else:
        age_group = "35-54"

    interest_tags = []
    if "eco" in audience_lower or "sustainable" in audience_lower or "green" in audience_lower:
        interest_tags.append("eco_friendly")
    if "yoga" in audience_lower or "fitness" in audience_lower or "wellness" in audience_lower:
        interest_tags.append("yoga_practitioners")

    for trend_name, trend_data in weighted_trends.items():
        base_score = trend_data["weighted_score"]

        if age_group in DEMOGRAPHIC_TRIGGER_MAP["age_groups"]:
            age_weight = DEMOGRAPHIC_TRIGGER_MAP["age_groups"][age_group].get(trend_name, 1.0)
            base_score *= age_weight

        for tag in interest_tags:
            if tag in DEMOGRAPHIC_TRIGGER_MAP["interest_layers"]:
                interest_weight = DEMOGRAPHIC_TRIGGER_MAP["interest_layers"][tag].get(trend_name, 1.0)
                base_score *= interest_weight

        trend_data["demo_weighted_score"] = round(base_score, 3)
        original = trend_data["weighted_score"]
        trend_data["demo_confidence"] = (
            min(100, round(trend_data["confidence"] * (base_score / original))) if original > 0 else 0
        )

    return weighted_trends


# ======================
# CONVERSION ANALYSIS
# ======================

def calculate_conversion_potential(validated_trends: Dict[str, Dict]) -> Dict[str, Any]:
    scores = {
        "engagement": 0.0, "conversion": 0.0, "emotional_valence": 0.0,
        "attention_grab": 0.0, "trust_building": 0.0, "urgency_pressure": 0.0,
    }

    dimension_mapping = {
        "engagement": ["curiosity_gap_engagement", "surprise_engagement", "anticipation_engagement", "power_words"],
        "conversion": ["urgency_scarcity_conversion", "risk_reversal_conversion", "social_proof_conversion", "specificity_conversion", "trust_conversion"],
        "emotional_valence": ["joy_conversion", "trust_conversion", "anticipation_conversion", "optimism_conversion", "-vigilance_conversion"],
        "attention_grab": ["surprise_engagement", "curiosity_gap_engagement"],
        "trust_building": ["trust_conversion", "specificity_conversion", "risk_reversal_conversion"],
        "urgency_pressure": ["urgency_scarcity_conversion", "vigilance_conversion"],
    }

    for dimension, trend_list in dimension_mapping.items():
        dimension_score = 0.0
        weight_sum = 0.0
        for trend in trend_list:
            is_negative = trend.startswith("-")
            actual_trend = trend[1:] if is_negative else trend
            if actual_trend in validated_trends:
                value = validated_trends[actual_trend].get("weighted_score", 0)
                dimension_score += -value if is_negative else value
                weight_sum += 1.0
        if weight_sum > 0:
            scores[dimension] = round(dimension_score / weight_sum, 3)

    conversion_score = sum(scores.get(f, 0) * w for f, w in CONVERSION_MODEL.items())
    conversion_probability = min(100, max(0, conversion_score * 50))

    return {
        "conversion_probability": round(conversion_probability, 1),
        "dimension_scores": scores,
        "key_drivers": _get_top_drivers(validated_trends, scores),
        "recommendations": _generate_optimization_tips(validated_trends, scores),
    }


def _get_top_drivers(validated_trends: Dict, scores: Dict) -> List[Dict]:
    drivers = []
    for emotion in ["joy", "trust", "anticipation", "surprise"]:
        for suffix in ["_engagement", "_conversion"]:
            key = f"{emotion}{suffix}"
            if key in validated_trends:
                drivers.append({
                    "factor": emotion, "type": suffix.replace("_", " ").strip(),
                    "impact": round(validated_trends[key].get("weighted_score", 0), 3),
                    "description": EMOTION_FRAMEWORK.get(emotion, {}).get("description", ""),
                })

    for driver in ["urgency_scarcity", "risk_reversal", "social_proof", "specificity"]:
        for suffix in ["_engagement", "_conversion"]:
            key = f"{driver}{suffix}"
            if key in validated_trends:
                drivers.append({
                    "factor": driver, "type": suffix.replace("_", " ").strip(),
                    "impact": round(validated_trends[key].get("weighted_score", 0), 3),
                    "description": f"{driver.replace('_', ' ').title()} effectiveness",
                })

    drivers.sort(key=lambda x: x["impact"], reverse=True)
    return drivers[:5]


def _generate_optimization_tips(validated_trends: Dict, scores: Dict) -> List[str]:
    tips = []
    if scores["attention_grab"] < 0.3:
        tips.append("Boost initial hook: Add surprising facts or curiosity gaps in first 3 seconds")
    if scores["engagement"] < 0.4:
        tips.append("Increase engagement: Use power words ('discover', 'unlock') and benefit-focused language")
    if scores["conversion"] < 0.4:
        if scores["urgency_pressure"] < 0.3:
            tips.append("Add scarcity: Limited-time offers or low-stock warnings increase conversion by 22%")
        if scores["trust_building"] < 0.4:
            tips.append("Build trust: Include guarantees, certifications, or social proof elements")
        if scores["emotional_valence"] < 0.2:
            tips.append("Improve emotional balance: Increase positive emotions while reducing fear-based messaging")

    format_scores = {
        "video": validated_trends.get("format_video", {}).get("weighted_score", 0),
        "image": validated_trends.get("format_image", {}).get("weighted_score", 0),
        "carousel": validated_trends.get("format_carousel", {}).get("weighted_score", 0),
    }
    best_format = max(format_scores, key=format_scores.get)
    if format_scores[best_format] > 0.5:
        tips.append(f"Prioritize {best_format} ads: Currently showing strongest engagement")

    return tips[:4]


# ======================
# PLATFORM AUDIENCE SPECS
# ======================

def build_platform_audience_specs(
    keyword: str, product_name: str, audience: str, demographic_trends: Dict,
) -> Dict:
    intent_layer = {
        "type": "intent_signal", "value": keyword,
        "platforms": {
            "google": {"match_type": "phrase", "campaign_type": "Performance Max"},
            "meta": {"use_as_lookalike_seed": True, "advantage_plus": True},
        },
    }

    demo_layers = []
    platform_mapping = {
        "risk_reversal_conversion": {
            "meta": ["interest:guarantees", "interest:warranties"],
            "google": ["inmarket:product_guarantees", "custom_intent:money_back_guarantee"],
        },
        "social_proof_conversion": {
            "meta": ["interest:testimonials", "interest:reviews"],
            "google": ["inmarket:product_reviews", "similar_to:review_sites"],
        },
        "specificity_conversion": {
            "meta": ["interest:product_details", "behavior:engaged_shoppers"],
            "google": ["inmarket:technical_specifications", "custom_intent:product_specs"],
        },
    }

    for trend_name, trend_data in demographic_trends.items():
        if trend_data.get("demo_weighted_score", 0) > 0.4 and trend_name in platform_mapping:
            for platform, options in platform_mapping[trend_name].items():
                demo_layers.append({
                    "trend": trend_name, "platform": platform,
                    "targeting_options": options, "weight": trend_data["demo_weighted_score"],
                })

    return {
        "intent_layer": intent_layer,
        "demographic_layers": demo_layers,
        "exclusion_layer": {
            "platforms": {
                "meta": ["exclude:competitor_brands", "exclude:low_quality_placements"],
                "google": ["exclude:parked_domains", "exclude:mobapps"],
            },
        },
        "ethical_note": "Uses ONLY aggregated, anonymized signals - NO individual user data",
    }


# ======================
# CREATIVE MATRIX
# ======================

def generate_creative_matrix(
    demographic_trends: Dict, product_name: str, audience: str, unique_benefit: str,
) -> List[Dict]:
    variants = []

    top_trends = sorted(
        demographic_trends.items(),
        key=lambda x: x[1].get("demo_weighted_score", 0),
        reverse=True,
    )[:2]

    format_scores = {
        k.replace("format_", ""): v.get("demo_weighted_score", 0)
        for k, v in demographic_trends.items()
        if k.startswith("format_")
    }
    preferred_format = max(format_scores, key=format_scores.get) if format_scores else "image"

    if top_trends:
        trend1_name, trend1_data = top_trends[0]
        trend1_base = trend1_name.replace("_engagement", "").replace("_conversion", "")

        hook_templates = {
            "risk_reversal": f"As a {audience}, try {product_name} risk-free—{unique_benefit} guaranteed or your money back.",
            "social_proof": f"Join {audience} who switched to {product_name} for {unique_benefit}. See why they never went back.",
            "specificity": f"How {product_name} delivers {unique_benefit}: [SPECIFIC MECHANISM] (tested by [AUTHORITY]).",
            "anticipation": f"The {audience}'s upgrade is here: {product_name} with {unique_benefit}—early access now.",
            "curiosity_gap": f"What most {audience} miss about {unique_benefit}—and how {product_name} fixes it.",
        }
        hook = hook_templates.get(trend1_base, f"Discover how {product_name} gives {audience} {unique_benefit}.")

        cta_options = {
            "video": ["Watch the Demo", "See How It Works"],
            "image": ["Learn More", "See Details"],
            "carousel": ["Explore Features", "Swipe Through Benefits"],
        }
        cta = cta_options.get(preferred_format, ["Learn More", "Get Started"])[0]

        variants.append({
            "name": f"{trend1_base.replace('_', ' ').title()}-First Framework",
            "hook": hook, "cta": cta, "format": preferred_format,
            "why": f"Leverages {trend1_base} (top trend for {audience}) + your unique truth",
            "test_priority": "high" if trend1_data.get("demo_weighted_score", 0) > 0.6 else "medium",
        })

    if len(top_trends) > 1 and top_trends[1][1].get("demo_weighted_score", 0) > 0.4:
        trend2_name, trend2_data = top_trends[1]
        trend2_base = trend2_name.replace("_engagement", "").replace("_conversion", "")

        compatible_pairs = [
            ("risk_reversal", "social_proof"),
            ("specificity", "anticipation"),
            ("joy", "curiosity_gap"),
        ]
        pair = (trend1_base, trend2_base)
        if pair in compatible_pairs or (trend2_base, trend1_base) in compatible_pairs:
            hook = (
                f"As a {audience}, experience {unique_benefit} with {product_name}"
                f"—{trend1_base.replace('_', ' ')} proven by {trend2_base.replace('_', ' ')}."
            )
            variants.append({
                "name": f"{trend1_base.replace('_', ' ').title()}+{trend2_base.replace('_', ' ').title()} Combo",
                "hook": hook, "cta": "Get Yours Today", "format": preferred_format,
                "why": f"Combines {trend1_base} + {trend2_base} (top 2 trends)",
                "test_priority": "high",
            })

    return variants


# ======================
# PERFORMANCE FEEDBACK (V4)
# ======================

def fetch_anonymized_performance_data(keyword: str, audience: str, period_days: int) -> Dict:
    logger.warning("fetch_anonymized_performance_data is a stub — integrate with Meta/Google Ads API")
    return {}


def extract_age_group(demo_segment: str) -> str:
    match = re.search(r"age_(\d+-\d+|\d+\+)", demo_segment)
    return match.group(1) if match else "25-34"


def extract_interests(demo_segment: str) -> List[str]:
    interests = []
    if "eco" in demo_segment:
        interests.append("eco_friendly")
    if "yoga" in demo_segment:
        interests.append("yoga_practitioners")
    return interests


def save_demographic_weights(trigger_map: Dict) -> None:
    path = os.path.join(OUTPUT_DIR, "demographic_weights.json")
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(trigger_map, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved demographic weights to {path}")
    except Exception as e:
        logger.error(f"Failed to save demographic weights: {e}")


def update_trend_weights_from_performance(keyword: str, audience: str, period_days: int = 14) -> None:
    perf_data = fetch_anonymized_performance_data(keyword, audience, period_days)
    if not perf_data:
        logger.warning("No performance data to update trends")
        return

    for demo_segment, metrics in perf_data.items():
        age_group = extract_age_group(demo_segment)
        for trend_name in DEMOGRAPHIC_TRIGGER_MAP["age_groups"].get(age_group, {}):
            if trend_name in metrics:
                observed_lift = metrics[trend_name]
                current = DEMOGRAPHIC_TRIGGER_MAP["age_groups"][age_group].get(trend_name, 1.0)
                new_weight = round(0.7 * current + 0.3 * (1.0 + observed_lift), 3)
                DEMOGRAPHIC_TRIGGER_MAP["age_groups"][age_group][trend_name] = new_weight
                logger.info(f"Updated {age_group} {trend_name}: {current} -> {new_weight} ({observed_lift:.1%} lift)")

    save_demographic_weights(DEMOGRAPHIC_TRIGGER_MAP)


# ======================
# INSIGHT EXPORT
# ======================

def save_insights(keyword: str, insights: Dict, product_name: str, audience: str, unique_benefit: str) -> str:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{OUTPUT_DIR}/insights_{keyword.replace(' ', '_')}_{timestamp}.csv"

    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Keyword", "Product", "Audience", "Unique Benefit", "Timestamp",
            "Trend Type", "Trend Name", "Confidence", "Weighted Score",
            "Engagement Impact", "Conversion Impact", "Emotional Valence",
            "Recommendation", "Why It Works",
        ])

        for trend_name, trend_data in insights.items():
            engagement = insights.get(f"{trend_name}_engagement", {}).get("weighted_score", 0)
            conversion = insights.get(f"{trend_name}_conversion", {}).get("weighted_score", 0)
            emotion = next((e for e in EMOTION_FRAMEWORK if e in trend_name), "neutral")

            writer.writerow([
                keyword, product_name, audience, unique_benefit,
                datetime.now().isoformat(),
                "emotional" if any(e in trend_name for e in EMOTION_FRAMEWORK) else "structural",
                trend_name, trend_data.get("confidence", 0), trend_data.get("weighted_score", 0),
                round(engagement, 3), round(conversion, 3), emotion,
                _get_trend_recommendation(trend_name, engagement, conversion),
                _get_trend_explanation(trend_name),
            ])

    print(f"Ethical insights saved to {filename}")
    return filename


def _get_trend_recommendation(trend_name: str, engagement: float, conversion: float) -> str:
    if "engagement" in trend_name:
        base = trend_name.replace("_engagement", "")
        if engagement > 0.7:
            return f"Amplify {base} elements - strong attention getter"
        elif engagement > 0.4:
            return f"Moderately enhance {base} for better hook"
        return f"Consider testing {base} variations"
    base = trend_name.replace("_conversion", "")
    if conversion > 0.7:
        return f"Leverage {base} - high conversion driver"
    elif conversion > 0.4:
        return f"Strengthen {base} elements"
    return f"Test {base} in combination with other triggers"


def _get_trend_explanation(trend_name: str) -> str:
    base = trend_name.replace("_engagement", "").replace("_conversion", "")
    if base in EMOTION_FRAMEWORK:
        return EMOTION_FRAMEWORK[base]["description"]
    explanations = {
        "urgency_scarcity": "Triggers fear of missing out (FOMO) through time/quantity constraints",
        "risk_reversal": "Reduces perceived purchase risk through guarantees or trials",
        "social_proof": "Leverages social validation to reduce uncertainty",
        "specificity": "Increases credibility through concrete, verifiable claims",
        "power_words": "Uses psychologically potent action verbs to drive response",
        "curiosity_gap": "Creates psychological tension requiring resolution",
        "format_video": "Video content increases engagement duration and information retention",
        "format_carousel": "Carousel format allows stepwise storytelling and feature highlighting",
    }
    return explanations.get(base, f"{base.replace('_', ' ').title()} pattern effectiveness")
