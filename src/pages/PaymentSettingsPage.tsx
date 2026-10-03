import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Smartphone,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Save,
  RefreshCw,
  ExternalLink,
  Info,
  Check,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  Radio,
  FileCheck2
} from 'lucide-react';
import { useAuth, apiFetch } from '../context/AuthContext';

interface PaymentSettingsPageProps {
  onNavigate?: (path: string) => void;
}

export const PaymentSettingsPage: React.FC<PaymentSettingsPageProps> = ({ onNavigate }) => {
  const { activeBusiness } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'mpesa' | 'card' | 'bank'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // M-Pesa State
  const [mpesaEnv, setMpesaEnv] = useState<'test' | 'sandbox' | 'production'>('test');
  const [shortcode, setShortcode] = useState('174379');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [passkey, setPasskey] = useState('');
  const [mpesaActive, setMpesaActive] = useState(true);
  const [mpesaMaskedInfo, setMpesaMaskedInfo] = useState<{
    consumer_key_masked?: string;
    passkey_masked?: string;
    has_credentials?: boolean;
  }>({});

  // Card Payment State
  const [cardEnabled, setCardEnabled] = useState(true);
  const [cardProvider, setCardProvider] = useState<'pesapal' | 'flutterwave' | 'paystack' | 'stripe'>('pesapal');
  const [cardMode, setCardMode] = useState<'test' | 'live'>('test');
  const [cardPublicKey, setCardPublicKey] = useState('');
  const [cardSecretKey, setCardSecretKey] = useState('');
  const [cardSecretMasked, setCardSecretMasked] = useState('••••••••••••sec4');
  const [hasCardSecret, setHasCardSecret] = useState(true);
  const [supportedBrands, setSupportedBrands] = useState<string[]>(['Visa', 'Mastercard']);

  // Bank Transfer State
  const [bankEnabled, setBankEnabled] = useState(true);
  const [bankName, setBankName] = useState('Kenya Commercial Bank (KCB)');
  const [accountName, setAccountName] = useState('ABC SHOP LIMITED');
  const [accountNumber, setAccountNumber] = useState('1234567890');
  const [branch, setBranch] = useState('Nairobi CBD Branch');
  const [swiftBic, setSwiftBic] = useState('KCBLKENX');
  const [bankInstructions, setBankInstructions] = useState(
    'Use your Receipt or Sale Reference (e.g. BRK-000125) as the transfer payment memo. The store manager will verify receipt upon deposit.'
  );

  // Test Connection States
  const [testingMpesa, setTestingMpesa] = useState(false);
  const [testingCard, setTestingCard] = useState(false);
  const [testingBank, setTestingBank] = useState(false);
  const [testResult, setTestResult] = useState<{
    provider: string;
    status: string;
    message: string;
    latencyMs?: number;
    verifiedAt?: string;
  } | null>(null);

  // Popular Kenyan Banks list for convenient selection
  const popularBanks = [
    'Kenya Commercial Bank (KCB)',
    'Equity Bank Kenya',
    'Co-operative Bank of Kenya',
    'NCBA Bank Kenya',
    'Stanbic Bank Kenya',
    'Absa Bank Kenya',
    'Diamond Trust Bank (DTB)',
    'Standard Chartered Kenya',
    'I&M Bank',
    'Family Bank'
  ];

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const loadPaymentConfig = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/settings/payments');
      if (res.ok) {
        const data = await res.json();

        // Populate Card
        if (data.card) {
          setCardEnabled(data.card.enabled ?? true);
          setCardProvider(data.card.provider || 'pesapal');
          setCardMode(data.card.mode || 'test');
          setCardPublicKey(data.card.public_key || '');
          setCardSecretMasked(data.card.secret_key_masked || '••••••••••••sec4');
          setHasCardSecret(!!data.card.has_secret);
          setSupportedBrands(data.card.supported_brands || ['Visa', 'Mastercard']);
        }

        // Populate Bank
        if (data.bank_transfer) {
          setBankEnabled(data.bank_transfer.enabled ?? true);
          setBankName(data.bank_transfer.bank_name || 'Kenya Commercial Bank (KCB)');
          setAccountName(data.bank_transfer.account_name || activeBusiness?.name || 'ABC SHOP LIMITED');
          setAccountNumber(data.bank_transfer.account_number || '');
          setBranch(data.bank_transfer.branch || '');
          setSwiftBic(data.bank_transfer.swift_bic || '');
          setBankInstructions(data.bank_transfer.instructions || '');
        }

        // Populate M-Pesa
        if (data.mpesa) {
          setMpesaEnv(data.mpesa.environment || 'test');
          setShortcode(data.mpesa.shortcode || '174379');
          setMpesaActive(data.mpesa.active ?? true);
          setMpesaMaskedInfo({
            consumer_key_masked: data.mpesa.consumer_key_masked,
            passkey_masked: data.mpesa.passkey_masked,
            has_credentials: data.mpesa.has_credentials,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load payment settings:', err);
      showToast('error', 'Unable to retrieve payment configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentConfig();
  }, [activeBusiness?.id]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        card: {
          enabled: cardEnabled,
          provider: cardProvider,
          mode: cardMode,
          public_key: cardPublicKey,
          secret_key: cardSecretKey ? cardSecretKey : undefined,
          supported_brands: supportedBrands,
        },
        bank_transfer: {
          enabled: bankEnabled,
          bank_name: bankName,
          account_name: accountName,
          account_number: accountNumber,
          branch,
          swift_bic: swiftBic,
          instructions: bankInstructions,
        },
        mpesa: {
          environment: mpesaEnv,
          shortcode,
          consumerKey: consumerKey || undefined,
          consumerSecret: consumerSecret || undefined,
          passkey: passkey || undefined,
          active: mpesaActive,
        },
      };

      const res = await apiFetch('/api/settings/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save payment configurations.');

      showToast('success', 'Payment gateway & banking details saved securely.');
      // Clear write-only secret inputs
      setConsumerSecret('');
      setPasskey('');
      setCardSecretKey('');
      loadPaymentConfig();
    } catch (err: any) {
      showToast('error', err.message || 'Error updating payment settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider: 'mpesa' | 'card' | 'bank_transfer') => {
    try {
      setTestResult(null);
      if (provider === 'mpesa') setTestingMpesa(true);
      if (provider === 'card') setTestingCard(true);
      if (provider === 'bank_transfer') setTestingBank(true);

      const details =
        provider === 'mpesa'
          ? { environment: mpesaEnv, shortcode }
          : provider === 'card'
          ? { provider: cardProvider, mode: cardMode }
          : { bank_name: bankName, account_number: accountNumber, account_name: accountName };

      const res = await apiFetch('/api/payments/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, details }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection handshake failed.');

      setTestResult(data);
      showToast('success', `${data.provider} handshake successful (${data.latencyMs ? data.latencyMs + 'ms' : 'OK'})!`);
    } catch (err: any) {
      showToast('error', err.message || 'Connection test failed.');
    } finally {
      setTestingMpesa(false);
      setTestingCard(false);
      setTestingBank(false);
    }
  };

  const toggleBrand = (brand: string) => {
    setSupportedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Loading secure payment configurations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* ========================================================================= */}
      {/* PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Lock className="w-4 h-4" />
            <span>Multi-Method Payment Configuration · PCI-DSS Compliant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Payment Methods & Gateway Settings</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Configure checkout payment channels for <strong className="text-white">{activeBusiness?.name || 'Your Business'}</strong>. Accept M-Pesa STK push, debit/credit cards, and direct bank transfers with automated inventory deduction and receipt verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/payments/bank-transfers')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>Verify Bank Transfers</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Test Result Live Banner */}
      {testResult && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-blue-950 flex items-center gap-2">
                <span>{testResult.provider} Handshake OK</span>
                {testResult.latencyMs && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono">
                    {testResult.latencyMs}ms latency
                  </span>
                )}
              </div>
              <p className="text-blue-800 mt-0.5">{testResult.message}</p>
            </div>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-blue-400 hover:text-blue-600 text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TABS NAVIGATION */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Payment Methods
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mpesa')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'mpesa'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>M-Pesa STK Push</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('card')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'card'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Card Payments (Visa / Mastercard)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'bank'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Bank Transfer</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: M-PESA CONFIGURATION (Section 10 & 22) */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'mpesa') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Safaricom M-Pesa STK Push</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                    Instant Mobile Payment
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prompts customer directly on their Safaricom phone to enter M-Pesa PIN for instant counter checkout.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleTestConnection('mpesa')}
                disabled={testingMpesa}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-emerald-200"
              >
                {testingMpesa ? (
                  <div className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Test Daraja Connection</span>
              </button>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={mpesaActive}
                  onChange={e => setMpesaActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {mpesaActive ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Environment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Daraja Environment
              </label>
              <select
                value={mpesaEnv}
                onChange={e => setMpesaEnv(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              >
                <option value="test">Test / Simulation (Instant callback demo)</option>
                <option value="sandbox">Safaricom Sandbox (Daraja Developer)</option>
                <option value="production">Safaricom Production (Live Paybill / Till)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                {mpesaEnv === 'production'
                  ? 'Real money is deducted from customer M-Pesa accounts.'
                  : 'Safe simulation & sandbox testing mode.'}
              </p>
            </div>

            {/* Shortcode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                M-Pesa Short Code (Paybill or Till)
              </label>
              <input
                type="text"
                value={shortcode}
                onChange={e => setShortcode(e.target.value)}
                placeholder="e.g. 174379 or 600000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default test shortcode is 174379.</p>
            </div>

            {/* Passkey */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Online Passkey (Lipa Na M-Pesa)
              </label>
              <input
                type="password"
                value={passkey}
                onChange={e => setPasskey(e.target.value)}
                placeholder={mpesaMaskedInfo.passkey_masked || '••••••••••••••••••••'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {mpesaMaskedInfo.passkey_masked ? `Masked: ${mpesaMaskedInfo.passkey_masked}` : 'Leave blank to retain current.'}
              </p>
            </div>

            {/* Consumer Key */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Consumer Key
              </label>
              <input
                type="text"
                value={consumerKey}
                onChange={e => setConsumerKey(e.target.value)}
                placeholder={mpesaMaskedInfo.consumer_key_masked || 'Enter Daraja Consumer Key'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {mpesaMaskedInfo.consumer_key_masked ? `Stored: ${mpesaMaskedInfo.consumer_key_masked}` : 'From Safaricom Developer Portal.'}
              </p>
            </div>

            {/* Consumer Secret */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Consumer Secret
              </label>
              <input
                type="password"
                value={consumerSecret}
                onChange={e => setConsumerSecret(e.target.value)}
                placeholder="•••••••••••••••••••• (Leave blank to keep existing)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Sensitive credential. Kept strictly server-side and never returned to the browser.
              </p>
            </div>

          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>STK Push Callback URL is auto-provisioned securely at <code>/api/mpesa/callback</code></span>
            </div>
            <span className="font-mono text-[11px] text-emerald-700 bg-white/70 px-2 py-0.5 rounded-lg border border-emerald-200">
              HTTPS Webhook Active
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: CARD PAYMENTS (Section 11, 12, 18 & 22) */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'card') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Card Payments (Visa, Mastercard & Local)</h2>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                    Hosted & Tokenized Checkout
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customers pay via tokenized payment page. BRISK SMART BILLING never stores raw card numbers, CVVs, or PINs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleTestConnection('card')}
                disabled={testingCard}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-blue-200"
              >
                {testingCard ? (
                  <div className="w-3.5 h-3.5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>Test Gateway Connection</span>
              </button>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cardEnabled}
                  onChange={e => setCardEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {cardEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Payment Provider */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Card Payment Gateway Provider
              </label>
              <select
                value={cardProvider}
                onChange={e => setCardProvider(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
                <option value="pesapal">PesaPal (Leading East African Gateway)</option>
                <option value="flutterwave">Flutterwave (Pan-African Cards & Mobile)</option>
                <option value="paystack">Paystack (Stripe / Africa Checkout)</option>
                <option value="stripe">Stripe (Global Card Processing)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Integrated via secure server-side webhook notification.
              </p>
            </div>

            {/* Test or Live Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Gateway Environment Mode
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setCardMode('test')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    cardMode === 'test'
                      ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Test Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setCardMode('live')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    cardMode === 'live'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Live Production
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Current: <strong className="text-slate-700 uppercase">{cardMode}</strong>
              </p>
            </div>

            {/* Public Key */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Public Key / Client ID
              </label>
              <input
                type="text"
                value={cardPublicKey}
                onChange={e => setCardPublicKey(e.target.value)}
                placeholder="pk_test_... or Client ID"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">Publicly usable in frontend checkout widget.</p>
            </div>

            {/* Secret Key */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Private API Secret Key / Merchant Secret
              </label>
              <input
                type="password"
                value={cardSecretKey}
                onChange={e => setCardSecretKey(e.target.value)}
                placeholder={cardSecretMasked || '••••••••••••••••••••'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {hasCardSecret ? `Saved securely (${cardSecretMasked}). Enter a new value only to replace.` : 'Enter private API secret key.'}
              </p>
            </div>

            {/* Supported Card Brands */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Supported Card Brands (Displayed at checkout)
              </label>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {['Visa', 'Mastercard', 'American Express'].map(brand => {
                  const active = supportedBrands.includes(brand);
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => toggleBrand(brand)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {active && '✓ '}
                      {brand}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Card receipts print masked format only (e.g. <code>Visa •••• 1234</code>) without raw sensitive credentials</span>
            </div>
            <span className="font-mono text-[11px] text-blue-700 bg-white/70 px-2 py-0.5 rounded-lg border border-blue-200">
              Zero Raw Data Retention
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: BANK TRANSFER CONFIGURATION (Section 13, 14, 15, 16 & 22) */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'bank') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Direct Bank Transfer</h2>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                    Store Manager Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customers transfer funds to your configured account and use their unique reference (e.g. <code>BRK-00125</code>).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleTestConnection('bank_transfer')}
                disabled={testingBank}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-indigo-200"
              >
                {testingBank ? (
                  <div className="w-3.5 h-3.5 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>Validate Bank Details</span>
              </button>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bankEnabled}
                  onChange={e => setBankEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {bankEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bank Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="e.g. Kenya Commercial Bank (KCB)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-slate-400 font-medium">Quick Select:</span>
                {['KCB', 'Equity', 'Co-op', 'NCBA', 'Absa'].map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      const full = popularBanks.find(x => x.toLowerCase().includes(b.toLowerCase())) || b;
                      setBankName(full);
                    }}
                    className="text-[10px] text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 px-2 py-0.5 rounded-md cursor-pointer border border-indigo-100"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Official Account Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                placeholder="e.g. ABC SHOP LIMITED"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">Must match business registered corporate bank title.</p>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder="e.g. 1234567890"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">Customers will transfer to this number.</p>
            </div>

            {/* Branch */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Branch Name
              </label>
              <input
                type="text"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                placeholder="e.g. Nairobi CBD Branch"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>

            {/* SWIFT / BIC */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                SWIFT / BIC Code (Optional)
              </label>
              <input
                type="text"
                value={swiftBic}
                onChange={e => setSwiftBic(e.target.value)}
                placeholder="e.g. KCBLKENX"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>

            {/* Verification Link Shortcut */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('/payments/bank-transfers')}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
              >
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <span>Open Pending Transfers Queue</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {/* Instructions */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Transfer Memo & Verification Instructions (Shown to customers)
              </label>
              <textarea
                rows={3}
                value={bankInstructions}
                onChange={e => setBankInstructions(e.target.value)}
                placeholder="e.g. Use your Sale Reference BRK-00125 as transfer payment memo..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
              ></textarea>
              <p className="text-[11px] text-slate-400 mt-1">
                Explains how the customer should supply proof/transaction reference so managers can verify and complete sales.
              </p>
            </div>

          </div>

          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Inventory is deducted only after a manager reviews the bank deposit and marks payment <strong>PAID</strong></span>
            </div>
            <span className="font-mono text-[11px] text-indigo-700 bg-white/70 px-2 py-0.5 rounded-lg border border-indigo-200">
              Anti-Fraud Safeguard
            </span>
          </div>
        </div>
      )}

      {/* Floating Save Actions Bar */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between gap-4">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Sensitive credentials are encrypted and stored strictly server-side.</span>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving Configurations...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Payment Settings</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
