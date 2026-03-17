import type { CreativeFramework } from '../types';

interface CreativeFrameworksProps {
  frameworks: CreativeFramework[];
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-green-900/60 text-green-300',
  medium: 'bg-yellow-900/60 text-yellow-300',
  low: 'bg-gray-700 text-gray-300',
};

function CreativeFrameworks({ frameworks }: CreativeFrameworksProps): JSX.Element {
  if (frameworks.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-3">Creative Frameworks</h3>
        <p className="text-gray-500">Focus on improving trust signals and specificity</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-200 mb-3">Creative Frameworks</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {frameworks.map((fw, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-100">{fw.name}</h4>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{fw.format}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[fw.test_priority] ?? PRIORITY_COLORS.low}`}
                >
                  {fw.test_priority}
                </span>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-2">{fw.hook}</p>
            <span className="inline-block text-xs px-3 py-1 rounded-full bg-blue-900/60 text-blue-300 mb-2">
              {fw.cta}
            </span>
            <p className="text-gray-500 text-xs">{fw.why}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CreativeFrameworks;
