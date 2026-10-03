import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  UserProfile,
  Business,
  BusinessMember,
  Subscription,
  Product,
  Category,
  Brand,
  Sale,
  Receipt,
  Customer,
  Expense,
  Payment,
  InventoryMovement,
  WorkerInvitation,
  SupportTicket,
  ContactMessage,
  SubscriptionPlan,
  BusinessPaymentConfig,
  BankTransferRecord
} from '../types';

// Create base Axios instance
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach authentication & business headers to every single request
axiosInstance.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem('brisk_user_id');
    const bizId = localStorage.getItem('brisk_biz_id');

    if (userId) {
      config.headers['x-user-id'] = userId;
    }
    if (bizId) {
      config.headers['x-business-id'] = bizId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for centralized error normalization
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);

/* =========================================================================
   IN-MEMORY CACHE FOR STATIC & SLOW-CHANGING GET RESOURCES
   ========================================================================= */
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // in milliseconds
}

const memoryCache = new Map<string, CacheEntry>();

/**
 * Universal cached GET request helper
 */
export async function cachedGet<T>(
  url: string,
  params?: Record<string, any>,
  ttlMs: number = 60000
): Promise<T> {
  const userId = localStorage.getItem('brisk_user_id') || '';
  const bizId = localStorage.getItem('brisk_biz_id') || '';
  const queryString = params ? JSON.stringify(params) : '';
  const cacheKey = `${bizId}:${userId}:${url}:${queryString}`;

  const cached = memoryCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }

  const res = await axiosInstance.get<T>(url, { params });
  memoryCache.set(cacheKey, {
    data: res.data,
    timestamp: now,
    ttl: ttlMs,
  });

  return res.data;
}

/**
 * Invalidate in-memory cache entries matching a URL pattern or purge all
 */
export function invalidateCache(urlPattern?: string) {
  if (!urlPattern) {
    memoryCache.clear();
    return;
  }
  for (const key of Array.from(memoryCache.keys())) {
    if (key.includes(urlPattern)) {
      memoryCache.delete(key);
    }
  }
}

/* =========================================================================
   1. AUTHENTICATION & IDENTITY SERVICE
   ========================================================================= */
