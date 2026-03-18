import { useState } from 'react';
import type { CreativeFramework, CreativeBrief } from '../types';

interface CreativeFrameworksProps {
  frameworks: (CreativeFramework | CreativeBrief)[];
}

const ANGLE_COLORS: Record<string, string> = {
  'Hook-First': 'bg-indigo-600 text-indigo-100',
  'Trust-First': 'bg-green-600 text-green-100',
  'Offer-First': 'bg-amber-600 text-amber-100',
  'Problem-First': 'bg-red-600 text-red-100',
  'Social-Proof-First': 'bg-purple-600 text-purple-100',
};

function isNewFormat(fw: CreativeFramework | CreativeBrief): fw is CreativeBrief {
  return 'angle' in fw;
}

function briefToClipboardText(brief: CreativeBrief): string {
  return [
    `Angle: ${brief.angle}`,
    `Headline: ${brief.headline}`,
    `Body: ${brief.body_direction}`,
    `CTA: ${brief.cta}`,
    `Format: ${brief.format}`,
    `Platform: ${brief.platform}`,
  ].join('\n');
}

function legacyToClipboardText(fw: CreativeFramework): string {
  return [
    `Name: ${fw.name}`,
    `Hook: ${fw.hook}`,
    `CTA: ${fw.cta}`,
    `Format: ${fw.format}`,
    `Why: ${fw.why}`,
  ].join('\n');
}

function CopyButton({ text }: { text: string }): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-600 transition-colors text-gray-400 hover:text-gray-200"
      title="Copy brief"
    >
      {copied ? (
        <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
        </svg>
      )}
    </button>
  );
}

function PriorityDot({ priority }: { priority: string }): JSX.Element {
  const color = priority === 'high' ? 'bg-green-400' : 'bg-yellow-400';
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-400">{priority}</span>
    </span>
  );
}

function NewBriefCard({ brief }: { brief: CreativeBrief }): JSX.Element {
  const badgeColor = ANGLE_COLORS[brief.angle] ?? 'bg-gray-600 text-gray-200';

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col">
      {/* Top row: angle badge + priority + copy */}
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeColor}`}>
          {brief.angle}
        </span>
        <div className="flex items-center gap-2">
          <PriorityDot priority={brief.priority} />
          <CopyButton text={briefToClipboardText(brief)} />
        </div>
      </div>

      {/* Headline */}
      <h4 className="text-lg font-semibold text-white mb-2 leading-snug">{brief.headline}</h4>

      {/* Body direction */}
      <p className="text-gray-300 text-sm mb-3 leading-relaxed">{brief.body_direction}</p>

      {/* CTA preview */}
      <div className="mb-3">
        <span className="inline-block text-xs font-medium px-3 py-1.5 rounded-full bg-indigo-600/40 text-indigo-300 border border-indigo-500/30">
          {brief.cta}
        </span>
      </div>

      {/* Why this works */}
      <p className="text-gray-400 text-xs italic mb-3">{brief.why}</p>

      {/* Format + Platform badges */}
      <div className="flex flex-wrap gap-2 mt-auto">
        <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">{brief.format}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">{brief.platform}</span>
      </div>
    </div>
  );
}

function LegacyCard({ fw }: { fw: CreativeFramework }): JSX.Element {
  const priorityColors: Record<string, string> = {
    high: 'bg-green-900/60 text-green-300',
    medium: 'bg-yellow-900/60 text-yellow-300',
    low: 'bg-gray-700 text-gray-300',
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-100">{fw.name}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{fw.format}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[fw.test_priority] ?? priorityColors.low}`}>
            {fw.test_priority}
          </span>
          <CopyButton text={legacyToClipboardText(fw)} />
        </div>
      </div>
      <p className="text-gray-300 text-sm mb-2">{fw.hook}</p>
      <span className="inline-block text-xs px-3 py-1 rounded-full bg-blue-900/60 text-blue-300 mb-2">
        {fw.cta}
      </span>
      <p className="text-gray-500 text-xs">{fw.why}</p>
    </div>
  );
}

function CreativeFrameworks({ frameworks }: CreativeFrameworksProps): JSX.Element {
  if (frameworks.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-3">Creative Briefs</h3>
        <p className="text-gray-500">No creative briefs generated yet</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-200 mb-3">Creative Briefs</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {frameworks.map((fw, i) =>
          isNewFormat(fw) ? (
            <NewBriefCard key={i} brief={fw} />
          ) : (
            <LegacyCard key={i} fw={fw} />
          ),
        )}
      </div>
    </div>
  );
}

export default CreativeFrameworks;
