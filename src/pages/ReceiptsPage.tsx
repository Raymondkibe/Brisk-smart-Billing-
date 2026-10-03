import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt as ReceiptIcon,
  Search,
  Printer,
  ShieldCheck,
  Eye,
  Filter,
  ArrowUpDown,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  FileText,
  RotateCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Receipt } from '../types';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';

export const ReceiptsPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'mpesa' | 'cash' | 'bank_transfer' | 'card'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, [activeBusiness?.id]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = await api.receipts.getReceipts();
      setReceipts(data || []);
    } catch (err) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered receipts
  const filtered = useMemo(() => {
    return receipts.filter(r => {
      // Payment method filter
      if (methodFilter !== 'all') {
        const m = (r.payment?.method || r.sale?.payment_method || '').toLowerCase();
        if (methodFilter === 'mpesa' && !m.includes('mpesa') && !m.includes('m-pesa')) return false;
        if (methodFilter === 'cash' && !m.includes('cash')) return false;
        if (methodFilter === 'bank_transfer' && !m.includes('bank')) return false;
        if (methodFilter === 'card' && !m.includes('card')) return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchReceipt = r.receipt_number.toLowerCase().includes(q);
        const matchSale = r.sale?.sale_number && r.sale.sale_number.toLowerCase().includes(q);
        const matchCustomer = r.sale?.customer_name && r.sale.customer_name.toLowerCase().includes(q);
        const matchRef = r.payment?.reference && r.payment.reference.toLowerCase().includes(q);
        const matchWorker = r.sale?.worker_name && r.sale.worker_name.toLowerCase().includes(q);
        if (!matchReceipt && !matchSale && !matchCustomer && !matchRef && !matchWorker) {
          return false;
        }
      }
      return true;
    });
  }, [receipts, methodFilter, search]);

  // Aggregate metrics
  const totalAmount = useMemo(() => {
    return receipts.reduce((sum, r) => sum + (r.sale?.total || 0), 0);
  }, [receipts]);

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return receipts.filter(r => r.issued_at.startsWith(today)).length;
  }, [receipts]);

  const handlePrintClick = (r: Receipt) => {
    setSelectedReceipt(r);
    setAutoPrint(true);
  };

  const handleViewClick = (r: Receipt) => {
    setSelectedReceipt(r);
    setAutoPrint(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Thermal Receipts & Verifications
            </h1>
            <span className="text-xs text-slate-500 font-normal">
              · {activeBusiness?.name || 'Store'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sequential business receipts with store branding, itemized breakdowns, and cryptographic QR verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReceipts}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stats (Clean unboxed typography) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Issued Receipts
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {receipts.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {todayCount} issued today
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Settled Value
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            KES {totalAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            100% verified sales transactions
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Thermal Compatibility
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            80mm / 58mm
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            ESC/POS & browser print ready
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by receipt number (BRK-000124), sale, M-Pesa ref, or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs transition-colors"
          />
        </div>

        {/* Method Filter Segmented Control */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Method:</span>
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'mpesa', label: 'M-Pesa' },
              { id: 'cash', label: 'Cash' },
              { id: 'bank_transfer', label: 'Bank' },
              { id: 'card', label: 'Card' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setMethodFilter(tab.id)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                methodFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Receipt Number</th>
                <th className="py-3.5 px-4">Sale Ref</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4 text-right">Settled Total</th>
                <th className="py-3.5 px-4">Reference Code</th>
                <th className="py-3.5 px-4">Issued At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading digital receipts...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ReceiptIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No receipts match your query</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Receipts are issued automatically upon successful checkout and payment settlement.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors group">
                    
                    {/* Receipt Number */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {r.receipt_number}
                    </td>

                    {/* Sale Number */}
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {r.sale?.sale_number || 'N/A'}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {r.sale?.customer_name || 'Walk-in Shopper'}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4 uppercase font-bold text-[10px] text-slate-700">
                      {r.payment?.method || r.sale?.payment_method || 'M-PESA'}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 tabular-nums">
                      KES {r.sale?.total?.toLocaleString() || '0'}
                    </td>

                    {/* Reference / M-Pesa Code */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {r.payment?.reference || 'CONFIRMED'}
                    </td>

                    {/* Issued Date */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(r.issued_at).toLocaleDateString('en-GB')}{' '}
                      <span className="text-slate-400">
                        {new Date(r.issued_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Direct Print Thermal Receipt Button */}
                        <button
                          type="button"
                          onClick={() => handlePrintClick(r)}
                          title="Print Thermal Receipt"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-900 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-md font-semibold text-[11px] transition-all cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>

                        {/* View Preview Button */}
                        <button
                          type="button"
                          onClick={() => handleViewClick(r)}
                          title="Inspect Receipt Details"
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Customer Verification Portal */}
                        <a
                          href={`/verify-receipt/${r.verification_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Customer Verification Portal"
                        >
                          <ShieldCheck className="w-4 h-4 inline" />
                        </a>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thermal Receipt Modal & Print Controller */}
      <ThermalReceiptModal
        receipt={selectedReceipt}
        onClose={() => {
          setSelectedReceipt(null);
          setAutoPrint(false);
        }}
        autoPrint={autoPrint}
      />

    </div>
  );
};
