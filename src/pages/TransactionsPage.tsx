import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Filter,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Sale, Receipt } from '../types';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';

export const TransactionsPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PAID' | 'PENDING' | 'FAILED'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'mpesa' | 'cash'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [activeBusiness?.id]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.sales.getSales();
      setSales(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (saleId: string) => {
    try {
      const receipts = await api.receipts.getReceipts();
      const r = receipts.find(item => item.sale_id === saleId);
      if (r) setSelectedReceipt(r);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = sales.filter(s => {
    const matchesStatus = statusFilter === 'all' || s.payment_status === statusFilter;
    const matchesMethod = methodFilter === 'all' || s.payment_method === methodFilter;
    const q = search.toLowerCase();
    const matchesQ = !q || s.sale_number.toLowerCase().includes(q) || (s.customer_name && s.customer_name.toLowerCase().includes(q)) || (s.customer_phone && s.customer_phone.includes(q));
    return matchesStatus && matchesMethod && matchesQ;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Payment & Sales Transactions</h1>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive audit ledger of M-Pesa and Cash payments</p>
        </div>

        <a
          href="/api/reports/export"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </a>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by sale number, customer name, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs"
          />
        </div>

        {/* Status segmented controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['all', 'PAID', 'PENDING', 'FAILED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
                statusFilter === st ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Sale No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Worker</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                    No transactions match your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(s => {
                  const isPaid = s.payment_status === 'PAID';
                  const isPending = s.payment_status === 'PENDING';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.sale_number}</td>
                      <td className="py-3 px-4 truncate max-w-[130px]">
                        <div>{s.customer_name || 'Walk-in'}</div>
                        {s.customer_phone && <div className="text-[10px] text-slate-400 font-mono">{s.customer_phone}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{s.worker_name}</td>
                      <td className="py-3 px-4 uppercase font-bold text-[10px] text-slate-600">
                        {s.payment_method || 'M-PESA'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                        KES {s.subtotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-600">
                        {s.discount > 0 ? `-KES ${s.discount.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        KES {s.total.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          isPaid ? 'text-emerald-700' : isPending ? 'text-amber-700' : 'text-red-700'
                        }`}>
                          {isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-500" />}
                          <span>{s.payment_status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(s.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPaid && (
                          <button
                            onClick={() => handleOpenReceipt(s.id)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
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
