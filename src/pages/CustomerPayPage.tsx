import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Store,
  ExternalLink,
  Receipt as ReceiptIcon,
  Sparkles
} from 'lucide-react';
import { Receipt } from '../types';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';

interface CustomerPayPageProps {
  token: string;
}

export const CustomerPayPage: React.FC<CustomerPayPageProps> = ({ token }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment states
  const [phone, setPhone] = useState('');
  const [payStatus, setPayStatus] = useState<'idle' | 'prompting' | 'waiting' | 'success' | 'failed'>('idle');
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    loadSession();
  }, [token]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/qr/${token}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load payment details');
      }
      setData(json);
      if (json.status === 'paid' && json.receipt) {
        setReceipt(json.receipt);
        setPayStatus('success');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayMpesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) {
      setError('Please enter a valid Safaricom phone number.');
      return;
    }

    try {
      setPayStatus('prompting');
      setError(null);

      const res = await fetch(`/api/qr/${token}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Payment request failed');
      }

      setCurrentPaymentId(json.paymentId);
      setPayStatus('waiting');

      // Poll status
      pollPayment(json.paymentId);
    } catch (err: any) {
      setError(err.message);
      setPayStatus('failed');
    }
  };

  const pollPayment = (paymentId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/payments/${paymentId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.payment.status === 'PAID') {
            clearInterval(interval);
            setPayStatus('success');
            setReceipt(json.receipt);
            confetti({ particleCount: 80, spread: 70 });
          } else if (json.payment.status === 'FAILED') {
            clearInterval(interval);
            setPayStatus('failed');
            setError(json.payment.failure_reason || 'Payment could not be completed.');
          }
        }
      } catch (err) {
        console.error(err);
      }

      if (attempts > 30) {
        clearInterval(interval);
        if (payStatus === 'waiting') {
          setPayStatus('failed');
          setError('Payment verification timed out. Please check your M-Pesa balance.');
        }
      }
    }, 1500);
  };

  const handleSimulatePin = async () => {
    if (!currentPaymentId) return;
    try {
      const res = await fetch('/api/payments/mpesa/simulate-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: currentPaymentId, scenario: 'success' }),
      });
      const json = await res.json();
      if (res.ok) {
        setPayStatus('success');
        setReceipt(json.receipt);
        confetti({ particleCount: 70, spread: 70 });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-12">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-12">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">QR Payment Link Expired or Invalid</h2>
          <p className="text-xs text-slate-600 mt-1">{error}</p>
          <p className="text-[11px] text-slate-400 mt-4">Please ask the cashier to generate a new payment QR code.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-100 py-10 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Merchant Branding Header */}
        <div className="bg-slate-900 text-white p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-blue-600 shrink-0 shadow-md">
              <img
                src="/src/assets/images/apple-touch-icon.png"
                alt="BRISK SMART BILLING"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[11px] font-black tracking-wider text-blue-400 uppercase">
              BRISK SMART BILLING
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight">{data?.business?.name}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{data?.business?.location || 'Kiambu, Kenya'}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Checkout</span>
          </div>
        </div>

        {/* Order Breakdown */}
        <div className="p-6">
          {payStatus === 'success' && receipt ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Payment Successful!</h2>
              <p className="text-xs text-slate-600">
                Receipt <strong>{receipt.receipt_number}</strong> has been issued.
              </p>

              <button
                onClick={() => setReceipt(receipt)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <ReceiptIcon className="w-4 h-4" />
                <span>View & Print Official Receipt</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Order Items */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Order Items</div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {data?.sale?.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-2.5 flex justify-between items-center bg-white">
                      <div>
                        <p className="font-semibold text-slate-900">{item.product_name_snapshot}</p>
                        <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        KES {item.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Amount (Server-calculated and tamper-proof) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-500 block">Total Amount Due</span>
                  <span className="text-xl font-extrabold text-blue-700 font-mono">
                    KES {data?.amount?.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  Order #{data?.sale?.sale_number}
                </span>
              </div>

              {/* Payment Flow */}
              {payStatus === 'waiting' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-emerald-800 font-semibold text-xs">
                    <Smartphone className="w-4 h-4 animate-bounce" />
                    <span>M-Pesa STK Prompt Sent!</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Check your phone and enter your M-Pesa PIN to complete payment.
                  </p>
                  
                  {/* Sandbox button for instant tester convenience */}
                  <div className="pt-2">
                    <button
                      onClick={handleSimulatePin}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                    >
                      Instant Sandbox PIN Authorization
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePayMpesa} className="space-y-3">
                  {error && (
                    <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Enter Your M-Pesa Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="07XXXXXXXX"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={payStatus === 'prompting'}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{payStatus === 'prompting' ? 'Sending prompt...' : `PAY KES ${data?.amount?.toLocaleString()} VIA M-PESA`}</span>
                  </button>
                </form>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <img
            src="/src/assets/images/apple-touch-icon.png"
            alt="Logo"
            className="w-4 h-4 rounded object-cover shadow-2xs shrink-0"
          />
          <span>Powered by <strong className="text-slate-700 font-bold">BRISK SMART BILLING</strong> · Smart Billing. Pay. Verify. Grow.</span>
        </div>

      </div>

      {receipt && (
        <ThermalReceiptModal
          receipt={receipt}
          onClose={() => {}}
        />
      )}
    </div>
  );
};
