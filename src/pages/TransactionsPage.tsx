import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Filter,
  Download,
  QrCode,
  Printer,
  ShieldCheck,
  RotateCw,
  TrendingUp,
  Receipt as ReceiptIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Sale, Receipt } from '../types';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';
import { TransactionQRModal } from '../components/TransactionQRCode';

export const TransactionsPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PAID' | 'PENDING' | 'FAILED'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'mpesa' | 'cash' | 'bank_transfer' | 'card'>('all');
  
  // Modals state
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
  const [qrModalSale, setQrModalSale] = useState<Sale | null>(null);
  const [qrModalReceipt, setQrModalReceipt] = useState<Receipt | null>(null);
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
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open QR Code Verification Modal with Real Backend Payload
  const handleOpenQr = async (sale: Sale) => {
    try {
      setQrModalSale(sale);
      // Fetch or auto-generate real receipt & verification token from backend
      const res = await api.sales.getReceiptBySaleId(sale.id);
      if (res?.receipt) {
        setQrModalReceipt(res.receipt);
      }
    } catch (err) {
      console.error('Failed to load receipt QR data:', err);
      // Fallback: Still display QR with token if present on sale
      setQrModalReceipt(null);
    }
  };

  // Open Thermal Receipt Modal
  const handleOpenReceipt = async (sale: Sale, autoPrint = false) => {
    try {
      setAutoPrintReceipt(autoPrint);
      const res = await api.sales.getReceiptBySaleId(sale.id);
      if (res?.receipt) {
        setSelectedReceipt(res.receipt);
      }
    } catch (err) {
      console.error('Failed to load receipt:', err);
    }
  };

  const filtered = useMemo(() => {
    return sales.filter(s => {
      const matchesStatus = statusFilter === 'all' || s.payment_status === statusFilter;
      
      let matchesMethod = true;
      if (methodFilter !== 'all') {
        const m = (s.payment_method || '').toLowerCase();
        if (methodFilter === 'mpesa' && !m.includes('mpesa') && !m.includes('m-pesa')) matchesMethod = false;
        if (methodFilter === 'cash' && !m.includes('cash')) matchesMethod = false;
        if (methodFilter === 'bank_transfer' && !m.includes('bank')) matchesMethod = false;
        if (methodFilter === 'card' && !m.includes('card')) matchesMethod = false;
      }

      const q = search.toLowerCase().trim();
      const matchesQ =
        !q ||
        s.sale_number.toLowerCase().includes(q) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
        (s.customer_phone && s.customer_phone.includes(q)) ||
        (s.worker_name && s.worker_name.toLowerCase().includes(q));

      return matchesStatus && matchesMethod && matchesQ;
    });
  }, [sales, statusFilter, methodFilter, search]);

  // Aggregate Metrics
  const totalVolume = useMemo(() => {
    return sales
      .filter(s => s.payment_status === 'PAID')
      .reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const paidCount = useMemo(() => sales.filter(s => s.payment_status === 'PAID').length, [sales]);
  const pendingCount = useMemo(() => sales.filter(s => s.payment_status === 'PENDING').length, [sales]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Payment & Sales Transactions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit ledger of M-Pesa, Cash and Bank payments with cryptographic QR verification for every sale.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTransactions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <a
            href="/api/reports/export"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Settled Volume
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            KES {totalVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {paidCount} confirmed sales
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Settled Transactions
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            {paidCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Instant digital receipt verification
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Pending / In-Flight
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            M-Pesa STK awaiting PIN or approval
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by sale number (SALE-00102), customer name, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs transition-colors"
          />
        </div>

        {/* Status Segmented Controls */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Status:</span>
          {(['all', 'PAID', 'PENDING', 'FAILED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'all' ? 'All' : st}
            </button>
          ))}
        </div>

        {/* Method Segmented Controls */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Method:</span>
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'mpesa', label: 'M-Pesa' },
              { id: 'cash', label: 'Cash' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setMethodFilter(tab.id as any)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                methodFilter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Sale Ref</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Cashier</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 text-right">Subtotal</th>
                <th className="py-3.5 px-4 text-right">Discount</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading transaction ledger...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <ReceiptIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No transactions match your query</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      New transactions appear here immediately as checkouts are processed.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(s => {
                  const isPaid = s.payment_status === 'PAID';
                  const isPending = s.payment_status === 'PENDING';
                  const isFailed = s.payment_status === 'FAILED';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors group">
                      
                      {/* Sale Number */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {s.sale_number}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4 truncate max-w-[140px]">
                        <div className="font-medium text-slate-800">{s.customer_name || 'Walk-in'}</div>
                        {s.customer_phone && (
                          <div className="text-[10px] text-slate-400 font-mono">{s.customer_phone}</div>
                        )}
                      </td>

                      {/* Cashier / Attendant */}
                      <td className="py-3 px-4 text-slate-600">
                        {s.worker_name || 'Staff'}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 uppercase font-bold text-[10px] text-slate-700">
                        {s.payment_method || 'M-PESA'}
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                        KES {s.subtotal.toLocaleString()}
                      </td>

                      {/* Discount */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-600">
                        {s.discount > 0 ? `-KES ${s.discount.toLocaleString()}` : '—'}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 tabular-nums">
                        KES {s.total.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-xs ${
                            isPaid
                              ? 'text-emerald-700'
                              : isPending
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isPending ? (
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span>{s.payment_status}</span>
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString('en-GB')}{' '}
                        <span className="text-slate-400">
                          {new Date(s.created_at).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPaid && (
                            <>
                              {/* Dedicated QR Code Scan Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenQr(s)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md font-medium text-[11px] transition-colors cursor-pointer"
                                title="Generate Customer Verification QR Code"
                              >
                                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                                <span>QR Code</span>
                              </button>

                              {/* Thermal Receipt Print Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenReceipt(s, false)}
                                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="View Thermal Receipt"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction QR Code Modal */}
      <TransactionQRModal
        sale={qrModalSale}
        receipt={qrModalReceipt}
        onClose={() => {
          setQrModalSale(null);
          setQrModalReceipt(null);
        }}
        onOpenReceipt={r => {
          setSelectedReceipt(r);
          setAutoPrintReceipt(false);
        }}
      />

      {/* Printable Thermal Receipt Modal */}
      <ThermalReceiptModal
        receipt={selectedReceipt}
        onClose={() => {
          setSelectedReceipt(null);
          setAutoPrintReceipt(false);
        }}
        autoPrint={autoPrintReceipt}
      />

    </div>
  );
};
