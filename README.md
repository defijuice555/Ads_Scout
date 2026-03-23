# Ads Scout

**Ethical Ad Intelligence Platform**

[![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Ads Scout analyzes public search trends across Google, Bing, and DuckDuckGo to generate original advertising strategies — without ever copying competitor ads. It reverse-engineers the emotional triggers behind what people search for and turns them into actionable creative briefs, conversion intelligence, and AI-powered ad strategies tailored to your market.

---

## Key Features

### 3-Agent AI Strategy Engine

Three competing AI agents analyze your market data through different emotional lenses:

- **Pain/Fear Agent** — Loss aversion, problem awareness, "stop suffering" framing
- **Desire/Aspiration Agent** — Dream outcomes, transformation narratives, aspirational messaging
- **Urgency/Scarcity Agent** — Limited availability, FOMO, time-sensitive offers

Each agent generates a complete ad strategy (headline, body direction, CTA, emotional hook, platform recommendation). Vote on a winner, and the selected strategy is highlighted and included in your export.

### Multi-Provider LLM Support

Choose your preferred AI provider directly from the app:

| Provider | Model | Status |
|----------|-------|--------|
| Anthropic | Claude | Supported |
| OpenAI | GPT-4o | Supported |
| MiniMax | M2 | Supported |

Switch providers from the sidebar settings. API keys are stored locally in `~/.ads-scout/config.json` — never committed to version control.

### Hyper-Local Geo-Targeting

Target advertising down to the city level:

- **50 US states** with dropdown selection
- **City-level targeting** with pre-populated city lists per state
- Search suggestions are localized — "dental implants Miami FL" returns different trends than "dental implants Seattle WA"
- Geo context flows through the entire pipeline: fetchers, cache keys, analysis, and export

### 20 Dental Preset Templates

One-click templates designed for dental practices:

- Dental Implants, Invisalign, Teeth Whitening, Emergency Dental
- Cosmetic Dentistry, Dental Crowns, Root Canal, Dental Veneers
- Pediatric Dentistry, Dentures, Dental Bridges, Oral Surgery
- TMJ Treatment, Periodontal Care, Sedation Dentistry
- Dental Bonding, Same-Day Crowns, All-on-4 Implants
- Smile Makeover, Tooth Extraction

Each template pre-fills keyword, product, audience, benefit, and geo-targeting fields.

### Conversion Intelligence

Five-dimension scoring system that measures ad potential:

| Dimension | What It Measures |
|-----------|-----------------|
| Emotional Valence | Strength of emotional triggers in search patterns |
| Attention Grab | Pattern novelty and scroll-stopping potential |
| Trust Building | Presence of social proof and credibility signals |
| Urgency Pressure | Time-sensitivity and scarcity indicators |
| Specificity | How targeted and concrete the messaging can be |

Each dimension includes actionable tooltips explaining what low or high scores mean and what to do about them.

### Creative Briefs

Rule-based creative matrix generates ready-to-use briefs:

- Headline direction and angle
- Body copy direction
- Call-to-action recommendations
- Optimal ad format (video, carousel, static, story)
- Platform recommendation (Meta, Google, TikTok)
- Priority ranking (high, medium, low)

### Structured CSV Export

Export analysis results in an 8-section table format designed for downstream AI agent consumption:

1. **Metadata** — Keyword, product, audience, benefit, region, state, city, timestamp
2. **Dimension Scores** — All 5 conversion dimensions with numerical scores
3. **Key Drivers** — Top conversion drivers with impact scores and descriptions
4. **Validated Signals** — Cross-source validated trend data with confidence scores
5. **Creative Briefs** — Complete brief details in tabular format
6. **AI Strategies** — All 3 agent strategies with winner flag
7. **Recommendations** — Actionable next steps
8. **Audience Specs** — Platform targeting specifications

### Ethical by Design

- Analyzes **generalized search patterns only** — no specific ads are stored or copied
- All trend data comes from **public suggest APIs** (Google, Bing, DuckDuckGo)
- Output is a **starting point for original creative**, not ready-to-run ad copy
- Built-in ethical reminders at every step

---

## Tech Stack

```
Electron Shell
  └── React + Vite + TypeScript (Frontend)
        └── IPC Bridge
              └── Python 3 Backend
                    ├── Google Suggest API
                    ├── Bing Suggest API
                    ├── DuckDuckGo Suggest API
                    └── LLM Provider (Claude / GPT-4o / M2)
```

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 28 |
| Frontend | React 18, Vite 5, TypeScript 5, Tailwind CSS 3 |
| Charts | Recharts |
| Routing | React Router 6 |
| Backend | Python 3.8+ |
| Data Sources | Google, Bing, DuckDuckGo Suggest APIs |
| AI Providers | Anthropic, OpenAI, MiniMax (via OpenAI-compatible SDK) |
| Storage | Local JSON files (`~/.ads-scout/`) |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ with `python3` on your PATH

### Installation

```bash
# Clone the repository
git clone https://github.com/defijuice555/Ads_Scout.git
cd Ads_Scout

# Install Python dependencies
pip install -r requirements.txt

# Install desktop app dependencies
cd desktop
npm install
```

### Running in Development

```bash
cd desktop
npm run dev
```

This starts the Vite dev server and launches the Electron app.

### Building for Production

```bash
cd desktop
npm run build
```

Outputs platform-specific installers in `desktop/release/`.

---

## Configuration

### API Keys

API keys are stored in `~/.ads-scout/config.json` on your local machine. They are **never** included in the repository or committed to version control.

To configure:
1. Open the app
2. Expand **AI Settings** in the sidebar
3. Select your provider (Anthropic, OpenAI, or MiniMax)
4. Enter your API key and click Save

The AI Strategy Engine is optional — the app works fully without an API key, using rule-based analysis only.

### Data Storage

| File | Location | Purpose |
|------|----------|---------|
| `config.json` | `~/.ads-scout/` | API keys and provider selection |
| `history.json` | `~/.ads-scout/` | Saved analysis history |

---

## Screenshots

> Screenshots coming soon.

---

## Project Structure

```
Ads_Scout/
├── main.py                    # Python CLI entry point
├── agents_runner.py           # AI strategy agent runner
├── requirements.txt           # Python dependencies
├── ads_scout/                 # Python analysis modules
│   ├── config.py              # Source configuration
│   ├── fetchers.py            # Google/Bing/DDG suggest fetchers
│   ├── analysis.py            # Trend validation & scoring
│   └── agents.py              # 3-agent AI strategy engine
├── desktop/                   # Electron + React app
│   ├── electron/
│   │   ├── main.ts            # Electron main process + IPC
│   │   └── preload.ts         # Context bridge
│   └── src/
│       ├── App.tsx            # Router + navigation
│       ├── types.ts           # TypeScript interfaces
│       ├── pages/
│       │   ├── AnalysisPage.tsx
│       │   └── HistoryPage.tsx
│       └── components/
│           ├── InputForm.tsx          # Search form + presets
│           ├── ResultsDashboard.tsx   # Main results view
│           ├── AiStrategies.tsx       # 3-agent voting UI
│           ├── ApiKeySettings.tsx     # Provider config
│           ├── MarketSnapshot.tsx     # Market overview
│           ├── MessagingDiagnostic.tsx # Dimension scoring
│           └── AudienceSpecs.tsx      # Targeting specs
```

---

## How It Works

1. **Input** — Enter a keyword, product, audience, and benefit. Optionally select state and city for geo-targeting, or use a preset template.

2. **Fetch** — The Python backend queries Google, Bing, and DuckDuckGo suggest APIs for public search patterns related to your keyword and location.

3. **Analyze** — Trends are extracted, cross-validated across sources, weighted by demographic relevance, and scored across 5 conversion dimensions.

4. **Generate** — Rule-based creative briefs are generated from validated trends. Optionally, 3 AI agents generate competing emotional ad strategies.

5. **Vote & Export** — Review AI strategies, vote on a winner, and export everything as a structured CSV for use in your ad workflow or downstream AI agents.

---

## License

MIT

---

Built for advertisers who want data-driven creative inspiration without crossing ethical lines.
