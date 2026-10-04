import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  CreditCard,
  Banknote,
  DollarSign,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export interface DailySalesTrend {
  date: string;
  label: string;
  revenue: number;
  transactions: number;
  mpesaRevenue?: number;
  cashRevenue?: number;
}

interface DashboardWidgetProps {
  data?: DailySalesTrend[];
  currency?: string;
  title?: string;
  className?: string;
}

// Custom High-Contrast Tooltip
const CustomTooltip = ({ active, payload, label, currency = 'KES' }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as DailySalesTrend;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs font-sans min-w-[160px]">
        <div className="text-slate-400 font-medium text-[11px] mb-1.5 pb-1 border-b border-slate-800">
          {item.label || label}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-3">
            <span className="text-slate-300">Revenue:</span>
            <span className="font-bold text-white font-mono tabular-nums">
              {currency} {item.revenue?.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-slate-400">Transactions:</span>
            <span className="font-semibold text-slate-200 font-mono tabular-nums">
              {item.transactions} orders
            </span>
          </div>
          {item.mpesaRevenue !== undefined && item.mpesaRevenue > 0 && (
            <div className="flex justify-between items-center gap-3 text-[10px] pt-1 border-t border-slate-800/80">
              <span className="text-emerald-400">M-Pesa:</span>
              <span className="font-mono text-emerald-300 tabular-nums">
                {currency} {item.mpesaRevenue.toLocaleString()}
              </span>
            </div>
          )}
          {item.cashRevenue !== undefined && item.cashRevenue > 0 && (
            <div className="flex justify-between items-center gap-3 text-[10px]">
              <span className="text-amber-400">Cash:</span>
              <span className="font-mono text-amber-300 tabular-nums">
                {currency} {item.cashRevenue.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  data,
  currency = 'KES',
  title = '7-Day Daily Sales Trends',
  className = '',
}) => {
  const [metric, setMetric] = useState<'revenue' | 'transactions'>('revenue');

  // Generate fallback 7-day skeleton if data is missing or empty
  const chartData: DailySalesTrend[] = React.useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    const days: DailySalesTrend[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
        revenue: 0,
        transactions: 0,
        mpesaRevenue: 0,
        cashRevenue: 0,
      });
    }
    return days;
  }, [data]);

  // Aggregates
  const total7DayRevenue = chartData.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const total7DayOrders = chartData.reduce((sum, d) => sum + (d.transactions || 0), 0);
  const avgDaily = Math.round(total7DayRevenue / 7);

  // Determine peak sales day
  const peakDay = [...chartData].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between ${className}`}>
      
      {/* Widget Header & Metrics Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {title}
            </h3>
            <span className="text-[11px] text-slate-400 font-normal">
              · Last 7 Days
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Daily retail volume, transaction velocity, and payment reconciliation
          </p>
        </div>

        {/* Metric View Segmented Toggle */}
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            className={`px-3 py-1 font-semibold rounded-md transition-all cursor-pointer ${
              metric === 'revenue'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revenue ({currency})
          </button>
          <button
            type="button"
            onClick={() => setMetric('transactions')}
            className={`px-3 py-1 font-semibold rounded-md transition-all cursor-pointer ${
              metric === 'transactions'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transactions
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-3 gap-3 mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
            7-Day Volume
          </span>
          <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
            {currency} {total7DayRevenue.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
            Total Orders
          </span>
          <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
            {total7DayOrders}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
            Daily Average
          </span>
          <span className="text-base font-bold text-blue-600 font-mono tabular-nums">
            {currency} {avgDaily.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Recharts Line / Area Visual Container */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="salesTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="orderTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              dy={6}
            />

            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val: number) => {
                if (metric === 'revenue') {
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return `${val}`;
                }
                return `${val}`;
              }}
              dx={-4}
            />

            <Tooltip content={<CustomTooltip currency={currency} />} />

            {metric === 'revenue' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesTrendGradient)"
                  activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="mpesaRevenue"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="M-Pesa"
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="transactions"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#orderTrendGradient)"
                activeDot={{ r: 6, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Insights Note */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
          <span>Total Sales Revenue</span>
          <span className="text-slate-300 ml-1">·</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-1" />
          <span className="text-slate-500">M-Pesa Volume (Dashed)</span>
        </div>

        {peakDay && peakDay.revenue > 0 && (
          <div className="text-slate-600 font-medium">
            Peak: <strong className="text-slate-900">{peakDay.label}</strong> ({currency} {peakDay.revenue.toLocaleString()})
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardWidget;
