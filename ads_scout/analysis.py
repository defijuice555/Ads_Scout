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
    TREND_DISPLAY_NAMES, DIMENSION_TOOLTIPS,
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
        "engagement": ["curiosity_gap_engagement", "surprise_engagement", "anticipation_engagement", "power_words", "product_research", "use_case"],
        "conversion": ["urgency_scarcity_conversion", "risk_reversal_conversion", "social_proof_conversion", "specificity_conversion", "trust_conversion", "purchase_intent", "product_bundle"],
        "emotional_valence": ["joy_conversion", "trust_conversion", "anticipation_conversion", "optimism_conversion", "-vigilance_conversion"],
        "attention_grab": ["surprise_engagement", "curiosity_gap_engagement", "product_research"],
        "trust_building": ["trust_conversion", "specificity_conversion", "risk_reversal_conversion", "product_attributes", "brand_comparison"],
        "urgency_pressure": ["urgency_scarcity_conversion", "vigilance_conversion", "purchase_intent"],
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

    # --- Opportunity score (replaces broken CONVERSION_MODEL lookup) ---
    commercial_keys = {"purchase_intent", "product_research", "product_attributes", "product_bundle", "use_case", "brand_comparison", "accessory_interest"}
    commercial_count = sum(1 for k in validated_trends if k in commercial_keys)

    # 1. Signal density: how many commercial signals detected (0-40 pts)
    signal_score = min(40, commercial_count * 10)

    # 2. Signal strength: avg weighted_score across all validated trends (0-35 pts)
    if validated_trends:
        avg_strength = sum(t.get("weighted_score", 0) for t in validated_trends.values()) / len(validated_trends)
    else:
        avg_strength = 0
    strength_score = min(35, avg_strength * 50)

    # 3. Source diversity bonus: validated trends need 2+ sources, more = better (0-25 pts)
    if validated_trends:
        avg_sources = sum(len(t.get("sources", [])) if isinstance(t.get("sources"), list) else t.get("sources", 0) for t in validated_trends.values()) / len(validated_trends)
        source_score = min(25, avg_sources * 5)
    else:
        source_score = 0

    conversion_probability = min(100, max(0, round(signal_score + strength_score + source_score, 1)))

    return {
        "conversion_probability": round(conversion_probability, 1),
        "dimension_scores": scores,
        "dimension_tooltips": DIMENSION_TOOLTIPS,
        "key_drivers": _get_top_drivers(validated_trends, scores),
        "recommendations": _generate_optimization_tips(validated_trends, scores),
    }


