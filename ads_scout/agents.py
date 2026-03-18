"""
3-Agent Emotional Ad Strategy System powered by Claude or GPT.

Each agent takes the same analysis data but generates a strategy
through a different emotional lens:
  1. Pain/Fear — loss aversion, problem awareness
  2. Desire/Aspiration — dream outcome, transformation
  3. Urgency/Scarcity — limited availability, FOMO

Supports both Anthropic (Claude) and OpenAI (GPT) as LLM providers.
"""

import json
import logging
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

CONFIG_PATH = os.path.join(os.path.expanduser("~"), ".ads-scout", "config.json")

# ---------------------------------------------------------------------------
# Config management
# ---------------------------------------------------------------------------

def load_config() -> Dict[str, Any]:
    """Read the full config from ~/.ads-scout/config.json."""
    if not os.path.exists(CONFIG_PATH):
        return {}
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to read config: {e}")
        return {}


def save_config(updates: Dict[str, Any]) -> None:
    """Merge updates into ~/.ads-scout/config.json."""
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    data = load_config()
    data.update(updates)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def load_api_key() -> Optional[str]:
    """Read the active API key based on selected provider."""
    config = load_config()
    provider = config.get("llm_provider", "anthropic")
    key_map = {
        "anthropic": "anthropic_api_key",
        "openai": "openai_api_key",
        "minimax": "minimax_api_key",
    }
    return config.get(key_map.get(provider, "anthropic_api_key")) or None


def load_provider() -> str:
    """Read which LLM provider is selected."""
    config = load_config()
    return config.get("llm_provider", "anthropic")


# ---------------------------------------------------------------------------
# Agent definitions
# ---------------------------------------------------------------------------

AGENTS = [
    {
        "name": "Pain/Fear Agent",
        "emotional_angle": "pain_fear",
        "system_prompt": """You are an expert advertising strategist specializing in PAIN-POINT and FEAR-BASED messaging.

Your approach: Identify what the audience is AFRAID of, what they're SUFFERING from, and what they'll LOSE if they don't act. Frame the product as the solution that eliminates their pain.

Psychological principles you use:
- Loss aversion (people fear losing more than they desire gaining)
- Problem awareness (make the pain vivid before offering relief)
- Negative outcome visualization ("without this, here's what happens...")
- Social comparison fear ("others already solved this — you're falling behind")

You MUST respond with ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "headline": "A compelling headline that leads with the pain point (max 15 words)",
  "body_direction": "2-3 sentences describing the ad body copy approach — how to frame the problem, agitate it, then present the solution",
  "cta": "A direct call-to-action that implies relief from pain (max 8 words)",
  "emotional_hook": "1 sentence explaining the core fear/pain this ad targets",
  "platform_recommendation": "Which ad platform and format works best for this angle and why",
  "why_this_works": "2-3 sentences on the psychology behind this strategy for this specific keyword/audience"
}""",
    },
    {
        "name": "Desire/Aspiration Agent",
        "emotional_angle": "desire_aspiration",
        "system_prompt": """You are an expert advertising strategist specializing in DESIRE and ASPIRATION-BASED messaging.

Your approach: Paint a vivid picture of the DREAM OUTCOME. Show the audience the TRANSFORMATION they'll experience. Make them feel the joy, confidence, and pride of having solved their problem.

Psychological principles you use:
- Future pacing (help them visualize life AFTER using the product)
- Identity shift ("become the person who...")
- Aspirational social proof ("join thousands who transformed their...")
- Positive emotion activation (joy, pride, confidence, excitement)

You MUST respond with ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "headline": "A compelling headline that leads with the dream outcome (max 15 words)",
  "body_direction": "2-3 sentences describing the ad body copy approach — how to paint the transformation, build desire, then offer the path",
  "cta": "A direct call-to-action that implies achieving the dream (max 8 words)",
  "emotional_hook": "1 sentence explaining the core desire/aspiration this ad targets",
  "platform_recommendation": "Which ad platform and format works best for this angle and why",
  "why_this_works": "2-3 sentences on the psychology behind this strategy for this specific keyword/audience"
}""",
    },
    {
        "name": "Urgency/Scarcity Agent",
        "emotional_angle": "urgency_scarcity",
        "system_prompt": """You are an expert advertising strategist specializing in URGENCY and SCARCITY-BASED messaging.

Your approach: Create a sense of NOW-OR-NEVER. Combine time pressure with limited availability to trigger immediate action. Make waiting feel like a costly mistake.

Psychological principles you use:
- Scarcity bias (limited spots/time increases perceived value)
- FOMO — Fear Of Missing Out (others are acting NOW)
- Temporal discounting (immediate action > future planning)
- Commitment escalation (small first step leads to full conversion)
- Social urgency ("X people are looking at this right now")

You MUST respond with ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "headline": "A compelling headline that creates urgency or scarcity (max 15 words)",
  "body_direction": "2-3 sentences describing the ad body copy approach — how to build urgency, show what's at stake, and drive immediate action",
  "cta": "A direct call-to-action with urgency language (max 8 words)",
  "emotional_hook": "1 sentence explaining the core urgency/scarcity trigger this ad uses",
  "platform_recommendation": "Which ad platform and format works best for this angle and why",
  "why_this_works": "2-3 sentences on the psychology behind this strategy for this specific keyword/audience"
}""",
    },
]


