import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SupportTicket } from '../types';

export const SupportPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'payment' | 'account' | 'subscription' | 'receipt' | 'technical'>('payment');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadTickets();
  }, [activeBusiness?.id]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await api.support.getTickets();
      setTickets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    try {
      await api.support.createTicket({
        subject,
        message: description,
        category,
        priority,
      });
      setModalOpen(false);
      setSubject('');
      setDescription('');
      loadTickets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Support & Help Desk</h1>
          <p className="text-xs text-slate-500 mt-0.5">Submit technical or payment assistance tickets directly to our engineering team</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-slate-700">No support tickets submitted</p>
            <p className="text-[11px] text-slate-400 mt-1">If you need assistance with tills or receipts, click "New Support Ticket".</p>
          </div>
        ) : (
          tickets.map(t => (
            <div key={t.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {t.category}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      t.priority === 'urgent' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {t.priority} priority
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{t.subject}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t.description}</p>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  t.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {t.status}
                </span>
              </div>

              {t.admin_reply && (
                <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Engineering Team Response:</span>
                  </span>
                  <p className="text-slate-700 text-[11px] leading-relaxed">{t.admin_reply}</p>
                </div>
              )}

              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
                <span>Submitted by {t.user_name}</span>
                <span>{new Date(t.created_at).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Create Support Ticket</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  placeholder="e.g. Assistance setting up second counter till"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="payment">M-Pesa Payment</option>
                    <option value="account">Account & Business</option>
                    <option value="subscription">Subscription & Billing</option>
                    <option value="receipt">Receipts & QR</option>
                    <option value="technical">Technical / POS</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue with exact details..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
