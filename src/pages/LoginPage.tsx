import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  KeyRound,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onSuccess?: (targetPath?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onSuccess }) => {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Check if just registered
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const regEmail = params.get('registered_email');
    if (regEmail) {
      setIdentifier(regEmail);
      setInfoBanner('Registration successful! Please sign in with your credentials to access your terminal.');
    }
  }, []);

  const performLogin = async (e?: React.FormEvent, customId?: string, customPwd?: string) => {
    if (e) e.preventDefault();

    const cleanId = (customId !== undefined ? customId : identifier).trim();
    const cleanPwd = (customPwd !== undefined ? customPwd : password).trim();

    if (!cleanId) {
      setError('Please enter your email address or phone number.');
      return;
    }

    if (!cleanPwd) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const res = await login(cleanId, cleanPwd);

      if (!res.success) {
        throw new Error(res.error || 'Invalid credentials. Please verify your email/phone and password.');
      }

      setSuccessMessage(`Welcome back, ${res.user?.full_name || 'User'}! Opening dashboard...`);

      const dest = res.targetPath && res.targetPath !== '/login' && res.targetPath !== '/register-business'
        ? res.targetPath
        : '/dashboard';

      // Navigate immediately to the dashboard
      if (onSuccess) {
        onSuccess(dest);
      } else {
        onNavigate(dest);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (id: string, pwd: string) => {
    setIdentifier(id);
    setPassword(pwd);
    performLogin(undefined, id, pwd);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setForgotModalOpen(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center font-sans">
      
      {/* Container Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 text-center relative">
          <BrandLogo size="lg" className="mx-auto mb-3" />
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Sign In</h1>
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mt-0.5">BRISK SMART BILLING</p>
          <p className="text-xs text-slate-400 mt-1">Access your business billing terminal & POS workspace</p>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8">
          
          {infoBanner && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
              <span>{infoBanner}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2.5 font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Unified Clean Form without role/user-type selectors */}
          <form onSubmit={performLogin} className="space-y-4 text-xs">
            
            {/* Email or Phone Input */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Email Address or Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {identifier.includes('@') ? (
                    <Mail className="w-4 h-4" />
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. name@company.co.ke or 07XXXXXXXX"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs text-slate-600">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Open Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Credentials for One-Click Instant Access */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Instant Test Accounts (1-Click Login)
                </span>
                <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Direct Dashboard Access
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('owner@abcshop.co.ke', 'Owner123!')}
                  className="px-2 py-2 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-center transition-colors cursor-pointer"
                  title="Log in directly as Store Owner"
                >
                  Store Owner
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('john.kamau@abcshop.co.ke', '123456')}
                  className="px-2 py-2 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-center transition-colors cursor-pointer"
                  title="Log in directly as Cashier"
                >
                  Cashier
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@briskbilling.co.ke', 'Admin123!')}
                  className="px-2 py-2 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-center transition-colors cursor-pointer"
                  title="Log in directly as Platform Super Admin"
                >
                  Super Admin
                </button>
              </div>
            </div>
          </form>

        </div>

        {/* Connect to Registration Form */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 text-center space-y-2 text-xs">
          <div className="text-slate-600">
            <span>New business owner? </span>
            <button
              onClick={() => onNavigate('/register-business')}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Register Your Business (14-Day Free Trial) →
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            No credit card required · Instant POS register and M-Pesa setup
          </p>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Reset Account Password</h3>
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSent ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">Reset Instructions Sent</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  A verification link has been dispatched to <strong>{forgotEmail}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="pt-4 space-y-4 text-xs">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered phone number or email address. You will receive instructions to reset your password.
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email or Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0712345678 or user@business.co.ke"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