export const authApi = {
  registerBusiness: async (payload: {
    businessName: string;
    ownerName?: string;
    fullName?: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword?: string;
    category?: string;
    location?: string;
    country?: string;
    currency?: string;
  }) => {
    const res = await axiosInstance.post<{
      success: boolean;
      user: UserProfile;
      business: Business;
      activeBusiness: Business;
      businesses: Business[];
      member: BusinessMember;
      subscription: Subscription;
      role: string;
    }>('/auth/register-business', payload);
    invalidateCache();
    return res.data;
  },

  login: async (identifier: string, password?: string) => {
    const res = await axiosInstance.post<{
      success: boolean;
      user: UserProfile;
      businesses: Business[];
      activeBusiness: Business;
      member: BusinessMember;
      subscription: Subscription;
      role: string;
      token?: string;
    }>('/auth/login', { identifier, password });
    invalidateCache();
    return res.data;
  },

  adminLogin: async (identifier: string, password?: string) => {
    const res = await axiosInstance.post<{
      success: boolean;
      user: UserProfile;
      role: string;
      token?: string;
    }>('/auth/admin-login', { identifier, password });
    invalidateCache();
    return res.data;
  },

  getMe: async (userId?: string, businessId?: string) => {
    const params: Record<string, string> = {};
    if (userId) params.user_id = userId;
    if (businessId) params.business_id = businessId;
    const res = await axiosInstance.get<{
      user: UserProfile | null;
      businesses: Business[];
      activeBusiness: Business | null;
      member: BusinessMember | null;
      subscription: Subscription | null;
      role: string | null;
    }>('/auth/me', { params });
    return res.data;
  },

  getProfile: async () => {
    const res = await axiosInstance.get<{
      user: UserProfile;
      activities: any[];
    }>('/auth/profile');
    return res.data;
  },

  updateProfile: async (payload: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    mfaEnabled?: boolean;
  }) => {
    const res = await axiosInstance.put<{ success: boolean; user: UserProfile }>(
      '/auth/profile',
      payload
    );
    return res.data;
  },

  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
  }) => {
    const res = await axiosInstance.post<{ success: boolean; message: string }>(
      '/auth/change-password',
      payload
    );
    return res.data;
  },

  switchBusiness: async (businessId: string) => {
    const res = await axiosInstance.post<{
      success: boolean;
      activeBusiness: Business;
      member: BusinessMember;
      subscription: Subscription;
      role: string;
    }>('/auth/switch-business', { businessId });
    invalidateCache();
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await axiosInstance.post<{ success: boolean; message: string; previewToken?: string }>(
      '/auth/forgot-password',
      { email }
    );
    return res.data;
  },

  resetPassword: async (payload: { token: string; newPassword: string; confirmPassword?: string }) => {
    const res = await axiosInstance.post<{ success: boolean; message: string }>(
      '/auth/reset-password',
      payload
    );
    return res.data;
  },

  verifyEmail: async (payload: { email: string; code: string }) => {
    const res = await axiosInstance.post<{ success: boolean; message: string }>(
      '/auth/verify-email',
      payload
    );
    return res.data;
  },

  resendVerification: async (email: string) => {
    const res = await axiosInstance.post<{ success: boolean; message: string; previewCode?: string }>(
      '/auth/resend-verification',
      { email }
    );
    return res.data;
  },

  getInvitation: async (token: string) => {
    const res = await axiosInstance.get<{ invitation: WorkerInvitation }>(
      `/auth/invitations/${token}`
    );
    return res.data;
  },

  acceptInvitation: async (payload: {
    token: string;
    fullName: string;
    password?: string;
    phone?: string;
  }) => {
    const res = await axiosInstance.post<{
      success: boolean;
      user: UserProfile;
      business: Business;
      member: BusinessMember;
    }>('/auth/accept-invitation', payload);
    invalidateCache();
    return res.data;
  },
};

/* =========================================================================
   2. POS, SALES & PAYMENTS SERVICE
   ========================================================================= */
export const salesApi = {
  createSale: async (payload: {
    items: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      barcode?: string;
      variant?: string;
      unit?: string;
    }>;
    subtotal: number;
    discount_amount?: number;
    tax_amount?: number;
    total_amount: number;
    payment_method: string;
    customer_id?: string;
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
  }) => {
    const res = await axiosInstance.post<{
      success: boolean;
      sale: Sale;
      receipt: Receipt;
    }>('/sales', payload);
    return res.data;
  },

  createCashSale: async (payload: {
    items: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      barcode?: string;
      variant?: string;
      unit?: string;
    }>;
    subtotal: number;
    discount_amount?: number;
    tax_amount?: number;
    total_amount: number;
    amount_tendered: number;
    change_due: number;
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
  }) => {
    const res = await axiosInstance.post<{
      success: boolean;
      sale: Sale;
      receipt: Receipt;
    }>('/sales/cash', payload);
    return res.data;
  },

  getSales: async (params?: {
    limit?: number;
    status?: string;
    payment_method?: string;
    start_date?: string;
    end_date?: string;
    worker_id?: string;
  }) => {
    const res = await axiosInstance.get<Sale[]>('/sales', { params });
    return res.data;
  },

  getSaleById: async (id: string) => {
    const res = await axiosInstance.get<{ sale: Sale; receipt?: Receipt }>(`/sales/${id}`);
    return res.data;
  },

  initiateMpesaStk: async (payload: {
    phone: string;
    amount: number;
    reference?: string;
    sale_id?: string;
  }) => {
    const res = await axiosInstance.post<{
      success: boolean;
      paymentId: string;
      status: string;
      message: string;
      CheckoutRequestID?: string;
    }>('/payments/mpesa/stk-push', payload);
    return res.data;
  },

  checkPaymentStatus: async (paymentId: string) => {
    const res = await axiosInstance.get<{
      id: string;
      status: string;
      amount: number;
      phone?: string;
      mpesa_receipt_number?: string;
      transaction_code?: string;
      error_message?: string;
    }>(`/payments/${paymentId}/status`);
    return res.data;
  },

  simulatePaymentCallback: async (paymentId: string, success: boolean = true) => {
    const res = await axiosInstance.post<{ success: boolean; payment: any }>(
      '/payments/simulate-callback',
      { paymentId, success }
    );
    return res.data;
  },

  createPaymentQr: async (payload: {
    amount: number;
    description?: string;
    reference?: string;
  }) => {
    const res = await axiosInstance.post<{
      success: boolean;
      token: string;
      payUrl: string;
      qrDataUrl: string;
      amount: number;
    }>('/qr/create', payload);
    return res.data;
  },

  getQrPayment: async (token: string) => {
    const res = await axiosInstance.get<{
      payment: any;
      business: Business;
    }>(`/qr/${token}`);
    return res.data;
  },

  payQr: async (token: string, payload: { phone: string; paymentMethod?: string }) => {
    const res = await axiosInstance.post<{
      success: boolean;
      status: string;
      message: string;
      paymentId?: string;
    }>(`/qr/${token}/pay`, payload);
    return res.data;
  },
};

