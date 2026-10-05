import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Business, BusinessMember, Subscription, UserRole } from '../types';

const REDIRECT_STORAGE_KEY = 'brisk_auth_redirect_url';

interface AuthContextType {
  user: UserProfile | null;
  businesses: Business[];
  activeBusiness: Business | null;
  member: BusinessMember | null;
  subscription: Subscription | null;
  role: string | null;
  isOwner: boolean;
  isManager: boolean;
  isCashier: boolean;
  isSales: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  switchBusiness: (businessId: string) => void;
  refreshAuth: () => Promise<void>;
  updateActiveBusiness: (updated: Business) => void;
  getDefaultPath: (roleOverride?: string | null) => string;
  saveRedirectPath: (path: string) => void;
  getAndClearRedirectPath: () => string | null;
  login: (identifier: string, password?: string) => Promise<{
    success: boolean;
    error?: string;
    user?: UserProfile;
    role?: string;
    defaultPath?: string;
    targetPath?: string;
  }>;
  registerBusiness: (payload: any) => Promise<{
    success: boolean;
    error?: string;
    user?: UserProfile;
    business?: Business;
    role?: string;
    defaultPath?: string;
    targetPath?: string;
  }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [member, setMember] = useState<BusinessMember | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to resolve role dynamically (defaults to owner for store owners)
  const resolveRole = (
    u: UserProfile | null,
    m: BusinessMember | null,
    bizList: Business[],
    activeBiz: Business | null
  ): string | null => {
    if (!u) return null;
    if (u.is_super_admin) return 'super_admin';
    if (activeBiz && activeBiz.owner_id === u.id) return 'owner';
    if (bizList.some(b => b.owner_id === u.id)) return 'owner';
    if (m?.role) return m.role;
    if (bizList.length > 0) return 'owner';
    return 'owner';
  };

  const role = resolveRole(user, member, businesses, activeBusiness);
  const isSuperAdmin = Boolean(user?.is_super_admin || role === 'super_admin');
  const isOwner = role === 'owner' || isSuperAdmin || !role;
  const isManager = role === 'manager';
  const isCashier = role === 'cashier' && !isOwner && !isSuperAdmin;
  const isSales = role === 'sales_worker' && !isOwner && !isSuperAdmin;

  const getDefaultPath = useCallback((_roleOverride?: string | null): string => {
    return '/dashboard';
  }, []);

  /**
   * Save a requested destination URL during unauthenticated navigation attempt
   */
  const saveRedirectPath = useCallback((path: string) => {
    if (!path) return;
    const clean = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
    if (clean === '/login' || clean === '/' || clean === '/register-business' || clean === '/onboarding' || clean === '/contact') {
      return;
    }
    try {
      sessionStorage.setItem(REDIRECT_STORAGE_KEY, path);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  /**
   * Retrieve and clear the saved destination URL
   */
  const getAndClearRedirectPath = useCallback((): string | null => {
    try {
      const saved = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
      if (saved) {
        sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
        const clean = saved.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
        if (clean !== '/login' && clean !== '/' && clean !== '/register-business' && clean !== '/onboarding' && clean !== '/contact') {
          return saved;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  }, []);

  const fetchAuth = async (userIdOverride?: string, businessIdOverride?: string) => {
    try {
      const storedUserId = userIdOverride || localStorage.getItem('brisk_user_id') || '';
      const storedBizId = businessIdOverride || localStorage.getItem('brisk_biz_id') || '';

      if (!storedUserId) {
        setUser(null);
        setBusinesses([]);
        setActiveBusiness(null);
        setMember(null);
        setSubscription(null);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/auth/me?user_id=${storedUserId}&business_id=${storedBizId}`, {
        headers: {
          'x-user-id': storedUserId,
          'x-business-id': storedBizId,
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setBusinesses(data.businesses || []);
        setActiveBusiness(data.activeBusiness || null);
        setMember(data.member || null);
        setSubscription(data.subscription || null);

        if (data.user?.id) localStorage.setItem('brisk_user_id', data.user.id);
        if (data.activeBusiness?.id) {
          localStorage.setItem('brisk_biz_id', data.activeBusiness.id);
        } else {
          localStorage.removeItem('brisk_biz_id');
        }
      } else {
        // Invalid session
        localStorage.removeItem('brisk_user_id');
        localStorage.removeItem('brisk_biz_id');
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load auth state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth();
  }, []);

  const switchBusiness = (businessId: string) => {
    const target = businesses.find(b => b.id === businessId);
    if (target) {
      setActiveBusiness(target);
      localStorage.setItem('brisk_biz_id', target.id);
      fetchAuth(user?.id, target.id);
    }
  };

  const updateActiveBusiness = (updated: Business) => {
    setActiveBusiness(updated);
    setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const refreshAuth = async () => {
    await fetchAuth(user?.id, activeBusiness?.id);
  };

  const login = async (identifier: string, password?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setUser(data.user);
      setBusinesses(data.businesses || []);
      setActiveBusiness(data.activeBusiness || null);
      setMember(data.member || null);
      setSubscription(data.subscription || null);

      if (data.user?.id) localStorage.setItem('brisk_user_id', data.user.id);
      if (data.activeBusiness?.id) localStorage.setItem('brisk_biz_id', data.activeBusiness.id);

      const dynamicRole =
        data.role ||
        data.member?.role ||
        (data.user?.is_super_admin ? 'super_admin' : (data.businesses?.some((b: Business) => b.owner_id === data.user?.id) ? 'owner' : 'cashier'));

      const defaultPath = '/dashboard';
      const savedRedirect = getAndClearRedirectPath();
      const targetPath = savedRedirect || defaultPath;

      return {
        success: true,
        user: data.user,
        role: dynamicRole,
        defaultPath,
        targetPath,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const registerBusiness = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setUser(data.user);
      const bizList = data.businesses || (data.business ? [data.business] : []);
      const activeBiz = data.activeBusiness || data.business || null;
      setBusinesses(bizList);
      setActiveBusiness(activeBiz);
      setMember(data.member || null);
      setSubscription(data.subscription || null);

      if (data.user?.id) localStorage.setItem('brisk_user_id', data.user.id);
      if (activeBiz?.id) localStorage.setItem('brisk_biz_id', activeBiz.id);

      const savedRedirect = getAndClearRedirectPath();
      const targetPath = savedRedirect || '/dashboard';

      return {
        success: true,
        user: data.user,
        business: activeBiz,
        role: 'owner',
        defaultPath: '/dashboard',
        targetPath,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('brisk_user_id');
    localStorage.removeItem('brisk_biz_id');
    try {
      sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    } catch {
      // Ignore storage error
    }
    setUser(null);
    setBusinesses([]);
    setActiveBusiness(null);
    setMember(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider
      value={{
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
        loading,
        switchBusiness,
        refreshAuth,
        updateActiveBusiness,
        getDefaultPath,
        saveRedirectPath,
        getAndClearRedirectPath,
        login,
        registerBusiness,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Universal authenticated fetch helper that injects real user and business headers
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const userId = localStorage.getItem('brisk_user_id') || '';
  const bizId = localStorage.getItem('brisk_biz_id') || '';

  const headers = new Headers(options.headers || {});
  if (userId && !headers.has('x-user-id')) headers.set('x-user-id', userId);
  if (bizId && !headers.has('x-business-id')) headers.set('x-business-id', bizId);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
