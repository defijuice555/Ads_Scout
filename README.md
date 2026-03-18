# Ads Scout
Ads Scout — an Ethical Ad Intelligence desktop app that analyzes ad trends and generates creative briefs.

Summary
Full Electron + React + Vite desktop app — scaffold, IPC bridge, Python backend integration
Agency-grade dashboard — market snapshot with opportunity score, messaging diagnostic bars, creative briefs, audience specs
State + city geo-targeting — localized search suggestions (e.g., "dental implant Miami FL") across all 5 data sources with geo-aware caching
5 dental preset templates — one-click analysis for implants, whitening, Invisalign, emergency, veneers with pre-filled city/state
Human-readable UX — "Who to Target" and "What to Do Next" panels replace raw JSON, inline expandable descriptions replace clipped tooltips
Analysis history — auto-save, browse, delete past analyses
CSV export — full results with geo metadata
Loading, error, empty states — Python environment check, retry on empty trends
Test plan
 cd desktop && npm run dev — app launches, no compile errors
 Click "Dental Implants" preset — auto-fills Miami, FL
 Run analysis — results include Miami-specific suggestions
 Change state to CA, re-run — different results (fresh cache key)
 Click score badge — expands breakdown inline
 Export CSV — includes state/city in metadata
 Check history page — previous analyses saved and browsable
