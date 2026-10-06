import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Users,
  UserCheck,
  CreditCard,
  Receipt as ReceiptIcon,
  BarChart3,
  TrendingDown,
  Bell,
  Sparkles,
  Settings,
  HelpCircle,
  Shield,
  Menu,
  X,
  ChevronDown,
  Store,
  LogOut,
  Clock,
  ArrowRight,
  QrCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPath, onNavigate }) => {
  const {
    user,
    businesses,
    activeBusiness,
    member,
    subscription,
    role,
    isOwner,
    isManager,
    isCashier,
    isSales,
    isSuperAdmin,
    getDefaultPath,
    switchBusiness,
    logout,
  } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false);

  // Dynamic Navigation Items based on resolved role
  const navItems = [
    {
      label: 'Dashboard',
      path: isOwner || isManager || isSuperAdmin ? '/dashboard' : '/worker/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: 'New Sale (POS)',
      path: isOwner || isManager || isSuperAdmin ? '/sales/new' : '/worker/sales/new',
      icon: ShoppingCart,
      visible: true,
      highlight: true,
    },
    {
      label: 'Products',
      path: '/products',
      icon: Package,
      visible: isOwner || isManager || isSuperAdmin || isCashier || isSales,
    },
    {
      label: 'Shelf Labels',
      path: '/labels',
      icon: QrCode,
      visible: isOwner || isManager || isSuperAdmin || isCashier || isSales,
    },
    {
      label: 'Inventory',
      path: '/inventory',
      icon: Layers,
      visible: isOwner || isManager || isSuperAdmin,
    },
    {
      label: 'Workers',
      path: '/workers',
      icon: Users,
      visible: isOwner || isManager || isSuperAdmin,
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: UserCheck,
      visible: isOwner || isManager || isSuperAdmin,
    },
    {
      label: 'Transactions',
      path: '/transactions',
      icon: CreditCard,
      visible: true,
    },
    {
      label: 'Receipts',
      path: '/receipts',
      icon: ReceiptIcon,
      visible: true,
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: BarChart3,
      visible: isOwner || isManager || isSuperAdmin,
    },
    {
      label: 'Expenses',
      path: '/expenses',
      icon: TrendingDown,
      visible: isOwner || isManager || isSuperAdmin,
    },
    {
      label: 'Subscription',
      path: '/subscription',
      icon: Sparkles,
      visible: isOwner || isSuperAdmin,
    },
    {
      label: 'Payment Methods',
      path: '/settings/payments',
      icon: CreditCard,
      visible: isOwner || isSuperAdmin,
    },
    {
      label: 'Settings',
      path: '/settings/business',
      icon: Settings,
      visible: isOwner || isSuperAdmin,
    },
    {
      label: 'Support',
      path: '/support',
      icon: HelpCircle,
      visible: true,
    },
    {
      label: 'Platform Admin',
      path: '/admin',
      icon: Shield,
      visible: isSuperAdmin,
    },
  ].filter(item => item.visible);

  const handleSelectNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* TOP BAR CONTRACT: Zone 1 (Wordmark) - Zone 2 (Nav/Context) - Zone 3 (Actions & Right NavButton) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 no-print">
        
        {/* Zone 1: Single text element wordmark with logo (Left Side) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => onNavigate('/')}
            className="text-sm sm:text-base font-bold tracking-tight text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-2 cursor-pointer min-w-0"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 overflow-hidden shrink-0 shadow-md shadow-blue-500/20">
              <img
                src="/favicon_logo_1790884666478.jpg"
                alt="BRISK SMART BILLING"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span className="truncate max-w-[140px] sm:max-w-none">BRISK SMART BILLING</span>
          </button>
        </div>

        {/* Zone 2: Business Switcher & Subscription Context (Clean unboxed metadata) */}
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-600">
          
          {/* Business Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setBusinessDropdownOpen(!businessDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-800 transition-colors cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate max-w-[140px]">{activeBusiness?.name || 'My Store'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {businessDropdownOpen && (
              <div className="absolute left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Your Businesses
                </div>
                {businesses.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      switchBusiness(b.id);
                      setBusinessDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      b.id === activeBusiness?.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    <span className="text-[10px] text-slate-400">{b.location}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span aria-hidden="true" className="text-slate-300">·</span>

          {/* Subscription / Trial Status */}
          <button
            onClick={() => onNavigate('/subscription')}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {subscription?.status === 'trial' ? (
                <span>Trial: <strong className="font-semibold text-slate-900">{subscription.days_remaining} days</strong> remaining</span>
              ) : subscription?.status === 'active' ? (
                <span>Plan: <strong className="font-semibold text-slate-900">{subscription.plan_name}</strong></span>
              ) : (
                <span className="text-red-600 font-semibold">Subscription Expired</span>
              )}
            </span>
          </button>
        </div>

        {/* Zone 3: Fast Actions, Persona Controls & Right-Aligned Mobile Navbutton */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* POS Button */}
          <button
            onClick={() => onNavigate('/sales/new')}
            className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">POS Register</span>
            <span className="sm:hidden">POS</span>
          </button>

          {/* User Profile & Sign Out Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs transition-colors cursor-pointer"
              title="Account Options & Sign Out"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                {user?.full_name ? user.full_name.slice(0, 1) : 'U'}
              </div>
              <div className="text-left hidden lg:block leading-tight">
                <p className="font-semibold text-slate-900 truncate max-w-[110px]">{user?.full_name || 'My Account'}</p>
                <p className="text-[10px] text-slate-500 capitalize">
                  {role ? role.replace('_', ' ') : 'Account'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 text-xs animate-fadeIn">
                <div className="pb-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || user?.phone}</p>
                  <div className="mt-1.5 inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded capitalize">
                    {role ? role.replace('_', ' ') : 'Account'}
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  {(isOwner || isManager || isSuperAdmin) && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('/dashboard');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Dashboard</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('/sales/new');
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                    <span>POS Terminal</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('/register-business');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span>Register New Business</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      onNavigate('/login');
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right-Aligned Mobile Navigation Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
          </button>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR NAVIGATION (240px width) */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 fixed top-14 sm:top-16 bottom-0 left-0 z-30 overflow-y-auto no-print">
        
        {/* User Role Banner */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Logged In As</div>
          <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">{user?.full_name}</div>
          <div className="text-[11px] text-blue-600 font-medium capitalize mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{role ? role.replace('_', ' ') : 'Staff'}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => handleSelectNav(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-600">BRISK SMART BILLING</p>
          <p>Smart Billing. Pay. Verify. Grow.</p>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER NAVIGATION */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/60 backdrop-blur-2xs no-print animate-fadeIn">
          <div className="w-64 bg-white h-full shadow-2xl flex flex-col p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-blue-600 shrink-0">
                  <img
                    src="/favicon_logo_1790884666478.jpg"
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-bold text-xs text-slate-900 truncate">BRISK SMART BILLING</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2 text-xs text-slate-500 border-b border-slate-100">
              <p className="font-bold text-slate-800">{activeBusiness?.name || 'My Store'}</p>
              <p className="text-[11px]">{user?.full_name} ({role ? role.replace('_', ' ') : 'Staff'})</p>
            </div>

            <nav className="flex-1 py-3 overflow-y-auto space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelectNav(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer ${
                      active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex justify-around items-center h-14 px-2 no-print">
        <button
          onClick={() => onNavigate(getDefaultPath())}
          className={`flex flex-col items-center justify-center w-14 py-1 text-[10px] cursor-pointer ${
            currentPath === '/dashboard' ? 'text-blue-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onNavigate('/sales/new')}
          className={`flex flex-col items-center justify-center w-14 py-1 text-[10px] cursor-pointer ${
            currentPath === '/sales/new' ? 'text-blue-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>POS</span>
        </button>

        {(isOwner || isManager || isSuperAdmin) && (
          <button
            onClick={() => onNavigate('/products')}
            className={`flex flex-col items-center justify-center w-14 py-1 text-[10px] cursor-pointer ${
              currentPath === '/products' ? 'text-blue-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('/receipts')}
          className={`flex flex-col items-center justify-center w-14 py-1 text-[10px] cursor-pointer ${
            currentPath === '/receipts' ? 'text-blue-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <ReceiptIcon className="w-4 h-4" />
          <span>Receipts</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-14 py-1 text-[10px] text-slate-500 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </div>
    </>
  );
};
