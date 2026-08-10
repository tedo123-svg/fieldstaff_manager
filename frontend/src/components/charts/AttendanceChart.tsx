import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const genWeekData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    present: Math.floor(Math.random() * 15) + 70,
    absent: Math.floor(Math.random() * 10) + 5,
    late: Math.floor(Math.random() * 8) + 2,
  }));
};

const data = genWeekData();

export default function AttendanceChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="present" stroke="#22C55E" strokeWidth={2} dot={false} name="Present" />
        <Line type="monotone" dataKey="absent" stroke="#EF4444" strokeWidth={2} dot={false} name="Absent" />
        <Line type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={2} dot={false} name="Late" />
      </LineChart>
    </ResponsiveContainer>
  );
}
