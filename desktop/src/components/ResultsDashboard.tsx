import type { AnalysisResult } from '../types';
import ConversionGauge from './ConversionGauge';
import DriversChart from './DriversChart';
import TrendTable from './TrendTable';
import CreativeFrameworks from './CreativeFrameworks';
import AudienceSpecs from './AudienceSpecs';

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function exportToCSV(result: AnalysisResult): void {
  const rows: string[][] = [];

  // Metadata
  rows.push(['Section', 'Field', 'Value']);
  rows.push(['Metadata', 'Keyword', result.keyword]);
  rows.push(['Metadata', 'Product', result.product]);
  rows.push(['Metadata', 'Audience', result.audience]);
  rows.push(['Metadata', 'Benefit', result.benefit]);
  rows.push(['Metadata', 'Region', result.region]);
  rows.push(['Metadata', 'Timestamp', result.timestamp]);
  rows.push(['Metadata', 'Conversion Probability', String(result.conversion_analysis.conversion_probability)]);
  rows.push([]);

  // Dimension Scores
  rows.push(['Dimension Scores', 'Dimension', 'Score']);
  for (const [dim, score] of Object.entries(result.conversion_analysis.dimension_scores)) {
    rows.push(['Dimension Scores', dim, String(score)]);
  }
  rows.push([]);

  // Trends
  rows.push(['Trends', 'Trend', 'Count', 'Weighted Score', 'Confidence', 'Sources']);
  for (const [trend, data] of Object.entries(result.validated_trends)) {
    rows.push([
      'Trends',
      trend,
      String(data.count),
      String(data.weighted_score),
      String(data.confidence),
      data.sources.join('; '),
    ]);
  }
  rows.push([]);

  // Drivers
  rows.push(['Drivers', 'Factor', 'Type', 'Impact', 'Description']);
  for (const d of result.conversion_analysis.key_drivers) {
    rows.push(['Drivers', d.factor, d.type, String(d.impact), d.description]);
  }
  rows.push([]);

  // Creative Frameworks
  rows.push(['Creative Frameworks', 'Name', 'Hook', 'CTA', 'Format', 'Why', 'Priority']);
  for (const f of result.creative_frameworks) {
    rows.push(['Creative Frameworks', f.name, f.hook, f.cta, f.format, f.why, f.test_priority]);
  }

  const csvContent = rows.map((row) => row.map((cell) => escapeCsvField(cell)).join(',')).join('\n');
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

const DIMENSION_LABELS: Record<string, string> = {
  emotional_valence: 'Emotional Valence',
  attention_grab: 'Attention Grab',
  trust_building: 'Trust Building',
  urgency_pressure: 'Urgency / Pressure',
  specificity: 'Specificity',
};

function barColor(value: number): string {
  if (value >= 0.7) return 'bg-green-500';
  if (value >= 0.4) return 'bg-yellow-500';
  return 'bg-red-500';
}

function ResultsDashboard({ result }: ResultsDashboardProps): JSX.Element {
  const { conversion_analysis, validated_trends, creative_frameworks, audience_specs } = result;

  return (
    <div className="space-y-6">
      {/* Top row: gauge + dimension scores */}
      <div className="flex gap-6 items-start">
        <div className="w-[300px] flex-shrink-0">
          <ConversionGauge probability={conversion_analysis.conversion_probability} />
        </div>
        <div className="flex-1 bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">Dimension Scores</h3>
          <div className="space-y-3">
            {Object.entries(conversion_analysis.dimension_scores).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{DIMENSION_LABELS[key] ?? key}</span>
                  <span className="text-gray-400">{Math.round(value * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor(value)}`}
                    style={{ width: `${Math.round(value * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drivers */}
      <DriversChart drivers={conversion_analysis.key_drivers} />

      {/* Trends */}
      <TrendTable trends={validated_trends} />

      {/* Creative */}
      <CreativeFrameworks frameworks={creative_frameworks} />

      {/* Audience + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AudienceSpecs specs={audience_specs} />
        <div className="bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">Recommendations</h3>
          {conversion_analysis.recommendations.length > 0 ? (
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
              {conversion_analysis.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ol>
          ) : (
            <p className="text-gray-500">No recommendations available</p>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <button
          onClick={() => exportToCSV(result)}
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
