import { useState } from 'react';
import type { DimensionTooltip } from '../types';

const DEFAULT_TOOLTIPS: Record<string, DimensionTooltip> = {
  engagement: {
    label: 'Engagement',
    tooltip:
      'Measures attention-grabbing power of current messaging. Low = hooks are generic. Fix: add curiosity gaps, surprising stats, or power words.',
    low_action: 'Your hook needs work. Test: surprising question or stat in first 3 seconds.',
    high_action: 'Strong engagement signals. Your hook resonates — scale this angle.',
  },
  conversion: {
    label: 'Purchase Readiness',
    tooltip:
      'How strong are buy-now signals. Low = audience isn\'t ready to purchase yet. Fix: add urgency, social proof, or risk-reversal.',
    low_action: 'Audience needs education first. Run awareness before conversion campaigns.',
    high_action: 'High purchase intent. Push conversion campaigns with strong CTAs.',
  },
  emotional_valence: {
    label: 'Sentiment',
    tooltip:
      'Positive vs negative emotional tone in market signals. Low = messaging may feel fear-based. Fix: balance with positive/aspirational language.',
    low_action: 'Current tone is neutral/negative. Add aspirational messaging.',
    high_action: 'Positive sentiment. Audience responds to joy/optimism angles.',
  },
  attention_grab: {
    label: 'Hook Strength',
    tooltip:
      'How well the ad hooks viewers in first 3 seconds. Low = opening is boring/generic. Fix: lead with surprise, question, or bold claim.',
    low_action: "Opening hook is weak. Test: 'Did you know...?' or bold stat opener.",
    high_action: 'Strong hook potential. Use curiosity-gap openers.',
  },
  trust_building: {
    label: 'Trust Score',
    tooltip:
      'How much the audience values proof and credibility. High = they need to see evidence before buying. Lead with certifications, lab tests, reviews.',
    low_action: "Trust isn't a key driver here. Focus on engagement and urgency instead.",
    high_action:
      'Trust is critical for this audience. Add proof: certifications, lab tests, 3rd-party validation.',
  },
  urgency_pressure: {
    label: 'Urgency',
    tooltip:
      'How much FOMO/time-pressure exists in the market. Low = no reason to act now. Fix: add ethical scarcity (limited stock, early-bird offers).',
    low_action: 'No urgency detected. Add ethical scarcity: limited offers, seasonal angle.',
    high_action: 'Market has urgency signals. Capitalize with time-limited offers.',
  },
};

const DIMENSION_ORDER = [
  'attention_grab',
  'engagement',
  'trust_building',
  'conversion',
  'urgency_pressure',
  'emotional_valence',
] as const;

function barColor(score: number): string {
  if (score < 0.3) return 'bg-red-500';
  if (score < 0.6) return 'bg-yellow-500';
  return 'bg-green-500';
}

interface MessagingDiagnosticProps {
  dimensionScores: Record<string, number>;
  dimensionTooltips?: Record<string, DimensionTooltip>;
}

function DimensionRow({
  score,
  tip,
}: {
  score: number;
  tip: DimensionTooltip;
}): JSX.Element {
  const [showTooltip, setShowTooltip] = useState(false);
  const pct = Math.round(score * 100);
  const action = score < 0.3 ? tip.low_action : tip.high_action;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-gray-200 font-medium">{tip.label}</span>
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-700 text-gray-400 text-[10px] cursor-help select-none">
              i
            </span>
            {showTooltip && (
              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[300px] max-w-[300px] bg-gray-900 text-gray-200 text-xs p-3 rounded-lg shadow-xl pointer-events-none">
                {tip.tooltip}
              </div>
            )}
          </div>
        </div>
        <span className="text-sm text-gray-400 font-mono">{pct}%</span>
      </div>

      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 leading-snug">{action}</p>
    </div>
  );
}

function MessagingDiagnostic({
  dimensionScores,
  dimensionTooltips,
}: MessagingDiagnosticProps): JSX.Element {
  const tooltips = { ...DEFAULT_TOOLTIPS, ...dimensionTooltips };

  return (
    <div className="bg-gray-800/50 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-gray-200">Messaging Diagnostic</h3>
      <p className="text-sm text-gray-400 mb-4">Where is the messaging strong/weak?</p>

      <div className="space-y-4">
        {DIMENSION_ORDER.map((key) => {
          const score = dimensionScores[key];
          if (score == null) return null;
          const tip = tooltips[key] ?? DEFAULT_TOOLTIPS[key];
          if (!tip) return null;
          return <DimensionRow key={key} score={score} tip={tip} />;
        })}
      </div>
    </div>
  );
}

export default MessagingDiagnostic;
