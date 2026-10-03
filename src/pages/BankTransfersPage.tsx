import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  FileCheck2,
  AlertCircle,
  ShieldCheck,
  Receipt,
  User,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAuth, apiFetch } from '../context/AuthContext';
import { BankTransferRecord, Sale } from '../types';

interface BankTransfersPageProps {
  onNavigate?: (path: string) => void;
}

export const BankTransfersPage: React.FC<BankTransfersPageProps> = ({ onNavigate }) => {
  const { activeBusiness } = useAuth();

  const [transfers, setTransfers] = useState<BankTransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<BankTransferRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/payments/bank-transfers?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setTransfers(data || []);
      }
    } catch (err) {
      console.error('Failed to load bank transfers:', err);
      showToast('error', 'Failed to retrieve bank transfers queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, [activeBusiness?.id, filter]);

  const handleVerify = async (transferId: string) => {
    if (!window.confirm('Confirm that funds have been deposited in your business bank account before marking PAID?')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await apiFetch(`/api/payments/bank-transfers/${transferId}/verify`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify transfer.');

      showToast('success', 'Bank transfer marked as VERIFIED! Sale completed & inventory deducted.');
      setSelectedTransfer(null);
      loadTransfers();
    } catch (err: any) {
      showToast('error', err.message || 'Verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (transferId: string) => {
    try {
      setActionLoading(true);
      const res = await apiFetch(`/api/payments/bank-transfers/${transferId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || 'Deposit not reflected in business bank statement.' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject transfer.');

      showToast('success', 'Transfer marked as REJECTED. Sale was not completed.');
      setSelectedTransfer(null);
      setRejectReason('');
      loadTransfers();
    } catch (err: any) {
      showToast('error', err.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTransfers = transfers.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.reference.toLowerCase().includes(q) ||
      (t.bank_reference && t.bank_reference.toLowerCase().includes(q)) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
      (t.sender_name && t.sender_name.toLowerCase().includes(q)) ||
      (t.customer_phone && t.customer_phone.includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
            <Building2 className="w-4 h-4" />
            <span>Bank Transfer Payment Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Direct Bank Transfers Queue</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Verify direct electronic fund transfers for <strong className="text-white">{activeBusiness?.name || 'Your Business'}</strong>. Only confirmed transfers mark sales as completed and deduct inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate && onNavigate('/settings/payments')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            Bank Payment Settings
          </button>
          <button
            onClick={loadTransfers}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
            title="Refresh Transfers"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'pending', 'verified', 'rejected'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                filter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st} Transfers
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reference, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4">Customer / Sender</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Bank Ref</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading bank transfer records...</span>
                  </td>
                </tr>
              ) : filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-slate-700">No bank transfers found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Filter: {filter}</p>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map(t => {
                  const statusBadges: Record<string, string> = {
                    pending: 'bg-blue-50 text-blue-700 border-blue-200',
                    verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    rejected: 'bg-red-50 text-red-700 border-red-200',
                  };

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString('en-KE', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 font-mono text-xs">{t.reference}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{t.customer_name || t.sender_name || 'Counter Customer'}</div>
                        {t.customer_phone && (
                          <div className="text-[11px] text-slate-500 font-mono">{t.customer_phone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono whitespace-nowrap">
                        KES {t.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {t.bank_reference || t.transaction_id || '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${statusBadges[t.status] || 'bg-slate-100 text-slate-700'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedTransfer(t)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Details
                          </button>

                          {t.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleVerify(t.id)}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                              >
                                Verify Payment
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTransfer(t);
                                }}
                                disabled={actionLoading}
                                className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Reject
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

      {/* Transfer Review Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-fadeIn">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Transfer Reference
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">{selectedTransfer.reference}</h3>
              </div>
              <button
                onClick={() => setSelectedTransfer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Amount</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    KES {selectedTransfer.amount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white border border-slate-200">
                    {selectedTransfer.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Customer / Sender</span>
                  <span className="font-bold text-slate-900">{selectedTransfer.customer_name || selectedTransfer.sender_name || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Bank Transaction ID</span>
                  <span className="font-mono text-slate-900 font-bold">{selectedTransfer.bank_reference || selectedTransfer.transaction_id || 'Awaiting customer entry'}</span>
                </div>
              </div>

              {selectedTransfer.proof_notes && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Customer Proof Note</span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                    {selectedTransfer.proof_notes}
                  </div>
                </div>
              )}

              {selectedTransfer.status === 'pending' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Rejection Reason (If rejecting this payment)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Funds not reflected in KCB account statement"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTransfer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>

              {selectedTransfer.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReject(selectedTransfer.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reject Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify(selectedTransfer.id)}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    Verify & Mark PAID
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
