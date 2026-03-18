import { useState } from 'react';
import type { AgentStrategy } from '../types';
// useState still needed for StrategyCard's `copied` state

interface AiStrategiesProps {
  strategies: AgentStrategy[];
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  hasApiKey: boolean;
  selectedWinner: number | null;
  onSelectWinner: (idx: number) => void;
}

const ANGLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pain_fear: { bg: 'bg-red-600', text: 'text-red-100', label: 'Pain / Fear' },
  desire_aspiration: { bg: 'bg-emerald-600', text: 'text-emerald-100', label: 'Desire / Aspiration' },
  urgency_scarcity: { bg: 'bg-amber-600', text: 'text-amber-100', label: 'Urgency / Scarcity' },
};

function copyToClipboard(strategy: AgentStrategy): void {
  const text = [
    `[${strategy.agent_name}]`,
    `Headline: ${strategy.headline}`,
    `Body: ${strategy.body_direction}`,
    `CTA: ${strategy.cta}`,
    `Hook: ${strategy.emotional_hook}`,
    `Platform: ${strategy.platform_recommendation}`,
    `Why: ${strategy.why_this_works}`,
  ].join('\n');
  navigator.clipboard.writeText(text);
}

function StrategyCard({
  strategy,
  index,
  isWinner,
  isDimmed,
  onSelect,
}: {
  strategy: AgentStrategy;
  index: number;
  isWinner: boolean;
  isDimmed: boolean;
  onSelect: () => void;
}): JSX.Element {
  const [copied, setCopied] = useState(false);
  const style = ANGLE_STYLES[strategy.emotional_angle] ?? {
    bg: 'bg-gray-600',
    text: 'text-gray-100',
    label: strategy.emotional_angle,
  };

  if (strategy.error) {
    return (
      <div className="bg-gray-800/60 rounded-xl p-5 border border-red-800/50">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${style.bg} ${style.text} mb-3`}>
          {style.label}
        </span>
        <p className="text-red-400 text-sm">{strategy.error}</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-800/60 rounded-xl p-5 border transition-all duration-300 ${
        isWinner
          ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-[1.02]'
          : isDimmed
            ? 'border-gray-700/50 opacity-50'
            : 'border-gray-700 hover:border-gray-600'
      }`}
    >
      {/* Agent badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${style.bg} ${style.text}`}>
          {style.label}
        </span>
        <div className="flex items-center gap-1">
          {isWinner && (
            <span className="text-xs text-indigo-400 font-semibold mr-2">WINNER</span>
          )}
          <button
            onClick={() => {
              copyToClipboard(strategy);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="text-gray-500 hover:text-white text-xs transition-colors"
            title="Copy to clipboard"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Headline */}
      <h4 className="text-white font-bold text-base leading-snug mb-3">
        &ldquo;{strategy.headline}&rdquo;
      </h4>

      {/* Emotional hook */}
      <div className="mb-3 p-2 rounded bg-gray-900/60 border border-gray-700/50">
        <span className="text-xs text-gray-400 uppercase tracking-wide">Emotional Hook</span>
        <p className="text-sm text-gray-200 mt-0.5">{strategy.emotional_hook}</p>
      </div>

      {/* Body direction */}
      <div className="mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide">Body Copy Direction</span>
        <p className="text-sm text-gray-300 mt-0.5 leading-relaxed">{strategy.body_direction}</p>
      </div>

      {/* CTA */}
      <div className="mb-3">
        <span className="inline-block px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 text-sm font-medium border border-blue-600/30">
          {strategy.cta}
        </span>
      </div>

      {/* Platform */}
      <div className="mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide">Best Platform</span>
        <p className="text-sm text-gray-300 mt-0.5">{strategy.platform_recommendation}</p>
      </div>

      {/* Why */}
      <div className="mb-4">
        <span className="text-xs text-gray-400 uppercase tracking-wide">Why This Works</span>
        <p className="text-sm text-gray-400 mt-0.5 italic leading-relaxed">{strategy.why_this_works}</p>
      </div>

      {/* Vote button */}
      <button
        onClick={onSelect}
        className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isWinner
            ? 'bg-indigo-600 text-white cursor-default'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
        }`}
      >
        {isWinner ? 'Selected' : `Select Strategy ${index + 1}`}
      </button>
    </div>
  );
}

function AiStrategies({ strategies, loading, error, onGenerate, hasApiKey, selectedWinner, onSelectWinner }: AiStrategiesProps): JSX.Element {

  if (!hasApiKey) {
    return (
      <div className="bg-gray-800/30 rounded-xl p-5 border border-dashed border-gray-700 text-center">
        <p className="text-gray-400 text-sm">
          Set your Anthropic API key in <span className="text-gray-300">AI Settings</span> (sidebar) to unlock AI-powered ad strategies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">AI Ad Strategies</h3>
          <p className="text-xs text-gray-400">3 agents compete with different emotional angles. Pick the winner.</p>
        </div>
        {strategies.length === 0 && !loading && (
          <button
            onClick={onGenerate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Generate AI Strategies
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800/50 p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-gray-800/60 rounded-xl p-5 border border-gray-700 animate-pulse">
              <div className="h-5 w-24 bg-gray-700 rounded mb-3" />
              <div className="h-6 w-full bg-gray-700 rounded mb-3" />
              <div className="h-16 w-full bg-gray-700/50 rounded mb-3" />
              <div className="h-12 w-full bg-gray-700/50 rounded mb-3" />
              <div className="h-8 w-32 bg-gray-700/50 rounded mb-3" />
              <div className="h-10 w-full bg-gray-700/30 rounded" />
            </div>
          ))}
          <div className="col-span-full text-center">
            <p className="text-gray-400 text-sm animate-pulse">3 agents are competing... this takes about 15-30 seconds</p>
          </div>
        </div>
      )}

      {strategies.length > 0 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {strategies.map((s, i) => (
            <StrategyCard
              key={i}
              strategy={s}
              index={i}
              isWinner={selectedWinner === i}
              isDimmed={selectedWinner !== null && selectedWinner !== i}
              onSelect={() => onSelectWinner(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AiStrategies;
