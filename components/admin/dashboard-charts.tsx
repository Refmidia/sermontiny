'use client';

import {
  CartesianGrid,
  Cell,
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
const STEEL = '#174A7E';
const MUTED = '#66758A';
const LINE = '#DDE4EC';

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export function QuotePerformanceChart({
  data,
}: {
  data: Array<{ month: string; quoted: number; approved: number }>;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke={LINE} vertical={false} />
          <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} dy={8} />
          <YAxis
            width={72}
            tick={{ fill: MUTED, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => money(Number(value))}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${LINE}`,
              boxShadow: '0 8px 24px rgba(7,27,53,0.08)',
              fontSize: 12,
            }}
            formatter={(value, name) => [money(Number(value ?? 0)), name === 'quoted' ? 'Valor orçado' : 'Valor aprovado']}
            labelStyle={{ color: NAVY, fontWeight: 600, marginBottom: 4 }}
          />
          <Line
            type="monotone"
            dataKey="quoted"
            name="Valor orçado"
            stroke={NAVY}
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: NAVY, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="approved"
            name="Valor aprovado"
            stroke={STEEL}
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: STEEL, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-5 text-[12px] text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-navy" />
          Valor orçado
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-steel" />
          Valor aprovado
        </span>
      </div>
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
    <div className="flex h-full min-h-80 flex-col">
      <div className="relative min-h-56 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={72} outerRadius={100} paddingAngle={3} stroke="#fff" strokeWidth={2}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: `1px solid ${LINE}`,
                boxShadow: '0 8px 24px rgba(7,27,53,0.08)',
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[28px] leading-none font-bold text-navy tabular-nums">{total}</p>
            <p className="mt-1 text-[12px] text-muted">orçamentos</p>
          </div>
        </div>
      </div>
      <ul className="mt-2 space-y-2.5 border-t border-border pt-4">
        {data.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex min-w-0 items-center gap-2.5 text-navy">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-navy">
              {item.value}
              <span className="ml-1.5 text-[12px] font-medium text-muted">
                ({total ? Math.round((item.value / total) * 100) : 0}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EquipmentBars({ data }: { data: Array<{ name: string; count: number }> }) {
  const max = Math.max(...data.map((item) => item.count), 1);
  return (
    <div className="space-y-5">
      {data.map((item, index) => (
        <div key={item.name}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-paper-strong text-[11px] font-bold text-navy">
                {index + 1}
              </span>
              <span className="truncate font-medium text-navy">{item.name}</span>
            </span>
            <span className="shrink-0 rounded-md bg-info-soft px-2 py-0.5 text-[12px] font-semibold text-info">
              {item.count}×
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-paper-strong">
            <div
              className="h-full rounded-full bg-gradient-to-r from-navy to-steel"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
