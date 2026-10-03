import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useAuth, apiFetch } from '../context/AuthContext';
import { SubscriptionPlan } from '../types';

export const SubscriptionPage: React.FC = () => {
  const { activeBusiness, subscription, refreshAuth } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Upgrade / Activation Modal
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [phone, setPhone] = useState('0712345678');
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/subscriptions/plans');
      if (res.ok) setPlans(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !phone) return;

    try {
      setPaying(true);
      setError(null);
      setMessage(null);

      const res = await apiFetch('/api/subscriptions/activate', {
        method: 'POST',
        body: JSON.stringify({
          planId: selectedPlan.id,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate subscription');

      confetti({ particleCount: 80, spread: 70 });
      setMessage(data.message);
      await refreshAuth();
      setTimeout(() => {
        setSelectedPlan(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Current Plan Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Current Subscription Status</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {subscription?.plan_name || 'Standard Plan'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Business: <strong>{activeBusiness?.name}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              subscription?.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : subscription?.status === 'trial'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{subscription?.status} · {subscription?.days_remaining} Days Remaining</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[11px]">Billing Cadence</span>
            <span className="font-semibold text-slate-800">Every 30 Days (Prepaid via M-Pesa)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Valid Until</span>
            <span className="font-semibold text-slate-800 font-mono">
              {subscription?.ends_at ? new Date(subscription.ends_at).toLocaleDateString('en-GB') : 'Active'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Separated Workflow</span>
            <span className="font-semibold text-slate-800">
              Platform software fee (Customer sales money belongs 100% to merchant)
            </span>
          </div>
        </div>
      </div>

      {/* Subscription Plans Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Available Subscription Plans</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a plan to activate or renew your business account via M-Pesa STK push
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {plans.map(plan => {
            const isCurrent = subscription?.plan_id === plan.id;
            return (
              <div
                key={plan.id}
                className={`p-5 bg-white rounded-2xl border flex flex-col justify-between transition-all ${
                  isCurrent ? 'border-blue-600 ring-2 ring-blue-600/10 shadow-md' : 'border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold text-slate-900">{plan.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="my-3">
                    <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      KES {plan.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400"> / 30 days</span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-3 mb-4">
                    <p>• Max Workers: <strong>{plan.worker_limit >= 999 ? 'Unlimited' : plan.worker_limit}</strong></p>
                    <p>• Max Products: <strong>{plan.product_limit >= 99999 ? 'Unlimited' : plan.product_limit}</strong></p>
                    <p>• Transactions: <strong>{plan.transaction_limit >= 999999 ? 'Unlimited' : plan.transaction_limit}</strong></p>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-[11px]">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isCurrent ? 'Renew Plan' : `Activate ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Activation Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Activate {selectedPlan.name} Subscription
                </h3>
                <p className="text-[11px] text-slate-500">Duration: 30 Days · Amount: KES {selectedPlan.price}</p>
              </div>
              <button onClick={() => setSelectedPlan(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {error && <div className="p-2 mb-3 bg-red-50 text-red-700 text-xs rounded">{error}</div>}
            {message && <div className="p-2 mb-3 bg-emerald-50 text-emerald-800 text-xs rounded font-medium">{message}</div>}

            <form onSubmit={handleActivatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  M-Pesa Phone Number for Billing *
                </label>
                <div className="relative">
                  <Smartphone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    placeholder="07XXXXXXXX"
                    className="w-full pl-9 pr-3 py-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                Clicking "Send M-Pesa STK Push" triggers an STK prompt to your phone. Once confirmed, your subscription will be instantly activated for 30 days.
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="px-3 py-2 bg-slate-100 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{paying ? 'Processing STK Push...' : `Pay KES ${selectedPlan.price} via M-Pesa`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
