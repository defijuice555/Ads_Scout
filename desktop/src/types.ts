export interface MarketSummary {
  opportunity_score: number;
  summary_text: string;
  top_angle: string;
  source_coverage: string;
  best_format: string;
  signal_count: number;
}

export interface CreativeBrief {
  angle: string;
  headline: string;
  body_direction: string;
  cta: string;
  format: string;
  platform: string;
  why: string;
  priority: string;
}

export interface AnalysisResult {
  keyword: string;
  product: string;
  audience: string;
  benefit: string;
  region: string;
  state?: string;
  city?: string;
  sources: Record<string, { count: number; status: string }>;
  validated_trends: Record<string, TrendData>;
  conversion_analysis: ConversionAnalysis;
  creative_frameworks: CreativeFramework[] | CreativeBrief[];
  audience_specs: AudienceSpecs;
  market_summary?: MarketSummary;
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

export interface DimensionTooltip {
  label: string;
  tooltip: string;
  low_action: string;
  high_action: string;
}

export interface ConversionAnalysis {
  conversion_probability: number;
  dimension_scores: Record<string, number>;
  dimension_tooltips?: Record<string, DimensionTooltip>;
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
  intent_layer: { type: string; value: string; platforms: Record<string, unknown> };
  demographic_layers: Array<{
    trend: string;
    platform: string;
    targeting_options: string[];
    weight: number;
  }>;
  exclusion_layer: { platforms: Record<string, string[]> };
  ethical_note: string;
}

export interface AnalysisInput {
  keyword: string;
  product: string;
  audience: string;
  benefit: string;
  region: string;
  state?: string;
  city?: string;
}

declare global {
  interface Window {
    electronAPI: {
      checkPython: () => Promise<{ ok: boolean; error?: string; detail?: string }>;
      runAnalysis: (args: AnalysisInput) => Promise<AnalysisResult>;
      getHistory: () => Promise<AnalysisResult[]>;
      saveHistoryEntry: (entry: AnalysisResult) => Promise<void>;
      deleteHistoryEntry: (timestamp: string) => Promise<void>;
      onNavigate: (callback: (path: string) => void) => void;
      platform: string;
    };
  }
}
