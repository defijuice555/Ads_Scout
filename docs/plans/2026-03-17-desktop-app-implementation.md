# Ads Scout Desktop App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an Electron + React desktop app that wraps the existing Python CLI ad intelligence tool with a polished dark-themed dashboard, analysis history, and CSV export.

**Architecture:** Electron spawns `python3 main.py --format json` as a subprocess, captures JSON stdout, renders results in React. No server needed. History stored as local JSON file.

**Tech Stack:** Electron, React 18, TypeScript, Vite, Tailwind CSS, Recharts, React Router, electron-builder

---

## Task 1: Add JSON Output to Python CLI

**Files:**
- Modify: `main.py`
- Modify: `ads_scout/analysis.py`

**Step 1: Add `run_analysis()` function that returns a dict**

Extract the pipeline logic from `main()` into a new `run_analysis(keyword, product, audience, benefit, region)` function that returns a structured dict instead of printing. Keep `main()` as a thin wrapper that calls `run_analysis()` and either prints human-readable output or JSON.

In `main.py`, refactor to:

```python
import json as json_module

def run_analysis(keyword: str, product: str, audience: str, benefit: str, region: str = "US") -> dict:
    """Run full analysis pipeline and return structured results."""
    setup_directories()
    # ... (existing pipeline logic, but collect results into a dict instead of printing)
    return {
        "keyword": keyword,
        "product": product,
        "audience": audience,
        "benefit": benefit,
        "region": region,
        "sources": source_results,  # {source_name: {"count": N, "status": "ok"|"failed"}}
        "validated_trends": validated_trends,
        "demographic_trends": demo_trends,
        "conversion_analysis": analysis,
        "creative_frameworks": variants,
        "audience_specs": specs,
        "timestamp": datetime.now().isoformat(),
    }
```

**Step 2: Add `--format` argument to argparse**

```python
parser.add_argument("--format", choices=["text", "json"], default="text", help="Output format")
```

**Step 3: Update `main()` to use format flag**

```python
def main() -> None:
    # ... argparse setup ...
    result = run_analysis(args.keyword, args.product, args.audience, args.benefit, args.region)

    if args.format == "json":
        print(json_module.dumps(result, ensure_ascii=False, indent=2, default=str))
    else:
        _print_human_readable(result)
```

Move all the existing print statements into `_print_human_readable(result)`.

**Step 4: Test JSON output**

Run: `cd "/Users/seudopro1/Documents/Ads Scout" && python3 main.py --keyword "yoga mat" --product "TestMat" --audience "yogis" --benefit "grip" --format json 2>/dev/null | python3 -m json.tool | head -20`

Expected: Valid JSON with top-level keys (keyword, product, validated_trends, etc.)

**Step 5: Commit**

```bash
git add main.py
git commit -m "feat: add --format json output for desktop app integration"
```

---

## Task 2: Scaffold Electron + React + Vite Project

**Files:**
- Create: `desktop/package.json`
- Create: `desktop/tsconfig.json`
- Create: `desktop/tsconfig.node.json`
- Create: `desktop/vite.config.ts`
- Create: `desktop/tailwind.config.js`
- Create: `desktop/postcss.config.js`
- Create: `desktop/index.html`
- Create: `desktop/electron/main.ts`
- Create: `desktop/electron/preload.ts`
- Create: `desktop/src/main.tsx`
- Create: `desktop/src/App.tsx`
- Create: `desktop/src/index.css`

**Step 1: Initialize project**

```bash
cd "/Users/seudopro1/Documents/Ads Scout"
mkdir -p desktop/electron desktop/src
cd desktop
npm init -y
```

**Step 2: Install dependencies**

```bash
cd "/Users/seudopro1/Documents/Ads Scout/desktop"
npm install react react-dom react-router-dom recharts
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react electron electron-builder tailwindcss postcss autoprefixer concurrently wait-on
```

**Step 3: Write package.json**

Key scripts:
```json
{
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build": "vite build && tsc -p tsconfig.node.json && electron-builder",
    "vite:dev": "vite"
  }
}
```

**Step 4: Write vite.config.ts**

Configure Vite with React plugin, set base to `./` for Electron file:// protocol.

**Step 5: Write tailwind.config.js**

Dark mode enabled, content paths pointing to `src/**/*.{ts,tsx}`.

**Step 6: Write index.html**

Basic HTML shell with `<div id="root">` and Vite script entry.

