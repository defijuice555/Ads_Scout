import { useState, useEffect } from 'react';
import type { AnalysisResult } from '../types';
import { loadHistory, deleteAnalysis } from '../lib/storage';
import ResultsDashboard from '../components/ResultsDashboard';

function HistoryPage(): JSX.Element {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [filter, setFilter] = useState('');
  const [expandedTimestamp, setExpandedTimestamp] = useState<string | null>(null);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const filtered = filter
    ? history.filter((e) =>
        e.keyword.toLowerCase().includes(filter.toLowerCase()) ||
        e.product.toLowerCase().includes(filter.toLowerCase())
      )
    : history;

  const handleDelete = async (timestamp: string): Promise<void> => {
    await deleteAnalysis(timestamp);
    setHistory((prev) => prev.filter((e) => e.timestamp !== timestamp));
    if (expandedTimestamp === timestamp) {
      setExpandedTimestamp(null);
    }
  };

  const formatDate = (ts: string): string => {
    try {
      return new Date(ts).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  const expandedEntry = filtered.find((e) => e.timestamp === expandedTimestamp);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <input
          type="text"
          placeholder="Filter by keyword or product..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-72 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <p className="text-lg">
            {history.length === 0 ? 'No past analyses' : 'No results match your filter'}
          </p>
          {history.length === 0 && (
            <p className="mt-1 text-sm">Run an analysis and it will appear here.</p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-800 bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-400">Keyword</th>
                <th className="px-4 py-3 font-medium text-gray-400">Product</th>
                <th className="px-4 py-3 font-medium text-gray-400">Date</th>
                <th className="px-4 py-3 font-medium text-gray-400 text-right">Conversion %</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.timestamp}
                  onClick={() =>
                    setExpandedTimestamp(
                      expandedTimestamp === entry.timestamp ? null : entry.timestamp
                    )
                  }
                  className={`cursor-pointer border-b border-gray-800/50 transition-colors hover:bg-gray-900/50 ${
                    expandedTimestamp === entry.timestamp ? 'bg-gray-900/70' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-white">{entry.keyword}</td>
                  <td className="px-4 py-3 text-gray-300">{entry.product}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(entry.timestamp)}</td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-400">
                    {entry.conversion_analysis?.conversion_probability != null
                      ? `${entry.conversion_analysis.conversion_probability.toFixed(1)}%`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.timestamp);
                      }}
                      className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-red-900/50 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expandedEntry && (
        <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900/30 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {expandedEntry.keyword} &mdash; {expandedEntry.product}
            </h2>
            <button
              onClick={() => setExpandedTimestamp(null)}
              className="text-sm text-gray-400 hover:text-white"
            >
              Collapse
            </button>
          </div>
          <ResultsDashboard result={expandedEntry} />
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