def generate_market_summary(
    validated_trends: Dict, sources_status: Dict, keyword: str, conversion_analysis: Dict,
) -> Dict:
    """Produce a concise market summary for the analysis output."""
    opportunity_score = conversion_analysis.get("conversion_probability", 0)
    signal_count = len(validated_trends)

    # Source coverage
    total_sources = len(sources_status)
    active_sources = sum(1 for s in sources_status.values() if s.get("status") == "ok")
    source_coverage = f"{active_sources} of {total_sources} sources returned data"

    # Top angle — highest weighted_score trend
    if validated_trends:
        best_trend_key = max(
            validated_trends,
            key=lambda k: validated_trends[k].get("weighted_score", 0),
        )
        top_angle = TREND_DISPLAY_NAMES.get(best_trend_key, best_trend_key.replace("_", " ").title())
    else:
        top_angle = "General Awareness"

    # Best format from format trends
    format_scores = {
        k.replace("format_", ""): v.get("weighted_score", 0)
        for k, v in validated_trends.items()
        if k.startswith("format_")
    }
    best_format = max(format_scores, key=format_scores.get) if format_scores else "image"

    # Summary text
    if signal_count > 0:
        summary_text = (
            f"Strong {'feature interest' if signal_count >= 4 else 'market signal'} "
            f"detected across {active_sources} sources for '{keyword}'. "
            f"Best angle: lead with {top_angle.lower()} claims."
        )
    else:
        summary_text = (
            f"Limited signals detected for '{keyword}' across {active_sources} sources. "
            f"Consider broadening the keyword or testing general awareness campaigns."
        )

    return {
        "opportunity_score": round(opportunity_score, 1),
        "summary_text": summary_text,
        "top_angle": top_angle,
        "source_coverage": source_coverage,
        "best_format": best_format,
        "signal_count": signal_count,
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

    commercial_descriptions = {
        "purchase_intent": "High commercial intent signals — audience ready to buy",
        "product_research": "Active research phase — audience comparing options",
        "product_attributes": "Feature-focused queries — audience values specifics",
        "product_bundle": "Bundle/kit interest — upsell and AOV opportunity",
        "use_case": "Use-case queries — audience seeking solutions for specific needs",
        "brand_comparison": "Brand awareness — audience familiar with category leaders",
        "accessory_interest": "Accessory demand — cross-sell and complementary product opportunity",
    }
    for key, desc in commercial_descriptions.items():
        if key in validated_trends:
            drivers.append({
                "factor": key, "type": "commercial signal",
                "impact": round(validated_trends[key].get("weighted_score", 0), 3),
                "description": desc,
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

def _brief_priority(trend_data: Optional[Dict]) -> str:
    """Return 'high' if weighted_score > 0.3 or sources >= 4, else 'medium'."""
    if trend_data is None:
        return "medium"
    if trend_data.get("weighted_score", 0) > 0.3:
        return "high"
    if trend_data.get("count", 0) >= 4:
        return "high"
    return "medium"


def _find_trend(demographic_trends: Dict, *keywords: str) -> Optional[Dict]:
    """Return the first trend data dict whose key contains any of the keywords."""
    for key, data in demographic_trends.items():
        for kw in keywords:
            if kw in key:
                return data
    return None


def _top_trend_insight(demographic_trends: Dict) -> str:
    """Return the display name of the highest-scoring trend."""
    if not demographic_trends:
        return "market trends"
    best_key = max(
        demographic_trends,
        key=lambda k: demographic_trends[k].get("demo_weighted_score", demographic_trends[k].get("weighted_score", 0)),
    )
    return TREND_DISPLAY_NAMES.get(best_key, best_key.replace("_", " ").title())


def _product_category(keyword: str, product_name: str) -> str:
    """Derive a short product category label."""
    return keyword if keyword else product_name


def generate_creative_matrix(
    demographic_trends: Dict, product_name: str, audience: str, unique_benefit: str,
) -> List[Dict]:
    briefs: List[Dict] = []
    category = _product_category("", product_name)

    # Determine which signal groups are present
    has_trust = _find_trend(demographic_trends, "product_attributes", "brand_comparison", "trust_conversion") is not None
    has_offer = _find_trend(demographic_trends, "purchase_intent", "product_bundle") is not None
    has_problem = _find_trend(demographic_trends, "product_research", "use_case") is not None
    has_social = _find_trend(demographic_trends, "social_proof") is not None

    # Check if 4+ sources agree on any single trend
    four_plus_sources = any(
        v.get("count", 0) >= 4 for v in demographic_trends.values()
    )

    top_insight = _top_trend_insight(demographic_trends)

    # --- 1. Hook-First (always generated) ---
    hook_trigger = _find_trend(demographic_trends, "surprise", "curiosity_gap", "joy", "anticipation")
    briefs.append({
        "angle": "Hook-First",
        "headline": f"Did you know most {audience} overlook {top_insight} when choosing {category}?",
        "body_direction": (
            f"Open with a surprising question or stat. "
            f"Pivot to how {product_name} solves this. "
            f"End with {unique_benefit}."
        ),
        "cta": "See Why",
        "format": "video",
        "platform": "Meta Reels, TikTok, YouTube Shorts",
        "why": f"Top engagement signal is {top_insight} — short-form video hooks capture attention fastest",
        "priority": _brief_priority(hook_trigger),
    })

    # --- 2. Trust-First ---
    if has_trust:
        trust_data = _find_trend(demographic_trends, "product_attributes", "brand_comparison", "trust_conversion")
        top_attr_insight = _top_trend_insight({
            k: v for k, v in demographic_trends.items()
            if any(t in k for t in ("product_attributes", "brand_comparison", "trust_conversion"))
        })
        briefs.append({
            "angle": "Trust-First",
            "headline": f"Independent sources confirm: {audience} prioritize {top_attr_insight} in {category}",
            "body_direction": (
                f"Lead with data/proof. "
                f"Show specific features {audience} search for. "
                f"Back with {unique_benefit}."
            ),
            "cta": "See the Proof",
            "format": "carousel",
            "platform": "Meta Feed, Google Display",
            "why": f"Trust signals detected ({top_attr_insight}) — proof-led creatives convert high-consideration buyers",
            "priority": _brief_priority(trust_data),
        })

    # --- 3. Offer-First ---
    if has_offer:
        offer_data = _find_trend(demographic_trends, "purchase_intent", "product_bundle")
        briefs.append({
            "angle": "Offer-First",
            "headline": f"The complete {category} solution: {product_name} delivers {unique_benefit}",
            "body_direction": (
                f"Lead with the value package. "
                f"{'Suggest bundle angle — bundle demand detected. ' if _find_trend(demographic_trends, 'product_bundle') else ''}"
                f"Emphasize complete solution."
            ),
            "cta": "Get Started",
            "format": "carousel",
            "platform": "Meta Carousel, Google Shopping",
            "why": "Purchase intent or bundle demand detected — offer-led creative captures ready-to-buy audience",
            "priority": _brief_priority(offer_data),
        })

    # --- 4. Problem-First ---
    if has_problem:
        problem_data = _find_trend(demographic_trends, "product_research", "use_case")
        briefs.append({
            "angle": "Problem-First",
            "headline": f"Still searching for the right {category}? Here's what {audience} actually need",
            "body_direction": (
                f"Acknowledge the search frustration. "
                f"Position {product_name} as the answer to their research. "
                f"Deliver {unique_benefit} as proof."
            ),
            "cta": "Find Your Solution",
            "format": "video",
            "platform": "Google Search, YouTube Pre-roll",
            "why": "Active research/use-case queries detected — problem-aware copy meets the audience mid-funnel",
            "priority": _brief_priority(problem_data),
        })

    # --- 5. Social-Proof-First ---
    if has_social or four_plus_sources:
        social_data = _find_trend(demographic_trends, "social_proof")
        briefs.append({
            "angle": "Social-Proof-First",
            "headline": f"{audience} are choosing {product_name} for {unique_benefit} — here's why",
            "body_direction": (
                f"Lead with crowd validation. "
                f"Show that the market is moving toward {category}. "
                f"Use {unique_benefit} as differentiator."
            ),
            "cta": "Join Them",
            "format": "video",
            "platform": "Meta Stories, Instagram",
            "why": (
                "Social proof signals detected"
                + (" and 4+ sources agree on trend direction" if four_plus_sources else "")
                + " — crowd validation drives action"
            ),
            "priority": _brief_priority(social_data),
        })

    return briefs


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

    logger.info(f"Ethical insights saved to {filename}")
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