**Step 7: Write electron/main.ts**

- Create BrowserWindow (1200x800, dark background)
- In dev: load `http://localhost:5173`
- In prod: load `file://dist/index.html`
- Register IPC handler for `run-analysis` (see Task 3)

**Step 8: Write electron/preload.ts**

Expose `electronAPI.runAnalysis(args)` and `electronAPI.onAnalysisProgress(callback)` via contextBridge.

**Step 9: Write src/main.tsx, src/App.tsx, src/index.css**

- main.tsx: React root render
- App.tsx: BrowserRouter with routes for `/` (AnalysisPage) and `/history` (HistoryPage)
- index.css: Tailwind imports + dark theme base styles

**Step 10: Verify dev mode launches**

Run: `cd "/Users/seudopro1/Documents/Ads Scout/desktop" && npm run dev`

Expected: Electron window opens with empty React app, dark background.

**Step 11: Commit**

```bash
git add desktop/
git commit -m "feat: scaffold Electron + React + Vite desktop app"
```

---

## Task 3: Python IPC Bridge

**Files:**
- Modify: `desktop/electron/main.ts`
- Modify: `desktop/electron/preload.ts`
- Create: `desktop/src/hooks/usePythonAnalysis.ts`
- Create: `desktop/src/types.ts`

**Step 1: Define TypeScript types for analysis result**

In `desktop/src/types.ts`, define interfaces matching the JSON output from Task 1:

```typescript
export interface AnalysisResult {
  keyword: string;
  product: string;
  audience: string;
  benefit: string;
  region: string;
  sources: Record<string, { count: number; status: string }>;
  validated_trends: Record<string, TrendData>;
  demographic_trends: Record<string, TrendData>;
  conversion_analysis: ConversionAnalysis;
  creative_frameworks: CreativeFramework[];
  audience_specs: AudienceSpecs;
  timestamp: string;
}

export interface TrendData {
  count: number;
  weighted_score: number;
  confidence: number;
  sources: string[];
  demo_weighted_score?: number;
  demo_confidence?: number;
}

export interface ConversionAnalysis {
  conversion_probability: number;
  dimension_scores: Record<string, number>;
  key_drivers: Driver[];
  recommendations: string[];
}

export interface Driver {
  factor: string;
  type: string;
  impact: number;
  description: string;
}

export interface CreativeFramework {
  name: string;
  hook: string;
  cta: string;
  format: string;
  why: string;
  test_priority: string;
}

export interface AudienceSpecs {
  intent_layer: { type: string; value: string; platforms: Record<string, any> };
  demographic_layers: Array<{ trend: string; platform: string; targeting_options: string[]; weight: number }>;
  exclusion_layer: { platforms: Record<string, string[]> };
  ethical_note: string;
}

export interface AnalysisInput {
  keyword: string;
  product: string;
  audience: string;
  benefit: string;
  region: string;
}
```

**Step 2: IPC handler in electron/main.ts**

Add handler that spawns Python subprocess:

```typescript
import { spawn } from 'child_process';
import path from 'path';

ipcMain.handle('run-analysis', async (event, args: AnalysisInput) => {
  const pythonPath = 'python3';
  const scriptPath = path.resolve(__dirname, '../../main.py');

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonPath, [
      scriptPath,
      '--keyword', args.keyword,
      '--product', args.product,
      '--audience', args.audience,
      '--benefit', args.benefit,
      '--region', args.region,
      '--format', 'json',
    ], { cwd: path.resolve(__dirname, '../..') });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error(`Invalid JSON from Python: ${stdout.slice(0, 200)}`));
        }
      } else {
        reject(new Error(`Python exited with code ${code}: ${stderr.slice(0, 500)}`));
      }
    });

    proc.on('error', (err) => {
      if (err.message.includes('ENOENT')) {
        reject(new Error('Python not found. Please install Python 3.9+ and ensure python3 is in your PATH.'));
      } else {
        reject(err);
      }
    });
  });
});
```

**Step 3: Preload bridge**

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  runAnalysis: (args: any) => ipcRenderer.invoke('run-analysis', args),
});
```

**Step 4: React hook `usePythonAnalysis.ts`**

```typescript
import { useState, useCallback } from 'react';
import type { AnalysisResult, AnalysisInput } from '../types';