# ---------------------------------------------------------------------------
# Context builder
# ---------------------------------------------------------------------------

def _build_context(data: Dict[str, Any]) -> str:
    """Build a concise prompt context string from analysis results."""
    lines = [
        f"KEYWORD: {data.get('keyword', '')}",
        f"PRODUCT: {data.get('product', '')}",
        f"TARGET AUDIENCE: {data.get('audience', '')}",
        f"KEY BENEFIT: {data.get('benefit', '')}",
    ]

    geo_parts = [p for p in [data.get("city", ""), data.get("state", "")] if p]
    if geo_parts:
        lines.append(f"GEO TARGET: {', '.join(geo_parts)}")

    conv = data.get("conversion_analysis", {})
    if conv:
        lines.append(f"\nCONVERSION PROBABILITY: {conv.get('conversion_probability', 0)}%")
        dims = conv.get("dimension_scores", {})
        if dims:
            lines.append("DIMENSION SCORES:")
            for dim, score in dims.items():
                label = dim.replace("_", " ").title()
                lines.append(f"  {label}: {score:.2f}" if isinstance(score, float) else f"  {label}: {score}")

        drivers = conv.get("key_drivers", [])
        if drivers:
            lines.append("\nTOP CONVERSION DRIVERS:")
            for d in drivers[:5]:
                lines.append(f"  - {d.get('factor', '')}: {d.get('description', '')}")

        recs = conv.get("recommendations", [])
        if recs:
            lines.append("\nCURRENT RECOMMENDATIONS:")
            for r in recs:
                lines.append(f"  - {r}")

    trends = data.get("validated_trends", {})
    if trends:
        sorted_trends = sorted(trends.items(), key=lambda x: x[1].get("weighted_score", 0), reverse=True)[:10]
        lines.append("\nTOP MARKET SIGNALS:")
        for trend_name, trend_data in sorted_trends:
            score = trend_data.get("weighted_score", 0)
            sources = trend_data.get("sources", [])
            lines.append(f"  - {trend_name}: score={score:.3f}, sources={len(sources)}")

    summary = data.get("market_summary", {})
    if summary:
        lines.append(f"\nMARKET OPPORTUNITY SCORE: {summary.get('opportunity_score', 0)}/100")
        lines.append(f"SUMMARY: {summary.get('summary_text', '')}")

    lines.append("\nGenerate an ad strategy for THIS specific keyword, audience, and market data. Be specific — reference the actual trends and scores above.")

    return "\n".join(lines)


def _parse_json_response(raw: str) -> dict:
    """Strip thinking tags, markdown fences, and parse JSON from LLM response."""
    cleaned = raw.strip()
    # Strip <think>...</think> blocks (MiniMax chain-of-thought)
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", cleaned).strip()
    # Strip markdown code fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()
    return json.loads(cleaned)


# ---------------------------------------------------------------------------
# Provider-specific callers
# ---------------------------------------------------------------------------

