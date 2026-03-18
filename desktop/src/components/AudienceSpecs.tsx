import { useState } from 'react';
import type { AudienceSpecs as AudienceSpecsType } from '../types';

interface AudienceSpecsProps {
  specs: AudienceSpecsType;
}

/** Turn a raw platform config object into a plain-English sentence. */
function describePlatformConfig(platform: string, config: unknown): string {
  if (typeof config === 'string') return config;
  if (typeof config !== 'object' || config === null) return '';

  const c = config as Record<string, unknown>;

  if (platform === 'google') {
    const parts: string[] = [];
    if (c.match_type) parts.push(`${String(c.match_type)} match`);
    if (c.campaign_type) parts.push(`${String(c.campaign_type)} campaign`);
    return parts.length > 0 ? parts.join(', ') : JSON.stringify(config);
  }

  if (platform === 'meta') {
    const parts: string[] = [];
    if (c.use_as_lookalike_seed) parts.push('use as lookalike seed');
    if (c.advantage_plus) parts.push('Advantage+ enabled');
    return parts.length > 0 ? parts.join(', ') : JSON.stringify(config);
  }

  return JSON.stringify(config);
}

/** Human-readable label for exclusion keys like "exclude:competitor_brands" */
function formatExclusion(ex: string): string {
  const clean = ex.replace(/^exclude:/, '').replace(/_/g, ' ');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function AudienceSpecs({ specs }: AudienceSpecsProps): JSX.Element {
  const [showDetails, setShowDetails] = useState(false);

  const platforms = Object.entries(specs.intent_layer.platforms);
  const demographics = specs.demographic_layers ?? [];
  const exclusions = Object.entries(specs.exclusion_layer.platforms);
  const hasContent = specs.intent_layer.value || platforms.length > 0;

  return (
    <div className="bg-gray-800/50 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-gray-200 mb-1">Who to Target</h3>
      <p className="text-sm text-gray-400 mb-4">
        Recommended audience strategy based on market signals
      </p>

      {/* Primary targeting — always visible */}
      {hasContent && (
        <div className="space-y-3 mb-4">
          {/* Main intent */}
          {specs.intent_layer.value && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-700/40">
              <span className="mt-0.5 text-indigo-400 text-lg">&#127919;</span>
              <div>
                <p className="text-sm font-medium text-gray-200">
                  Target people searching for &ldquo;{specs.intent_layer.value}&rdquo;
                </p>
                {specs.intent_layer.type && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Signal type: {specs.intent_layer.type.replace(/_/g, ' ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Platform recommendations */}
          {platforms.length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {platforms.map(([platform, config]) => (
                <div
                  key={platform}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-700/40"
                >
                  <span className="mt-0.5 text-lg">
                    {platform === 'google' ? '\u{1F50D}' : platform === 'meta' ? '\u{1F4F1}' : '\u{1F4E2}'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-200 capitalize">{platform}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {describePlatformConfig(platform, config)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Demographics — collapsible */}
      {demographics.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-300 mb-2">Layer with these interests:</p>
          <div className="space-y-2">
            {demographics.map((layer, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-yellow-400 mt-0.5">&#9679;</span>
                <div>
                  <span className="text-gray-200">{layer.trend}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    ({layer.platform}, {Math.round(layer.weight * 100)}% weight)
                  </span>
                  {layer.targeting_options.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Options: {layer.targeting_options.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exclusions — show/hide toggle */}
      {exclusions.length > 0 && (
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} exclusion details
          </button>
          {showDetails && (
            <div className="mt-2 p-3 rounded-lg bg-gray-900/50 border border-gray-700 space-y-2">
              <p className="text-xs text-gray-400 font-medium">
                Exclude these to avoid wasted spend:
              </p>
              {exclusions.map(([platform, items]) => (
                <div key={platform} className="text-xs">
                  <span className="text-gray-300 capitalize font-medium">{platform}:</span>{' '}
                  <span className="text-gray-400">
                    {items.map(formatExclusion).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {specs.ethical_note && (
        <div className="mt-4 rounded-lg bg-yellow-900/30 border border-yellow-700/50 p-3 text-yellow-200 text-xs">
          {specs.ethical_note}
        </div>
      )}
    </div>
  );
}

export default AudienceSpecs;