/* =========================================================================
   3. PRODUCTS, CATEGORIES & BRANDS SERVICE (WITH IN-MEMORY CACHE)
   ========================================================================= */
export const productsApi = {
  getProducts: async (params?: {
    category_id?: string;
    brand_id?: string;
    search?: string;
    is_service?: boolean;
  }) => {
    const res = await axiosInstance.get<Product[]>('/products', { params });
    return res.data;
  },

  createProduct: async (productData: Partial<Product> & { category_name?: string; brand_name?: string }) => {
    const res = await axiosInstance.post<Product>('/products', productData);
    invalidateCache('/categories');
    invalidateCache('/brands');
    return res.data;
  },

  updateProduct: async (id: string, productData: Partial<Product>) => {
    const res = await axiosInstance.put<Product>(`/products/${id}`, productData);
    return res.data;
  },

  deleteProduct: async (id: string) => {
    const res = await axiosInstance.delete<{ success: boolean; message: string }>(`/products/${id}`);
    return res.data;
  },

  importProducts: async (products: Partial<Product>[]) => {
    const res = await axiosInstance.post<{ success: boolean; importedCount: number; products: Product[] }>(
      '/products/import',
      { products }
    );
    invalidateCache('/categories');
    invalidateCache('/brands');
    return res.data;
  },

  // Cached GET for categories (60s TTL)
  getCategories: async () => {
    return cachedGet<Category[]>('/categories', undefined, 60000);
  },

  createCategory: async (name: string, description?: string) => {
    const res = await axiosInstance.post<Category>('/categories', { name, description });
    invalidateCache('/categories');
    return res.data;
  },

  deleteCategory: async (id: string) => {
    const res = await axiosInstance.delete<{ success: boolean }>(`/categories/${id}`);
    invalidateCache('/categories');
    return res.data;
  },

  // Cached GET for brands (60s TTL)
  getBrands: async () => {
    return cachedGet<Brand[]>('/brands', undefined, 60000);
  },

  createBrand: async (name: string, description?: string) => {
    const res = await axiosInstance.post<Brand>('/brands', { name, description });
    invalidateCache('/brands');
    return res.data;
  },

  deleteBrand: async (id: string) => {
    const res = await axiosInstance.delete<{ success: boolean }>(`/brands/${id}`);
    invalidateCache('/brands');
    return res.data;
  },

  parseProductsWithAi: async (description: string) => {
    const res = await axiosInstance.post<{ products: Partial<Product>[] }>('/ai/parse-products', {
      text: description,
      description,
    });
    return res.data;
  },
};

