Content Structure

Ethical Ad Intelligence Platform
Analyzes public search trends across Google/Bing/DuckDuckGo to generate original ad strategies without copying competitor ads

Key Features (with section headers):

3-Agent AI Strategy Engine — 3 competing emotional AI agents (Pain/Fear, Desire/Aspiration, Urgency/Scarcity) generate different ad angles; vote on a winner
Multi-Provider LLM Support — Anthropic Claude, OpenAI GPT-4o, MiniMax M2 — switch providers from the UI
Hyper-Local Geo-Targeting — State + city level targeting across all 50 US states; search suggestions localized to specific markets
20 Dental Preset Templates — One-click templates for dental practices (implants, Invisalign, whitening, emergency, etc.) with city/state pre-filled
Conversion Intelligence — 5-dimension scoring (emotional valence, attention grab, trust building, urgency pressure, specificity) with actionable tooltips
Creative Briefs — Rule-based creative matrix generates headline directions, CTAs, formats, platform recommendations
Structured CSV Export — 8-section table format designed for downstream AI agent consumption (metadata, dimensions, drivers, signals, briefs, AI strategies, recommendations, audience specs)
Ethical by Design — Analyzes generalized patterns only, never stores or copies specific ads


Screenshots — placeholder section for future screenshots
Tech Stack — Electron + React + Vite + TypeScript frontend, Python backend, IPC bridge
Getting Started — Prerequisites (Node 18+, Python 3.8+), install steps, run dev
Architecture — Brief diagram: Electron shell → React UI → IPC → Python pipeline → Suggest APIs
Configuration — API keys stored in ~/.ads-scout/config.json (never committed), provider selection
License — MIT

Verification

README renders correctly on GitHub (check markdown formatting)
No sensitive info (API keys, paths) in README
