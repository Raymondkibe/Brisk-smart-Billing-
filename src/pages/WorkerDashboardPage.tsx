import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  QrCode,
  Package,
  CreditCard,
  Receipt,
  Search,
  Bell,
  User,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Barcode,
  Sparkles,
  Store,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth, apiFetch } from '../context/AuthContext';
import { Sale } from '../types';

interface WorkerDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const WorkerDashboardPage: React.FC<WorkerDashboardPageProps> = ({ onNavigate }) => {
  const { user, activeBusiness, member, role, logout } = useAuth();
  const [stats, setStats] = useState<{
    todaySalesTotal: number;
    todayTransactionsCount: number;
    successfulPaymentsTotal: number;
    pendingPaymentsCount: number;
    cancelledPaymentsCount: number;
    failedPaymentsCount: number;
    expiredPaymentsCount?: number;
    recentTransactions: Sale[];
  }>({
    todaySalesTotal: 8450,
    todayTransactionsCount: 37,
    successfulPaymentsTotal: 6800,
    pendingPaymentsCount: 2,
    cancelledPaymentsCount: 3,
    failedPaymentsCount: 1,
    expiredPaymentsCount: 0,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Poll shift data every 10s
    return () => clearInterval(interval);
  }, [activeBusiness?.id]);

  const loadStats = async () => {
    try {
      const res = await apiFetch('/api/worker/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load worker stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>PAID</span>
          </span>
        );
      case 'PENDING':
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>PENDING</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
            <XCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>CANCELLED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            <span>FAILED</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>EXPIRED</span>
          </span>
        );
      default:
        return <span className="text-xs font-medium text-slate-700">{status}</span>;
    }
  };

  const filteredTransactions = stats.recentTransactions.filter(t => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      t.sale_number.toLowerCase().includes(q) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
      (t.customer_phone && t.customer_phone.includes(q)) ||
      (t.items && t.items.some(i => i.product_name_snapshot.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      
      {/* ========================================================================= */}
      {/* WORKER DASHBOARD HEADER (Section 7) */}
      {/* Header Displays: Business Name, Worker Info (Name & Role), Header Controls */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-800 space-y-5">
        
        {/* Top Control Bar: Logo, Search, Notifications, Profile, Logout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          
          {/* Brand & Business Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-blue-600 shrink-0 shadow-md shadow-blue-500/20">
              <img
                src="/src/assets/images/apple-touch-icon.png"
                alt="BRISK SMART BILLING"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white block leading-none">
                  {activeBusiness?.name || 'ABC SHOP'}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase">
                  · POS Active
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                BRISK SMART BILLING Register
              </span>
            </div>
          </div>

          {/* Header Controls: Quick Search, Notifications, Profile, Logout */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Quick Shift Search */}
            <div className="relative min-w-[180px] sm:min-w-[240px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search shift receipts..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Notifications Shortcut */}
            <button
              onClick={() => onNavigate('/transactions')}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {stats.pendingPaymentsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
              )}
            </button>

            {/* Profile Tag */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700/80 text-xs">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'W'}
              </div>
              <div className="text-left">
                <span className="font-semibold text-white block leading-tight text-xs">
                  {user?.full_name || 'John Kamau'}
                </span>
                <span className="text-[10px] text-blue-400 uppercase font-medium">
                  {role ? role.replace('_', ' ') : 'Cashier'}
                </span>
              </div>
            </div>

            {/* Logout Control */}
            <button
              onClick={() => {
                logout();
                onNavigate('/login');
              }}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Sign Out of Register"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Section: Welcome & Primary POS Call to Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Shift Operations & Counter Terminal
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Serving at <strong className="text-white">{activeBusiness?.name || 'ABC SHOP'}</strong> · Real-time M-Pesa STK verification active
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('/worker/sales/new')}
              className="flex-1 sm:flex-initial px-5 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch New Sale (POS)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5 SHIFT CARDS (Section 8) */}
      {/* Metrics: Today's Sales, Transactions, Successful, Pending, Cancelled */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Card 1: Today's Sales */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Today's Sales</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 mt-2 font-mono tabular-nums">
            KES {stats.todaySalesTotal.toLocaleString()}
          </p>
          <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1.5">
            <span>Shift total</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 font-medium">Active register</span>
          </div>
        </div>

        {/* Card 2: Transactions Count */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Transactions</span>
            <Receipt className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 mt-2 font-mono tabular-nums">
            {stats.todayTransactionsCount}
          </p>
          <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1.5">
            <span>Customer checkouts</span>
          </div>
        </div>

        {/* Card 3: Successful Payments */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-600">Successful Payments</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-700 mt-2 font-mono tabular-nums">
            KES {stats.successfulPaymentsTotal.toLocaleString()}
          </p>
          <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1.5">
            <span>Confirmed M-Pesa & Cash</span>
          </div>
        </div>

        {/* Card 4: Pending Payments */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px] text-blue-600">Pending Payments</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-blue-700 mt-2 font-mono tabular-nums">
            {stats.pendingPaymentsCount}
          </p>
          <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1.5">
            <span>Awaiting customer PIN</span>
          </div>
        </div>

        {/* Card 5: Cancelled Payments */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-600">Cancelled Payments</span>
            <XCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-amber-700 mt-2 font-mono tabular-nums">
            {stats.cancelledPaymentsCount}
          </p>
          <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1.5">
            <span>Cancelled by customer</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* QUICK ACTIONS (Section 8) */}
      {/* Actions: New Sale, Scan Barcode, Products, Transactions, Receipts */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Quick Counter Actions
          </h2>
          <span className="text-[11px] text-slate-400">Tap to start operation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* Action 1: New Sale */}
          <button
            onClick={() => onNavigate('/worker/sales/new')}
            className="p-4 rounded-2xl bg-blue-50/80 hover:bg-blue-100 text-blue-900 border border-blue-200/80 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold block">New Sale</span>
              <span className="text-[10px] text-blue-700 block">Fast POS Register</span>
            </div>
          </button>

          {/* Action 2: Scan Barcode */}
          <button
            onClick={() => onNavigate('/worker/sales/new?scan=true')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold block">Scan Barcode</span>
              <span className="text-[10px] text-slate-500 block">Instant item add</span>
            </div>
          </button>

          {/* Action 3: Products */}
          <button
            onClick={() => onNavigate('/products')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold block">Products</span>
              <span className="text-[10px] text-slate-500 block">View stock & prices</span>
            </div>
          </button>

          {/* Action 4: Transactions */}
          <button
            onClick={() => onNavigate('/transactions')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold block">Transactions</span>
              <span className="text-[10px] text-slate-500 block">Payment monitoring</span>
            </div>
          </button>

          {/* Action 5: Receipts */}
          <button
            onClick={() => onNavigate('/receipts')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group col-span-2 sm:col-span-1"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold block">Receipts</span>
              <span className="text-[10px] text-slate-500 block">Print & verify</span>
            </div>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* RECENT SHIFT TRANSACTIONS STREAM */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Shift Sales & Payment Callbacks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status for transactions on this counter register
            </p>
          </div>

          <button
            onClick={loadStats}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Refresh Shift Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 sm:px-5">Sale No</th>
                <th className="py-3 px-3 sm:px-4">Items</th>
                <th className="py-3 px-3 sm:px-4">Customer</th>
                <th className="py-3 px-3 sm:px-4">Amount</th>
                <th className="py-3 px-3 sm:px-4">Payment Status</th>
                <th className="py-3 px-4 sm:px-5 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Receipt className="w-7 h-7 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-700 text-xs">
                      {searchFilter ? 'No transactions match your search' : 'No transactions recorded yet on this shift'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Launch POS register to start billing customers with instant M-Pesa STK push.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 sm:px-5 font-mono font-bold text-slate-900">
                      {s.sale_number}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-slate-700">
                      <span className="font-semibold">{s.items?.length || 1} items</span>
                      <span className="text-slate-400 text-[11px] block truncate max-w-[200px]">
                        {s.items?.map(i => i.product_name_snapshot).join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-slate-600">
                      <span className="font-medium text-slate-800 block">
                        {s.customer_name || 'Walk-in'}
                      </span>
                      {s.customer_phone && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {s.customer_phone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-mono font-black text-slate-900">
                      KES {s.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      {getStatusBadge(s.payment_status)}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-mono text-[11px] text-slate-400">
                      {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
