import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Building2,
  ShieldCheck,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { apiFetch } from '../context/AuthContext';

interface ContactPageProps {
  onNavigate?: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    website_trap: '', // Anti-spam honeypot (bots fill this, humans do not)
  });

  const [formLoadedAt, setFormLoadedAt] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ id?: string; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormLoadedAt(Date.now());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic frontend verification
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in all required fields (Full Name, Email, Subject, and Message).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiFetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          businessName: formData.businessName.trim(),
          business_name: formData.businessName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          website_trap: formData.website_trap,
          _form_loaded_at: formLoadedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit contact request.');
      }

      setSuccessResult({
        id: data.id,
        message: data.message || 'Message Sent Successfully. Thank you for contacting BRISK SMART BILLING. Our team will get back to you.',
      });

      // Clear sensitive form fields
      setFormData({
        name: '',
        businessName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        website_trap: '',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappUrl = `https://wa.me/254712883849?text=${encodeURIComponent(
    'Hello BRISK SMART BILLING, I would like to learn more about your billing platform.'
  )}`;

  const emailMailto = `mailto:techray91@gmail.com?subject=${encodeURIComponent(
    'BRISK SMART BILLING Enquiry'
  )}&body=${encodeURIComponent(
    'Hello BRISK SMART BILLING, I would like to learn more about your platform.'
  )}`;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* ========================================================================= */}
        {/* HERO / CONTACT HEADER */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>BRISK SMART BILLING · Official Support</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Let's Talk About Your Business
          </h1>

          <p className="text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Have a question about BRISK SMART BILLING, payments, billing, inventory or getting started? Contact us directly.
          </p>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <span>Bill. Pay. Verify. Grow.</span>
            <span>·</span>
            <span className="text-emerald-600 font-bold">Average Response: Under 2 Hours</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2 OFFICIAL CONTACT CARDS (Section 2 & 3) */}
        {/* WhatsApp & Email Direct Action Cards */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          
          {/* Card 1: WhatsApp */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Phone className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] uppercase tracking-wider">
                  Instant Chat
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">WhatsApp</h3>
                <p className="text-xs text-slate-500 mt-1">Chat with us on WhatsApp</p>
                <p className="text-base font-extrabold text-slate-900 mt-2 font-mono">
                  +254 712 883 849
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Prefilled quick inquiry for billing, hardware, and POS setup.
                </p>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Chat on WhatsApp</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Card 2: Email Us */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                  <Mail className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] uppercase tracking-wider">
                  Direct Email
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Email Us</h3>
                <p className="text-xs text-slate-500 mt-1">Direct inquiries & enterprise consultations</p>
                <p className="text-base font-extrabold text-blue-700 mt-2 font-mono break-all">
                  techray91@gmail.com
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Suggested subject: BRISK SMART BILLING Enquiry
                </p>
              </div>
            </div>

            <a
              href={emailMailto}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Send Email</span>
              <Send className="w-4 h-4" />
            </a>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* CONTACT FORM SECTION (Section 4 & 5) */}
        {/* Protected with rate limiting, server-side validation & anti-spam */}
        {/* ========================================================================= */}
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-10 space-y-6">
          
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-2xl font-black text-slate-900">Send Us a Direct Message</h2>
            <p className="text-xs text-slate-500 mt-1">
              Please share your business details and requirements. All submissions are processed through our secure server backend.
            </p>
          </div>

          {/* Success Message Banner */}
          {successResult && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-base font-extrabold text-emerald-950">Message Sent Successfully</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Thank you for contacting BRISK SMART BILLING. Our team will get back to you.
                  </p>
                </div>
              </div>

              {successResult.id && (
                <div className="text-[11px] bg-white/80 p-2.5 rounded-xl border border-emerald-200 font-mono text-emerald-800">
                  Ticket Reference: <strong>{successResult.id}</strong> · Notification dispatched to <span className="font-bold">techray91@gmail.com</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSuccessResult(null)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer mt-1"
              >
                Send another message
              </button>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Anti-Spam Honeypot Field (Hidden from real human users) */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website_trap">Leave this blank</label>
              <input
                id="website_trap"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={formData.website_trap}
                onChange={e => setFormData({ ...formData, website_trap: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Kamau"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Highridge Wholesalers"
                  value={formData.businessName}
                  onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@domain.co.ke"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="0712 345 678"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BRISK SMART BILLING Enquiry / POS Setup"
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                placeholder="Hello BRISK SMART BILLING, I would like to learn more about your platform, payment integrations, and counter billing..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 active:scale-98 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-400">
                Protected by rate limiting & anti-spam verification · Responses sent directly to your email
              </p>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
