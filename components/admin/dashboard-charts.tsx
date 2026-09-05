'use client';

import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const NAVY = '#071B35';
const GOLD = '#D6A72C';
const GRAY = '#66758A';

export function QuotePerformanceChart({
  data,
}: {
  data: Array<{ month: string; quoted: number; approved: number }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EC" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: GRAY, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: GRAY, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
            }
          />
          <Tooltip
            formatter={(value) =>
              Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
          <Legend />
          <Line type="monotone" dataKey="quoted" name="Valor orçado" stroke={NAVY} strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="approved" name="Valor aprovado" stroke={GOLD} strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function QuoteStatusDonut({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  return (
    <div className="relative h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={68} outerRadius={96} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-navy">{total}</p>
          <p className="text-[12px] text-muted">orçamentos</p>
        </div>
      </div>
    </div>
  );
}

export function EquipmentBars({ data }: { data: Array<{ name: string; count: number }> }) {
  const max = Math.max(...data.map((item) => item.count), 1);
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.name}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-navy">{item.name}</span>
            <span className="shrink-0 font-semibold text-navy">{item.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-paper-strong">
            <div className="h-full rounded-full bg-navy" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
