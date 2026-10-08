import React, { useState, useEffect } from 'react';
import {
  Store,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogIn,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RegisterBusinessPageProps {
  onSuccess: () => void;
  onNavigate: (path: string) => void;
}

export const RegisterBusinessPage: React.FC<RegisterBusinessPageProps> = ({ onSuccess, onNavigate }) => {
  const { registerBusiness, user } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [category, setCategory] = useState('Retail & Supermarket');
  const [location, setLocation] = useState('Nairobi, Kenya');
  const [country, setCountry] = useState('Kenya');
  const [currency, setCurrency] = useState('KES');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      onSuccess();
      onNavigate('/dashboard');
    }
  }, [user, onSuccess, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !ownerName || !phone || !email || !password) {
      setError('Please fill in all required fields, including your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await registerBusiness({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        category,
        location: location.trim(),
        country,
        currency,
      });

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      setSuccess(true);
      // Immediate dual transition so user is never stuck
      onSuccess();
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-100 py-8 sm:py-12 px-4 flex items-center justify-center font-sans selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white text-center relative">
          
          {/* Quick link to login at top right */}
          <div className="absolute right-3.5 top-3.5">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="text-xs font-semibold text-blue-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/80"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>

          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/25 overflow-hidden">
            <img
              src="/favicon_logo_1790884666478.jpg"
              alt="BRISK SMART BILLING"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback text if image load error
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Register Your Business</h2>
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mt-0.5">BRISK SMART BILLING</p>
          <p className="text-xs text-slate-400 mt-1">
            Includes instant 14-day free trial · No payment card required
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Business registered successfully! Setting up your store...</span>
            </div>
          )}

          {/* Business Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Business Name *</label>
            <div className="relative">
              <Store className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Apex Hardware, Nairobi Supermarket"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                required
                autoFocus
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Owner Full Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Owner Full Name *</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. David Mwangi"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number (M-Pesa) *</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  placeholder="07XXXXXXXX or 01XXXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="owner@mybusiness.co.ke"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Business Category */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs cursor-pointer"
              >
                <option value="Retail & Supermarket">Retail & Supermarket</option>
                <option value="Restaurant & Café">Restaurant & Café</option>
                <option value="Salon & Beauty">Salon & Beauty</option>
                <option value="Electronics & Tech">Electronics & Tech</option>
                <option value="Clothing & Apparel">Clothing & Apparel</option>
                <option value="Pharmacy & Chemist">Pharmacy & Chemist</option>
                <option value="Hardware & Building">Hardware & Building</option>
                <option value="Services & Consultancy">Services & Consultancy</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location / Town</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Kiambu Road, Nairobi"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
            <span className="font-bold">14-Day Free Trial Activated Automatically:</span> You will enjoy unlimited POS transactions, digital receipts, worker management, and M-Pesa integration with zero upfront cost.
          </div>

          {success ? (
            <button
              type="button"
              onClick={() => onNavigate('/dashboard')}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/25 transition-colors flex items-center justify-center gap-2 cursor-pointer animate-pulse"
            >
              <span>Registration Complete! Click to Open Dashboard →</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Activating Store & Opening Dashboard...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration & Start Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {/* Connection to Login Form */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
            <div className="text-slate-600">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
              >
                Sign In to Your Account →
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
