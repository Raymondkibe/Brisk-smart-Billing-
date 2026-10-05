import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Store,
  Calendar,
  CreditCard,
  Receipt as ReceiptIcon,
  ShoppingBag,
  ExternalLink,
  Printer
} from 'lucide-react';

interface VerifyReceiptPageProps {
  token: string;
}

export const VerifyReceiptPage: React.FC<VerifyReceiptPageProps> = ({ token }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/receipts/verify/${token}`)
      .then(res => res.json())
      .then(json => {
        if (json.valid) {
          setData(json);
        } else {
          setError(json.message || 'Invalid or revoked receipt.');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-12">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-12">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-md border border-red-200 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">INVALID OR UNVERIFIED RECEIPT</h2>
          <p className="text-xs text-slate-600 mt-2">{error || 'This receipt could not be verified by the platform.'}</p>
          <div className="mt-6 p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 font-mono">
            Verification Token: {token.slice(0, 16)}...
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(data.paymentDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = new Date(data.paymentDate).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex-1 bg-slate-100 py-12 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Verification Status Banner */}
        <div className="bg-emerald-600 text-white p-6 text-center">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/20 mx-auto mb-2 shadow-sm">
            <img
              src="/apple-touch-icon.png"
              alt="BRISK SMART BILLING"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest bg-emerald-700/60 px-3 py-1 rounded-full inline-block">
            {data.verificationStatus}
          </span>
          <h1 className="text-lg font-bold mt-2">Official Digital Receipt Verified</h1>
          <p className="text-xs text-emerald-100">Authenticated via BRISK SMART BILLING Engine</p>
        </div>

        {/* Verification Details */}
        <div className="p-6 space-y-4">
          
          {/* Business & Receipt Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Business</span>
                <h3 className="text-base font-bold text-slate-900">{data.businessName}</h3>
                <p className="text-xs text-slate-500">{data.businessLocation}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Receipt No</span>
                <p className="text-sm font-bold text-slate-900 font-mono">{data.receiptNumber}</p>
              </div>
            </div>
          </div>

          {/* Payment Proof Card */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
                KES {data.amount?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-bold text-slate-800">{data.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">M-Pesa Reference:</span>
              <span className="font-mono font-bold text-slate-900">{data.paymentReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-emerald-600">PAID</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span className="text-slate-800">{formattedDate} at {formattedTime}</span>
            </div>
          </div>

          {/* Itemized Snapshot */}
          {data.itemsSummary && (
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Purchased Items</span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {data.itemsSummary.map((item: any, idx: number) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center bg-white">
                    <span className="font-medium text-slate-800">{item.name} × {item.quantity}</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      KES {item.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cryptographic token indicator */}
          <div className="pt-2 text-center text-[10px] text-slate-400 font-mono truncate">
            Token: {token}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <img
              src="/apple-touch-icon.png"
              alt="Logo"
              className="w-5 h-5 rounded-md object-cover shadow-2xs"
            />
            <span className="text-xs font-bold text-slate-800">BRISK SMART BILLING</span>
          </div>
          <p className="text-[11px] text-slate-500">Smart Billing. Pay. Verify. Grow.</p>
        </div>

      </div>
    </div>
  );
};
