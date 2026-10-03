import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  Share2,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { Receipt } from '../types';

interface ThermalReceiptModalProps {
  receipt: Receipt | null;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ receipt, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (receipt) {
      const verifyUrl = `${window.location.origin}/verify-receipt/${receipt.verification_token}`;
      QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 180,
        color: { dark: '#0f172a', light: '#ffffff' }
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [receipt]);

  if (!receipt) return null;

  const sale = receipt.sale;
  const business = receipt.business;
  const payment = receipt.payment;
  const verifyUrl = `${window.location.origin}/verify-receipt/${receipt.verification_token}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Receipt ${receipt.receipt_number} from ${business?.name || 'BRISK BILLING'}`,
        text: `Here is your verified digital receipt for KES ${sale?.total.toLocaleString()}:`,
        url: verifyUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const { date, time } = formatDate(receipt.issued_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto no-print">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Digital Receipt Issued</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Preview */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {/* Paper Receipt Simulation */}
          <div id="printable-receipt" className="thermal-receipt bg-white text-slate-900 border border-dashed border-slate-300 rounded-xl p-6 shadow-xs font-mono text-sm leading-relaxed">
            
            {/* Business Header */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg font-sans">
                {business?.name ? business.name.slice(0, 2).toUpperCase() : 'BB'}
              </div>
              <h2 className="text-base font-bold uppercase tracking-tight text-slate-900 font-sans">
                {business?.name || 'ABC SHOP'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">{business?.location || 'Kiambu, Kenya'}</p>
              {business?.phone && <p className="text-xs text-slate-500">Tel: {business.phone}</p>}
              
              <div className="mt-3 pt-2 border-t border-dotted border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">SALES RECEIPT</span>
              </div>
            </div>

            {/* Receipt Metadata */}
            <div className="py-3 text-xs border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-bold text-slate-900">{receipt.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sale No:</span>
                <span className="text-slate-800">{sale?.sale_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-800">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="text-slate-800">{time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier / Staff:</span>
                <span className="text-slate-800">{sale?.worker_name || 'Staff'}</span>
              </div>
              {sale?.customer_name && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="text-slate-800">{sale.customer_name}</span>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="grid grid-cols-12 text-xs font-bold text-slate-600 pb-1 border-b border-slate-200">
                <div className="col-span-6">Item</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-4 text-right">Total</div>
              </div>

              <div className="divide-y divide-dotted divide-slate-100 py-1">
                {sale?.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-xs py-1.5">
                    <div className="col-span-6 font-medium text-slate-800 truncate pr-1">
                      {item.product_name_snapshot}
                    </div>
                    <div className="col-span-2 text-center text-slate-600">
                      {item.quantity}
                    </div>
                    <div className="col-span-4 text-right font-medium text-slate-900 tabular-nums">
                      {item.total.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Monetary Breakdown */}
            <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums">KES {sale?.subtotal.toLocaleString()}</span>
              </div>
              {sale && sale.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="tabular-nums">-KES {sale.discount.toLocaleString()}</span>
                </div>
              )}
              {sale && sale.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax (Included)</span>
                  <span className="tabular-nums">KES {sale.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>TOTAL</span>
                <span className="tabular-nums">KES {sale?.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-800">{payment?.method || 'M-PESA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-emerald-600">PAID</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">M-Pesa Reference:</span>
                <span className="font-mono font-bold text-slate-900">{payment?.reference || 'CONFIRMED'}</span>
              </div>
              {payment?.phone_masked && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Phone:</span>
                  <span className="text-slate-800">{payment.phone_masked}</span>
                </div>
              )}
            </div>

            {/* QR Code Verification Section */}
            <div className="pt-4 text-center">
              {qrDataUrl && (
                <div className="inline-block p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <img src={qrDataUrl} alt="Receipt Verification QR" className="w-32 h-32 mx-auto" />
                </div>
              )}
              <p className="text-[11px] font-semibold text-slate-700 mt-2">Scan to verify receipt</p>
              <p className="text-[10px] text-slate-400 truncate max-w-xs mx-auto mt-0.5">
                {receipt.verification_token.slice(0, 16)}...
              </p>
              
              <div className="mt-4 pt-3 border-t border-dotted border-slate-200 text-[11px] text-slate-500 flex flex-col items-center justify-center text-center">
                <p>{business?.receipt_footer || 'Thank you for your business.'}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <img
                    src="/src/assets/images/apple-touch-icon.png"
                    alt="Logo"
                    className="w-4 h-4 rounded object-cover shadow-2xs"
                  />
                  <span className="font-bold text-slate-800 text-xs">BRISK SMART BILLING</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Smart Billing. Pay. Verify. Grow.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="flex gap-2">
            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Portal</span>
            </a>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