/* =========================================================================
   3b. AI SERVICES (Powered by Gemini)
   ========================================================================= */
export const aiApi = {
  parseProducts: async (prompt: string) => {
    const res = await axiosInstance.post<{ success: boolean; products: Partial<Product>[] }>('/ai/parse-products', {
      text: prompt,
      description: prompt,
    });
    return res.data;
  },

  getInsights: async (params?: { businessName?: string; totalSales?: number; totalTransactions?: number }) => {
    const res = await axiosInstance.post<{
      success: boolean;
      insights: {
        summary: string;
        recommendations: string[];
        stockAlertMessage: string;
        profitabilityScore: number;
      };
    }>('/ai/insights', params || {});
    return res.data;
  },

  askAssistant: async (message: string) => {
    const res = await axiosInstance.post<{ success: boolean; reply: string }>('/ai/assistant', {
      message,
    });
    return res.data;
  },

  composeSms: async (params: {
    customerName?: string;
    totalAmount?: number;
    saleNumber?: string;
    purpose?: 'receipt' | 'promo' | 'reminder';
    extraNotes?: string;
  }) => {
    const res = await axiosInstance.post<{ success: boolean; message: string }>('/ai/compose-sms', params);
    return res.data;
  },
};

/* =========================================================================
   4. INVENTORY SERVICE
   ========================================================================= */
export const inventoryApi = {
  getMovements: async (params?: { product_id?: string; type?: string; limit?: number }) => {
    const res = await axiosInstance.get<InventoryMovement[]>('/inventory/movements', { params });
    return res.data;
  },

  adjustStock: async (payload: {
    product_id: string;
    quantity: number;
    type: 'purchase' | 'adjustment' | 'damage' | 'return' | 'transfer';
    reason: string;
    unit_cost?: number;
  }) => {
    const res = await axiosInstance.post<{
      success: boolean;
      product: Product;
      movement: InventoryMovement;
    }>('/inventory/adjust', payload);
    return res.data;
  },
};

/* =========================================================================
   5. WORKERS & STAFF MANAGEMENT SERVICE
   ========================================================================= */
export const workersApi = {
  getWorkers: async () => {
    const res = await axiosInstance.get<BusinessMember[]>('/workers');
    return res.data;
  },

  getSummary: async () => {
    const res = await axiosInstance.get<{
      totalWorkers: number;
      activeToday: number;
      totalSalesToday: number;
      shiftsActive: number;
    }>('/workers/summary');
    return res.data;
  },

  getWorkerStats: async () => {
    const res = await axiosInstance.get<{
      worker: BusinessMember;
      todaySales: number;
      todayTransactions: number;
      thisMonthSales: number;
      recentSales: Sale[];
    }>('/worker/stats');
    return res.data;
  },

  createWorker: async (payload: {
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    employeeId?: string;
    password?: string;
    permissions?: any;
  }) => {
    const res = await axiosInstance.post<{
      success: boolean;
      worker: BusinessMember;
      invitationUrl?: string;
      tempPassword?: string;
    }>('/workers', payload);
    return res.data;
  },

  updateWorker: async (id: string, payload: Partial<BusinessMember>) => {
    const res = await axiosInstance.put<{ success: boolean; worker: BusinessMember }>(
      `/workers/${id}`,
      payload
    );
    return res.data;
  },

  resetPassword: async (id: string, newPassword?: string) => {
    const res = await axiosInstance.post<{ success: boolean; message: string; newPassword?: string }>(
      `/workers/${id}/reset-password`,
      { newPassword }
    );
    return res.data;
  },

  getActivity: async (id: string) => {
    const res = await axiosInstance.get<{ activities: any[]; sales: Sale[] }>(
      `/workers/${id}/activity`
    );
    return res.data;
  },
};

