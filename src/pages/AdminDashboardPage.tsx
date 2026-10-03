import React, { useState, useEffect } from 'react';
import {
  Shield,
  Store,
  Users,
  CreditCard,
  DollarSign,
  Layers,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Settings,
  MessageSquare,
  Mail,
  Phone,
  Trash2,
  Clock,
  Send,
  Eye,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SubscriptionPlan, AuditLog, ContactMessage, ContactMessageStatus } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'businesses' | 'plans' | 'logs' | 'messages'>('businesses');
  const [messageStatusFilter, setMessageStatusFilter] = useState<'ALL' | 'NEW' | 'READ' | 'REPLIED' | 'CLOSED'>('ALL');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [metRes, bizRes, planRes, logRes, msgRes] = await Promise.all([
        api.admin.getMetrics(),
        api.admin.getBusinesses(),
        api.admin.getPlans(),
        api.support.getAuditLogs(),
        api.admin.getContactMessages(),
      ]);
      setMetrics(metRes);
      setBusinesses(bizRes || []);
      setPlans(planRes || []);
      setLogs(logRes || []);
      setContactMessages(msgRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMessageStatus = async (id: string, status: ContactMessageStatus, replyNotes?: string) => {
    try {
      await api.admin.updateContactMessageStatus(id, status);
      showToast(`Message marked as ${status}.`);
      loadAdminData();
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev: ContactMessage | null) => prev ? { ...prev, status, reply_notes: replyNotes } : null);
      }
    } catch (err) {
      console.error('Failed to update message status:', err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact message record?')) return;
    try {
      await api.admin.deleteContactMessage(id);
      showToast('Contact message deleted.');
      if (selectedMessage && selectedMessage.id === id) setSelectedMessage(null);
      loadAdminData();
    } catch (err) {
      console.error('Failed to delete contact message:', err);
    }
  };

  const handleToggleBusiness = async (bizId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await api.admin.updateBusinessStatus(bizId, nextStatus);
    loadAdminData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Shield className="w-4 h-4" />
            <span>BRISK BILLING Platform Super Admin</span>
          </div>
          <h1 className="text-xl font-bold">Platform Operations & Tenancy Console</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Supervise multi-tenant businesses, platform transaction volume, subscription plans, and audit trails
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">Logged In As</span>
          <span className="text-xs font-bold text-white">{user?.full_name}</span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Registered Businesses</span>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
            {metrics?.totalBusinesses || 0}
          </p>
          <p className="text-[11px] text-emerald-600 mt-1">
            {metrics?.activeBusinesses || 0} active, {metrics?.suspendedBusinesses || 0} suspended
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Platform Payments Volume</span>
          <p className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums mt-1">
            KES {(metrics?.platformVolume || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Processed via Safaricom M-Pesa & Cash
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Transactions</span>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
            {metrics?.totalTransactions || 0}
          </p>
          <p className="text-[11px] text-emerald-600 mt-1">
            {metrics?.successfulPayments || 0} verified successful
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Subscription Revenue</span>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono tabular-nums mt-1">
            KES {(metrics?.subscriptionRevenue || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Software SaaS licensing revenue
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('businesses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'businesses' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Businesses ({businesses.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'plans' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Subscription Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'logs' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          System Audit Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'messages' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Contact Messages ({contactMessages.length})</span>
          {contactMessages.filter(m => m.status === 'NEW').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
              {contactMessages.filter(m => m.status === 'NEW').length} new
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Businesses List */}
      {activeTab === 'businesses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Tenant Directory</span>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search business..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Staff Count</th>
                  <th className="py-3 px-4">Subscription Status</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {businesses
                  .filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()))
                  .map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{b.name}</td>
                      <td className="py-3 px-4 text-slate-600">{b.category}</td>
                      <td className="py-3 px-4 text-slate-600">{b.location}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{b.phone}</td>
                      <td className="py-3 px-4 font-mono">{b.workersCount || 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-blue-700">
                          {b.subscription?.plan_name || 'Standard'} ({b.subscription?.status || 'active'})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleBusiness(b.id, b.status)}
                          className="text-[11px] font-semibold text-slate-700 hover:text-blue-600 cursor-pointer"
                        >
                          {b.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Subscription Plans Management (Section 45) */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {plans.map(p => (
            <div key={p.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900">{p.name}</h4>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                KES {p.price.toLocaleString()}
              </p>
              <div className="text-[11px] text-slate-600 space-y-1">
                <p>Duration: <strong>{p.duration_days} days</strong></p>
                <p>Workers: <strong>{p.worker_limit >= 999 ? 'Unlimited' : p.worker_limit}</strong></p>
                <p>Products: <strong>{p.product_limit >= 99999 ? 'Unlimited' : p.product_limit}</strong></p>
                <p>Transactions: <strong>{p.transaction_limit >= 999999 ? 'Unlimited' : p.transaction_limit}</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: System Audit Logs (Section 47) */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Platform Security & Event Logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {new Date(l.created_at).toLocaleTimeString('en-GB')}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800">
                      {l.user_name || 'System'}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-700">{l.action}</td>
                    <td className="py-3 px-4 text-slate-600">{l.resource_type}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-xs font-mono">
                      {JSON.stringify(l.metadata || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Contact Messages Management (Section 7) */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            
            {/* Header & Filter Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Public Contact & Sales Inquiries
                </span>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['ALL', 'NEW', 'READ', 'REPLIED', 'CLOSED'] as const).map(st => {
                  const count = st === 'ALL'
                    ? contactMessages.length
                    : contactMessages.filter(m => m.status === st).length;
                  const active = messageStatusFilter === st;

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMessageStatusFilter(st)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Messages Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">Business</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {contactMessages
                    .filter((m: ContactMessage) => messageStatusFilter === 'ALL' || m.status === messageStatusFilter)
                    .map((m: ContactMessage) => {
                      const statusStyles: Record<string, string> = {
                        NEW: 'bg-blue-50 text-blue-700 border-blue-200',
                        READ: 'bg-slate-100 text-slate-700 border-slate-200',
                        REPLIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        CLOSED: 'bg-amber-50 text-amber-700 border-amber-200',
                      };

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {new Date(m.created_at).toLocaleDateString('en-KE', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{m.name}</div>
                            <div className="text-[11px] text-slate-500">{m.email}</div>
                            {m.phone && <div className="text-[10px] text-slate-400 font-mono">{m.phone}</div>}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {m.business_name || '—'}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-bold text-slate-900 truncate">{m.subject}</div>
                            <div className="text-[11px] text-slate-500 truncate">{m.message}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles[m.status] || 'bg-slate-100 text-slate-700'}`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedMessage(m)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="View & Reply"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {m.status !== 'READ' && (
                                <button
                                  onClick={() => handleUpdateMessageStatus(m.id, 'READ')}
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Mark as Read"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {m.status !== 'CLOSED' && (
                                <button
                                  onClick={() => handleUpdateMessageStatus(m.id, 'CLOSED')}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
                                  title="Close Message"
                                >
                                  Close
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteMessage(m.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {contactMessages.filter(m => messageStatusFilter === 'ALL' || m.status === messageStatusFilter).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-slate-700">No contact messages found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Filter: {messageStatusFilter}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Message Details & Reply Drawer Modal */}
          {selectedMessage && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-fadeIn">
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      Ticket ID: {selectedMessage.id}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">{selectedMessage.subject}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Sender</span>
                    <span className="font-bold text-slate-900 block">{selectedMessage.name}</span>
                    <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 underline block text-[11px]">
                      {selectedMessage.email}
                    </a>
                    {selectedMessage.phone && (
                      <a href={`tel:${selectedMessage.phone}`} className="text-slate-500 font-mono text-[11px] block">
                        {selectedMessage.phone}
                      </a>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Business & Date</span>
                    <span className="font-bold text-slate-900 block">{selectedMessage.business_name || 'Not provided'}</span>
                    <span className="text-slate-400 text-[11px] block">
                      {new Date(selectedMessage.created_at).toLocaleString('en-KE')}
                    </span>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      Status: {selectedMessage.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase mb-1">Inquiry Message</span>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </div>
                </div>

                {selectedMessage.reply_notes && (
                  <div>
                    <span className="text-emerald-700 font-bold block text-[10px] uppercase mb-1">Previous Reply Note</span>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                      {selectedMessage.reply_notes}
                    </div>
                  </div>
                )}

                {/* Reply Actions */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add internal reply note..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
                    />
                    <button
                      onClick={() => {
                        handleUpdateMessageStatus(selectedMessage.id, 'REPLIED', replyText || 'Replied via email');
                        setReplyText('');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Mark Replied
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re:%20${encodeURIComponent(selectedMessage.subject)}&body=Hello%20${encodeURIComponent(selectedMessage.name)}%2C%0A%0AThank%20you%20for%20contacting%20BRISK%20SMART%20BILLING.%0A%0A`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send Reply Email</span>
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateMessageStatus(selectedMessage.id, 'CLOSED')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Close Ticket
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(selectedMessage.id)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
