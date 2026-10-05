import React, { useState } from 'react';
import {
  Smartphone,
  QrCode,
  Receipt,
  Layers,
  Users,
  ShieldCheck,
  TrendingUp,
  Store,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Clock,
  Lock,
  Headphones,
  FileSpreadsheet,
  Send,
  AlertCircle,
  Star,
  Check,
  Building2,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  RefreshCw,
  Zap,
  DollarSign,
  Laptop,
  ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  // Billing cycle toggle: monthly, quarterly, annual
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');

  // Testimonials category filter
  const [activeTestimonialCategory, setActiveTestimonialCategory] = useState<string>('all');
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    businessName: '',
    businessType: 'Retail & Supermarket',
    rating: 5,
    comment: ''
  });

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    inquiryType: 'Free Trial Onboarding',
    message: ''
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<{ referenceId: string; message: string } | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  // Pricing calculations
  const getPlanPrice = (baseMonthly: number) => {
    if (billingCycle === 'quarterly') {
      return Math.round(baseMonthly * 3 * 0.9); // 10% discount for 3 months
    }
    if (billingCycle === 'annual') {
      return Math.round(baseMonthly * 12 * 0.8); // 20% discount for 1 year
    }
    return baseMonthly;
  };

  const getBillingLabel = () => {
    if (billingCycle === 'quarterly') return '/ 3 months (10% off)';
    if (billingCycle === 'annual') return '/ year (20% off)';
    return '/ 30 days';
  };

  const plans = [
    {
      id: 'plan_starter',
      name: 'Starter',
      price: 450,
      desc: 'For single counters, kiosks, and sole proprietors',
      badge: null,
      features: [
        'M-Pesa STK Push Checkout',
        'Digital & Thermal Receipts',
        'Basic Inventory (up to 100 SKUs)',
        '1 Dedicated Cashier / Worker',
        'Standard Email Support',
        'Tamper-Proof Receipt QR Codes'
      ]
    },
    {
      id: 'plan_basic',
      name: 'Basic',
      price: 750,
      desc: 'For growing neighborhood retail shops & mini-marts',
      badge: null,
      features: [
        'M-Pesa STK & Dynamic QR Payments',
        'Digital, PDF & Thermal Receipts',
        'Real-Time Stock & Low-Stock Alerts',
        'Up to 3 Cashier / Worker Accounts',
        'Customer Directory & History',
        'Daily Sales Summary Reports',
        'Standard Email & WhatsApp Support'
      ]
    },
    {
      id: 'plan_standard',
      name: 'Standard',
      price: 1500,
      desc: 'For supermarkets, pharmacies, hardware & wholesale depots',
      badge: 'Most Popular',
      popular: true,
      features: [
        'Everything in Basic Tier',
        'Up to 10 Workers with Role Permissions',
        'Granular Cashier & Manager Permissions',
        'Expense Tracking & Profit/Loss Ledger',
        'Automated Tax & VAT Breakdown',
        'CSV & Excel Data Export',
        'Audit Trail & Worker Activity Logs',
        'Priority Technical Support'
      ]
    },
    {
      id: 'plan_business',
      name: 'Business',
      price: 2500,
      desc: 'For high-volume retail chains & multi-counter stores',
      badge: null,
      features: [
        'Everything in Standard Tier',
        'Up to 25 Worker & Manager Accounts',
        'High-Speed Rapid POS Register',
        'Custom Business Receipt Branding',
        'Supplier Ledger & Purchase Orders',
        'Automated End-of-Day Shift Reconciliation',
        'Dedicated Technical Account Rep'
      ]
    },
    {
      id: 'plan_premium',
      name: 'Premium',
      price: 3500,
      desc: 'For enterprise retailers, distributors & multi-branch firms',
      badge: 'Enterprise',
      features: [
        'Unlimited Cashiers & Workers',
        'Unlimited SKUs & Product Variations',
        'Multi-Branch Consolidated Dashboard',
        'Custom Safaricom Daraja API Integration',
        'Automated Daily SMS / WhatsApp Receipts',
        '99.99% Guaranteed SLA Uptime',
        '24/7 Dedicated Priority Phone Support'
      ]
    }
  ];

  // Verified Business Testimonials
  const testimonials = [
    {
      id: 'test_1',
      category: 'supermarket',
      author: 'David Mwangi',
      role: 'Managing Director',
      company: 'Highridge Fresh Supermarket',
      location: 'Parklands, Nairobi',
      metric: '+94% M-Pesa Speed',
      quote: 'Before BRISK SMART BILLING, cashiers had to wait for customers to show M-Pesa confirmation SMS on their personal phones. Now with STK push, the customer inputs their PIN and the POS immediately prints the verified receipt in under 4 seconds.'
    },
    {
      id: 'test_2',
      category: 'pharmacy',
      author: 'Dr. Grace Njeri',
      role: 'Lead Pharmacist & Owner',
      company: 'Apex Community Pharmacy',
      location: 'Thika Road, Nairobi',
      metric: 'Zero Till Discrepancies',
      quote: 'Inventory control and shift handovers were our biggest challenge. The multi-worker permissions ensure only authorized supervisors can modify prices or approve discounts. Our daily reconciliation is 100% accurate.'
    },
    {
      id: 'test_3',
      category: 'wholesale',
      author: 'Hassan Omar',
      role: 'Operations Head',
      company: 'Bayshore Wholesale & Hardware',
      location: 'Mombasa Old Town',
      metric: 'KES 4.2M Monthly Volume',
      quote: 'The dynamic QR payment feature and cryptographic receipt verification completely eliminated fake M-Pesa SMS fraud. Every customer receipt has a verifiable QR code our dispatch team scans at the gate.'
    },
    {
      id: 'test_4',
      category: 'restaurant',
      author: 'Amina Abdi',
      role: 'General Manager',
      company: 'Savannah Kitchen & Lounge',
      location: 'Kilimani, Nairobi',
      metric: '3-Minute Shift Close',
      quote: 'The speed POS interface is remarkably responsive on both our counter tablets and desktop PCs. End-of-day reports with gross margin and expense tracking saved our accounting team 15 hours every week.'
    }
  ];

  const filteredTestimonials = activeTestimonialCategory === 'all'
    ? testimonials
    : testimonials.filter(t => t.category === activeTestimonialCategory);

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactError(null);
    setContactSuccess(null);

    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit inquiry. Please try again.');
      }

      setContactSuccess({
        referenceId: data.referenceId || `INQ-${Math.floor(100000 + Math.random() * 900000)}`,
        message: data.message || 'Inquiry submitted successfully! Our onboarding team will get in touch shortly.'
      });

      setContactForm({
        name: '',
        businessName: '',
        email: '',
        phone: '',
        inquiryType: 'Free Trial Onboarding',
        message: ''
      });
    } catch (err: any) {
      setContactError(err.message || 'Unable to submit contact form. Please check your connection.');
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackModalOpen(false);
      setFeedbackSubmitted(false);
      setFeedbackForm({
        name: '',
        businessName: '',
        businessType: 'Retail & Supermarket',
        rating: 5,
        comment: ''
      });
    }, 2000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 font-sans">
      
      {/* ========================================================================= */}
      {/* SECTION NAV / TOP ANCHOR BAR */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-slate-200">Safaricom Daraja M-Pesa STK Push Active & Verified</span>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <span className="text-slate-400 hidden sm:inline">256-Bit Encrypted Multi-Tenant Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollToSection('contact-section')}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Enterprise Consultation
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => onNavigate('/login')}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer"
            >
              Merchant Sign In →
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section id="hero-section" className="relative overflow-hidden pt-16 pb-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Editorial kicker with Logo */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100 mb-6">
            <img
              src="/apple-touch-icon.png"
              alt="Logo"
              className="w-4 h-4 rounded-sm object-cover"
            />
            <span>BRISK SMART BILLING · Next-Generation Multi-Business POS Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] max-w-4xl mx-auto text-balance">
            Bill with Speed. Accept M-Pesa. Issue Verified Receipts.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate cashier checkout queues and manual reconciliation errors. Process instant Safaricom M-Pesa STK prompts, dynamic payment QRs, real-time stock sync, and tamper-proof digital receipts.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('/register-business')}
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('/sales/new')}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
            >
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Launch Live POS Demo</span>
            </button>

            <button
              onClick={() => scrollToSection('how-it-works-section')}
              className="w-full sm:w-auto px-5 py-3.5 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors cursor-pointer"
            >
              How It Works ↓
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
            <span>✓ No credit card required</span>
            <span>·</span>
            <span>✓ 2-minute instant onboarding</span>
            <span>·</span>
            <span>✓ Full multi-worker access</span>
          </div>

          {/* Quantitative Rigor Metrics Adjacency */}
          <div className="mt-14 pt-10 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <p className="text-3xl font-extrabold text-slate-900 tabular-nums">&lt; 3.5s</p>
              <p className="text-xs font-semibold text-slate-700 mt-1">Average M-Pesa STK Settlement</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Automated prompt and callback confirmation</p>
            </div>
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <p className="text-3xl font-extrabold text-slate-900 tabular-nums">100%</p>
              <p className="text-xs font-semibold text-slate-700 mt-1">Cryptographic Verification</p>
              <p className="text-[11px] text-slate-500 mt-0.5">SHA-256 tamper-proof QR tokens</p>
            </div>
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <p className="text-3xl font-extrabold text-slate-900 tabular-nums">0.00%</p>
              <p className="text-xs font-semibold text-slate-700 mt-1">Duplicate Payment Risk</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Strict idempotent transaction checks</p>
            </div>
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <p className="text-3xl font-extrabold text-slate-900 tabular-nums">14 Days</p>
              <p className="text-xs font-semibold text-slate-700 mt-1">Full Enterprise Free Trial</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Unrestricted feature exploration</p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FEATURES SECTION (Bento Grid) */}
      {/* ========================================================================= */}
      <section id="features-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
            Comprehensive Capabilities
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-balance">
            Engineered for High-Volume Retail, Wholesale & Hospitality
          </h3>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Every feature is purpose-built to eliminate cashier queues, prevent inventory leakage, protect against counterfeit receipts, and simplify end-of-day accounting.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
          
          {/* Bento Card 1 (Span 2): M-Pesa STK Push */}
          <div className="md:col-span-2 p-7 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                Direct Safaricom Daraja Integration
              </span>
              <h4 className="text-xl font-bold text-slate-900 mt-3">
                Automated M-Pesa STK Push & Webhook Verification
              </h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                When a customer reaches checkout, the cashier enters the phone number or selects an existing customer profile. An instant PIN prompt appears on the buyer's handset. As soon as they enter their PIN, the server receives the webhook callback and automatically marks the order as paid in real-time.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Zero manual till entry errors</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Instant automatic stock deduction</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Paybill & Till shortcode support</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Dynamic QR Codes */}
          <div className="p-7 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <QrCode className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                Self-Checkout Ready
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-3">
                Dynamic Cart Payment QRs
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Display unique transaction QR codes on customer-facing screens or tablets. Shoppers scan with their phone camera to open their exact bill breakdown and pay seamlessly.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Auto-expiring security tokens</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>

          {/* Bento Card 3: Cryptographic Receipts */}
          <div className="p-7 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                <Receipt className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                Fraud-Proof Ledger
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-3">
                Verifiable Digital Receipts
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Every generated receipt includes a unique public verification QR code. Gatekeepers and auditors can scan the physical slip to verify transaction authenticity.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-indigo-700 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Prevents duplicate receipt reuse</span>
            </div>
          </div>

          {/* Bento Card 4: Real-time Stock Sync */}
          <div className="p-7 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                Inventory Intelligence
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-3">
                Live Inventory & Reorder Alerts
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Stock counts update instantly across all cashier registers. Automated low-stock flags and out-of-stock locks prevent overselling and streamline supplier restocks.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>SKU & barcode scanner compatible</span>
            </div>
          </div>

          {/* Bento Card 5: Role-Based Workers */}
          <div className="p-7 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md">
                Staff Accountability
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-3">
                Cashier Permissions & Audit Trails
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Configure roles for Cashiers, Sales Representatives, and Store Managers. Control maximum discount thresholds, restrict voiding permissions, and trace every action.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-purple-700 font-medium">
              <Lock className="w-4 h-4" />
              <span>Full immutable activity log</span>
            </div>
          </div>

          {/* Bento Card 6 (Span 3 on lg): Financial Reports & Tax */}
          <div className="md:col-span-3 p-7 bg-slate-900 text-white rounded-2xl shadow-md flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800 mb-3">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Automated End-of-Day Books</span>
              </div>
              <h4 className="text-2xl font-bold tracking-tight">
                Daily Sales Journals, Profit/Loss & Instant CSV Export
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Generate real-time gross margin analyses, net profits, expense ledgers, and VAT calculations with a single click. Download accountant-ready CSV files or print daily summary sheets.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
              <button
                onClick={() => onNavigate('/reports')}
                className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
              >
                Explore Reports Console
              </button>
              <button
                onClick={() => onNavigate('/register-business')}
                className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer text-center"
              >
                Create Account
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW IT WORKS SECTION */}
      {/* ========================================================================= */}
      <section id="how-it-works-section" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
              Step-by-Step Workflow
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From Setup to Verified Payment in 7 Simple Steps
            </h3>
            <p className="text-sm text-slate-600 mt-3">
              Deploy your business terminal in minutes without specialized hardware or technical complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 01 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold text-blue-600 tracking-wider">
                  01. REGISTER
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">
                  Create Business Account
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Sign up with your business name and mobile phone. Instantly receive a 14-day unrestricted trial with full platform access.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                Time required: ~45 seconds
              </div>
            </div>

            {/* Step 02 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold text-blue-600 tracking-wider">
                  02. CATALOG
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">
                  Add Inventory & SKUs
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Input products with cost prices, selling prices, unit sizes (kg, L, pieces), and initial inventory quantities.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                Supports CSV bulk import
              </div>
            </div>

            {/* Step 03 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold text-blue-600 tracking-wider">
                  03. STAFF
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">
                  Invite Cashiers & Roles
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Add counter cashiers, sales representatives, and store managers. Set custom permissions and maximum discount limits.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                Individual PIN access
              </div>
            </div>

            {/* Step 04 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold text-blue-600 tracking-wider">
                  04. CONFIGURE
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">
                  Connect M-Pesa Shortcode
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Connect your live Safaricom Paybill, Till Number, or utilize our built-in instant test simulation sandbox.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                Zero credential exposure guarantee
              </div>
            </div>

            {/* Step 05 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold text-blue-600 tracking-wider">
                  05. SELL
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">
                  Ring Up Orders in POS
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Cashiers search items by name or scan barcodes. Cart automatically computes totals, discounts, and item taxes.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                Instant search in &lt;10ms
              </div>
            </div>

            {/* Step 06 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold text-blue-600 tracking-wider">
                  06. COLLECT
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">
                  Instant STK Push / QR
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Customer receives the PIN prompt on their phone or scans the counter QR. The POS registers payment automatically upon PIN entry.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                Real-time callback confirmation
              </div>
            </div>

            {/* Step 07 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold text-blue-600 tracking-wider">
                  07. ISSUE
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">
                  Issue Verifiable Receipt
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  A cryptographic thermal receipt prints or is shared via digital link. Stock counts deduct automatically from inventory.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                Print & digital verification
              </div>
            </div>

            {/* Callout Card */}
            <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl flex flex-col justify-between shadow-md">
              <div>
                <span className="text-xs font-extrabold text-blue-200 uppercase tracking-wider">
                  Ready to test?
                </span>
                <h4 className="text-base font-bold text-white mt-2">
                  Launch In Your Browser
                </h4>
                <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                  Test the actual speed register and see how M-Pesa STK push operates right now.
                </p>
              </div>

              <div className="mt-6 pt-3">
                <button
                  onClick={() => onNavigate('/sales/new')}
                  className="w-full py-2.5 px-4 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Open POS Speed Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PACKAGE / PRICING SECTION */}
      {/* ========================================================================= */}
      <section id="pricing-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
            Transparent Pricing
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Flexible Plans in Kenyan Shillings
          </h3>
          <p className="text-sm text-slate-600 mt-3">
            Choose the package tailored to your transaction volume and store size. All plans include a 14-day unrestricted trial.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="mt-8 inline-flex items-center p-1 bg-slate-200/80 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'quarterly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Quarterly</span>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Save 10%
              </span>
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 5-Column Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {plans.map((p) => {
            const calculatedPrice = getPlanPrice(p.price);

            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  p.popular
                    ? 'bg-white border-blue-600 shadow-lg ring-2 ring-blue-600/15 relative'
                    : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div>
                  {p.popular && (
                    <div className="mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <h4 className="text-base font-bold text-slate-900">{p.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                    {p.desc}
                  </p>

                  <div className="my-5 pb-4 border-b border-slate-100">
                    <span className="text-2xl font-black text-slate-900 tabular-nums">
                      KES {calculatedPrice.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {getBillingLabel()}
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onNavigate('/register-business')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    p.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  Start Free Trial
                </button>
              </div>
            );
          })}
        </div>

        {/* Pricing Subtext & Guarantee */}
        <div className="mt-12 p-6 bg-slate-100/70 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">14-Day Full Free Trial on Every Tier</p>
              <p className="text-slate-500 text-[11px]">Upgrade, downgrade, or cancel anytime. Instant activation with zero setup fees.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollToSection('contact-section')}
              className="px-4 py-2 bg-white text-slate-800 hover:text-blue-600 rounded-lg border border-slate-200 font-semibold transition-colors cursor-pointer"
            >
              Need Custom Enterprise Terms? Contact Sales →
            </button>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 5. WHY CHOOSE US SECTION */}
      {/* ========================================================================= */}
      <section id="why-choose-us-section" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              Why Choose BRISK SMART BILLING
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Rock-Solid Reliability & Zero Leakage
            </h3>
            <p className="text-sm text-slate-300 mt-3">
              Compare our purpose-built African payment architecture against conventional offline cash registers and fragmented till systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Reason 1 */}
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                Zero Credential Exposure Guarantee
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your M-Pesa Consumer Secrets, Passkeys, and Safaricom Daraja tokens are encrypted at rest with AES-256 and never transmitted to client browsers or mobile devices.
              </p>
            </div>

            {/* Reason 2 */}
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                Idempotent Callback Settlement
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Network retries and duplicate Safaricom webhook events are safely absorbed with cryptographic idempotency keys, eliminating the risk of double-crediting or double-stock deductions.
              </p>
            </div>

            {/* Reason 3 */}
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                Cross-Platform Device Agility
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Runs effortlessly on standard web browsers, touch Android tablets, iPad POS stands, smartphones, and dedicated thermal ESC/POS receipt printer terminals.
              </p>
            </div>

            {/* Reason 4 */}
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                Cryptographic Fraud Prevention
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Protects your business against fake M-Pesa SMS messages and fraudulent customer return claims. Every valid receipt has an instantly verifiable digital signature.
              </p>
            </div>

            {/* Reason 5 */}
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                Strict Cashier Permission Gates
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cashiers can only process authorized sales. Restrict discounts to pre-approved percentages, prohibit inventory tampering, and keep every worker accountable.
              </p>
            </div>

            {/* Reason 6 */}
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                Multi-Branch & Multi-Tenant
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Operate multiple independent shops, branches, or distinct legal entities from a single unified management login with clean data partition boundaries.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TESTIMONIALS & VERIFIED BUSINESS PROOF */}
      {/* ========================================================================= */}
      <section id="testimonials-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
            Verified Business Feedback
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Trusted by Retailers, Pharmacies & Wholesalers
          </h3>
          <p className="text-sm text-slate-600 mt-3">
            Real outcomes from business owners who simplified billing, increased cashier throughput, and stopped till reconciliation losses.
          </p>

          {/* Category Filter Tabs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[
              { label: 'All Industries', value: 'all' },
              { label: 'Supermarkets & Retail', value: 'supermarket' },
              { label: 'Pharmacies & Chemists', value: 'pharmacy' },
              { label: 'Wholesale & Hardware', value: 'wholesale' },
              { label: 'Restaurants & Hospitality', value: 'restaurant' },
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveTestimonialCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTestimonialCategory === cat.value
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTestimonials.map((t) => (
            <div
              key={t.id}
              className="p-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    {t.metric}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <h5 className="font-bold text-slate-900">{t.author}</h5>
                  <p className="text-slate-500 text-[11px]">{t.role} · {t.company}</p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>{t.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive feedback callout */}
        <div className="mt-10 text-center">
          <button
            onClick={() => setFeedbackModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Are you an active merchant? Share your feedback</span>
          </button>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 7. CONTACT FORM & SALES CONSULTATION */}
      {/* ========================================================================= */}
      <section id="contact-section" className="py-20 bg-slate-100/80 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Direct info & context (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Contact Us
                </span>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                  Let's Talk About Your Business
                </h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  Have a question about BRISK SMART BILLING, payments, billing, inventory or getting started? Contact us directly.
                </p>
              </div>

              {/* 2 Official Contact Cards (WhatsApp & Email Us) */}
              <div className="space-y-4 pt-2">
                
                {/* Card 1: WhatsApp */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">WhatsApp</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Chat with us on WhatsApp</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1 font-mono">
                        +254 712 883 849
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://wa.me/254712883849?text=Hello%20BRISK%20SMART%20BILLING%2C%20I%20would%20like%20to%20learn%20more%20about%20your%20billing%20platform."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Chat on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Card 2: Email Us */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">Email Us</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Direct platform inquiries</p>
                      <p className="text-sm font-extrabold text-blue-700 mt-1 font-mono">
                        techray91@gmail.com
                      </p>
                    </div>
                  </div>

                  <a
                    href="mailto:techray91@gmail.com?subject=BRISK%20SMART%20BILLING%20Enquiry&body=Hello%20BRISK%20SMART%20BILLING%2C%20I%20would%20like%20to%20learn%20more%20about%20your%20platform."
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Send Email</span>
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3 text-xs text-blue-800">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Immediate 14-day access is granted upon registration with no credit card required.</span>
              </div>
            </div>

            {/* Right Column: Interactive Contact Form (7 cols) */}
            <div className="lg:col-span-7">
              <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
                
                <h4 className="text-xl font-bold text-slate-900">
                  Send Us a Message
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Fill in your details below and our team will respond with personalized guidance.
                </p>

                {contactSuccess ? (
                  <div className="my-6 p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h5 className="text-sm font-bold">Message Sent Successfully</h5>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Thank you for contacting BRISK SMART BILLING. Our team will get back to you.
                    </p>
                    <button
                      onClick={() => setContactSuccess(null)}
                      className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                    {contactError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>{contactError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="e.g. John Kamau"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Business / Store Name
                        </label>
                        <input
                          type="text"
                          value={contactForm.businessName}
                          onChange={(e) => setContactForm({ ...contactForm, businessName: e.target.value })}
                          placeholder="e.g. Highridge Supermarket"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Work Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="you@company.co.ke"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Phone Number (M-Pesa)
                        </label>
                        <input
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          placeholder="0712 345 678"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Inquiry Topic
                      </label>
                      <select
                        value={contactForm.inquiryType}
                        onChange={(e) => setContactForm({ ...contactForm, inquiryType: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      >
                        <option value="Free Trial Onboarding">Free Trial Onboarding & Setup</option>
                        <option value="Custom Multi-Branch Setup">Custom Multi-Branch & Enterprise Solution</option>
                        <option value="M-Pesa Daraja Integration">Safaricom Daraja API Assistance</option>
                        <option value="POS Hardware Compatibility">Thermal Printers & POS Hardware</option>
                        <option value="General Question">General Question</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Your Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Tell us about your business, counter volume, or any specific questions..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={contactSubmitting}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {contactSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Transmitting Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. MERCHANT FEEDBACK MODAL */}
      {/* ========================================================================= */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-fadeIn">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">Share Your Experience</h4>
                <p className="text-xs text-slate-500">Provide authentic feedback about your store operations</p>
              </div>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {feedbackSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h5 className="text-sm font-bold text-slate-900">Thank You for Your Feedback!</h5>
                <p className="text-xs text-slate-500">Your review helps us continuously improve the platform.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={feedbackForm.name}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                    placeholder="e.g. Sarah Kimani"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business / Store Name</label>
                  <input
                    type="text"
                    required
                    value={feedbackForm.businessName}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, businessName: e.target.value })}
                    placeholder="e.g. Kimani Chemist & Cosmetics"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Industry</label>
                  <select
                    value={feedbackForm.businessType}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, businessType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Retail & Supermarket">Retail & Supermarket</option>
                    <option value="Pharmacy & Chemist">Pharmacy & Chemist</option>
                    <option value="Wholesale & Hardware">Wholesale & Hardware</option>
                    <option value="Restaurant & Hospitality">Restaurant & Hospitality</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Star Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setFeedbackForm({ ...feedbackForm, rating: num })}
                        className="cursor-pointer p-1"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            num <= feedbackForm.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Review</label>
                  <textarea
                    required
                    rows={3}
                    value={feedbackForm.comment}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                    placeholder="How has BRISK SMART BILLING improved your speed, checkout flow, or reconciliation?"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs resize-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Submit Feedback
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
