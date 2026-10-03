import React, { useState } from 'react';
import {
  CheckCircle2,
  Store,
  Upload,
  Package,
  Smartphone,
  Users,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface OnboardingPageProps {
  onComplete: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { activeBusiness, refreshAuth } = useAuth();
  const [step, setStep] = useState(1);

  // Form states
  const [bizPhone, setBizPhone] = useState(activeBusiness?.phone || '0712345678');
  const [bizAddress, setBizAddress] = useState(activeBusiness?.address || 'Kiambu, Kenya');
  const [receiptFooter, setReceiptFooter] = useState(activeBusiness?.receipt_footer || 'Thank you for your business!');
  
  // Product state
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('50');

  // Worker state
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerRole, setWorkerRole] = useState('cashier');

  // M-Pesa state
  const [shortcode, setShortcode] = useState('174379');

  const handleNext = async () => {
    if (step === 1) {
      await api.settings.updateBusinessSettings({ phone: bizPhone, address: bizAddress });
    } else if (step === 3 && prodName && prodPrice) {
      await api.products.createProduct({
        name: prodName,
        selling_price: Number(prodPrice),
        stock_quantity: Number(prodStock),
      });
    } else if (step === 4) {
      await api.settings.updateMpesaSettings({ shortcode, environment: 'test', active: true });
    } else if (step === 5 && workerName && workerEmail) {
      await api.workers.createWorker({ fullName: workerName, email: workerEmail, role: workerRole });
    }

    if (step < 6) {
      setStep(step + 1);
    } else {
      await refreshAuth();
      onComplete();
    }
  };

  const steps = [
    { num: 1, title: 'Business Info', icon: Store },
    { num: 2, title: 'Branding & Receipts', icon: Upload },
    { num: 3, title: 'First Product', icon: Package },
    { num: 4, title: 'Configure M-Pesa', icon: Smartphone },
    { num: 5, title: 'Add Workers', icon: Users },
    { num: 6, title: 'Ready to Bill', icon: Sparkles },
  ];

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Onboarding Progress Bar */}
        <div className="bg-slate-900 text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-blue-600 shrink-0">
                <img
                  src="/src/assets/images/apple-touch-icon.png"
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">BRISK SMART BILLING</span>
                <span className="text-[10px] text-slate-400 font-medium">Onboarding · Step {step} of 6</span>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-400">{Math.round((step / 6) * 100)}% Completed</span>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 6) * 100}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-6 gap-1 mt-4 text-center">
            {steps.map(s => {
              const Icon = s.icon;
              const isDone = s.num < step;
              const isCurrent = s.num === step;
              return (
                <div key={s.num} className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs mb-1 ${
                    isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[50px] hidden sm:block">
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 text-xs space-y-4">
          
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Confirm Business Details</h3>
              <p className="text-slate-500 text-[11px]">These details will appear at the top of your printed receipts.</p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Business Phone</label>
                <input
                  type="text"
                  value={bizPhone}
                  onChange={e => setBizPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Address / Counter Location</label>
                <input
                  type="text"
                  value={bizAddress}
                  onChange={e => setBizAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Receipt Branding & Custom Message</h3>
              <p className="text-slate-500 text-[11px]">Customize the thank you note printed on each digital receipt.</p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Footer Note</label>
                <textarea
                  rows={3}
                  value={receiptFooter}
                  onChange={e => setReceiptFooter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Add Your First Product</h3>
              <p className="text-slate-500 text-[11px]">You can also use our pre-seeded products (Coca-Cola, Bread, Milk).</p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Orange Juice 500ml"
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (KES)</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={prodPrice}
                    onChange={e => setProdPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={e => setProdStock(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">M-Pesa Gateway Setup</h3>
              <p className="text-slate-500 text-[11px]">
                Pre-configured in test mode with Safaricom Daraja sandbox so you can test STK push right away!
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">M-Pesa Shortcode / Till Number</label>
                <input
                  type="text"
                  value={shortcode}
                  onChange={e => setShortcode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                />
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-[11px]">
                ✓ Test mode is enabled. No real money is charged during testing.
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Add Counter Worker (Optional)</h3>
              <p className="text-slate-500 text-[11px]">Invite a cashier or manager. You can always add more later.</p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Worker Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Kamau"
                  value={workerName}
                  onChange={e => setWorkerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Worker Email</label>
                  <input
                    type="email"
                    placeholder="worker@mybusiness.co.ke"
                    value={workerEmail}
                    onChange={e => setWorkerEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={workerRole}
                    onChange={e => setWorkerRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="sales_worker">Sales Worker</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">You Are Ready to Start Billing!</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your store is initialized with product catalog, M-Pesa STK push capability, and tamper-proof digital receipts.
              </p>
            </div>
          )}

          {/* Nav buttons */}
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : <div></div>}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              <span>{step === 6 ? 'Launch POS Register' : 'Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
