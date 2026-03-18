import { useState, useEffect, useCallback } from 'react';
import type { AnalysisResult, CreativeBrief, AgentStrategy } from '../types';
import MarketSnapshot from './MarketSnapshot';
import MessagingDiagnostic from './MessagingDiagnostic';
import TrendTable from './TrendTable';
import CreativeFrameworks from './CreativeFrameworks';
import AudienceSpecs from './AudienceSpecs';
import AiStrategies from './AiStrategies';

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function isNewBriefFormat(fw: unknown): fw is CreativeBrief {
  return typeof fw === 'object' && fw !== null && 'angle' in fw;
}

function exportToCSV(
  result: AnalysisResult,
  strategies: AgentStrategy[] = [],
  selectedWinner: number | null = null,
): void {
  const rows: string[][] = [];

  // --- Section 1: Metadata ---
  rows.push(['Section', 'Field', 'Value']);
  rows.push(['Metadata', 'Keyword', result.keyword]);
  rows.push(['Metadata', 'Product', result.product]);
  rows.push(['Metadata', 'Audience', result.audience]);
  rows.push(['Metadata', 'Benefit', result.benefit]);
  rows.push(['Metadata', 'Region', result.region]);
  if (result.state) rows.push(['Metadata', 'State', result.state]);
  if (result.city) rows.push(['Metadata', 'City', result.city]);
  rows.push(['Metadata', 'Timestamp', result.timestamp]);

  if (result.market_summary) {
    rows.push(['Metadata', 'Opportunity Score', String(result.market_summary.opportunity_score)]);
    rows.push(['Metadata', 'Summary', result.market_summary.summary_text]);
    rows.push(['Metadata', 'Top Angle', result.market_summary.top_angle]);
    rows.push(['Metadata', 'Best Format', result.market_summary.best_format]);
  }

  rows.push(['Metadata', 'Conversion Probability', String(result.conversion_analysis?.conversion_probability ?? '')]);
  rows.push([]);

  // --- Section 2: Dimension Scores ---
  const dims = result.conversion_analysis?.dimension_scores ?? {};
  if (Object.keys(dims).length > 0) {
    rows.push(['Dimension Scores', 'Dimension', 'Score']);
    for (const [dim, score] of Object.entries(dims)) {
      rows.push(['Dimension Scores', dim.replace(/_/g, ' '), String(typeof score === 'number' ? score.toFixed(3) : score)]);
    }
    rows.push([]);
  }

  // --- Section 3: Key Drivers ---
  const drivers = result.conversion_analysis?.key_drivers ?? [];
  if (drivers.length > 0) {
    rows.push(['Key Drivers', 'Factor', 'Type', 'Impact', 'Description']);
    for (const d of drivers) {
      rows.push(['Key Drivers', d.factor, d.type, String(d.impact.toFixed(3)), d.description]);
    }
    rows.push([]);
  }

  // --- Section 4: Validated Trends ---
  rows.push(['Market Signals', 'Trend', 'Count', 'Weighted Score', 'Confidence', 'Sources']);
  for (const [trend, data] of Object.entries(result.validated_trends)) {
    rows.push([
      'Market Signals',
      trend,
      String(data.count),
      String(data.weighted_score),
      String(data.confidence),
      data.sources.join('; '),
    ]);
  }
  rows.push([]);

  // --- Section 5: Creative Briefs ---
  const frameworks = result.creative_frameworks ?? [];
  if (frameworks.length > 0 && isNewBriefFormat(frameworks[0])) {
    rows.push(['Creative Briefs', 'Angle', 'Headline', 'Body Direction', 'CTA', 'Format', 'Platform', 'Priority', 'Why']);
    for (const f of frameworks as CreativeBrief[]) {
      rows.push(['Creative Briefs', f.angle, f.headline, f.body_direction, f.cta, f.format, f.platform, f.priority, f.why]);
    }
  } else if (frameworks.length > 0) {
    rows.push(['Creative Frameworks', 'Name', 'Hook', 'CTA', 'Format', 'Why', 'Priority']);
    for (const f of frameworks as Array<{ name: string; hook: string; cta: string; format: string; why: string; test_priority: string }>) {
      rows.push(['Creative Frameworks', f.name, f.hook, f.cta, f.format, f.why, f.test_priority]);
    }
  }
  rows.push([]);

  // --- Section 6: AI Ad Strategies (all 3 agents) ---
  const validStrategies = strategies.filter((s) => !s.error);
  if (validStrategies.length > 0) {
    rows.push(['AI Strategies', 'Agent', 'Emotional Angle', 'Is Winner', 'Headline', 'Body Direction', 'CTA', 'Emotional Hook', 'Platform Recommendation', 'Why This Works']);
    strategies.forEach((s, i) => {
      if (s.error) return;
      rows.push([
        'AI Strategies',
        s.agent_name,
        s.emotional_angle.replace(/_/g, ' '),
        selectedWinner === i ? 'YES' : 'NO',
        s.headline,
        s.body_direction,
        s.cta,
        s.emotional_hook,
        s.platform_recommendation,
        s.why_this_works,
      ]);
    });
    rows.push([]);
  }

  // --- Section 7: Recommendations ---
  const recs = result.conversion_analysis?.recommendations ?? [];
  if (recs.length > 0) {
    rows.push(['Recommendations', 'Priority', 'Action']);
    recs.forEach((rec, i) => {
      rows.push(['Recommendations', String(i + 1), rec]);
    });
    rows.push([]);
  }

  // --- Section 8: Audience Specs ---
  const specs = result.audience_specs;
  if (specs?.intent_layer?.value) {
    rows.push(['Audience Specs', 'Layer', 'Detail']);
    rows.push(['Audience Specs', 'Intent', `${specs.intent_layer.type}: ${specs.intent_layer.value}`]);
    for (const dl of specs.demographic_layers ?? []) {
      rows.push(['Audience Specs', 'Demographic', `${dl.trend} (${dl.platform}) — ${dl.targeting_options.join(', ')} [weight: ${dl.weight}]`]);
    }
    const exclusions = specs.exclusion_layer?.platforms ?? {};
    for (const [platform, items] of Object.entries(exclusions)) {
      rows.push(['Audience Specs', `Exclusion (${platform})`, (items as string[]).join(', ')]);
    }
    rows.push(['Audience Specs', 'Ethical Note', specs.ethical_note]);
  }

  const csvContent = rows.map((row) => row.map((cell) => escapeCsvField(String(cell ?? ''))).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `ads-scout-${result.keyword.replace(/\s+/g, '-').toLowerCase()}-${date}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface ResultsDashboardProps {
  result: AnalysisResult;
}

const EMPTY_CONVERSION: AnalysisResult['conversion_analysis'] = {
  conversion_probability: 0,
  dimension_scores: {},
  key_drivers: [],
  recommendations: [],
};

const EMPTY_SPECS: AnalysisResult['audience_specs'] = {
  intent_layer: { type: '', value: '', platforms: {} },
  demographic_layers: [],
  exclusion_layer: { platforms: {} },
  ethical_note: '',
};

function ResultsDashboard({ result }: ResultsDashboardProps): JSX.Element {
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [aiStrategies, setAiStrategies] = useState<AgentStrategy[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiWinnerIdx, setAiWinnerIdx] = useState<number | null>(null);

  useEffect(() => {
    window.electronAPI.getApiKey().then(({ key }) => setHasApiKey(!!key));
  }, []);

  // Reset AI strategies when result changes
  useEffect(() => {
    setAiStrategies([]);
    setAiError(null);
    setAiWinnerIdx(null);
  }, [result.timestamp]);

  const handleGenerateStrategies = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    setAiStrategies([]);
    try {
      const res = await window.electronAPI.runAiStrategies(result);
      if (res.error) {
        setAiError(res.error);
      } else if (res.strategies) {
        setAiStrategies(res.strategies);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate strategies');
    } finally {
      setAiLoading(false);
    }
  }, [result]);

  const conversion_analysis = result.conversion_analysis?.conversion_probability != null
    ? result.conversion_analysis
    : EMPTY_CONVERSION;
  const validated_trends = result.validated_trends ?? {};
  const creative_frameworks = result.creative_frameworks ?? [];
  const audience_specs = result.audience_specs?.intent_layer
    ? result.audience_specs
    : EMPTY_SPECS;

  const trendCount = Object.keys(validated_trends).length;

  return (
    <div className="space-y-6">
      {/* 1. Market Snapshot (compact top bar) */}
      {result.market_summary ? (
        <MarketSnapshot summary={result.market_summary} keyword={result.keyword} city={result.city} state={result.state} />
      ) : (
        <div className="bg-gray-800/50 rounded-xl p-4 flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-white bg-gray-600">
            {Math.round(conversion_analysis.conversion_probability)}
          </span>
          <div>
            <span className="text-gray-100 font-semibold">&ldquo;{result.keyword}&rdquo;</span>
            <p className="text-gray-400 text-sm">
              Conversion probability: {Math.round(conversion_analysis.conversion_probability)}%
            </p>
          </div>
        </div>
      )}

      {/* 2. Messaging Diagnostic */}
      {Object.keys(conversion_analysis.dimension_scores).length > 0 && (
        <MessagingDiagnostic
          dimensionScores={conversion_analysis.dimension_scores}
          dimensionTooltips={result.conversion_analysis?.dimension_tooltips}
        />
      )}

      {/* 3. Creative Briefs (main content) */}
      <CreativeFrameworks frameworks={creative_frameworks} />

      {/* 4. AI Strategies (optional — requires API key) */}
      <AiStrategies
        strategies={aiStrategies}
        loading={aiLoading}
        error={aiError}
        onGenerate={handleGenerateStrategies}
        hasApiKey={hasApiKey}
        selectedWinner={aiWinnerIdx}
        onSelectWinner={setAiWinnerIdx}
      />

      {/* 5. Market Signals (collapsible) */}
      <div>
        <button
          onClick={() => setTrendsOpen(!trendsOpen)}
          className="w-full flex items-center justify-between bg-gray-800/50 rounded-xl px-4 py-3 text-left hover:bg-gray-800/70 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-200">
            Market Signals
            {trendCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({trendCount})</span>
            )}
          </h3>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${trendsOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {trendsOpen && (
          <div className="mt-2">
            <TrendTable trends={validated_trends} />
          </div>
        )}
      </div>

      {/* 4. Platform Setup + Recommendations (side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AudienceSpecs specs={audience_specs} />
        <div className="bg-gray-800/50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-200 mb-1">What to Do Next</h3>
          <p className="text-sm text-gray-400 mb-4">
            Prioritized actions to improve your ad performance
          </p>
          {conversion_analysis.recommendations.length > 0 ? (
            <div className="space-y-3">
              {conversion_analysis.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-700/40">
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-200 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recommendations available</p>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <button
          onClick={() => exportToCSV(result, aiStrategies, aiWinnerIdx)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  );
}

export default ResultsDashboard;
