import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  Share2,
  X,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  CreditCard,
  Receipt as ReceiptIcon,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { Receipt } from '../types';
import { useAuth } from '../context/AuthContext';

interface ThermalReceiptModalProps {
  receipt: Receipt | null;
  onClose: () => void;
  autoPrint?: boolean;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  receipt,
  onClose,
  autoPrint = false,
}) => {
  const { activeBusiness } = useAuth();
  const [copied, setCopied] = useState(false);
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>('80mm');
  const [showStoreBranding, setShowStoreBranding] = useState(true);

  // Handle optional auto-print when opened
  useEffect(() => {
    if (receipt && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [receipt, autoPrint]);

  if (!receipt) return null;

  const sale = receipt.sale;
  const payment = receipt.payment;
  
  // Prefer receipt.business, fallback to active authenticated business
  const business = receipt.business || (activeBusiness ? {
    name: activeBusiness.name,
    logo_url: activeBusiness.logo_url,
    location: activeBusiness.location,
    address: activeBusiness.address,
    phone: activeBusiness.phone,
    email: activeBusiness.email,
    receipt_footer: activeBusiness.receipt_footer,
    currency: activeBusiness.currency || 'KES',
  } : undefined);

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
        text: `Here is your verified digital receipt for KES ${sale?.total?.toLocaleString()}:`,
        url: verifyUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch {
      return { date: 'N/A', time: 'N/A' };
    }
  };

  const { date, time } = formatDate(receipt.issued_at);
  const currency = business?.currency || 'KES';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      
      {/* Modal Dialog Card (Interactive Screen Shell) */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header (Screen only, hidden in print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Thermal Receipt Print Preview</h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {receipt.receipt_number} · {date}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper & Layout Options Bar (Screen only) */}
        <div className="no-print px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Paper Size Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium text-[11px]">Paper Width:</span>
            <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5">
              <button
                type="button"
                onClick={() => setPaperSize('80mm')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  paperSize === '80mm'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80mm (Standard POS)
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('58mm')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  paperSize === '58mm'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                58mm (Handheld POS)
              </button>
            </div>
          </div>

          {/* Store Branding Toggle */}
          <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showStoreBranding}
              onChange={e => setShowStoreBranding(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>Store Header & Details</span>
          </label>
        </div>

        {/* Scrollable Thermal Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center items-start">
          
          {/* THE PRINTABLE TARGET
              This DOM element is isolated by @media print in index.css */}
          <div
            id="thermal-print-target"
            className={`thermal-receipt bg-white text-slate-900 border border-dashed border-slate-300 rounded-sm shadow-md font-mono text-[12px] leading-tight select-text transition-all ${
              paperSize === '80mm' ? 'w-[320px] p-5' : 'w-[250px] p-3.5 paper-58mm'
            }`}
          >
            {/* Top Paper Perforation Line (Visual Screen Only) */}
            <div className="no-print h-1.5 receipt-paper-edge -mt-5 -mx-5 mb-4 opacity-30" />

            {/* STORE BRANDING HEADER */}
            {showStoreBranding && (
              <div className="text-center pb-3 border-b border-dashed border-slate-400">
                {/* Store Monogram or Logo */}
                {business?.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="w-12 h-12 object-contain mx-auto mb-1.5 filter grayscale contrast-125"
                  />
                ) : (
                  <div className="w-10 h-10 mx-auto mb-1 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-base font-sans tracking-wider">
                    {business?.name ? business.name.slice(0, 2).toUpperCase() : 'BB'}
                  </div>
                )}

                <h1 className="text-base font-black uppercase tracking-tight text-slate-950 font-sans">
                  {business?.name || 'BRISK STORE'}
                </h1>
                
                {business?.location && (
                  <p className="text-[11px] text-slate-700 mt-0.5 font-sans">
                    {business.location}
                  </p>
                )}
                {business?.address && (
                  <p className="text-[10px] text-slate-600 font-sans">
                    {business.address}
                  </p>
                )}
                {business?.phone && (
                  <p className="text-[11px] text-slate-700 font-sans">
                    Tel: {business.phone}
                  </p>
                )}
                {activeBusiness?.vat_number && (
                  <p className="text-[10px] text-slate-600 font-sans">
                    KRA PIN: {activeBusiness.vat_number}
                  </p>
                )}
              </div>
            )}

            {/* RECEIPT TITLE & SEPARATORS */}
            <div className="text-center py-2 border-b border-dashed border-slate-400">
              <span className="text-[12px] font-bold tracking-widest uppercase text-slate-900">
                OFFICIAL SALES RECEIPT
              </span>
            </div>

            {/* TRANSACTION METADATA */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">RECEIPT NO:</span>
                <span className="font-bold text-slate-950">{receipt.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">SALE REF:</span>
                <span className="text-slate-900">{sale?.sale_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">DATE & TIME:</span>
                <span className="text-slate-900">{date} {time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">CASHIER:</span>
                <span className="text-slate-900">{sale?.worker_name || 'Counter Staff'}</span>
              </div>
              {sale?.customer_name && (
                <div className="flex justify-between">
                  <span className="text-slate-600">CUSTOMER:</span>
                  <span className="text-slate-900 truncate max-w-[150px]">{sale.customer_name}</span>
                </div>
              )}
            </div>

            {/* ITEMIZED PRODUCTS LIST */}
            <div className="py-2.5 border-b border-dashed border-slate-400">
              <div className="flex justify-between font-bold text-[11px] text-slate-900 pb-1.5 border-b border-dotted border-slate-400">
                <span className="w-1/2">ITEM / DESCRIPTION</span>
                <span className="w-1/4 text-center">QTY</span>
                <span className="w-1/4 text-right">TOTAL</span>
              </div>

              <div className="divide-y divide-dotted divide-slate-200 py-1 space-y-1.5">
                {sale?.items && sale.items.length > 0 ? (
                  sale.items.map((item, idx) => (
                    <div key={idx} className="pt-1.5 text-[11px]">
                      <div className="font-medium text-slate-950 truncate">
                        {item.product_name_snapshot}
                      </div>
                      <div className="flex justify-between text-slate-600 text-[10px] mt-0.5">
                        <span>
                          {item.quantity} {item.unit || 'pcs'} × {currency} {item.unit_price?.toLocaleString()}
                        </span>
                        <span className="font-bold text-slate-900 tabular-nums text-[11px]">
                          {currency} {(item.unit_price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-center text-slate-500 italic text-[11px]">
                    Standard Sale Transaction
                  </div>
                )}
              </div>
            </div>

            {/* FINANCIAL TOTALS */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium">{currency} {sale?.subtotal?.toLocaleString() || '0'}</span>
              </div>
              {sale && sale.discount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Discount</span>
                  <span className="tabular-nums font-medium">-{currency} {sale.discount.toLocaleString()}</span>
                </div>
              )}
              {sale && sale.tax > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>VAT (16% Included)</span>
                  <span className="tabular-nums font-medium">{currency} {sale.tax.toLocaleString()}</span>
                </div>
              )}

              {/* GRAND TOTAL */}
              <div className="flex justify-between text-[13px] font-black text-slate-950 pt-2 border-t border-slate-900">
                <span>TOTAL PAID</span>
                <span className="tabular-nums">{currency} {sale?.total?.toLocaleString() || '0'}</span>
              </div>
            </div>

            {/* SETTLEMENT & PAYMENT CONFIRMATION */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">METHOD:</span>
                <span className="font-bold uppercase text-slate-900">{payment?.method || sale?.payment_method || 'M-PESA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">STATUS:</span>
                <span className="font-bold text-slate-900">PAID & SETTLED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">REF / CODE:</span>
                <span className="font-bold text-slate-950">{payment?.reference || 'CONFIRMED'}</span>
              </div>
              {payment?.phone_masked && (
                <div className="flex justify-between">
                  <span className="text-slate-600">CUSTOMER TEL:</span>
                  <span className="text-slate-900">{payment.phone_masked}</span>
                </div>
              )}
            </div>

            {/* VERIFICATION QR CODE (Powered by qrcode.react) */}
            <div className="pt-3 text-center">
              <div className="inline-block p-1 bg-white border border-slate-900 rounded-xs shadow-2xs">
                <QRCodeSVG
                  value={verifyUrl}
                  size={paperSize === '80mm' ? 120 : 96}
                  level="M"
                  marginSize={1}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
              <p className="text-[10px] font-bold text-slate-900 mt-1 uppercase tracking-wider">
                Scan QR to Verify Genuine Receipt
              </p>
              <p className="text-[9px] text-slate-500 font-mono truncate max-w-[200px] mx-auto">
                Token: {receipt.verification_token.slice(0, 16)}...
              </p>

              {/* FOOTER NOTICE */}
              <div className="mt-3 pt-2 border-t border-dotted border-slate-400 text-[10px] text-slate-600">
                <p className="font-sans font-medium">
                  {business?.receipt_footer || 'Thank you for your business. Karibu Tena!'}
                </p>
                <p className="text-[9px] text-slate-500 font-mono mt-1">
                  BRISK SMART BILLING · POS TERMINAL
                </p>
              </div>
            </div>

            {/* Bottom Paper Perforation Line (Visual Screen Only) */}
            <div className="no-print h-1.5 receipt-paper-edge -mb-5 -mx-5 mt-4 opacity-30 transform rotate-180" />

          </div>
        </div>

        {/* Modal Bottom Action Controls (Screen Only) */}
        <div className="no-print p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-98 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Receipt</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 active:scale-98 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Portal</span>
            </a>
            <button
              type="button"
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
