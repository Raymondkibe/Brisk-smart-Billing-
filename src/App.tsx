import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigation } from './components/Navigation';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { PageSkeleton } from './components/PageSkeleton';

// Pages
import { LandingPage } from './pages/LandingPage';
import { RegisterBusinessPage } from './pages/RegisterBusinessPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PosPage } from './pages/PosPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkerDashboardPage } from './pages/WorkerDashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { WorkersPage } from './pages/WorkersPage';
import { CustomersPage } from './pages/CustomersPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ReceiptsPage } from './pages/ReceiptsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportPage } from './pages/SupportPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CustomerPayPage } from './pages/CustomerPayPage';
import { VerifyReceiptPage } from './pages/VerifyReceiptPage';
import { LoginPage } from './pages/LoginPage';
import { ContactPage } from './pages/ContactPage';
import { PaymentSettingsPage } from './pages/PaymentSettingsPage';
import { BankTransfersPage } from './pages/BankTransfersPage';

function AppContent() {
  const { user, loading, isOwner, isCashier, isSales, isSuperAdmin, getDefaultPath } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/dashboard');
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  // Sync route with browser history (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const target = window.location.pathname || '/dashboard';
      setCurrentPath(target);
      setIsPageTransitioning(true);
      const timer = setTimeout(() => setIsPageTransitioning(false), 200);
      return () => clearTimeout(timer);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Universal SPA Navigation Handler: updates browser history without page reload
  const navigate = useCallback((path: string) => {
    if (path === currentPath) {
      window.scrollTo(0, 0);
      return;
    }

    // Update browser URL without reload
    window.history.pushState({ path }, '', path);
    
    // Provide immediate visual skeleton feedback while loading target page & API data
    setIsPageTransitioning(true);
    setCurrentPath(path);
    window.scrollTo(0, 0);

    // Smooth transition release after initial mount
    const timer = setTimeout(() => {
      setIsPageTransitioning(false);
    }, 220);

    return () => clearTimeout(timer);
  }, [currentPath]);

  // Base path without query params or trailing slash for exact matching
  const cleanPath = (currentPath.split('?')[0].split('#')[0] || '/').replace(/\/+$/, '') || '/';

  // Determine if current route is a public/standalone view
  const isPublicRoute =
    cleanPath === '/' ||
    cleanPath === '/login' ||
    cleanPath === '/register-business' ||
    cleanPath === '/onboarding' ||
    cleanPath === '/contact' ||
    cleanPath.startsWith('/pay/') ||
    cleanPath.startsWith('/verify-receipt/');

  // Clean authenticated navigation - users can freely navigate to all back-office pages without bouncing

  // Show a light loading indicator while authenticating session on initial load
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Public Routes (Landing, Login, Register, Pay, Receipt verification)
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans">
        {/* Global Public Website Header */}
        <SiteHeader currentPath={currentPath} onNavigate={navigate} />

        {/* Dynamic Page Content */}
        <div className="flex-1 flex flex-col">
          {cleanPath === '/' && (
            <LandingPage onNavigate={navigate} />
          )}

          {cleanPath === '/login' && (
            <LoginPage
              onNavigate={navigate}
              onSuccess={(targetPath) => navigate(targetPath || getDefaultPath())}
            />
          )}

          {cleanPath === '/register-business' && (
            <RegisterBusinessPage
              onSuccess={() => navigate('/dashboard')}
              onNavigate={navigate}
            />
          )}

          {cleanPath === '/onboarding' && (
            <OnboardingPage
              onComplete={() => navigate('/dashboard')}
            />
          )}

          {cleanPath.startsWith('/pay/') && (
            <CustomerPayPage token={cleanPath.replace('/pay/', '')} />
          )}

          {cleanPath.startsWith('/verify-receipt/') && (
            <VerifyReceiptPage token={cleanPath.replace('/verify-receipt/', '')} />
          )}

          {cleanPath === '/contact' && (
            <ContactPage onNavigate={navigate} />
          )}
        </div>

        {/* Global Public Website Footer */}
        <SiteFooter variant="public" onNavigate={navigate} />
      </div>
    );
  }

  // If user is unauthenticated and attempting to visit a private route, show the unified login form
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans">
        <SiteHeader currentPath="/login" onNavigate={navigate} />
        <div className="flex-1 flex flex-col">
          <LoginPage
            onNavigate={navigate}
            onSuccess={(targetPath) => {
              if (currentPath && currentPath !== '/login' && currentPath !== '/') {
                navigate(currentPath);
              } else {
                navigate(targetPath || getDefaultPath());
              }
            }}
          />
        </div>
        <SiteFooter variant="public" onNavigate={navigate} />
      </div>
    );
  }

  // Helper to render the active authenticated page with skeleton loading fallback
  const renderAuthenticatedPage = () => {
    // If page is transitioning, show contextual skeleton loader immediately
    if (isPageTransitioning) {
      switch (cleanPath) {
        case '/worker/dashboard':
        case '/dashboard':
          return <PageSkeleton pageTitle="Dashboard Overview" variant="dashboard" />;

        case '/pos':
        case '/sales/new':
        case '/worker/sales/new':
          return <PageSkeleton pageTitle="Point of Sale Terminal" variant="pos" />;

        case '/products':
          return <PageSkeleton pageTitle="Products & Inventory Catalog" variant="table" />;

        case '/inventory':
          return <PageSkeleton pageTitle="Stock Levels & Movements" variant="table" />;

        case '/workers':
          return <PageSkeleton pageTitle="Staff & Cashiers" variant="table" />;

        case '/customers':
          return <PageSkeleton pageTitle="Customer Accounts" variant="table" />;

        case '/sales':
        case '/transactions':
          return <PageSkeleton pageTitle="Sales Transactions" variant="table" />;

        case '/receipts':
          return <PageSkeleton pageTitle="Receipts & Invoices" variant="table" />;

        case '/reports':
          return <PageSkeleton pageTitle="Financial & Sales Reports" variant="dashboard" />;

        case '/expenses':
          return <PageSkeleton pageTitle="Business Expenses" variant="table" />;

        case '/subscription':
        case '/subscriptions':
          return <PageSkeleton pageTitle="Subscription & Billing" variant="form" />;

        case '/settings/payments':
        case '/payments/settings':
        case '/payment-methods':
          return <PageSkeleton pageTitle="Payment Gateways & Methods" variant="form" />;

        case '/payments/bank-transfers':
        case '/bank-transfers':
          return <PageSkeleton pageTitle="Bank Transfer Approvals" variant="table" />;

        case '/support':
          return <PageSkeleton pageTitle="Support Center & Tickets" variant="table" />;

        case '/admin':
          return <PageSkeleton pageTitle="Platform Administration" variant="dashboard" />;

        default:
          if (cleanPath.startsWith('/settings')) {
            return <PageSkeleton pageTitle="Store Settings" variant="form" />;
          }
          return <PageSkeleton pageTitle="Loading page..." variant="default" />;
      }
    }

    // Normal Page View Rendering
    switch (cleanPath) {
      case '/worker/dashboard':
        return <WorkerDashboardPage onNavigate={navigate} />;

      case '/dashboard':
        if ((isCashier || isSales) && !isOwner && !isSuperAdmin) {
          return <WorkerDashboardPage onNavigate={navigate} />;
        }
        return <DashboardPage onNavigate={navigate} />;

      case '/pos':
      case '/sales/new':
      case '/worker/sales/new':
        return <PosPage onNavigate={navigate} />;

      case '/products':
        return <ProductsPage />;

      case '/inventory':
        return <InventoryPage />;

      case '/workers':
        return <WorkersPage />;

      case '/customers':
        return <CustomersPage />;

      case '/sales':
      case '/transactions':
        return <TransactionsPage />;

      case '/receipts':
        return <ReceiptsPage />;

      case '/reports':
        return <ReportsPage />;

      case '/expenses':
        return <ExpensesPage />;

      case '/subscription':
      case '/subscriptions':
        return <SubscriptionPage />;

      case '/settings/payments':
      case '/payments/settings':
      case '/payment-methods':
        return <PaymentSettingsPage onNavigate={navigate} />;

      case '/payments/bank-transfers':
      case '/bank-transfers':
        return <BankTransfersPage onNavigate={navigate} />;

      case '/support':
        return <SupportPage />;

      case '/admin':
        return <AdminDashboardPage />;

      default:
        // Handle nested settings routes (e.g. /settings/business, /settings/mpesa, /settings/sms, /settings)
        if (cleanPath === '/settings' || cleanPath.startsWith('/settings/')) {
          if (cleanPath === '/settings/payments') {
            return <PaymentSettingsPage onNavigate={navigate} />;
          }
          return <SettingsPage />;
        }

        // Default fallback to Dashboard
        if ((isCashier || isSales) && !isOwner && !isSuperAdmin) {
          return <WorkerDashboardPage onNavigate={navigate} />;
        }
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  // Authenticated Back-Office Application Layout
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between pb-16 md:pb-0 selection:bg-blue-600 selection:text-white font-sans">
      {/* Top Bar Header & Responsive Navigation */}
      <Navigation currentPath={currentPath} onNavigate={navigate} />

      {/* Main Content Area with Desktop Sidebar Offset (w-60 = 240px) */}
      <div className="flex-1 md:pl-60 flex flex-col justify-between min-h-[calc(100vh-4rem)]">
        <main className="pt-4 flex-1">
          {renderAuthenticatedPage()}
        </main>

        {/* Back-Office Application Footer */}
        <SiteFooter variant="app" onNavigate={navigate} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