export function usePythonAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (input: AnalysisInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await window.electronAPI.runAnalysis(input);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, runAnalysis };
}
```

**Step 5: Verify IPC works end-to-end**

Temporarily add a test button in App.tsx that calls `runAnalysis` with hardcoded args, logs result to console.

**Step 6: Commit**

```bash
git add desktop/
git commit -m "feat: add Python IPC bridge with typed analysis hook"
```

---

## Task 4: Input Form Component

**Files:**
- Create: `desktop/src/components/InputForm.tsx`
- Modify: `desktop/src/pages/AnalysisPage.tsx`

**Step 1: Build InputForm**

Dark-themed form with:
- 4 text inputs (keyword, product, audience, benefit) — all required
- Region select dropdown (US, UK, CA, AU, DE, FR, BR, IN, JP)
- "Run Analysis" button with loading spinner state
- Form validation: all fields required, keyword min 2 chars
- `onSubmit` prop receives `AnalysisInput`

Use Tailwind: `bg-gray-900`, `text-white`, `border-gray-700`, accent `bg-blue-600` for button.

**Step 2: Wire into AnalysisPage**

AnalysisPage renders InputForm on left sidebar (fixed width 320px) and results area on the right. On submit, calls `usePythonAnalysis().runAnalysis`.

**Step 3: Verify form submits and triggers Python**

Run dev, fill form, click Run. Should see loading state, then result in console.

**Step 4: Commit**

```bash
git add desktop/src/
git commit -m "feat: add input form with validation and dark theme"
```

---

## Task 5: Results Dashboard Components

**Files:**
- Create: `desktop/src/components/ResultsDashboard.tsx`
- Create: `desktop/src/components/ConversionGauge.tsx`
- Create: `desktop/src/components/DriversChart.tsx`
- Create: `desktop/src/components/TrendTable.tsx`
- Create: `desktop/src/components/CreativeFrameworks.tsx`
- Create: `desktop/src/components/AudienceSpecs.tsx`

**Step 1: ConversionGauge**

Circular gauge using Recharts `PieChart` with custom label showing percentage in center. Color gradient: red (0-30) -> yellow (30-60) -> green (60-100). Props: `probability: number`.

**Step 2: DriversChart**

Horizontal bar chart using Recharts `BarChart`. Shows top 5 drivers with factor name and impact score. Bars colored by type (engagement=blue, conversion=green). Props: `drivers: Driver[]`.

**Step 3: TrendTable**

Sortable table showing validated trends. Columns: Trend Name, Sources, Confidence %, Score. Click column header to sort. Dark styled with `bg-gray-800` rows, `border-gray-700`. Props: `trends: Record<string, TrendData>`.

**Step 4: CreativeFrameworks**

Card grid showing each variant. Each card has: name badge, hook text, CTA button preview, format icon, priority badge (high=green, medium=yellow), "why it works" explanation. Props: `frameworks: CreativeFramework[]`.

**Step 5: AudienceSpecs**

Collapsible panel with three sections: Intent Layer, Demographic Layers, Exclusions. Each shows platform-specific targeting options. Props: `specs: AudienceSpecs`.

**Step 6: ResultsDashboard**

Composes all 5 components above. Layout:
- Top row: ConversionGauge + dimension scores (5 mini progress bars)
- Middle: DriversChart (full width)
- Bottom left: TrendTable
- Bottom right: CreativeFrameworks
- Footer: AudienceSpecs (collapsible) + Export CSV button + Recommendations list

Shows loading skeleton while `loading=true`, error banner if `error` is set.

**Step 7: Wire into AnalysisPage**

When `usePythonAnalysis().result` is not null, render `ResultsDashboard` in the main area.

**Step 8: Verify full flow visually**

Run dev mode, submit analysis form, verify dashboard renders with all sections.

**Step 9: Commit**

```bash
git add desktop/src/
git commit -m "feat: add results dashboard with charts, trends, and creative frameworks"
```

---

## Task 6: History System

**Files:**
- Create: `desktop/src/lib/storage.ts`
- Create: `desktop/src/pages/HistoryPage.tsx`
- Modify: `desktop/src/pages/AnalysisPage.tsx`
- Modify: `desktop/electron/main.ts`
- Modify: `desktop/electron/preload.ts`

**Step 1: Storage IPC in Electron**

Add IPC handlers for:
- `get-history`: reads `~/.ads-scout/history.json`, returns array
- `save-history-entry`: appends entry to history file
- `delete-history-entry`: removes by timestamp
- `get-app-data-path`: returns Electron `app.getPath('userData')`

**Step 2: Preload bridge**

Expose: `electronAPI.getHistory()`, `electronAPI.saveHistoryEntry(entry)`, `electronAPI.deleteHistoryEntry(timestamp)`.

**Step 3: Storage lib**

`storage.ts` provides typed wrappers around the IPC calls:

```typescript
export async function loadHistory(): Promise<HistoryEntry[]>
export async function saveAnalysis(result: AnalysisResult): Promise<void>
export async function deleteAnalysis(timestamp: string): Promise<void>
```

**Step 4: Auto-save in AnalysisPage**

After a successful analysis, call `saveAnalysis(result)` automatically.

**Step 5: HistoryPage**

- List view of past analyses (keyword, product, date, conversion probability)
- Click row to load full results in a ResultsDashboard
- Delete button per row
- Search/filter by keyword
- Dark theme matching rest of app

**Step 6: Navigation**

Add sidebar or top nav with two items: "Analysis" (/) and "History" (/history). Active state styling.

**Step 7: Verify**

Run analysis -> check it appears in history -> click to view -> delete works.

**Step 8: Commit**

```bash
git add desktop/
git commit -m "feat: add analysis history with auto-save and browse"
```

---

## Task 7: Polish & Error States

**Files:**
- Modify: `desktop/src/components/ResultsDashboard.tsx`
- Modify: `desktop/src/pages/AnalysisPage.tsx`
- Create: `desktop/src/components/ErrorBanner.tsx`
- Create: `desktop/src/components/EmptyState.tsx`
- Create: `desktop/src/components/LoadingSkeleton.tsx`

**Step 1: Loading state**

Skeleton placeholders for each dashboard section while analysis runs. Show "Analyzing {keyword}..." with animated dots.

**Step 2: Error banner**

Red banner at top of results area. Special handling for:
- "Python not found" -> show install instructions link
- Network errors -> "Some sources failed, results may be partial"
- Generic errors -> show message with "Try Again" button

**Step 3: Empty state**

When no analysis has been run yet, show centered illustration/icon with "Enter your product details and run an analysis to see ethical ad intelligence."

**Step 4: No trends found**

When Python returns empty validated_trends, show specific guidance: "No strong trends found. Try a broader keyword or check back later."

**Step 5: Export CSV button**

Wire the export button in ResultsDashboard to trigger `save_insights` via a new IPC call, or generate CSV client-side from the JSON result.

**Step 6: Verify all states**

Test: empty state, loading, success, error (kill Python mid-run), no trends (use obscure keyword).

**Step 7: Commit**

```bash
git add desktop/src/
git commit -m "feat: add loading, error, and empty states with export"
```

---

## Task 8: App Window & Packaging

**Files:**
- Modify: `desktop/electron/main.ts`
- Modify: `desktop/package.json`
- Create: `desktop/build/icon.png` (placeholder)

**Step 1: Window configuration**

- Title: "Ads Scout — Ethical Ad Intelligence"
- Min size: 900x600
- Default size: 1200x800
- Dark title bar on macOS (`titleBarStyle: 'hiddenInset'`)
- App icon

**Step 2: App menu**

Custom menu with: File (Export, Quit), View (Analysis, History), Help (About).

**Step 3: electron-builder config**

Add to package.json:
```json
"build": {
  "appId": "com.adsscout.desktop",
  "productName": "Ads Scout",
  "mac": { "target": "dmg" },
  "win": { "target": "nsis" }
}
```

**Step 4: Build test**

Run: `cd desktop && npm run build`

Expected: Creates distributable in `desktop/dist/`.

**Step 5: Commit**

```bash
git add desktop/
git commit -m "feat: configure app window, menu, and packaging"
```

---

## Summary

| Task | What | Est. Complexity |
|------|------|----------------|
| 1 | JSON output for Python CLI | Small |
| 2 | Scaffold Electron + React + Vite | Medium |
| 3 | Python IPC bridge | Medium |
| 4 | Input form component | Small |
| 5 | Results dashboard (5 components) | Large |
| 6 | History system | Medium |
| 7 | Polish & error states | Medium |
| 8 | Window & packaging | Small |

Tasks 1-3 are foundational (must be sequential). Tasks 4-7 can partially overlap. Task 8 is final polish.
