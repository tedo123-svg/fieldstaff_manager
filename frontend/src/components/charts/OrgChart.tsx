import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { OrgStat } from '../../types';

interface OrgChartProps { data: OrgStat[]; }

export default function OrgChart({ data }: OrgChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Noto Sans Ethiopic, sans-serif' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]}>
          {data.map(entry => <Cell key={entry.orgId} fill={entry.color} />)}
        </Bar>
        <Bar dataKey="working" name="Working" radius={[6, 6, 0, 0]} fill="#22C55E" opacity={0.7} />
      </BarChart>
    </ResponsiveContainer>
  );
}
