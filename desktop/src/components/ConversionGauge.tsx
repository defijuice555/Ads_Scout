import { PieChart, Pie, Cell } from 'recharts';

interface ConversionGaugeProps {
  probability: number;
}

function getColor(value: number): string {
  if (value < 30) return '#ef4444';
  if (value < 60) return '#eab308';
  return '#22c55e';
}

function ConversionGauge({ probability }: ConversionGaugeProps): JSX.Element {
  const value = Math.round(probability * 100);
  const color = getColor(value);
  const data = [
    { name: 'value', value },
    { name: 'remainder', value: 100 - value },
  ];

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 flex flex-col items-center">
      <PieChart width={200} height={120}>
        <Pie
          data={data}
          cx={100}
          cy={100}
          startAngle={180}
          endAngle={0}
          innerRadius={60}
          outerRadius={80}
          dataKey="value"
          stroke="none"
        >
          <Cell fill={color} />
          <Cell fill="#374151" />
        </Pie>
        <text
          x={100}
          y={85}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-3xl font-bold"
          fill={color}
          fontSize={32}
          fontWeight={700}
        >
          {value}%
        </text>
      </PieChart>
      <p className="text-gray-400 text-sm mt-1">Conversion Probability</p>
    </div>
  );
}

export default ConversionGauge;
