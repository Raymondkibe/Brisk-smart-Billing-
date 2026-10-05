import React from 'react';
import {
  ShieldCheck,
  Smartphone,
  QrCode,
  Receipt,
  Layers,
  Users,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Store,
  CreditCard,
  Lock,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

interface SiteFooterProps {
  variant?: 'public' | 'app';
  onNavigate: (path: string) => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ variant = 'public', onNavigate }) => {
  const { activeBusiness, subscription, user, member } = useAuth();
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId: string) => {
    if (window.location.pathname !== '/') {
      onNavigate('/');
      setTimeout(() => {
        const target = document.getElementById(sectionId) || document.getElementById(`${sectionId}-section`);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const target = document.getElementById(sectionId) || document.getElementById(`${sectionId}-section`);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Back-office Application Footer (inside dashboard)
  if (variant === 'app') {
    return (
      <footer className="mt-12 border-t border-slate-200 bg-white/70 backdrop-blur-xs py-5 px-4 sm:px-8 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-center md:text-left">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <BrandLogo size="xs" className="w-5 h-5 rounded-md" />
              <span>BRISK SMART BILLING</span>
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-slate-600 font-medium">
              {activeBusiness?.name || 'My Business'}
            </span>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Safaricom Daraja: Active
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {subscription?.status === 'trial' ? (
              <button
                onClick={() => onNavigate('/subscription')}
                className="text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
              >
                14-Day Free Trial: <strong className="font-bold">{subscription.days_remaining} days left</strong>
              </button>
            ) : (
              <span className="text-slate-600 font-medium">
                Plan: <strong className="text-slate-900">{subscription?.plan_name || 'Active'}</strong>
              </span>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">© {currentYear} BRISK SMART BILLING</span>
          </div>
        </div>
      </footer>
    );
  }

  // =========================================================================
  // PUBLIC WEBSITE MULTI-COLUMN FOOTER
  // =========================================================================
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 pt-16 pb-12 no-print font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          
          {/* Column 1 — BRISK SMART BILLING */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <BrandLogo size="sm" />
              <div>
                <span className="text-base font-extrabold tracking-tight text-white block">BRISK SMART BILLING</span>
                <span className="text-[10px] text-blue-400 font-medium tracking-wide uppercase block -mt-0.5">
                  Bill. Pay. Verify. Grow.
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Smart billing, payments, inventory and verifiable digital receipts for modern African businesses.
            </p>

            <div className="pt-2 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Nairobi, Kenya</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a href="https://wa.me/254712883849" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors text-slate-300 font-mono">
                  +254 712 883 849
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <a href="mailto:techray91@gmail.com" className="hover:text-white transition-colors text-slate-300 font-mono">
                  techray91@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Column 2 — Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">
                  Core Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors cursor-pointer">
                  Transparent Pricing
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('why-choose-us')} className="hover:text-white transition-colors cursor-pointer">
                  Why Choose Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/inventory')} className="hover:text-white transition-colors cursor-pointer">
                  Inventory Management
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/reports')} className="hover:text-white transition-colors cursor-pointer">
                  Financial Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 — Business */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">Business</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('/register-business')} className="hover:text-white transition-colors cursor-pointer text-blue-400 font-semibold">
                  Start 14-Day Free Trial
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/login')} className="hover:text-white transition-colors cursor-pointer">
                  Sign In to Account
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/sales/new')} className="hover:text-white transition-colors cursor-pointer">
                  Speed POS Register
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/workers')} className="hover:text-white transition-colors cursor-pointer">
                  Worker Permissions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/products')} className="hover:text-white transition-colors cursor-pointer">
                  Product Catalog
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/support')} className="hover:text-white transition-colors cursor-pointer">
                  Support Desk
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4 — Contact & Direct Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">Contact</h4>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">WhatsApp</span>
                <span className="font-mono text-slate-200 font-bold text-xs">+254 712 883 849</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Email</span>
                <span className="font-mono text-slate-200 font-bold text-xs">techray91@gmail.com</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href="https://wa.me/254712883849?text=Hello%20BRISK%20SMART%20BILLING%2C%20I%20would%20like%20to%20learn%20more%20about%20your%20billing%20platform."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="mailto:techray91@gmail.com?subject=BRISK%20SMART%20BILLING%20Enquiry&body=Hello%20BRISK%20SMART%20BILLING%2C%20I%20would%20like%20to%20learn%20more%20about%20your%20platform."
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Email Us</span>
                <Mail className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => onNavigate('/contact')}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <span>Contact Support</span>
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="text-center sm:text-left space-y-0.5">
            <p>© {currentYear} BRISK SMART BILLING. All rights reserved.</p>
            <p className="text-[11px] text-slate-400">Powered by Brisk Innovations</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <button onClick={() => scrollToSection('contact')} className="hover:text-slate-200 transition-colors cursor-pointer">
              Privacy
            </button>
            <span className="text-slate-800">·</span>
            <button onClick={() => scrollToSection('contact')} className="hover:text-slate-200 transition-colors cursor-pointer">
              Terms
            </button>
            <span className="text-slate-800">·</span>
            <button onClick={() => scrollToSection('contact')} className="hover:text-slate-200 transition-colors cursor-pointer">
              Cookies
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
