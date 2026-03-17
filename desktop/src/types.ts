export interface AnalysisResult {
  keyword: string;
  product: string;
  audience: string;
  benefit: string;
  region: string;
  sources: Record<string, { count: number; status: string }>;
  validated_trends: Record<string, TrendData>;
  conversion_analysis: ConversionAnalysis;
  creative_frameworks: CreativeFramework[];
  audience_specs: AudienceSpecs;
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

export interface ConversionAnalysis {
  conversion_probability: number;
  dimension_scores: Record<string, number>;
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
}

declare global {
  interface Window {
    electronAPI: {
      runAnalysis: (args: AnalysisInput) => Promise<AnalysisResult>;
      platform: string;
    };
  }
}
