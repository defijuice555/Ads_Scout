import type { AnalysisResult } from '../types';
import ConversionGauge from './ConversionGauge';
import DriversChart from './DriversChart';
import TrendTable from './TrendTable';
import CreativeFrameworks from './CreativeFrameworks';
import AudienceSpecs from './AudienceSpecs';

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
    </div>
  );
}

export default ResultsDashboard;
