# Ads Scout Desktop App — Design Document

**Date:** 2026-03-17
**Status:** Approved

## Purpose

Turn the Ads Scout Python CLI tool into a polished, client-facing Electron + React desktop app with an analysis dashboard and history tracking.

## Architecture

**Approach:** Python subprocess — Electron spawns the Python CLI with `--format json`, captures structured JSON output, renders in React.

- Python engine stays as-is (ads_scout/ package + main.py)
- main.py gains `--format json` flag for structured output
- Electron app lives in `desktop/` directory
- No server needed — direct subprocess communication

## Project Structure

```
Ads Scout/
  ads_scout/                # Existing Python engine (unchanged)
  main.py                   # Add --format json flag
  requirements.txt
  desktop/                  # Electron + React app
    package.json
    electron/
      main.ts               # Electron main process
      preload.ts             # IPC bridge
    src/
      App.tsx
      pages/
        AnalysisPage.tsx     # Input form + results dashboard
        HistoryPage.tsx      # Past analyses + comparison
      components/
        InputForm.tsx
        ResultsDashboard.tsx
        ConversionGauge.tsx
        DriversChart.tsx
        TrendTable.tsx
        CreativeFrameworks.tsx
        AudienceSpecs.tsx
      hooks/
        usePythonAnalysis.ts
      lib/
        storage.ts           # JSON file history
```

## Screens

### Analysis Page (main)
- **Input Panel:** Keyword, product, audience, benefit, region fields + Run button
- **Results Dashboard:** Conversion gauge (0-100%), dimension scores (radar/mini-gauges), top drivers bar chart, validated trends table, creative framework cards, audience specs, export button

### History Page
- Past analyses list (keyword, date, conversion probability)
- Click to reload results
- Compare button for side-by-side overlay
- Storage: `~/.ads-scout/history.json`

## Data Flow

```
User fills form → Click "Run Analysis"
→ Electron spawns: python3 main.py --keyword X ... --format json
→ Python outputs JSON to stdout
→ Electron parses JSON → React renders dashboard
→ Auto-saves to history
```

## Tech Stack

- Electron (app shell, subprocess management)
- React 18 + TypeScript (UI)
- Vite (bundler)
- Tailwind CSS (dark theme styling)
- Recharts (charts/gauges)
- React Router (navigation)
- electron-builder (packaging)

## Visual Style

Dark theme, professional analytics dashboard. Card-based layout, accent colors for data visualization.

## Distribution

V1: Require Python 3.9+ installed on user's machine. Document in README.
Future: Bundle via PyInstaller for self-contained distribution.

## Error Handling

- Python not found: Clear error dialog with install instructions
- No data: "No trends found" state with suggestions
- Source timeouts: Non-fatal, show which sources succeeded/failed
- History corruption: Reset with user confirmation
- Long-running: Progress indicator per source, cancel button
