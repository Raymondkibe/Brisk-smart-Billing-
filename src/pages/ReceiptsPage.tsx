import React, { useState, useEffect } from 'react';
import {
  Receipt as ReceiptIcon,
  Search,
  Printer,
  ShieldCheck,
  ExternalLink,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Receipt } from '../types';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';

export const ReceiptsPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = receipts.filter(r => {
    const q = search.toLowerCase();
    return r.receipt_number.toLowerCase().includes(q) ||
      (r.sale?.sale_number && r.sale.sale_number.toLowerCase().includes(q)) ||
      (r.sale?.customer_name && r.sale.customer_name.toLowerCase().includes(q)) ||
      (r.payment?.reference && r.payment.reference.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Issued Digital Receipts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sequential business receipts (e.g. BRK-000124) with cryptographic QR verification
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Total Issued: <strong className="text-slate-900 font-bold">{receipts.length}</strong>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by receipt number (e.g. BRK-000124), M-Pesa reference, or customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Sale No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">M-Pesa Reference</th>
                <th className="py-3 px-4">Issued At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No receipts issued yet. Receipts are generated automatically once a sale is marked PAID.
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.receipt_number}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{r.sale?.sale_number}</td>
                    <td className="py-3 px-4">{r.sale?.customer_name || 'Customer'}</td>
                    <td className="py-3 px-4 uppercase font-bold text-[10px] text-slate-600">
                      {r.payment?.method || 'M-PESA'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      KES {r.sale?.total?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">{r.payment?.reference || 'PAID'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(r.issued_at).toLocaleDateString('en-GB')} {new Date(r.issued_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setSelectedReceipt(r)}
                          className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                        <a
                          href={`/verify-receipt/${r.verification_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                          title="Verify Link"
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

      <ThermalReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

    </div>
  );
};
