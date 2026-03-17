import { useState } from 'react';
import type { AudienceSpecs as AudienceSpecsType } from '../types';

interface AudienceSpecsProps {
  specs: AudienceSpecsType;
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-200 hover:bg-gray-700/50"
        onClick={onToggle}
      >
        <span className="font-medium">{title}</span>
        <span className="text-gray-400">{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

function AudienceSpecs({ specs }: AudienceSpecsProps): JSX.Element {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    intent: true,
    demographic: false,
    exclusions: false,
  });

  const toggle = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-gray-200 mb-3">Audience Specs</h3>
      <div className="space-y-2">
        <Section title="Intent Layer" open={!!openSections.intent} onToggle={() => toggle('intent')}>
          <div className="text-sm text-gray-300 space-y-1">
            <p>
              <span className="text-gray-500">Type:</span> {specs.intent_layer.type}
            </p>
            <p>
              <span className="text-gray-500">Value:</span> {specs.intent_layer.value}
            </p>
            {Object.entries(specs.intent_layer.platforms).length > 0 && (
              <div>
                <span className="text-gray-500">Platforms:</span>
                <ul className="ml-4 mt-1 list-disc text-gray-400">
                  {Object.entries(specs.intent_layer.platforms).map(([platform, config]) => (
                    <li key={platform}>
                      <span className="text-gray-300">{platform}:</span>{' '}
                      {typeof config === 'string' ? config : JSON.stringify(config)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>

        <Section title="Demographic Layers" open={!!openSections.demographic} onToggle={() => toggle('demographic')}>
          <div className="space-y-3">
            {specs.demographic_layers.map((layer, i) => (
              <div key={i} className="text-sm border-l-2 border-blue-500 pl-3">
                <p className="text-gray-200 font-medium">{layer.trend}</p>
                <p className="text-gray-400 text-xs">
                  {layer.platform} &middot; Weight: {Math.round(layer.weight * 100)}%
                </p>
                <ul className="mt-1 ml-2 list-disc text-gray-400 text-xs">
                  {layer.targeting_options.map((opt, j) => (
                    <li key={j}>{opt}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Exclusions" open={!!openSections.exclusions} onToggle={() => toggle('exclusions')}>
          <div className="text-sm space-y-2">
            {Object.entries(specs.exclusion_layer.platforms).map(([platform, exclusions]) => (
              <div key={platform}>
                <p className="text-gray-300 font-medium">{platform}</p>
                <ul className="ml-4 list-disc text-gray-400 text-xs">
                  {exclusions.map((ex, i) => (
                    <li key={i}>{ex}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {specs.ethical_note && (
        <div className="mt-3 rounded-lg bg-yellow-900/30 border border-yellow-700/50 p-3 text-yellow-200 text-sm">
          {specs.ethical_note}
        </div>
      )}
    </div>
  );
}

export default AudienceSpecs;
