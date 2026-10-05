import React, { useState } from 'react';
import {
  Menu,
  X,
  ShoppingCart,
  Store,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  User,
  ExternalLink,
  HelpCircle,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

interface SiteHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({ currentPath, onNavigate }) => {
  const { user, activeBusiness, member, subscription, logout, role, getDefaultPath } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (path: string, sectionId?: string) => {
    if (sectionId && (currentPath === '/' || currentPath === '')) {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
        return;
      }
    }
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Home', path: '/', sectionId: 'hero-section' },
    { label: 'Features', path: '/', sectionId: 'features-section' },
    { label: 'How It Works', path: '/', sectionId: 'how-it-works-section' },
    { label: 'Pricing', path: '/subscription', sectionId: 'pricing-section' },
    { label: 'Why Choose Us', path: '/', sectionId: 'why-choose-us-section' },
    { label: 'Reviews', path: '/', sectionId: 'testimonials-section' },
    { label: 'Contact', path: '/contact', sectionId: 'contact-section' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8 shadow-2xs no-print">
        
        {/* Brand Wordmark & Logo (Left Side) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => handleNav('/')}
            className="flex items-center gap-2 text-left group cursor-pointer min-w-0"
          >
            <BrandLogo size="sm" />
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors block leading-tight truncate">
                BRISK SMART BILLING
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase hidden sm:block -mt-0.5 truncate">
                Smart Billing. Pay. Verify. Grow.
              </span>
            </div>
          </button>
        </div>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600">
          {navLinks.map(link => {
            const isActive = currentPath === link.path && !link.sectionId;
            return (
              <button
                key={link.label}
                onClick={() => handleNav(link.path, link.sectionId)}
                className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right CTA / Session Controls & Right-Aligned Mobile Nav Button */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Active Business / Trial Badge */}
          {user && (
            <div className="hidden xl:flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold truncate max-w-[120px]">{activeBusiness?.name || 'My Store'}</span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {subscription?.status === 'trial' ? `${subscription.days_remaining}d Trial` : subscription?.plan_name}
              </span>
            </div>
          )}

          {/* User Account / Sign In Controls */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                title="Account Menu"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.full_name?.slice(0, 1) || 'U'}
                </div>
                <span className="hidden md:inline max-w-[90px] truncate">{user.full_name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 text-xs animate-fadeIn">
                  <div className="pb-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{user.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email || user.phone}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded capitalize">
                      {role ? role.replace('_', ' ') : 'Account'}
                    </span>
                  </div>

                  <div className="py-2 space-y-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleNav(getDefaultPath());
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                    >
                      My Workspace
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleNav('/sales/new');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                    >
                      POS Speed Register
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleNav('/register-business');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                    >
                      Register New Business
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                        handleNav('/login');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-semibold cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            currentPath !== '/login' && (
              <button
                onClick={() => handleNav('/login')}
                className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )
          )}

          {/* Direct Dashboard Button for Authenticated Users */}
          {user && (
            <button
              onClick={() => handleNav('/dashboard')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                currentPath === '/dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          )}

          {/* Primary POS Action Button */}
          {currentPath === '/sales/new' ? (
            <button
              onClick={() => handleNav('/dashboard')}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Workspace</span>
            </button>
          ) : (
            <button
              onClick={() => handleNav('/sales/new')}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Launch POS</span>
              <span className="sm:hidden">POS</span>
            </button>
          )}

          {/* Free Trial Button on larger screens */}
          {currentPath !== '/register-business' && !user && (
            <button
              onClick={() => handleNav('/register-business')}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free Trial</span>
            </button>
          )}

          {/* Mobile Navigation Toggle Button (Clean Right-Aligned Hamburger) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
          </button>

        </div>
      </header>

      {/* Mobile Dropdown Menu with Smooth Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 sm:top-16 bottom-0 z-50 bg-slate-950/60 backdrop-blur-xs flex flex-col justify-start no-print animate-fadeIn">
          <div className="bg-white border-b border-slate-200 px-4 py-4 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
              {navLinks.map(link => (
                <button
                  key={link.label}
                  onClick={() => handleNav(link.path, link.sectionId)}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentPath === link.path && !link.sectionId
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="pt-1 flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => handleNav('/dashboard')}
                    className="w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Go to Dashboard</span>
                  </button>
                  <button
                    onClick={() => handleNav('/sales/new')}
                    className="w-full text-center py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Launch POS Speed Register
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNav('/login')}
                    className="w-full text-center py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Sign In to Account
                  </button>
                  <button
                    onClick={() => handleNav('/register-business')}
                    className="w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Start 14-Day Free Trial</span>
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </>
  );
};
