import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  Calendar,
  Tag,
  DollarSign
} from 'lucide-react';
import { useAuth, apiFetch } from '../context/AuthContext';
import { Expense } from '../types';

export const ExpensesPage: React.FC = () => {
  const { activeBusiness } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState('Utilities');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadExpenses();
  }, [activeBusiness?.id]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/expenses');
      if (res.ok) setExpenses(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    try {
      const res = await apiFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ category, description, amount, expenseDate }),
      });
      if (res.ok) {
        setModalOpen(false);
        setDescription('');
        setAmount('');
        loadExpenses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Business Expenses</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track overheads, utilities, and stock transport expenses</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary Stat */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <span className="text-xs font-semibold text-slate-500">Total Recorded Expenses</span>
        <p className="text-2xl font-extrabold text-red-600 font-mono tabular-nums mt-1">
          KES {totalExpenseAmount.toLocaleString()}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-slate-500">{e.expense_date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{e.description}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-red-600 tabular-nums">
                      KES {e.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{e.created_by_name || 'Staff'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Record Operational Expense</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Utilities">Utilities (Electricity, Water, Internet)</option>
                  <option value="Rent">Rent & Shop Lease</option>
                  <option value="Supplies">Packing Bags & Receipt Paper Rolls</option>
                  <option value="Transport">Delivery & Transport Logistics</option>
                  <option value="Salaries">Wages & Casual Labor</option>
                  <option value="General">Other General Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Electricity token for main counter"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    placeholder="2500"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
