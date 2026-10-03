import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Users,
  CreditCard,
  Package,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { useAuth, apiFetch } from '../context/AuthContext';

export const ReportsPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [activeBusiness?.id]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [metricsRes, salesRes] = await Promise.all([
        apiFetch('/api/reports/summary'),
        apiFetch('/api/sales'),
      ]);
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (salesRes.ok) setSales(await salesRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group sales by worker
  const workerSalesMap: Record<string, { name: string; count: number; total: number }> = {};
  for (const s of sales.filter(x => x.payment_status === 'PAID')) {
    if (!workerSalesMap[s.worker_id]) {
      workerSalesMap[s.worker_id] = { name: s.worker_name, count: 0, total: 0 };
    }
    workerSalesMap[s.worker_id].count += 1;
    workerSalesMap[s.worker_id].total += s.total;
  }
  const workerPerformances = Object.values(workerSalesMap);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Financial Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive revenue reconciliation, bestsellers, and staff sales</p>
        </div>

        <a
          href="/api/reports/export"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Sales CSV</span>
        </a>
      </div>

      {/* Primary Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Gross Sales Revenue</span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            KES {metrics ? metrics.totalRevenue.toLocaleString() : '0'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {metrics?.completedSalesCount || 0} completed orders
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Operational Expenses</span>
          <p className="text-2xl font-extrabold text-red-600 font-mono tabular-nums mt-1">
            KES {metrics ? metrics.totalExpenses.toLocaleString() : '0'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Utilities, supplies, stock deliveries
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Estimated Net Profit</span>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono tabular-nums mt-1">
            KES {metrics ? metrics.netProfit.toLocaleString() : '0'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Gross revenue minus recorded expenses
          </p>
        </div>
      </div>

      {/* Worker Performance & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cashier / Staff Sales Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Worker Sales Performance</h3>
            </div>
            <span className="text-[11px] text-slate-400">By total sales processed</span>
          </div>

          {workerPerformances.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">No staff sales recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {workerPerformances.map((w, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-900">{w.name}</p>
                    <p className="text-[11px] text-slate-400">{w.count} transactions completed</p>
                  </div>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    KES {w.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Channels Split */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Payment Methods Breakdown</h3>
            </div>
            <span className="text-[11px] text-slate-400">M-Pesa vs Cash</span>
          </div>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700">M-Pesa (STK Push & QR)</span>
                <span className="font-mono font-bold text-slate-900">{metrics?.paymentMethods?.mpesa || 0} orders</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${
                      ((metrics?.paymentMethods?.mpesa || 0) /
                        Math.max(1, (metrics?.paymentMethods?.mpesa || 0) + (metrics?.paymentMethods?.cash || 0))) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700">Cash Register</span>
                <span className="font-mono font-bold text-slate-900">{metrics?.paymentMethods?.cash || 0} orders</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-700 h-full rounded-full"
                  style={{
                    width: `${
                      ((metrics?.paymentMethods?.cash || 0) /
                        Math.max(1, (metrics?.paymentMethods?.mpesa || 0) + (metrics?.paymentMethods?.cash || 0))) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
