import { useState } from 'react';
import type { MarketSummary } from '../types';

interface MarketSnapshotProps {
  summary: MarketSummary;
  keyword: string;
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

function MarketSnapshot({ summary, keyword }: MarketSnapshotProps): JSX.Element {
  const score = Math.round(summary.opportunity_score);
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);

  return (
    <div className="bg-gray-800/50 rounded-xl p-5">
      {/* Top line: score badge + keyword + signal count */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="relative"
          onMouseEnter={() => setShowScoreTooltip(true)}
          onMouseLeave={() => setShowScoreTooltip(false)}
        >
          <span
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-white cursor-help ${scoreColor(score)}`}
          >
            {score}
          </span>
          {showScoreTooltip && (
            <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-[300px] max-w-[300px] bg-gray-900 text-gray-200 text-xs p-3 rounded-lg shadow-xl pointer-events-none">
              <p className="font-semibold mb-1.5">Market Opportunity Score (0-100)</p>
              <p className="mb-1.5">Calculated from:</p>
              <ul className="list-disc list-inside space-y-0.5 mb-1.5">
                <li>Signal density: how many market signals detected (max 40 pts)</li>
                <li>Source coverage: how many data sources agree (max 25 pts)</li>
                <li>Signal strength: cross-source agreement level (max 35 pts)</li>
              </ul>
              <p>{'Red (<30) = weak | Yellow (30-60) = moderate | Green (>60) = strong'}</p>
            </div>
          )}
        </div>
        <span className="text-gray-100 font-semibold text-lg">
          &ldquo;{keyword}&rdquo;
        </span>
        <span className="text-gray-400 text-sm">
          &mdash; {summary.signal_count} signal{summary.signal_count !== 1 ? 's' : ''} from{' '}
          {summary.source_coverage}
        </span>
      </div>

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