/* =========================================================================
   6. CUSTOMERS SERVICE
   ========================================================================= */
export const customersApi = {
  getCustomers: async (search?: string) => {
    const res = await axiosInstance.get<Customer[]>('/customers', {
      params: search ? { search } : undefined,
    });
    return res.data;
  },

  createCustomer: async (payload: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
  }) => {
    const res = await axiosInstance.post<Customer>('/customers', payload);
    return res.data;
  },

  getNotifications: async () => {
    const res = await axiosInstance.get<any[]>('/customer-notifications');
    return res.data;
  },
};

/* =========================================================================
   7. RECEIPTS & VERIFICATION SERVICE
   ========================================================================= */
export const receiptsApi = {
  getReceipts: async (params?: { search?: string; limit?: number }) => {
    const res = await axiosInstance.get<Receipt[]>('/receipts', { params });
    return res.data;
  },

  getReceiptById: async (id: string) => {
    const res = await axiosInstance.get<{ receipt: Receipt; sale: Sale; business: Business }>(
      `/receipts/${id}`
    );
    return res.data;
  },

  verifyReceipt: async (token: string) => {
    const res = await axiosInstance.get<{
      valid: boolean;
      receipt: Receipt;
      sale: Sale;
      business: Business;
    }>(`/receipts/verify/${token}`);
    return res.data;
  },
};

/* =========================================================================
   8. REPORTS & ANALYTICS SERVICE
   ========================================================================= */
export const reportsApi = {
  getSummary: async (params?: { period?: string; start_date?: string; end_date?: string }) => {
    const res = await axiosInstance.get<{
      totalRevenue: number;
      totalTransactions: number;
      totalExpenses: number;
      netProfit: number;
      avgTicketSize: number;
      salesByPaymentMethod: Record<string, number>;
      topProducts: Array<{ id: string; name: string; quantity: number; revenue: number }>;
      dailyRevenue: Array<{ date: string; revenue: number; transactions: number }>;
    }>('/reports/summary', { params });
    return res.data;
  },

  exportReport: async (params?: { format?: string; type?: string; period?: string }) => {
    const res = await axiosInstance.get<{
      format: string;
      data: any;
      csvContent?: string;
      downloadUrl?: string;
    }>('/reports/export', { params });
    return res.data;
  },
};

/* =========================================================================
   9. EXPENSES SERVICE
   ========================================================================= */
export const expensesApi = {
  getExpenses: async (params?: { category?: string; start_date?: string; end_date?: string }) => {
    const res = await axiosInstance.get<Expense[]>('/expenses', { params });
    return res.data;
  },

  createExpense: async (payload: {
    category: string;
    amount: number;
    description: string;
    payment_method: string;
    receipt_url?: string;
    notes?: string;
  }) => {
    const res = await axiosInstance.post<Expense>('/expenses', payload);
    return res.data;
  },
};

/* =========================================================================
   10. SUBSCRIPTIONS SERVICE (WITH IN-MEMORY CACHE)
   ========================================================================= */
export const subscriptionsApi = {
  // Cached GET for subscription plans (120s TTL)
  getPlans: async () => {
    return cachedGet<SubscriptionPlan[]>('/subscriptions/plans', undefined, 120000);
  },

  getStatus: async () => {
    const res = await axiosInstance.get<{
      subscription: Subscription;
      business: Business;
      plan: SubscriptionPlan;
    }>('/subscriptions/status');
    return res.data;
  },

  activateSubscription: async (payload: {
    plan_id: string;
    billing_cycle: 'monthly' | 'annual';
    payment_method: string;
    phone?: string;
  }) => {
    const res = await axiosInstance.post<{
      success: boolean;
      subscription: Subscription;
      message: string;
      paymentId?: string;
    }>('/subscriptions/activate', payload);
    return res.data;
  },
};

