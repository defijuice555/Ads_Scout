#!/usr/bin/env python3
"""
EthicalAdTracker v4.0 — CLI Entry Point
Ethical Ad Intelligence Platform for original creative inspiration.
"""

import argparse
import logging
import os

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


def main() -> None:
    parser = argparse.ArgumentParser(description="Ethical Ad Intelligence Tracker v4.0")
    parser.add_argument("--keyword", required=True, help="Your product niche (NOT competitor brand)")
    parser.add_argument("--product", required=True, help="Your product name")
    parser.add_argument("--audience", required=True, help="Your target audience")
    parser.add_argument("--benefit", required=True, help="Your unique value proposition")
    parser.add_argument("--region", default="US", help="Target region (default: US)")
    args = parser.parse_args()

    # Setup
    setup_directories()
    logging.basicConfig(
        level=LOG_LEVEL,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(os.path.join(OUTPUT_DIR, "ad_tracker.log")),
            logging.StreamHandler(),
        ],
    )
    logger = logging.getLogger(__name__)

    enabled_sources = [s for s in TREND_SOURCES if TREND_SOURCES[s]["enabled"]]
    print(f"EthicalAdTracker v4.0: Analyzing TRENDS for '{args.keyword}' (for ORIGINAL inspiration only)")
    print(f"Target: {args.product} for {args.audience} | Benefit: {args.benefit}")
    print(f"Region: {args.region} | Sources: {enabled_sources}")
    print()

    # 1. Fetch from all enabled sources
    source_data = {}
    for source, config in TREND_SOURCES.items():
        if not config["enabled"]:
            continue
        print(f"Fetching from {source}...")
        try:
            fetcher = FETCHER_MAP.get(source)
            if fetcher:
                source_data[source] = fetcher(args.keyword, args.region)
                if source_data[source]:
                    print(f"  {source}: Found {len(source_data[source])} quality signals")
                else:
                    print(f"  {source}: No data retrieved")
        except Exception as e:
            logger.error(f"Failed to fetch from {source}: {e}")
            source_data[source] = []

    # 2. Extract generalized trends
    source_trends = {}
    for source, ads in source_data.items():
        if ads:
            source_trends[source] = extract_generalized_trends(ads, source)
            print(f"{source}: Extracted {len(source_trends[source])} generalized patterns")
        else:
            source_trends[source] = {}

    # 3. Validate trends
    validated_trends = validate_trends(source_trends)
    print(f"\nVALIDATED TRENDS (appear in >={MIN_SOURCES_FOR_TREND} sources):")
    for trend, data in validated_trends.items():
        print(f"  {trend}: {data['count']} sources | {data['confidence']}% confidence | Score: {data['weighted_score']:.3f}")

    if not validated_trends:
        print("No strong trends found. Try a broader keyword or check back later.")
    else:
        # 4. Demographic weighting
        demo_trends = apply_demographic_weighting(validated_trends, args.audience, args.region)

        # 5. Conversion analysis
        print("\nCONVERSION INTELLIGENCE ANALYSIS:")
        analysis = calculate_conversion_potential(validated_trends)
        dim = analysis["dimension_scores"]
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

        # 6. Creative matrix
        print("\nORIGINAL AD FRAMEWORKS (NOT COPIES):")
        variants = generate_creative_matrix(demo_trends, args.product, args.audience, args.benefit)
        if variants:
            for i, v in enumerate(variants, 1):
                print(f"  {i}. {v['name']} [{v['test_priority']} priority]")
                print(f"     Hook: {v['hook']}")
                print(f"     CTA: {v['cta']} | Format: {v['format']}")
                print(f"     Why: {v['why']}")
                print()
        else:
            print("  Focus on improving trust signals and specificity in your messaging")

        # 7. Platform audience specs
        specs = build_platform_audience_specs(args.keyword, args.product, args.audience, demo_trends)
        print("PLATFORM AUDIENCE SPECS:")
        print(f"  Intent: {specs['intent_layer']['value']}")
        print(f"  Demographic layers: {len(specs['demographic_layers'])}")
        print(f"  Note: {specs['ethical_note']}")

        # 8. Save insights
        save_insights(args.keyword, validated_trends, args.product, args.audience, args.benefit)

    print("\nETHICAL REMINDER:")
    print("  - This tool analyzes GENERALIZED PATTERNS only - NO specific ad creatives stored")
    print("  - Replace [bracketed] ideas with YOUR product's SPECIFIC, VERIFIABLE claims")
    print("  - NEVER use raw output as ad copy - it's a starting point for ethical brainstorming")
    print("  - Always add: Your brand voice, customer proof, and unique offer")
    print(f"  - Data freshness: Insights based on last {TREND_HISTORY_DAYS} days of public trend data")
    print("\nAnalysis complete. Use insights responsibly to create original, ethical advertising.")


if __name__ == "__main__":
    main()
