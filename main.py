#!/usr/bin/env python3
"""
EthicalAdTracker v4.0 — CLI Entry Point
Ethical Ad Intelligence Platform for original creative inspiration.
"""

import argparse
import json as json_module
import logging
import os
import warnings
from datetime import datetime

warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", message=".*urllib3.*")

from ads_scout.config import TREND_SOURCES, MIN_SOURCES_FOR_TREND, TREND_HISTORY_DAYS, OUTPUT_DIR, LOG_LEVEL
from ads_scout.fetchers import setup_directories, FETCHER_MAP
from ads_scout.analysis import (
    extract_generalized_trends,
    validate_trends,
    apply_demographic_weighting,
    calculate_conversion_potential,
    generate_creative_matrix,
    build_platform_audience_specs,
    save_insights,
)


def run_analysis(keyword: str, product: str, audience: str, benefit: str, region: str = "US") -> dict:
    """Run the full analysis pipeline and return structured results.

    This function does NOT print anything — it only returns data.
    Logging goes to file only.
    """
    logger = logging.getLogger(__name__)

    # 1. Fetch from all enabled sources
    source_data: dict = {}
    sources_status: dict = {}
    for source, config in TREND_SOURCES.items():
        if not config["enabled"]:
            continue
        try:
            fetcher = FETCHER_MAP.get(source)
            if fetcher:
                source_data[source] = fetcher(keyword, region)
                if source_data[source]:
                    sources_status[source] = {"count": len(source_data[source]), "status": "ok"}
                else:
                    sources_status[source] = {"count": 0, "status": "empty"}
        except Exception as e:
            logger.error(f"Failed to fetch from {source}: {e}")
            source_data[source] = []
            sources_status[source] = {"count": 0, "status": "failed"}

    # 2. Extract generalized trends
    source_trends: dict = {}
    for source, ads in source_data.items():
        if ads:
            source_trends[source] = extract_generalized_trends(ads, source)
        else:
            source_trends[source] = {}

    # 3. Validate trends
    validated_trends = validate_trends(source_trends)

    # Build result dict with defaults for empty trends
    analysis: dict = {}
    variants: list = []
    specs: dict = {}

    if validated_trends:
        # 4. Demographic weighting
        demo_trends = apply_demographic_weighting(validated_trends, audience, region)

        # 5. Conversion analysis
        analysis = calculate_conversion_potential(validated_trends)

        # 6. Creative matrix
        variants = generate_creative_matrix(demo_trends, product, audience, benefit)

        # 7. Platform audience specs
        specs = build_platform_audience_specs(keyword, product, audience, demo_trends)

        # 8. Save insights
        save_insights(keyword, validated_trends, product, audience, benefit)

    return {
        "keyword": keyword,
        "product": product,
        "audience": audience,
        "benefit": benefit,
        "region": region,
        "sources": sources_status,
        "validated_trends": validated_trends,
        "conversion_analysis": analysis,
        "creative_frameworks": variants,
        "audience_specs": specs,
        "timestamp": datetime.now().isoformat(),
    }