/* =========================================================================
   11. PAYMENT SETTINGS & BANK TRANSFERS SERVICE (WITH IN-MEMORY CACHE)
   ========================================================================= */
export const paymentSettingsApi = {
  // Cached GET for payment settings (30s TTL)
  getSettings: async () => {
    return cachedGet<{
      business: Business;
      mpesa: any;
      paymentConfig: BusinessPaymentConfig;
    }>('/settings/payments', undefined, 30000);
  },

  updateSettings: async (payload: any) => {
    const res = await axiosInstance.put<{
      success: boolean;
      message: string;
      paymentConfig: BusinessPaymentConfig;
    }>('/settings/payments', payload);
    invalidateCache('/settings/payments');
    return res.data;
  },

  testConnection: async (provider: string) => {
    const res = await axiosInstance.post<{
      success: boolean;
      message: string;
      details?: any;
    }>('/payments/test-connection', { provider });
    return res.data;
  },

  getBankTransfers: async () => {
    const res = await axiosInstance.get<BankTransferRecord[]>('/payments/bank-transfers');
    return res.data;
  },

  verifyBankTransfer: async (id: string, notes?: string) => {
    const res = await axiosInstance.post<{ success: boolean; transfer: BankTransferRecord }>(
      `/payments/bank-transfers/${id}/verify`,
      { notes }
    );
    return res.data;
  },

  rejectBankTransfer: async (id: string, reason?: string) => {
    const res = await axiosInstance.post<{ success: boolean; transfer: BankTransferRecord }>(
      `/payments/bank-transfers/${id}/reject`,
      { reason }
    );
    return res.data;
  },
};

/* =========================================================================
   12. SETTINGS SERVICE (WITH IN-MEMORY CACHE)
   ========================================================================= */
export const settingsApi = {
  // Cached GET for business settings (30s TTL)
  getBusinessSettings: async () => {
    return cachedGet<Business>('/settings/business', undefined, 30000);
  },

  updateBusinessSettings: async (payload: Partial<Business>) => {
    const res = await axiosInstance.put<{ success: boolean; business: Business }>(
      '/settings/business',
      payload
    );
    invalidateCache('/settings/business');
    return res.data;
  },

  // Cached GET for M-Pesa settings (30s TTL)
  getMpesaSettings: async () => {
    return cachedGet<any>('/settings/mpesa', undefined, 30000);
  },

  updateMpesaSettings: async (payload: any) => {
    const res = await axiosInstance.put<{ success: boolean; config: any }>(
      '/settings/mpesa',
      payload
    );
    invalidateCache('/settings/mpesa');
    return res.data;
  },

  // Cached GET for SMS settings (30s TTL)
  getSmsSettings: async () => {
    return cachedGet<any>('/settings/sms', undefined, 30000);
  },

  updateSmsSettings: async (payload: any) => {
    const res = await axiosInstance.put<{ success: boolean; config: any }>(
      '/settings/sms',
      payload
    );
    invalidateCache('/settings/sms');
    return res.data;
  },

  testSms: async (phone: string, message: string) => {
    const res = await axiosInstance.post<{ success: boolean; message: string }>(
      '/settings/sms/test',
      { phone, message }
    );
    return res.data;
  },

  // Cached GET for security settings (30s TTL)
  getSecuritySettings: async () => {
    return cachedGet<any>('/settings/security', undefined, 30000);
  },

  updateSecuritySettings: async (payload: any) => {
    const res = await axiosInstance.put<{ success: boolean; message: string }>(
      '/settings/security',
      payload
    );
    invalidateCache('/settings/security');
    return res.data;
  },

  // Cached GET for notification settings (30s TTL)
  getNotificationSettings: async () => {
    return cachedGet<any>('/settings/notifications', undefined, 30000);
  },

  updateNotificationSettings: async (payload: any) => {
    const res = await axiosInstance.put<{ success: boolean; message: string }>(
      '/settings/notifications',
      payload
    );
    invalidateCache('/settings/notifications');
    return res.data;
  },
};

