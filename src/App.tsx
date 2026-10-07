import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { PublicProductPage } from './pages/PublicProductPage';
import { ProductLabelsPage } from './pages/ProductLabelsPage';

/**
 * Normalizes any route string by stripping query parameters, hashes, and trailing slashes.
 */
function normalizeRoute(rawPath: string): string {
  if (!rawPath) return '/';
  const withoutQueryOrHash = rawPath.split('?')[0].split('#')[0].trim();
  const normalized = withoutQueryOrHash.replace(/\/+$/, '') || '/';
  return normalized;
}

/**
 * Robust state-driven router hook for AI Studio SPA applications.
 * Synchronizes route state with browser history (popstate & pushState) with zero reload.
 */
function useRouter() {
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    return window.location.pathname + window.location.search + window.location.hash || '/dashboard';
  });
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const cleanPath = useMemo(() => normalizeRoute(currentUrl), [currentUrl]);

  // Synchronize on browser Back / Forward events
  useEffect(() => {
    const handlePopState = () => {
      const fullUrl = window.location.pathname + window.location.search + window.location.hash || '/dashboard';
      setCurrentUrl(fullUrl);
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 180);
      return () => clearTimeout(timer);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // State-driven navigate function
  const navigate = useCallback((targetPath: string, options?: { replace?: boolean; force?: boolean }) => {
    if (!targetPath) return;

    if (targetPath === currentUrl && !options?.force) {
      window.scrollTo(0, 0);
      return;
    }

    if (options?.replace) {
      window.history.replaceState({ path: targetPath }, '', targetPath);
    } else {
      window.history.pushState({ path: targetPath }, '', targetPath);
    }

    setCurrentUrl(targetPath);
    setIsTransitioning(true);
    window.scrollTo(0, 0);

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [currentUrl]);

  return {
    currentUrl,
    cleanPath,
    isTransitioning,
    navigate,
  };
}

function AppContent() {
  const {
    user,
    loading,
    isOwner,
    isCashier,
    isSales,
    isSuperAdmin,
    getDefaultPath,
    saveRedirectPath,
    getAndClearRedirectPath,
  } = useAuth();

  const { currentUrl, cleanPath, isTransitioning, navigate } = useRouter();

  // Automatic immediate transition: If user session is established while on /login or /register-business,
  // immediately route to dashboard without stalling.
  useEffect(() => {
    if (user && (cleanPath === '/login' || cleanPath === '/register-business')) {
      const dest = getAndClearRedirectPath() || getDefaultPath();
      navigate(dest, { replace: true, force: true });
    }
  }, [user, cleanPath, getDefaultPath, getAndClearRedirectPath, navigate]);

  // Determine if the current route is publicly accessible
  const isPublicRoute =
    cleanPath === '/' ||
    cleanPath === '/login' ||
    cleanPath === '/register-business' ||
    cleanPath === '/onboarding' ||
    cleanPath === '/contact' ||
    cleanPath.startsWith('/pay/') ||
    cleanPath.startsWith('/verify-receipt/') ||
    cleanPath.startsWith('/product/') ||
    cleanPath.startsWith('/p/');

  // When an unauthenticated user attempts to visit a protected route, preserve their requested path in session storage
  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      saveRedirectPath(currentUrl);
    }
  }, [loading, user, isPublicRoute, currentUrl, saveRedirectPath]);

  // Show a clean, branded loading spinner while authenticating initial session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. Render Public & Standalone Pages
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans">
        <SiteHeader currentPath={cleanPath} onNavigate={navigate} />

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

          {(cleanPath.startsWith('/product/') || cleanPath.startsWith('/p/')) && (
            <PublicProductPage
              productId={cleanPath.replace('/product/', '').replace('/p/', '')}
              onNavigate={navigate}
            />
          )}
        </div>

        <SiteFooter variant="public" onNavigate={navigate} />
      </div>
    );
  }

  // 2. Unauthenticated user trying to access a protected back-office page
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans">
        <SiteHeader currentPath="/login" onNavigate={navigate} />
        <div className="flex-1 flex flex-col">
          <LoginPage
            onNavigate={navigate}
            onSuccess={(targetPath) => {
              navigate(targetPath || getDefaultPath());
            }}
          />
        </div>
        <SiteFooter variant="public" onNavigate={navigate} />
      </div>
    );
  }

  // 3. Authenticated Router: Maps every navigation route directly to its corresponding page component
  const renderAuthenticatedPage = () => {
    // If transitioning, render instantaneous contextual skeleton feedback
    if (isTransitioning) {
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

        case '/labels':
        case '/product-labels':
          return <PageSkeleton pageTitle="Product Labels & Shelf Tag Studio" variant="form" />;

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
        case '/settings/bank-transfers':
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

    // Explicit and deterministic route matching
    switch (cleanPath) {
      case '/login':
      case '/register-business':
        if ((isCashier || isSales) && !isOwner && !isSuperAdmin) {
          return <WorkerDashboardPage onNavigate={navigate} />;
        }
        return <DashboardPage onNavigate={navigate} />;

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

      case '/labels':
      case '/product-labels':
      case '/products/labels':
      case '/shelf-labels':
        return <ProductLabelsPage onNavigate={navigate} />;

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
      case '/settings/bank-transfers':
        return <BankTransfersPage onNavigate={navigate} />;

      case '/support':
        return <SupportPage />;

      case '/admin':
        return <AdminDashboardPage />;

      // Settings and child settings views
      case '/settings':
      case '/settings/business':
      case '/settings/tax':
      case '/settings/sms':
      case '/settings/mpesa':
        return <SettingsPage />;

      default:
        // Handle any dynamic nested settings routes
        if (cleanPath.startsWith('/settings/')) {
          return <SettingsPage />;
        }

        // Fallback for role-specific dashboard
        if ((isCashier || isSales) && !isOwner && !isSuperAdmin) {
          return <WorkerDashboardPage onNavigate={navigate} />;
        }
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  // 4. Authenticated Layout with Responsive Navigation
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between pb-16 md:pb-0 selection:bg-blue-600 selection:text-white font-sans">
      <Navigation currentPath={cleanPath} onNavigate={navigate} />

      <div className="flex-1 md:pl-60 flex flex-col justify-between min-h-[calc(100vh-4rem)]">
        <main className="pt-4 flex-1">
          {renderAuthenticatedPage()}
        </main>

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
