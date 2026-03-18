import { useState, useMemo } from 'react';
import type { TrendData } from '../types';

const TREND_DISPLAY_NAMES: Record<string, string> = {
  purchase_intent: "Buy-Ready Signals",
  product_research: "Comparison Shopping",
  product_attributes: "Feature Interest",
  product_bundle: "Bundle Demand",
  use_case: "Solution Seeking",
  accessory_interest: "Cross-Sell Opportunity",
  brand_comparison: "Brand Awareness",
  joy_engagement: "Positive Emotion",
  joy_conversion: "Positive Emotion",
  trust_conversion: "Trust Signal",
  trust_engagement: "Trust Signal",
  surprise_engagement: "Surprise Factor",
  anticipation_engagement: "Anticipation",
  urgency_scarcity_conversion: "Urgency",
  risk_reversal_conversion: "Risk Reversal",
  social_proof_conversion: "Social Proof",
  specificity_conversion: "Specificity",
  curiosity_gap_engagement: "Curiosity Gap",
  format_video: "Video Format",
  format_image: "Image Format",
  format_carousel: "Carousel Format",
  power_words: "Power Words",
};

const TREND_TOOLTIPS: Record<string, string> = {
  purchase_intent: "High commercial intent — audience is ready to buy. Lead with strong CTAs.",
  product_research: "Audience is actively comparing options. Lead with comparison content.",
  product_attributes: "Audience cares about specific product details and specs. Lead with features.",
  product_bundle: "Demand for kits, sets, and bundles. Offer complete solutions.",
  use_case: "Audience searching for specific use cases. Show your product solving their problem.",
  accessory_interest: "Demand for related/complementary products. Cross-sell opportunity.",
  brand_comparison: "Audience knows the category brands. Differentiate with unique value.",
  trust_conversion: "Trust signals drive purchases. Add proof: reviews, certifications, lab tests.",
  social_proof_conversion: "Social validation matters. Show testimonials, user counts, endorsements.",
  risk_reversal_conversion: "Audience wants guarantees. Offer money-back, free trial, or risk-free.",
  specificity_conversion: "Specific claims convert better. Use exact numbers and details.",
};

function formatTrendKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getDisplayName(key: string): string {
  return TREND_DISPLAY_NAMES[key] ?? formatTrendKey(key);
}

function getTrendTooltip(key: string): string {
  return TREND_TOOLTIPS[key] ?? getDisplayName(key);
}

interface TrendTableProps {
  trends: Record<string, TrendData>;
}

type SortKey = 'name' | 'sources' | 'confidence' | 'score';

interface TrendRow {
  name: string;
  sources: number;
  confidence: number;
  score: number;
}

function TrendTable({ trends }: TrendTableProps): JSX.Element {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);

  const rows: TrendRow[] = useMemo(
    () =>
      Object.entries(trends).map(([name, data]) => ({
        name,
        sources: data.sources.length,
        confidence: Math.round(data.confidence * 100),
        score: Math.round(data.weighted_score * 100) / 100,
      })),
    [trends],
  );

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return copy;
  }, [rows, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const arrow = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortAsc ? ' \u25B2' : ' \u25BC';
  };

  if (rows.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-3">Validated Trends</h3>
        <p className="text-gray-500">No validated trends found</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-gray-200 mb-3">Validated Trends</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="text-left py-2 px-3 cursor-pointer select-none" title="Market signal detected across data sources" onClick={() => handleSort('name')}>
              Trend{arrow('name')}
            </th>
            <th className="text-right py-2 px-3 cursor-pointer select-none" title="Number of data sources (out of 5) that detected this signal. Higher = stronger signal." onClick={() => handleSort('sources')}>
              Sources{arrow('sources')}
            </th>
            <th className="text-right py-2 px-3 cursor-pointer select-none" title="Cross-source agreement level. Higher = more reliable signal." onClick={() => handleSort('confidence')}>
              Confidence %{arrow('confidence')}
            </th>
            <th className="text-right py-2 px-3 cursor-pointer select-none" title="Normalized signal strength across sources. Higher = more prominent in market data." onClick={() => handleSort('score')}>
              Weighted Score{arrow('score')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.name} className="bg-gray-800 hover:bg-gray-700 border-b border-gray-700">
              <td className="py-2 px-3 text-gray-200" title={getTrendTooltip(row.name)}>{getDisplayName(row.name)}</td>
              <td className="py-2 px-3 text-right text-gray-300">{row.sources}</td>
              <td className="py-2 px-3 text-right text-gray-300">{row.confidence}%</td>
              <td className="py-2 px-3 text-right text-gray-300">{row.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TrendTable;
