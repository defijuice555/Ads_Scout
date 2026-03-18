#!/usr/bin/env python3
"""
CLI entry point for the 3-agent emotional ad strategy system.

Reads analysis JSON from stdin, runs 3 agents (Claude or GPT) in parallel,
and prints the strategies as JSON to stdout.
"""

import json
import sys

from ads_scout.agents import generate_ai_strategies, load_api_key, load_provider


def main() -> None:
    provider = load_provider()
    api_key = load_api_key()

    if not api_key:
        label = "Anthropic" if provider == "anthropic" else "OpenAI"
        print(json.dumps({"error": f"No {label} API key configured. Add it in AI Settings."}))
        sys.exit(1)

    try:
        analysis_data = json.loads(sys.stdin.read())
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {e}"}))
        sys.exit(1)

    strategies = generate_ai_strategies(analysis_data, api_key, provider)
    print(json.dumps({"strategies": strategies, "provider": provider}))


if __name__ == "__main__":
    main()