/* =========================================================================
   13. SUPPORT, CONTACT & NOTIFICATIONS SERVICE
   ========================================================================= */
export const supportApi = {
  getTickets: async () => {
    const res = await axiosInstance.get<SupportTicket[]>('/support');
    return res.data;
  },

  createTicket: async (payload: { subject: string; message: string; category?: string; priority?: string }) => {
    const res = await axiosInstance.post<SupportTicket>('/support', payload);
    return res.data;
  },

  submitContactMessage: async (payload: {
    fullName: string;
    email: string;
    phone?: string;
    companyName?: string;
    subject: string;
    message: string;
  }) => {
    const res = await axiosInstance.post<{ success: boolean; message: string }>(
      '/public/contact',
      payload
    );
    return res.data;
  },

  getNotifications: async () => {
    const res = await axiosInstance.get<any[]>('/notifications');
    return res.data;
  },

  markNotificationRead: async (id: string) => {
    const res = await axiosInstance.post<{ success: boolean }>(`/notifications/${id}/read`);
    return res.data;
  },

  getAuditLogs: async () => {
    const res = await axiosInstance.get<any[]>('/audit-logs');
    return res.data;
  },

  searchGlobal: async (query: string) => {
    const res = await axiosInstance.get<{
      products: Product[];
      customers: Customer[];
      sales: Sale[];
    }>('/search', { params: { q: query } });
    return res.data;
  },
};

/* =========================================================================
   14. PLATFORM SUPER ADMIN SERVICE
   ========================================================================= */
export const adminApi = {
  getMetrics: async () => {
    const res = await axiosInstance.get<any>('/admin/metrics');
    return res.data;
  },

  getBusinesses: async () => {
    const res = await axiosInstance.get<any[]>('/admin/businesses');
    return res.data;
  },

  updateBusinessStatus: async (id: string, status: string) => {
    const res = await axiosInstance.put<{ success: boolean; business: Business }>(
      `/admin/businesses/${id}/status`,
      { status }
    );
    return res.data;
  },

  getUsers: async () => {
    const res = await axiosInstance.get<UserProfile[]>('/admin/users');
    return res.data;
  },

  getPlans: async () => {
    const res = await axiosInstance.get<SubscriptionPlan[]>('/admin/plans');
    return res.data;
  },

  updatePlan: async (id: string, payload: Partial<SubscriptionPlan>) => {
    const res = await axiosInstance.put<{ success: boolean; plan: SubscriptionPlan }>(
      `/admin/plans/${id}`,
      payload
    );
    invalidateCache('/subscriptions/plans');
    return res.data;
  },

  getContactMessages: async () => {
    const res = await axiosInstance.get<ContactMessage[]>('/admin/contact-messages');
    return res.data;
  },

  updateContactMessageStatus: async (id: string, status: string) => {
    const res = await axiosInstance.put<{ success: boolean; message: ContactMessage }>(
      `/admin/contact-messages/${id}/status`,
      { status }
    );
    return res.data;
  },

  deleteContactMessage: async (id: string) => {
    const res = await axiosInstance.delete<{ success: boolean }>(
      `/admin/contact-messages/${id}`
    );
    return res.data;
  },
};

// Unified API bundle export
export const api = {
  auth: authApi,
  sales: salesApi,
  products: productsApi,
  inventory: inventoryApi,
  workers: workersApi,
  customers: customersApi,
  receipts: receiptsApi,
  reports: reportsApi,
  expenses: expensesApi,
  subscriptions: subscriptionsApi,
  paymentSettings: paymentSettingsApi,
  settings: settingsApi,
  support: supportApi,
  admin: adminApi,
  ai: aiApi,
  client: axiosInstance,
  cache: {
    get: cachedGet,
    invalidate: invalidateCache,
  },
};

export default api;
