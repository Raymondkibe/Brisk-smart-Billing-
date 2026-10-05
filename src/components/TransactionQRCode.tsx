import React, { useRef, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import {
  QrCode,
  ShieldCheck,
  Download,
  Copy,
  Check,
  ExternalLink,
  Printer,
  X,
  Store,
  CheckCircle2,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Receipt, Sale } from '../types';

interface TransactionQRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeLogo?: boolean;
  logoUrl?: string;
  title?: string;
  className?: string;
  showActions?: boolean;
}

/**
 * Builds the canonical public receipt verification URL from a verification token.
 */
export function buildReceiptVerificationUrl(token: string): string {
  if (!token) return window.location.origin;
  const base = window.location.origin.replace(/\/+$/, '');
  return `${base}/verify-receipt/${token}`;
}

/**
 * Reusable QR Code generator for transactions and digital receipts using 'qrcode.react'
 */
export const TransactionQRCode: React.FC<TransactionQRCodeProps> = ({
  value,
  size = 160,
  level = 'M',
  includeLogo = true,
  logoUrl = '/apple-touch-icon.png',
  title = 'Scan to verify receipt',
  className = '',
  showActions = true,
}) => {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    try {
      // Find hidden canvas to export clean PNG
      const canvas = canvasRef.current?.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-qr-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to download QR Code:', err);
    }
  };

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* High-fidelity Vector SVG QR Code */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs inline-flex items-center justify-center">
        <QRCodeSVG
          value={value}
          size={size}
          level={level}
          bgColor="#ffffff"
          fgColor="#0f172a"
          marginSize={1}
          imageSettings={
            includeLogo && logoUrl
              ? {
                  src: logoUrl,
                  height: Math.round(size * 0.22),
                  width: Math.round(size * 0.22),
                  excavate: true,
                }
              : undefined
          }
        />
      </div>

      {/* Hidden canvas for direct PNG download */}
      <div ref={canvasRef} className="hidden" aria-hidden="true">
        <QRCodeCanvas
          value={value}
          size={size * 2} // 2x resolution for crisp downloaded image
          level={level}
          bgColor="#ffffff"
          fgColor="#0f172a"
          marginSize={2}
          imageSettings={
            includeLogo && logoUrl
              ? {
                  src: logoUrl,
                  height: Math.round(size * 0.44),
                  width: Math.round(size * 0.44),
                  excavate: true,
                }
              : undefined
          }
        />
      </div>

      {/* Verification Instructions */}
      {title && (
        <div className="mt-2 space-y-0.5">
          <p className="text-xs font-semibold text-slate-800 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{title}</span>
          </p>
          <p className="text-[10px] text-slate-400">
            Open camera on any smartphone to view verified receipt
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            title="Copy verification link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            title="Download QR code image"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>PNG</span>
          </button>

          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            title="Open verification portal directly"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Verify</span>
          </a>
        </div>
      )}
    </div>
  );
};

interface TransactionQRModalProps {
  sale?: Sale | null;
  receipt?: Receipt | null;
  onClose: () => void;
  onOpenReceipt?: (receipt: Receipt) => void;
}

/**
 * Dedicated Transaction Verification Modal with instant QR scanning
 */
export const TransactionQRModal: React.FC<TransactionQRModalProps> = ({
  sale,
  receipt,
  onClose,
  onOpenReceipt,
}) => {
  if (!sale && !receipt) return null;

  const token = receipt?.verification_token || (sale as any)?.verification_token || '';
  const verifyUrl = buildReceiptVerificationUrl(token);

  const amount = receipt?.sale?.total || sale?.total || 0;
  const receiptNo = receipt?.receipt_number || 'N/A';
  const saleNo = receipt?.sale?.sale_number || sale?.sale_number || 'N/A';
  const customer = receipt?.sale?.customer_name || sale?.customer_name || 'Walk-in Customer';
  const paymentMethod = receipt?.payment?.method || sale?.payment_method || 'M-PESA';
  const dateStr = receipt?.issued_at || sale?.created_at || new Date().toISOString();

  const formattedDate = new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Transaction QR Verification</h3>
              <p className="text-[10px] text-slate-500 font-mono">{saleNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body with QR Code */}
        <div className="p-6 flex flex-col items-center">
          
          {/* QR Code Presentation */}
          <div className="mb-4">
            <TransactionQRCode
              value={verifyUrl}
              size={180}
              level="M"
              title="Instant Customer Verification"
              showActions={true}
            />
          </div>

          {/* Transaction Metadata Card */}
          <div className="w-full bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2 mt-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-medium">Total Paid</span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                KES {amount.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">Receipt No</span>
                <span className="font-mono font-bold text-slate-900">{receiptNo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Payment Method</span>
                <span className="font-bold text-slate-800 uppercase">{paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Customer</span>
                <span className="text-slate-800 truncate block">{customer}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Timestamp</span>
                <span className="text-slate-800 font-mono">{formattedDate} {formattedTime}</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="w-full mt-4 flex items-center justify-between gap-2">
            {receipt && onOpenReceipt && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReceipt(receipt);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Thermal Receipt</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