def _print_human_readable(result: dict) -> None:
    """Print the analysis result in the original human-readable format."""
    keyword = result["keyword"]
    product = result["product"]
    audience = result["audience"]
    benefit = result["benefit"]
    region = result["region"]
    validated_trends = result["validated_trends"]
    analysis = result["conversion_analysis"]
    variants = result["creative_frameworks"]
    specs = result["audience_specs"]
    sources = result["sources"]

    enabled_sources = list(sources.keys())
    print(f"EthicalAdTracker v4.0: Analyzing TRENDS for '{keyword}' (for ORIGINAL inspiration only)")
    print(f"Target: {product} for {audience} | Benefit: {benefit}")
    print(f"Region: {region} | Sources: {enabled_sources}")
    print()

    # Source fetch results
    for source, info in sources.items():
        if info["status"] == "ok":
            print(f"  {source}: Found {info['count']} quality signals")
        elif info["status"] == "empty":
            print(f"  {source}: No data retrieved")
        else:
            print(f"  {source}: Failed")

    # Extracted trends counts
    print()

    # Validated trends
    print(f"VALIDATED TRENDS (appear in >={MIN_SOURCES_FOR_TREND} sources):")
    for trend, data in validated_trends.items():
        print(f"  {trend}: {data['count']} sources | {data['confidence']}% confidence | Score: {data['weighted_score']:.3f}")

    if not validated_trends:
        print("No strong trends found. Try a broader keyword or check back later.")
    else:
        # Conversion analysis
        dim = analysis["dimension_scores"]
        print("\nCONVERSION INTELLIGENCE ANALYSIS:")
        print(f"  Conversion Probability: {analysis['conversion_probability']}%")
        print(f"  Emotional Valence: {dim['emotional_valence']:.2f}")
        print(f"  Attention Grab: {dim['attention_grab']:.2f}")
        print(f"  Trust Building: {dim['trust_building']:.2f}")
        print(f"  Urgency Pressure: {dim['urgency_pressure']:.2f}")

        print("\nTOP CONVERSION DRIVERS:")
        for i, d in enumerate(analysis["key_drivers"], 1):
            print(f"  {i}. {d['factor'].title()} ({d['type']}): {d['impact']:.3f}")
            print(f"     -> {d['description']}")

        print("\nETHICAL AD INSPIRATION:")
        for i, tip in enumerate(analysis["recommendations"], 1):
            print(f"  {i}. {tip}")

        # Creative matrix
        print("\nORIGINAL AD FRAMEWORKS (NOT COPIES):")
        if variants:
            for i, v in enumerate(variants, 1):
                print(f"  {i}. {v['name']} [{v['test_priority']} priority]")
                print(f"     Hook: {v['hook']}")
                print(f"     CTA: {v['cta']} | Format: {v['format']}")
                print(f"     Why: {v['why']}")
                print()
        else:
            print("  Focus on improving trust signals and specificity in your messaging")

        # Platform audience specs
        print("PLATFORM AUDIENCE SPECS:")
        print(f"  Intent: {specs['intent_layer']['value']}")
        print(f"  Demographic layers: {len(specs['demographic_layers'])}")
        print(f"  Note: {specs['ethical_note']}")

    print("\nETHICAL REMINDER:")
    print("  - This tool analyzes GENERALIZED PATTERNS only - NO specific ad creatives stored")
    print("  - Replace [bracketed] ideas with YOUR product's SPECIFIC, VERIFIABLE claims")
    print("  - NEVER use raw output as ad copy - it's a starting point for ethical brainstorming")
    print("  - Always add: Your brand voice, customer proof, and unique offer")
    print(f"  - Data freshness: Insights based on last {TREND_HISTORY_DAYS} days of public trend data")
    print("\nAnalysis complete. Use insights responsibly to create original, ethical advertising.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ethical Ad Intelligence Tracker v4.0")
    parser.add_argument("--keyword", required=True, help="Your product niche (NOT competitor brand)")
    parser.add_argument("--product", required=True, help="Your product name")
    parser.add_argument("--audience", required=True, help="Your target audience")
    parser.add_argument("--benefit", required=True, help="Your unique value proposition")
    parser.add_argument("--region", default="US", help="Target region (default: US)")
    parser.add_argument("--format", choices=["text", "json"], default="text",
                        help="Output format: text (human-readable) or json (machine-readable)")
    args = parser.parse_args()

    # Setup
    setup_directories()

    # Configure logging — suppress StreamHandler when outputting JSON
    handlers = [logging.FileHandler(os.path.join(OUTPUT_DIR, "ad_tracker.log"))]
    if args.format == "text":
        handlers.append(logging.StreamHandler())

    logging.basicConfig(
        level=LOG_LEVEL,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=handlers,
    )

    # Run pipeline
    result = run_analysis(args.keyword, args.product, args.audience, args.benefit, args.region)

    # Output
    if args.format == "json":
        print(json_module.dumps(result))
    else:
        _print_human_readable(result)


if __name__ == "__main__":
    main()