def _call_anthropic(agent: Dict[str, str], context: str, api_key: str) -> Dict[str, Any]:
    """Call Claude via Anthropic SDK."""
    try:
        import anthropic
    except ImportError:
        return {
            "agent_name": agent["name"],
            "emotional_angle": agent["emotional_angle"],
            "error": "anthropic SDK not installed. Run: pip3 install anthropic",
        }

    try:
        client = anthropic.Anthropic(api_key=api_key, timeout=60.0)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=agent["system_prompt"],
            messages=[{"role": "user", "content": context}],
        )
        raw = response.content[0].text.strip()
        strategy = _parse_json_response(raw)
        strategy["agent_name"] = agent["name"]
        strategy["emotional_angle"] = agent["emotional_angle"]
        strategy["provider"] = "anthropic"
        return strategy

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error from {agent['name']} (Anthropic): {e}")
        return {"agent_name": agent["name"], "emotional_angle": agent["emotional_angle"], "error": f"JSON parse error: {e}"}
    except Exception as e:
        logger.error(f"Agent {agent['name']} (Anthropic) failed: {e}")
        return {"agent_name": agent["name"], "emotional_angle": agent["emotional_angle"], "error": str(e)}


def _call_openai(agent: Dict[str, str], context: str, api_key: str) -> Dict[str, Any]:
    """Call GPT via OpenAI SDK."""
    try:
        from openai import OpenAI
    except ImportError:
        return {
            "agent_name": agent["name"],
            "emotional_angle": agent["emotional_angle"],
            "error": "openai SDK not installed. Run: pip3 install openai",
        }

    try:
        client = OpenAI(api_key=api_key, timeout=60.0)
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1024,
            messages=[
                {"role": "system", "content": agent["system_prompt"]},
                {"role": "user", "content": context},
            ],
        )
        raw = response.choices[0].message.content or ""
        strategy = _parse_json_response(raw)
        strategy["agent_name"] = agent["name"]
        strategy["emotional_angle"] = agent["emotional_angle"]
        strategy["provider"] = "openai"
        return strategy

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error from {agent['name']} (OpenAI): {e}")
        return {"agent_name": agent["name"], "emotional_angle": agent["emotional_angle"], "error": f"JSON parse error: {e}"}
    except Exception as e:
        logger.error(f"Agent {agent['name']} (OpenAI) failed: {e}")
        return {"agent_name": agent["name"], "emotional_angle": agent["emotional_angle"], "error": str(e)}


def _call_minimax(agent: Dict[str, str], context: str, api_key: str) -> Dict[str, Any]:
    """Call MiniMax via OpenAI-compatible API."""
    try:
        from openai import OpenAI
    except ImportError:
        return {
            "agent_name": agent["name"],
            "emotional_angle": agent["emotional_angle"],
            "error": "openai SDK not installed. Run: pip3 install openai",
        }

    try:
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.minimax.io/v1",
            timeout=60.0,
        )
        response = client.chat.completions.create(
            model="MiniMax-M2",
            max_tokens=1024,
            messages=[
                {"role": "system", "content": agent["system_prompt"]},
                {"role": "user", "content": context},
            ],
        )
        raw = response.choices[0].message.content or ""
        strategy = _parse_json_response(raw)
        strategy["agent_name"] = agent["name"]
        strategy["emotional_angle"] = agent["emotional_angle"]
        strategy["provider"] = "minimax"
        return strategy

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error from {agent['name']} (MiniMax): {e}")
        return {"agent_name": agent["name"], "emotional_angle": agent["emotional_angle"], "error": f"JSON parse error: {e}"}
    except Exception as e:
        logger.error(f"Agent {agent['name']} (MiniMax) failed: {e}")
        return {"agent_name": agent["name"], "emotional_angle": agent["emotional_angle"], "error": str(e)}


def _call_agent(agent: Dict[str, str], context: str, api_key: str, provider: str) -> Dict[str, Any]:
    """Route to the correct provider."""
    if provider == "openai":
        return _call_openai(agent, context, api_key)
    if provider == "minimax":
        return _call_minimax(agent, context, api_key)
    return _call_anthropic(agent, context, api_key)


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def generate_ai_strategies(analysis_data: Dict[str, Any], api_key: str, provider: str = "anthropic") -> List[Dict[str, Any]]:
    """Run all 3 agents in parallel and return their strategies."""
    context = _build_context(analysis_data)
    strategies: List[Dict[str, Any]] = [{}] * len(AGENTS)

    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_idx = {
            executor.submit(_call_agent, agent, context, api_key, provider): idx
            for idx, agent in enumerate(AGENTS)
        }
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                strategies[idx] = future.result()
            except Exception as e:
                strategies[idx] = {
                    "agent_name": AGENTS[idx]["name"],
                    "emotional_angle": AGENTS[idx]["emotional_angle"],
                    "error": str(e),
                }

    return strategies
