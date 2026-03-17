import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import type { Driver } from '../types';

interface DriversChartProps {
  drivers: Driver[];
}

const TYPE_COLORS: Record<string, string> = {
  engagement: '#3b82f6',
  conversion: '#22c55e',
};

function DriversChart({ drivers }: DriversChartProps): JSX.Element {
  const top = drivers.slice(0, 5).map((d) => ({
    factor: d.factor,
    impact: Math.round(d.impact * 100) / 100,
    type: d.type,
  }));

  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-gray-200 mb-3">Top Conversion Drivers</h3>
      <ResponsiveContainer width="100%" height={top.length * 48 + 20}>
        <BarChart data={top} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="factor"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#e5e7eb' }}
            itemStyle={{ color: '#e5e7eb' }}
          />
          <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
            {top.map((entry, i) => (
              <Cell key={i} fill={TYPE_COLORS[entry.type] ?? '#6b7280'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DriversChart;
