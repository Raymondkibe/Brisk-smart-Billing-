import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  ShoppingCart,
  AlertTriangle,
  Receipt as ReceiptIcon,
  Users,
  Package,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Sale, Receipt } from '../types';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, activeBusiness, subscription, member } = useAuth();

  const [metrics, setMetrics] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [activeBusiness?.id]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [summaryData, salesData] = await Promise.all([
        api.reports.getSummary(),
        api.sales.getSales({ limit: 10 }),
      ]);

      setMetrics(summaryData);
      setRecentSales((salesData || []).slice(0, 7));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (saleId: string) => {
    try {
      const receipts = await api.receipts.getReceipts();
      const r = receipts.find(item => item.sale_id === saleId);
      if (r) setSelectedReceipt(r);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.full_name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>{activeBusiness?.name}</span>
            <span aria-hidden="true">·</span>
            <span>{activeBusiness?.location}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{member?.role?.replace('_', ' ') || 'Owner'}</span>
          </div>
        </div>

        {/* Quick Action Buttons (Section 81) */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('/sales/new')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New Sale</span>
          </button>
          <button
            onClick={() => onNavigate('/products')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Products</span>
          </button>
          <button
            onClick={() => onNavigate('/receipts')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ReceiptIcon className="w-3.5 h-3.5" />
            <span>Receipts</span>
          </button>
        </div>
      </div>

      {/* Subscription Banner (if trial or expiring) */}
      {subscription && subscription.status === 'trial' && (
        <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>14-Day Free Trial:</strong> You have <span className="font-bold">{subscription.days_remaining} days</span> remaining. Activate your plan anytime to maintain continuous service.
            </span>
          </div>
          <button
            onClick={() => onNavigate('/subscription')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            Upgrade Plan (KES 450+)
          </button>
        </div>
      )}

      {/* Primary KPI Grid (Tabular Numerals & High Density) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Revenue */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>Today's Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
            KES {metrics ? metrics.todayRevenue.toLocaleString() : '0'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics ? metrics.todaySalesCount : 0} completed transactions today
          </p>
        </div>

        {/* Total Gross Volume */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>Total Sales Volume</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
            KES {metrics ? metrics.totalRevenue.toLocaleString() : '0'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics ? metrics.completedSalesCount : 0} total paid orders
          </p>
        </div>

        {/* Payment Breakdown */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>M-Pesa vs Cash</span>
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">
              {metrics?.paymentMethods?.mpesa || 0}
            </span>
            <span className="text-xs text-slate-400">M-Pesa /</span>
            <span className="text-lg font-bold text-slate-700 tabular-nums">
              {metrics?.paymentMethods?.cash || 0}
            </span>
            <span className="text-xs text-slate-400">Cash</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics ? metrics.pendingCount : 0} pending payment confirmations
          </p>
        </div>

        {/* Low Stock Watch */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>Low Stock Items</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 tabular-nums">
            {metrics ? metrics.lowStockCount : 0}
          </p>
          <button
            onClick={() => onNavigate('/inventory')}
            className="text-[11px] text-blue-600 hover:underline font-medium mt-1 inline-flex items-center gap-1"
          >
            <span>Review inventory</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* Middle Row: Top Products & Quick Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Selling Products */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Top Selling Products</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Ranked by total sales revenue</p>
            </div>
            <button
              onClick={() => onNavigate('/products')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              View Catalog
            </button>
          </div>

          {metrics?.topProducts?.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">No sales completed yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {metrics?.topProducts?.map((p: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-400">{p.quantity} units sold</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 tabular-nums">
                    KES {p.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Inventory Alerts</h3>
              <span className="text-[11px] text-amber-600 font-semibold">{metrics?.lowStockCount || 0} Low Stock</span>
            </div>

            {metrics?.lowStockProducts?.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p>All stock levels healthy!</p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {metrics?.lowStockProducts?.map((item: any) => (
                  <div key={item.id} className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/50 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500">Threshold: {item.low_stock_threshold}</p>
                    </div>
                    <span className="font-bold text-amber-700 font-mono tabular-nums">
                      {item.stock_quantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('/inventory')}
            className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Manage Stock Restocking
          </button>
        </div>

      </div>

      {/* Bottom Table: Recent Transactions (Section 13) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Recent Transactions</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time ledger of completed and pending counter sales</p>
          </div>
          <button
            onClick={() => onNavigate('/transactions')}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            All Transactions →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Sale No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Worker</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No sales recorded yet. Click "New Sale" to begin billing.
                  </td>
                </tr>
              ) : (
                recentSales.map(sale => {
                  const isPaid = sale.payment_status === 'PAID';
                  const isPending = sale.payment_status === 'PENDING';
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{sale.sale_number}</td>
                      <td className="py-3 px-4 truncate max-w-[120px]">{sale.customer_name || 'Walk-in'}</td>
                      <td className="py-3 px-4 text-slate-500">{sale.worker_name}</td>
                      <td className="py-3 px-4 uppercase font-semibold text-[10px] text-slate-600">
                        {sale.payment_method || 'M-PESA'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        KES {sale.total.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          isPaid ? 'text-emerald-700' : isPending ? 'text-amber-700' : 'text-red-700'
                        }`}>
                          {isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-500" />}
                          <span>{sale.payment_status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(sale.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPaid && (
                          <button
                            onClick={() => handleViewReceipt(sale.id)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ThermalReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

    </div>
  );
};
