import { useState } from 'react';
import type { MarketSummary } from '../types';

interface MarketSnapshotProps {
  summary: MarketSummary;
  keyword: string;
  city?: string;
  state?: string;
}

function scoreColor(score: number): string {
  if (score < 30) return 'bg-red-500';
  if (score <= 60) return 'bg-yellow-500';
  return 'bg-green-500';
}

function scoreTextColor(score: number): string {
  if (score < 30) return 'text-red-400';
  if (score <= 60) return 'text-yellow-400';
  return 'text-green-400';
}

function MarketSnapshot({ summary, keyword, city, state }: MarketSnapshotProps): JSX.Element {
  const score = Math.round(summary.opportunity_score);
  const [scoreExpanded, setScoreExpanded] = useState(false);

  const geoLabel = [city, state].filter(Boolean).join(', ');

  return (
    <div className="bg-gray-800/50 rounded-xl p-5">
      {/* Top line: score badge + keyword + geo + signal count */}
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <button
          onClick={() => setScoreExpanded(!scoreExpanded)}
          className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-white cursor-pointer ring-2 ring-transparent hover:ring-gray-500 transition-all ${scoreColor(score)}`}
          aria-label="Toggle score breakdown"
        >
          {score}
        </button>
        <span className="text-gray-100 font-semibold text-lg">
          &ldquo;{keyword}&rdquo;
        </span>
        {geoLabel && (
          <span className="text-sm font-medium px-2 py-0.5 rounded bg-gray-700/60 text-blue-400">
            {geoLabel}
          </span>
        )}
        <span className="text-gray-400 text-sm">
          &mdash; {summary.signal_count} signal{summary.signal_count !== 1 ? 's' : ''} from{' '}
          {summary.source_coverage}
        </span>
      </div>

      {/* Expandable score breakdown */}
      {scoreExpanded && (
        <div className="mb-3 p-3 rounded-lg bg-gray-900/80 border border-gray-700 text-xs text-gray-300 leading-relaxed">
          <p className="font-semibold text-gray-200 mb-1.5">Market Opportunity Score (0-100)</p>
          <p className="mb-1.5">Calculated from:</p>
          <ul className="list-disc list-inside space-y-0.5 mb-1.5">
            <li>Signal density: how many market signals detected (max 40 pts)</li>
            <li>Source coverage: how many data sources agree (max 25 pts)</li>
            <li>Signal strength: cross-source agreement level (max 35 pts)</li>
          </ul>
          <p>{'Red (<30) = weak | Yellow (30-60) = moderate | Green (>60) = strong'}</p>
        </div>
      )}

      {/* Middle row: angle + format badges */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs uppercase tracking-wide">Top angle</span>
          <span className={`text-sm font-medium px-2 py-0.5 rounded ${scoreTextColor(score)} bg-gray-700/60`}>
            {summary.top_angle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs uppercase tracking-wide">Best format</span>
          <span className="text-sm font-medium px-2 py-0.5 rounded text-indigo-400 bg-gray-700/60">
            {summary.best_format}
          </span>
        </div>
      </div>

      {/* Summary text */}
      <p className="text-gray-300 text-sm leading-relaxed">{summary.summary_text}</p>
    </div>
  );
}

export default MarketSnapshot;
