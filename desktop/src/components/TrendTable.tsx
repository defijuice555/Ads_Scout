import { useState, useMemo } from 'react';
import type { TrendData } from '../types';

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
            <th className="text-left py-2 px-3 cursor-pointer select-none" onClick={() => handleSort('name')}>
              Trend Name{arrow('name')}
            </th>
            <th className="text-right py-2 px-3 cursor-pointer select-none" onClick={() => handleSort('sources')}>
              Sources{arrow('sources')}
            </th>
            <th className="text-right py-2 px-3 cursor-pointer select-none" onClick={() => handleSort('confidence')}>
              Confidence %{arrow('confidence')}
            </th>
            <th className="text-right py-2 px-3 cursor-pointer select-none" onClick={() => handleSort('score')}>
              Weighted Score{arrow('score')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.name} className="bg-gray-800 hover:bg-gray-700 border-b border-gray-700">
              <td className="py-2 px-3 text-gray-200">{row.name}</td>
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
