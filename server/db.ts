import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  UserProfile,
  Business,
  BusinessMember,
  SubscriptionPlan,
  Subscription,
  Category,
  Product,
  InventoryMovement,
  Customer,
  Sale,
  SaleItem,
  Payment,
  MpesaConfig,
  Receipt,
  QRPaymentSession,
  Expense,
  Notification,
  AuditLog,
  SupportTicket,
  PaymentStatus,
  SaleStatus,
  UserRole,
  PaymentProvider,
  EmailVerificationToken,
  PasswordResetToken,
  WorkerInvitation,
  LoginActivity,
  Brand,
  SmsConfig,
  CustomerNotification,
  CustomerNotificationStatus,
  ContactMessage,
  ContactMessageStatus,
  BusinessPaymentConfig,
  BankTransferRecord
} from '../src/types';
import { SmsService, normalizePhoneNumber, maskPhoneNumber } from './sms';

interface DatabaseSchema {
  profiles: UserProfile[];
  businesses: Business[];
  business_members: BusinessMember[];
  subscription_plans: SubscriptionPlan[];
  subscriptions: Subscription[];
  categories: Category[];
  brands: Brand[];
  products: Product[];
  inventory_movements: InventoryMovement[];
  customers: Customer[];
  sales: Sale[];
  sale_items: SaleItem[];
  payments: Payment[];
  payment_configs: BusinessPaymentConfig[];
  bank_transfers: BankTransferRecord[];
  contact_messages: ContactMessage[];
  mpesa_configs: MpesaConfig[];
  sms_configs: SmsConfig[];
  customer_notifications: CustomerNotification[];
  mpesa_callbacks: Array<{
    id: string;
    payment_id: string;
    raw_reference: string;
    result_code: number;
    result_description: string;
    payload_hash: string;
    processed: boolean;
    received_at: string;
  }>;
  receipts: Receipt[];
  qr_payment_sessions: QRPaymentSession[];
  expenses: Expense[];
  notifications: Notification[];
  audit_logs: AuditLog[];
  support_tickets: SupportTicket[];
  email_verifications: EmailVerificationToken[];
  password_resets: PasswordResetToken[];
  worker_invitations: WorkerInvitation[];
  login_activities: LoginActivity[];
  receipt_counters: Record<string, number>; // business_id -> sequence count
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'brisk_billing_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function generateId(prefix: string = ''): string {
  const rand = crypto.randomBytes(6).toString('hex');
  return prefix ? `${prefix}_${rand}` : rand;
}

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function hashString(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Initial Seed Data setup with ABC SHOP and testing worker accounts
function getInitialSeedData(): DatabaseSchema {
  const now = new Date().toISOString();
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Platform Super Admin
  const superAdminId = 'user_admin_001';
  const superAdmin: UserProfile = {
    id: superAdminId,
    email: 'admin@briskbilling.co.ke',
    phone: '254700000000',
    full_name: 'Platform Super Admin',
    password: 'Admin123!',
    password_hash: hashString('Admin123!'),
    is_super_admin: true,
    email_verified: true,
    created_at: now,
    updated_at: now,
  };

  // 2. Acceptance Test Business: ABC SHOP
  const bizId = 'biz_abc_shop_001';
  const ownerId = 'user_owner_001';
  const workerCashierId = 'user_worker_001';
  const workerManagerId = 'user_manager_001';
  const workerSalesId = 'user_sales_001';

  const ownerProfile: UserProfile = {
    id: ownerId,
    email: 'owner@abcshop.co.ke',
    phone: '0700112233',
    full_name: 'David Mwangi',
    password: 'Owner123!',
    password_hash: hashString('Owner123!'),
    email_verified: true,
    created_at: now,
    updated_at: now,
  };

  const cashierProfile: UserProfile = {
    id: workerCashierId,
    email: 'john.kamau@abcshop.co.ke',
    phone: '0712345678',
    full_name: 'John Kamau',
    password: '123456',
    password_hash: hashString('123456'),
    email_verified: true,
    created_at: now,
    updated_at: now,
  };

  const managerProfile: UserProfile = {
    id: workerManagerId,
    email: 'mary.wanjiku@abcshop.co.ke',
    phone: '0722334455',
    full_name: 'Mary Wanjiku',
    password: '123456',
    password_hash: hashString('123456'),
    email_verified: true,
    created_at: now,
    updated_at: now,
  };

  const salesProfile: UserProfile = {
    id: workerSalesId,
    email: 'peter.otieno@abcshop.co.ke',
    phone: '0733445566',
    full_name: 'Peter Otieno',
    password: '123456',
    password_hash: hashString('123456'),
    email_verified: true,
    created_at: now,
    updated_at: now,
  };

  const abcShop: Business = {
    id: bizId,
    owner_id: ownerId,
    name: 'ABC SHOP',
    slug: 'abc-shop',
    category: 'Retail & Supermarket',
    phone: '0700112233',
    email: 'contact@abcshop.co.ke',
    location: 'Nairobi CBD, Kenya',
    address: 'Kimathi Street, Nairobi',
    currency: 'KES',
    status: 'active',
    receipt_footer: 'Thank you for shopping with ABC SHOP! Powered by BRISK SMART BILLING.',
    tax_percentage: 16,
    vat_enabled: true,
    prices_include_vat: true,
    created_at: now,
    updated_at: now,
  };

  const members: BusinessMember[] = [
    {
      id: 'mem_owner_001',
      business_id: bizId,
      user_id: ownerId,
      role: 'owner',
      status: 'active',
      employee_id: 'OWN-001',
      permissions: {
        can_create_sales: true,
        can_apply_discount: true,
        max_discount_percent: 100,
        can_manage_products: true,
        can_manage_inventory: true,
        can_manage_workers: true,
        can_view_reports: true,
        can_configure_mpesa: true,
        can_manage_subscription: true,
        can_issue_refunds: true,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mem_cashier_001',
      business_id: bizId,
      user_id: workerCashierId,
      role: 'cashier',
      status: 'active',
      employee_id: 'EMP-001',
      notes: 'Lead morning shift cashier',
      permissions: {
        can_create_sales: true,
        can_apply_discount: true,
        max_discount_percent: 5,
        can_manage_products: false,
        can_manage_inventory: false,
        can_manage_workers: false,
        can_view_reports: false,
        can_configure_mpesa: false,
        can_manage_subscription: false,
        can_issue_refunds: false,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mem_manager_001',
      business_id: bizId,
      user_id: workerManagerId,
      role: 'manager',
      status: 'active',
      employee_id: 'EMP-002',
      notes: 'Store operations & stock supervisor',
      permissions: {
        can_create_sales: true,
        can_apply_discount: true,
        max_discount_percent: 20,
        can_manage_products: true,
        can_manage_inventory: true,
        can_manage_workers: true,
        can_view_reports: true,
        can_configure_mpesa: false,
        can_manage_subscription: false,
        can_issue_refunds: true,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mem_sales_001',
      business_id: bizId,
      user_id: workerSalesId,
      role: 'sales_worker',
      status: 'inactive',
      employee_id: 'EMP-003',
      notes: 'Field & counter sales representative',
      permissions: {
        can_create_sales: true,
        can_apply_discount: false,
        max_discount_percent: 0,
        can_manage_products: false,
        can_manage_inventory: false,
        can_manage_workers: false,
        can_view_reports: false,
        can_configure_mpesa: false,
        can_manage_subscription: false,
        can_issue_refunds: false,
      },
      created_at: now,
      updated_at: now,
    },
  ];

  // 3. Subscription Plans (Standard Package allows 10 Workers)
  const plans: SubscriptionPlan[] = [
    {
      id: 'plan_starter',
      name: 'Starter',
      price: 450,
      duration_days: 30,
      worker_limit: 1,
      product_limit: 100,
      transaction_limit: 500,
      features: ['M-Pesa STK Push', 'Digital Receipts', 'Basic Inventory', '1 Worker Account'],
      active: true,
      created_at: now,
    },
    {
      id: 'plan_basic',
      name: 'Basic',
      price: 750,
      duration_days: 30,
      worker_limit: 3,
      product_limit: 500,
      transaction_limit: 2000,
      features: ['M-Pesa & QR Payments', 'Digital & PDF Receipts', 'Inventory & Low Stock Alerts', 'Up to 3 Workers', 'Customer Profiles'],
      active: true,
      created_at: now,
    },
    {
      id: 'plan_standard',
      name: 'Standard',
      price: 1500,
      duration_days: 30,
      worker_limit: 10,
      product_limit: 2500,
      transaction_limit: 10000,
      features: ['Everything in Basic', 'Up to 10 Workers', 'Advanced Reports & CSV Export', 'Role Permissions & Audit Logs', 'Expense Tracking'],
      active: true,
      created_at: now,
    },
    {
      id: 'plan_business',
      name: 'Business',
      price: 2500,
      duration_days: 30,
      worker_limit: 25,
      product_limit: 10000,
      transaction_limit: 50000,
      features: ['Everything in Standard', 'Up to 25 Workers', 'High-volume Speed POS', 'Priority Support', 'Custom Branding on Receipts'],
      active: true,
      created_at: now,
    },
    {
      id: 'plan_premium',
      name: 'Premium',
      price: 3500,
      duration_days: 30,
      worker_limit: 999,
      product_limit: 99999,
      transaction_limit: 999999,
      features: ['Unlimited Workers', 'Unlimited Products', 'Multi-Branch Readiness', 'Dedicated Account Manager', 'Custom API Integrations'],
      active: true,
      created_at: now,
    },
  ];

  const subscription: Subscription = {
    id: 'sub_abc_shop_001',
    business_id: bizId,
    plan_id: 'plan_standard',
    plan_name: 'Standard (Active Plan - 10 Workers Allowed)',
    status: 'active',
    trial_started_at: now,
    trial_ends_at: trialEnd,
    started_at: now,
    ends_at: trialEnd,
    days_remaining: 14,
    created_at: now,
    updated_at: now,
  };

  // 4. Categories & Brands
  const catDairy: Category = {
    id: 'cat_dairy_001',
    business_id: bizId,
    name: 'Dairy & Beverages',
    created_at: now,
  };

  const catBakery: Category = {
    id: 'cat_bakery_001',
    business_id: bizId,
    name: 'Bakery & Bread',
    created_at: now,
  };

  const brandBrookside: Brand = {
    id: 'brd_brookside_001',
    business_id: bizId,
    name: 'Brookside',
    created_at: now,
  };

  const brandKcc: Brand = {
    id: 'brd_kcc_001',
    business_id: bizId,
    name: 'KCC',
    created_at: now,
  };

  const brandSuperLoaf: Brand = {
    id: 'brd_superloaf_001',
    business_id: bizId,
    name: 'Super Loaf',
    created_at: now,
  };

  // 5. Products requested for Acceptance Test
  const products: Product[] = [
    {
      id: 'prod_milk_500ml',
      business_id: bizId,
      category_id: catDairy.id,
      category_name: catDairy.name,
      brand_id: brandBrookside.id,
      brand_name: brandBrookside.name,
      variant: 'Fresh Milk',
      size: '500',
      unit: 'ml',
      unit_size: '500 ml',
      name: 'Brookside Fresh Milk 500ml',
      sku: 'BRK-MLK-500',
      barcode: '616110000101',
      description: 'Pasteurized whole fresh milk pouch 500ml',
      selling_price: 70,
      buying_price: 55,
      vat_type: 'default',
      tax_rate: 16,
      stock_quantity: 150,
      low_stock_threshold: 15,
      fractional_quantity_allowed: false,
      active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'prod_milk_1l',
      business_id: bizId,
      category_id: catDairy.id,
      category_name: catDairy.name,
      brand_id: brandBrookside.id,
      brand_name: brandBrookside.name,
      variant: 'Fresh Milk',
      size: '1',
      unit: 'L',
      unit_size: '1 L',
      name: 'Brookside Fresh Milk 1L',
      sku: 'BRK-MLK-1000',
      barcode: '616110000102',
      description: 'Pasteurized whole fresh milk tetra carton 1L',
      selling_price: 140,
      buying_price: 110,
      vat_type: 'default',
      tax_rate: 16,
      stock_quantity: 100,
      low_stock_threshold: 10,
      fractional_quantity_allowed: false,
      active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'prod_kcc_500ml',
      business_id: bizId,
      category_id: catDairy.id,
      category_name: catDairy.name,
      brand_id: brandKcc.id,
      brand_name: brandKcc.name,
      variant: 'Fresh Milk',
      size: '500',
      unit: 'ml',
      unit_size: '500 ml',
      name: 'KCC Fresh Milk 500ml',
      sku: 'KCC-MLK-500',
      barcode: '616110000103',
      description: 'KCC Gold Crown Fresh Milk 500ml',
      selling_price: 65,
      buying_price: 52,
      vat_type: 'default',
      tax_rate: 16,
      stock_quantity: 120,
      low_stock_threshold: 12,
      fractional_quantity_allowed: false,
      active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'prod_bread_400g',
      business_id: bizId,
      category_id: catBakery.id,
      category_name: catBakery.name,
      brand_id: brandSuperLoaf.id,
      brand_name: brandSuperLoaf.name,
      variant: 'White Bread',
      size: '400',
      unit: 'g',
      unit_size: '400 g',
      name: 'Bread',
      sku: 'SL-BRD-400',
      barcode: '616110000201',
      description: 'Super Loaf Sliced White Bread 400g',
      selling_price: 80,
      buying_price: 64,
      vat_type: 'default',
      tax_rate: 16,
      stock_quantity: 90,
      low_stock_threshold: 10,
      fractional_quantity_allowed: false,
      active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  // 6. M-Pesa Configuration for ABC SHOP
  const mpesaConfig: MpesaConfig = {
    id: 'mpesa_cfg_abc_001',
    business_id: bizId,
    environment: 'test',
    shortcode: '174379',
    consumer_key_masked: '••••••••••••1743',
    passkey_masked: '••••••••••••bfb2',
    active: true,
    has_credentials: true,
    updated_at: now,
  };

  const smsConfig: SmsConfig = {
    id: 'sms_cfg_abc_001',
    business_id: bizId,
    provider: 'simulator',
    sender_id: 'ABCSHOP',
    status: 'simulated',
    enabled: true,
    notify_payment_success: true,
    notify_receipt_ready: true,
    notify_payment_failed: false,
    notify_refund: true,
    created_at: now,
    updated_at: now,
  };

  const paymentConfig: BusinessPaymentConfig = {
    id: 'paycfg_abc_001',
    business_id: bizId,
    card: {
      enabled: true,
      provider: 'pesapal',
      mode: 'test',
      public_key: 'pk_test_brisk_live_demo',
      supported_brands: ['Visa', 'Mastercard'],
    },
    bank_transfer: {
      enabled: true,
      bank_name: 'Kenya Commercial Bank (KCB)',
      account_name: 'ABC SHOP LIMITED',
      account_number: '1234567890',
      branch: 'Nairobi CBD Branch',
      swift_bic: 'KCBLKENX',
      instructions: 'Use your Receipt or Sale Reference (e.g. BRK-000125) as the transfer payment note. Payment will be verified by store manager.',
    },
    updated_at: now,
  };

  const sampleContactMessage: ContactMessage = {
    id: 'cmsg_001',
    name: 'Samuel Mwangi',
    business_name: 'Mwangi Fresh Grocers',
    email: 'samuel.mwangi@example.com',
    phone: '+254722112233',
    subject: 'Multi-Branch POS & Inventory Setup',
    message: 'Hello, we are expanding to three new branches in Nakuru and Eldoret. Can BRISK SMART BILLING handle centralized inventory and M-Pesa STK across all locations?',
    status: 'NEW',
    created_at: now,
  };

  return {
    profiles: [superAdmin, ownerProfile, cashierProfile, managerProfile, salesProfile],
    businesses: [abcShop],
    business_members: members,
    subscription_plans: plans,
    subscriptions: [subscription],
    categories: [catDairy, catBakery],
    brands: [brandBrookside, brandKcc, brandSuperLoaf],
    products,
    inventory_movements: [],
    customers: [],
    sales: [],
    sale_items: [],
    payments: [],
    payment_configs: [paymentConfig],
    bank_transfers: [],
    contact_messages: [sampleContactMessage],
    mpesa_configs: [mpesaConfig],
    sms_configs: [smsConfig],
    customer_notifications: [],
    mpesa_callbacks: [],
    receipts: [],
    qr_payment_sessions: [],
    expenses: [],
    notifications: [],
    audit_logs: [],
    support_tickets: [],
    email_verifications: [],
    password_resets: [],
    worker_invitations: [],
    login_activities: [],
    receipt_counters: { [bizId]: 124 },
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
    this.ensureAcceptanceTestData();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;

        // Ensure new collections exist
        if (!parsed.brands) parsed.brands = [];
        if (!parsed.sms_configs) parsed.sms_configs = [];
        if (!parsed.customer_notifications) parsed.customer_notifications = [];
        if (!parsed.email_verifications) parsed.email_verifications = [];
        if (!parsed.password_resets) parsed.password_resets = [];
        if (!parsed.worker_invitations) parsed.worker_invitations = [];
        if (!parsed.login_activities) parsed.login_activities = [];
        if (!parsed.contact_messages) parsed.contact_messages = [];
        if (!parsed.payment_configs) parsed.payment_configs = [];
        if (!parsed.bank_transfers) parsed.bank_transfers = [];

        return parsed;
      }
    } catch (err) {
      console.error('Failed to load database file, resetting to clean initial seed:', err);
    }
    const initial = getInitialSeedData();
    this.saveData(initial);
    return initial;
  }

  public ensureAcceptanceTestData(): void {
    const seed = getInitialSeedData();

    // Ensure super admin exists
    const adminIdx = this.data.profiles.findIndex(p => p.is_super_admin || p.id === 'user_admin_001');
    if (adminIdx === -1) {
      this.data.profiles.unshift(seed.profiles[0]);
    }

    // Ensure ABC SHOP exists
    const hasAbc = this.data.businesses.some(b => b.id === 'biz_abc_shop_001');
    if (!hasAbc) {
      this.data.businesses.push(seed.businesses[0]);
      for (const p of seed.profiles.slice(1)) {
        if (!this.data.profiles.some(x => x.id === p.id || x.email === p.email)) {
          this.data.profiles.push(p);
        }
      }
      for (const m of seed.business_members) {
        if (!this.data.business_members.some(x => x.id === m.id)) {
          this.data.business_members.push(m);
        }
      }
      for (const sub of seed.subscriptions) {
        if (!this.data.subscriptions.some(x => x.id === sub.id)) {
          this.data.subscriptions.push(sub);
        }
      }
      for (const cat of seed.categories) {
        if (!this.data.categories.some(x => x.id === cat.id)) {
          this.data.categories.push(cat);
        }
      }
      for (const brd of seed.brands) {
        if (!this.data.brands.some(x => x.id === brd.id)) {
          this.data.brands.push(brd);
        }
      }
      for (const prod of seed.products) {
        if (!this.data.products.some(x => x.id === prod.id)) {
          this.data.products.push(prod);
        }
      }
      for (const cfg of seed.mpesa_configs) {
        if (!this.data.mpesa_configs.some(x => x.id === cfg.id)) {
          this.data.mpesa_configs.push(cfg);
        }
      }
      for (const scfg of seed.sms_configs) {
        if (!this.data.sms_configs.some(x => x.id === scfg.id)) {
          this.data.sms_configs.push(scfg);
        }
      }
      if (!this.data.receipt_counters['biz_abc_shop_001']) {
        this.data.receipt_counters['biz_abc_shop_001'] = 124;
      }
      this.persist();
    }
  }

  private saveData(data: DatabaseSchema): void {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public persist(): void {
    this.saveData(this.data);
  }

  public resetToAcceptanceTest(): void {
    this.data = getInitialSeedData();
    this.persist();
  }

  // --- Profiles & Users ---
  public getProfileById(id: string): UserProfile | undefined {
    return this.data.profiles.find(p => p.id === id);
  }

  public getProfileByEmail(email: string): UserProfile | undefined {
    if (!email) return undefined;
    return this.data.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
  }

  public getProfileByPhone(phone: string): UserProfile | undefined {
    const clean = (phone || '').replace(/[^0-9]/g, '');
    if (!clean) return undefined;
    return this.data.profiles.find(p => {
      const pClean = (p.phone || '').replace(/[^0-9]/g, '');
      return pClean === clean || pClean.endsWith(clean) || clean.endsWith(pClean);
    });
  }

  public getProfiles(): UserProfile[] {
    return this.data.profiles;
  }

  public createProfile(profile: UserProfile): UserProfile {
    this.data.profiles.push(profile);
    this.persist();
    return profile;
  }

  public updateProfile(id: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const profile = this.getProfileById(id);
    if (!profile) return undefined;
    Object.assign(profile, updates, { updated_at: new Date().toISOString() });
    this.persist();
    return profile;
  }

  // --- Email Verification ---
  public createEmailVerification(email: string): EmailVerificationToken {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const token = generateToken(24);

    const record: EmailVerificationToken = {
      id: generateId('evt'),
      email: email.toLowerCase(),
      token,
      verified: false,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      last_sent_at: now.toISOString(),
    };

    this.data.email_verifications = this.data.email_verifications.filter(e => e.email !== email.toLowerCase());
    this.data.email_verifications.push(record);
    this.persist();
    return record;
  }

  public getEmailVerification(token: string): EmailVerificationToken | undefined {
    return this.data.email_verifications.find(e => e.token === token && !e.verified);
  }

  public verifyEmail(token: string): { success: boolean; error?: string; user?: UserProfile } {
    const record = this.getEmailVerification(token);
    if (!record) {
      return { success: false, error: 'Invalid or expired verification token.' };
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return { success: false, error: 'Verification token has expired. Please request a new one.' };
    }

    record.verified = true;
    const user = this.getProfileByEmail(record.email);
    if (user) {
      user.email_verified = true;
      user.updated_at = new Date().toISOString();
    }
    this.persist();
    return { success: true, user };
  }

  public canResendVerification(email: string): { allowed: boolean; remainingSeconds: number } {
    const record = this.data.email_verifications.find(e => e.email === email.toLowerCase());
    if (!record) return { allowed: true, remainingSeconds: 0 };
    const lastSent = new Date(record.last_sent_at).getTime();
    const elapsedSec = Math.floor((Date.now() - lastSent) / 1000);
    const cooldown = 30; // 30 seconds cooldown
    if (elapsedSec < cooldown) {
      return { allowed: false, remainingSeconds: cooldown - elapsedSec };
    }
    return { allowed: true, remainingSeconds: 0 };
  }

  // --- Password Resets ---
  public createPasswordReset(email: string): PasswordResetToken | null {
    const user = this.getProfileByEmail(email);
    if (!user) return null;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    const token = generateToken(24);

    const record: PasswordResetToken = {
      id: generateId('prt'),
      email: email.toLowerCase(),
      token,
      used: false,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    this.data.password_resets = this.data.password_resets.filter(p => p.email !== email.toLowerCase());
    this.data.password_resets.push(record);
    this.persist();
    return record;
  }

  public getPasswordReset(token: string): PasswordResetToken | undefined {
    return this.data.password_resets.find(p => p.token === token && !p.used);
  }

  public resetPassword(token: string, newPassword: string): { success: boolean; error?: string } {
    const record = this.getPasswordReset(token);
    if (!record) {
      return { success: false, error: 'Invalid or already used password reset link.' };
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return { success: false, error: 'Password reset link has expired. Please request a new one.' };
    }

    const user = this.getProfileByEmail(record.email);
    if (!user) {
      return { success: false, error: 'Associated user account was not found.' };
    }

    user.password = newPassword;
    user.password_hash = hashString(newPassword);
    user.updated_at = new Date().toISOString();
    record.used = true;
    this.persist();
    return { success: true };
  }

  // --- Worker Invitations ---
  public createWorkerInvitation(data: {
    business_id: string;
    business_name: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    permissions: BusinessMember['permissions'];
  }): WorkerInvitation {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const token = generateToken(24);

    const invitation: WorkerInvitation = {
      id: generateId('inv'),
      business_id: data.business_id,
      business_name: data.business_name,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      role: data.role,
      permissions: data.permissions,
      token,
      status: 'pending',
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    this.data.worker_invitations = this.data.worker_invitations.filter(
      i => !(i.email === invitation.email && i.business_id === invitation.business_id && i.status === 'pending')
    );
    this.data.worker_invitations.push(invitation);
    this.persist();
    return invitation;
  }

  public getWorkerInvitation(token: string): WorkerInvitation | undefined {
    return this.data.worker_invitations.find(i => i.token === token);
  }

  public getWorkerInvitationsByBusiness(businessId: string): WorkerInvitation[] {
    return this.data.worker_invitations.filter(i => i.business_id === businessId);
  }

  public acceptWorkerInvitation(token: string, password: string, fullName?: string, phone?: string): {
    success: boolean;
    error?: string;
    user?: UserProfile;
    member?: BusinessMember;
  } {
    const inv = this.getWorkerInvitation(token);
    if (!inv || inv.status !== 'pending') {
      return { success: false, error: 'Invalid or already accepted invitation.' };
    }
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      inv.status = 'expired';
      this.persist();
      return { success: false, error: 'Invitation has expired. Please ask the business owner to re-invite you.' };
    }

    const now = new Date().toISOString();
    let user = this.getProfileByEmail(inv.email);
    if (!user) {
      user = {
        id: generateId('user'),
        email: inv.email,
        phone: phone || inv.phone || '',
        full_name: fullName || inv.name,
        password,
        password_hash: hashString(password),
        email_verified: true,
        created_at: now,
        updated_at: now,
      };
      this.data.profiles.push(user);
    } else {
      user.password = password;
      user.password_hash = hashString(password);
      user.email_verified = true;
      if (fullName) user.full_name = fullName;
      if (phone) user.phone = phone;
      user.updated_at = now;
    }

    // Add membership
    let member = this.getMember(inv.business_id, user.id);
    if (!member) {
      member = {
        id: generateId('mem'),
        business_id: inv.business_id,
        user_id: user.id,
        role: inv.role,
        status: 'active',
        permissions: inv.permissions,
        created_at: now,
        updated_at: now,
      };
      this.data.business_members.push(member);
    } else {
      member.role = inv.role;
      member.permissions = inv.permissions;
      member.status = 'active';
      member.updated_at = now;
    }

    inv.status = 'accepted';
    this.persist();
    return { success: true, user, member };
  }

  // --- Login Activity Tracking ---
  public recordLoginActivity(activity: Omit<LoginActivity, 'id' | 'timestamp'>): LoginActivity {
    const record: LoginActivity = {
      id: generateId('lac'),
      ...activity,
      timestamp: new Date().toISOString(),
    };
    this.data.login_activities.unshift(record);
    if (this.data.login_activities.length > 100) {
      this.data.login_activities = this.data.login_activities.slice(0, 100);
    }
    this.persist();
    return record;
  }

  public getLoginActivities(userId: string): LoginActivity[] {
    return this.data.login_activities.filter(a => a.user_id === userId);
  }

  // --- Businesses ---
  public getBusinessById(id: string): Business | undefined {
    return this.data.businesses.find(b => b.id === id);
  }

  public getBusinesses(): Business[] {
    return this.data.businesses;
  }

  public getBusinessesForUser(userId: string): Business[] {
    const memberBizIds = this.data.business_members
      .filter(m => m.user_id === userId && m.status === 'active')
      .map(m => m.business_id);
    return this.data.businesses.filter(b => b.owner_id === userId || memberBizIds.includes(b.id));
  }

  public createBusiness(business: Business): Business {
    this.data.businesses.push(business);
    this.data.receipt_counters[business.id] = 0;
    this.persist();
    return business;
  }

  public updateBusiness(id: string, updates: Partial<Business>): Business | null {
    const idx = this.data.businesses.findIndex(b => b.id === id);
    if (idx === -1) return null;
    this.data.businesses[idx] = {
      ...this.data.businesses[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.persist();
    return this.data.businesses[idx];
  }

  // --- Business Members / Workers ---
  public getMembers(businessId: string): BusinessMember[] {
    const members = this.data.business_members.filter(m => m.business_id === businessId);
    return members.map(m => {
      const user = this.getProfileById(m.user_id);
      return {
        ...m,
        user_details: user ? {
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          avatar_url: user.avatar_url,
        } : undefined,
      };
    });
  }

  public getMember(businessId: string, userId: string): BusinessMember | undefined {
    const member = this.data.business_members.find(m => m.business_id === businessId && m.user_id === userId);
    if (!member) return undefined;
    const user = this.getProfileById(member.user_id);
    return {
      ...member,
      user_details: user ? {
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
      } : undefined,
    };
  }

  public getMemberById(id: string): BusinessMember | undefined {
    return this.data.business_members.find(m => m.id === id);
  }

  public addMember(member: BusinessMember): BusinessMember {
    this.data.business_members.push(member);
    this.persist();
    return member;
  }

  public updateMember(id: string, updates: Partial<BusinessMember>): BusinessMember | null {
    const idx = this.data.business_members.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.data.business_members[idx] = {
      ...this.data.business_members[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.data.business_members[idx];
  }

  public deleteMember(id: string): boolean {
    const len = this.data.business_members.length;
    this.data.business_members = this.data.business_members.filter(m => m.id !== id);
    const changed = this.data.business_members.length !== len;
    if (changed) this.persist();
    return changed;
  }

  // --- Worker Limits by Subscription Package (Section 29) ---
  public getWorkerLimits(businessId: string): {
    currentCount: number;
    maxAllowed: number;
    isUnlimited: boolean;
    planName: string;
    limitReached: boolean;
  } {
    const sub = this.getSubscription(businessId);
    const plans = this.data.subscription_plans;
    const plan = plans.find(p => p.id === sub?.plan_id) || plans.find(p => p.id === 'plan_standard') || plans[0];
    
    // Count active workers (excluding owner)
    const members = this.data.business_members.filter(m => m.business_id === businessId && m.role !== 'owner');
    const currentCount = members.length;
    const maxAllowed = plan.worker_limit || 10;
    const isUnlimited = maxAllowed >= 999;
    const limitReached = !isUnlimited && currentCount >= maxAllowed;

    return {
      currentCount,
      maxAllowed,
      isUnlimited,
      planName: plan.name,
      limitReached,
    };
  }

  // --- Worker Fast Dashboard Statistics (Section 8) ---
  public getWorkerStats(businessId: string, workerId?: string): {
    todaySalesTotal: number;
    todayTransactionsCount: number;
    successfulPaymentsTotal: number;
    pendingPaymentsCount: number;
    cancelledPaymentsCount: number;
    failedPaymentsCount: number;
    recentTransactions: Sale[];
  } {
    const today = new Date().toISOString().slice(0, 10);
    const sales = this.data.sales.filter(s => {
      const matchBiz = s.business_id === businessId;
      const matchWorker = !workerId || s.worker_id === workerId;
      return matchBiz && matchWorker;
    });

    const todaySales = sales.filter(s => s.created_at.startsWith(today));
    const paidTodaySales = todaySales.filter(s => s.payment_status === 'PAID');
    const todaySalesTotal = paidTodaySales.reduce((sum, s) => sum + s.total, 0);
    const todayTransactionsCount = todaySales.length;
    const successfulPaymentsTotal = paidTodaySales.reduce((sum, s) => sum + s.total, 0);

    const pendingPaymentsCount = sales.filter(s => s.payment_status === 'PENDING' || s.payment_status === 'PROCESSING').length;
    const cancelledPaymentsCount = sales.filter(s => s.payment_status === 'CANCELLED').length;
    const failedPaymentsCount = sales.filter(s => s.payment_status === 'FAILED').length;

    const recentTransactions = sales.slice(0, 15);

    return {
      todaySalesTotal,
      todayTransactionsCount,
      successfulPaymentsTotal,
      pendingPaymentsCount,
      cancelledPaymentsCount,
      failedPaymentsCount,
      recentTransactions,
    };
  }

  // --- Subscriptions ---
  public getSubscription(businessId: string): Subscription | undefined {
    return this.data.subscriptions.find(s => s.business_id === businessId);
  }

  public getSubscriptionPlans(): SubscriptionPlan[] {
    return this.data.subscription_plans.filter(p => p.active);
  }

  public createSubscription(subscription: Subscription): Subscription {
    this.data.subscriptions = this.data.subscriptions.filter(s => s.business_id !== subscription.business_id);
    this.data.subscriptions.push(subscription);
    this.persist();
    return subscription;
  }

  public updateSubscription(businessId: string, planId: string): Subscription | null {
    const plan = this.data.subscription_plans.find(p => p.id === planId);
    if (!plan) return null;

    const now = new Date();
    const endsAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

    const existing = this.getSubscription(businessId);
    const sub: Subscription = {
      id: existing?.id || generateId('sub'),
      business_id: businessId,
      plan_id: plan.id,
      plan_name: plan.name,
      status: 'active',
      trial_started_at: existing?.trial_started_at || now.toISOString(),
      trial_ends_at: existing?.trial_ends_at || now.toISOString(),
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      days_remaining: plan.duration_days,
      created_at: existing?.created_at || now.toISOString(),
      updated_at: now.toISOString(),
    };

    return this.createSubscription(sub);
  }

  // --- Categories ---
  public getCategories(businessId: string): Category[] {
    return this.data.categories.filter(c => c.business_id === businessId);
  }

  public createCategory(businessId: string, name: string): Category {
    const existing = this.data.categories.find(c => c.business_id === businessId && c.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;
    const cat: Category = {
      id: generateId('cat'),
      business_id: businessId,
      name: name.trim(),
      created_at: new Date().toISOString(),
    };
    this.data.categories.push(cat);
    this.persist();
    return cat;
  }

  public deleteCategory(id: string, businessId: string): boolean {
    const len = this.data.categories.length;
    this.data.categories = this.data.categories.filter(c => !(c.id === id && c.business_id === businessId));
    const changed = this.data.categories.length !== len;
    if (changed) this.persist();
    return changed;
  }

  // --- Brands ---
  public getBrands(businessId: string): Brand[] {
    return (this.data.brands || []).filter(b => b.business_id === businessId);
  }

  public getBrandById(id: string, businessId: string): Brand | undefined {
    return (this.data.brands || []).find(b => b.id === id && b.business_id === businessId);
  }

  public createBrand(businessId: string, name: string): Brand {
    if (!this.data.brands) this.data.brands = [];
    const existing = this.data.brands.find(b => b.business_id === businessId && b.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;
    const brand: Brand = {
      id: generateId('brd'),
      business_id: businessId,
      name: name.trim(),
      created_at: new Date().toISOString(),
    };
    this.data.brands.push(brand);
    this.persist();
    return brand;
  }

  public deleteBrand(id: string, businessId: string): boolean {
    if (!this.data.brands) return false;
    const len = this.data.brands.length;
    this.data.brands = this.data.brands.filter(b => !(b.id === id && b.business_id === businessId));
    const changed = this.data.brands.length !== len;
    if (changed) this.persist();
    return changed;
  }

  // --- Products & Variants ---
  public getProducts(businessId: string): Product[] {
    return this.data.products.filter(p => p.business_id === businessId && p.active !== false);
  }

  public getProductById(id: string, businessId?: string): Product | undefined {
    return this.data.products.find(p => p.id === id && (!businessId || p.business_id === businessId));
  }

  public getProductByBarcode(barcode: string, businessId: string): Product | undefined {
    return this.data.products.find(p => p.business_id === businessId && (p.barcode === barcode || p.sku === barcode));
  }

  public createProduct(product: Product): Product {
    this.data.products.push(product);
    this.persist();
    return product;
  }

  public updateProduct(id: string, businessId: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id && p.business_id === businessId);
    if (idx === -1) return null;
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.persist();
    return this.data.products[idx];
  }

  public deleteProduct(id: string, businessId: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => !(p.id === id && p.business_id === businessId));
    const changed = this.data.products.length !== initialLen;
    if (changed) this.persist();
    return changed;
  }

  // --- Inventory & Movements ---
  public getInventoryMovements(businessId: string, productId?: string): InventoryMovement[] {
    return this.data.inventory_movements
      .filter(m => m.business_id === businessId && (!productId || m.product_id === productId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public recordStockMovement(
    businessId: string,
    productId: string,
    quantityDelta: number,
    type: InventoryMovement['type'],
    reason: string,
    createdById: string,
    referenceType?: 'sale' | 'manual' | 'refund',
    referenceId?: string
  ): { product: Product; movement: InventoryMovement } | null {
    const product = this.getProductById(productId, businessId);
    if (!product) return null;

    const openingStock = product.stock_quantity;
    const remainingStock = Math.max(0, openingStock + quantityDelta);

    product.stock_quantity = remainingStock;
    product.updated_at = new Date().toISOString();

    const user = this.getProfileById(createdById);
    const movement: InventoryMovement = {
      id: generateId('mov'),
      business_id: businessId,
      product_id: productId,
      product_name: product.name,
      type,
      quantity: quantityDelta,
      opening_stock: openingStock,
      remaining_stock: remainingStock,
      reference_type: referenceType,
      reference_id: referenceId,
      reason,
      created_by: createdById,
      created_by_name: user ? user.full_name : 'Staff',
      created_at: new Date().toISOString(),
    };

    this.data.inventory_movements.push(movement);

    // Check low stock notification
    if (remainingStock <= product.low_stock_threshold && openingStock > product.low_stock_threshold) {
      this.addNotification({
        id: generateId('notif'),
        business_id: businessId,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${product.name} is down to ${remainingStock} items (Threshold: ${product.low_stock_threshold}).`,
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    this.persist();
    return { product, movement };
  }

  // --- Customers ---
  public getCustomers(businessId: string): Customer[] {
    return this.data.customers
      .filter(c => c.business_id === businessId)
      .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0));
  }

  public getCustomerById(id: string, businessId: string): Customer | undefined {
    return this.data.customers.find(c => c.id === id && c.business_id === businessId);
  }

  public getCustomerByPhone(phone: string, businessId: string): Customer | undefined {
    const cleanPhone = normalizePhoneNumber(phone);
    return this.data.customers.find(c => {
      if (c.business_id !== businessId) return false;
      const cPhone = normalizePhoneNumber(c.phone);
      return cPhone === cleanPhone || c.phone === phone;
    });
  }

  public createOrUpdateCustomer(businessId: string, phone: string, name?: string, email?: string): Customer {
    let customer = this.getCustomerByPhone(phone, businessId);
    const now = new Date().toISOString();
    if (customer) {
      if (name && customer.name === 'Walk-in Customer') customer.name = name;
      if (email && !customer.email) customer.email = email;
      customer.updated_at = now;
    } else {
      customer = {
        id: generateId('cust'),
        business_id: businessId,
        name: name || `Customer ${phone.slice(-4)}`,
        phone: normalizePhoneNumber(phone),
        email,
        total_spent: 0,
        orders_count: 0,
        created_at: now,
        updated_at: now,
      };
      this.data.customers.push(customer);
    }
    this.persist();
    return customer;
  }

  // --- Sales ---
  public getSales(businessId: string): Sale[] {
    return this.data.sales
      .filter(s => s.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getSaleById(id: string, businessId?: string): Sale | undefined {
    return this.data.sales.find(s => s.id === id && (!businessId || s.business_id === businessId));
  }

  public createSale(sale: Sale): Sale {
    this.data.sales.push(sale);
    for (const item of sale.items) {
      this.data.sale_items.push(item);
    }
    this.persist();
    return sale;
  }

  public updateSaleStatus(saleId: string, status: SaleStatus, paymentStatus: PaymentStatus, paymentMethod?: PaymentProvider): Sale | null {
    const sale = this.data.sales.find(s => s.id === saleId);
    if (!sale) return null;
    sale.status = status;
    sale.payment_status = paymentStatus;
    if (paymentMethod) sale.payment_method = paymentMethod;
    sale.updated_at = new Date().toISOString();
    this.persist();
    return sale;
  }

  // --- Payments ---
  public getPayments(businessId?: string): Payment[] {
    return this.data.payments
      .filter(p => !businessId || p.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getPaymentById(id: string): Payment | undefined {
    return this.data.payments.find(p => p.id === id);
  }

  public getPaymentBySaleId(saleId: string): Payment | undefined {
    return this.data.payments.find(p => p.sale_id === saleId);
  }

  public getPaymentByReference(reference: string): Payment | undefined {
    return this.data.payments.find(p => p.reference === reference);
  }

  public getPaymentByProviderRequestId(requestId: string): Payment | undefined {
    return this.data.payments.find(p => p.provider_request_id === requestId);
  }

  public createPayment(payment: Payment): Payment {
    this.data.payments.push(payment);
    this.persist();
    return payment;
  }

  public updatePayment(id: string, updates: Partial<Payment>): Payment | null {
    const idx = this.data.payments.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.payments[idx] = {
      ...this.data.payments[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.persist();
    return this.data.payments[idx];
  }

  // --- M-Pesa Configs ---
  public getMpesaConfig(businessId: string): MpesaConfig | undefined {
    return this.data.mpesa_configs.find(c => c.business_id === businessId);
  }

  public updateMpesaConfig(businessId: string, updates: Partial<MpesaConfig>): MpesaConfig {
    let cfg = this.data.mpesa_configs.find(c => c.business_id === businessId);
    const now = new Date().toISOString();
    if (cfg) {
      Object.assign(cfg, updates, { updated_at: now });
    } else {
      cfg = {
        id: generateId('mpesa_cfg'),
        business_id: businessId,
        environment: 'test',
        consumer_key_masked: '••••••••••••' + (updates.shortcode?.slice(-4) || '1743'),
        shortcode: updates.shortcode || '174379',
        passkey_masked: '••••••••••••bfb2',
        active: true,
        has_credentials: true,
        updated_at: now,
        ...updates
      };
      this.data.mpesa_configs.push(cfg);
    }
    this.persist();
    return cfg;
  }

  // --- Receipt Generation & Numbering ---
  public nextReceiptNumber(businessId: string): string {
    const current = (this.data.receipt_counters[businessId] || 0) + 1;
    this.data.receipt_counters[businessId] = current;
    this.persist();
    const formattedNum = String(current).padStart(6, '0');
    return `BRK-${formattedNum}`;
  }

  public getReceipts(businessId: string): Receipt[] {
    return this.data.receipts
      .filter(r => r.business_id === businessId)
      .sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
  }

  public getReceiptById(id: string): Receipt | undefined {
    return this.data.receipts.find(r => r.id === id);
  }

  public getReceiptBySaleId(saleId: string): Receipt | undefined {
    return this.data.receipts.find(r => r.sale_id === saleId);
  }

  public getReceiptByVerificationToken(token: string): Receipt | undefined {
    return this.data.receipts.find(r => r.verification_token === token);
  }

  public createReceipt(receipt: Receipt): Receipt {
    this.data.receipts.push(receipt);
    this.persist();
    return receipt;
  }

  // --- Hydrate Receipt Data for View / PDF / Print ---
  public hydrateReceipt(receipt: Receipt): Receipt {
    const business = this.getBusinessById(receipt.business_id);
    const sale = this.getSaleById(receipt.sale_id);
    const payment = this.data.payments.find(p => p.sale_id === receipt.sale_id && p.status === 'PAID')
      || this.data.payments.find(p => p.sale_id === receipt.sale_id);

    return {
      ...receipt,
      business: business ? {
        name: business.name,
        logo_url: business.logo_url,
        location: business.location,
        address: business.address,
        phone: business.phone,
        email: business.email,
        receipt_footer: business.receipt_footer,
        currency: business.currency,
      } : undefined,
      sale: sale,
      payment: payment ? {
        method: payment.method.toUpperCase(),
        reference: payment.reference || payment.provider_transaction_id || 'PENDING',
        status: payment.status,
        phone_masked: payment.phone ? payment.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : undefined,
        completed_at: payment.completed_at || payment.updated_at,
      } : undefined,
    };
  }

  // --- QR Payment Sessions ---
  public createQRSession(session: QRPaymentSession): QRPaymentSession {
    this.data.qr_payment_sessions.push(session);
    this.persist();
    return session;
  }

  public getQRSessionByToken(token: string): QRPaymentSession | undefined {
    return this.data.qr_payment_sessions.find(s => s.token === token);
  }

  public updateQRSessionStatus(id: string, status: QRPaymentSession['status']): void {
    const session = this.data.qr_payment_sessions.find(s => s.id === id);
    if (session) {
      session.status = status;
      if (status === 'paid') session.used_at = new Date().toISOString();
      this.persist();
    }
  }

  // --- Expenses ---
  public getExpenses(businessId: string): Expense[] {
    return this.data.expenses
      .filter(e => e.business_id === businessId)
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  }

  public createExpense(expense: Expense): Expense {
    this.data.expenses.push(expense);
    this.persist();
    return expense;
  }

  // --- Notifications ---
  public getNotifications(businessId: string, userId?: string): Notification[] {
    return this.data.notifications
      .filter(n => n.business_id === businessId && (!n.user_id || n.user_id === userId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addNotification(notification: Notification): void {
    this.data.notifications.push(notification);
    this.persist();
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.persist();
    }
  }

  // --- Audit Logs ---
  public getAuditLogs(businessId?: string, limit: number = 100): AuditLog[] {
    return this.data.audit_logs
      .filter(l => !businessId || l.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  public logAction(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const entry: AuditLog = {
      ...log,
      id: generateId('log'),
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.push(entry);
    this.persist();
    return entry;
  }

  // --- Subscription Plans ---
  public getPlans(): SubscriptionPlan[] {
    return this.data.subscription_plans || [];
  }

  public updatePlan(id: string, updates: Partial<SubscriptionPlan>): SubscriptionPlan | null {
    const plan = (this.data.subscription_plans || []).find(p => p.id === id);
    if (!plan) return null;
    Object.assign(plan, updates);
    this.persist();
    return plan;
  }

  // --- Support Tickets ---
  public getSupportTickets(businessId?: string): SupportTicket[] {
    return this.data.support_tickets
      .filter(t => !businessId || t.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createSupportTicket(ticket: SupportTicket): SupportTicket {
    this.data.support_tickets.push(ticket);
    this.persist();
    return ticket;
  }

  public updateSupportTicket(id: string, updates: Partial<SupportTicket>): SupportTicket | null {
    const idx = this.data.support_tickets.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.support_tickets[idx] = {
      ...this.data.support_tickets[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.persist();
    return this.data.support_tickets[idx];
  }

  // --- SMS Configuration ---
  public getSmsConfig(businessId: string): SmsConfig | undefined {
    return (this.data.sms_configs || []).find(s => s.business_id === businessId);
  }

  public updateSmsConfig(businessId: string, updates: Partial<SmsConfig>): SmsConfig {
    if (!this.data.sms_configs) this.data.sms_configs = [];
    let cfg = this.data.sms_configs.find(s => s.business_id === businessId);
    const now = new Date().toISOString();
    if (cfg) {
      Object.assign(cfg, updates, { updated_at: now });
    } else {
      cfg = {
        id: generateId('sms_cfg'),
        business_id: businessId,
        provider: updates.provider || 'simulator',
        sender_id: updates.sender_id || 'BRISKBILL',
        status: updates.status || 'simulated',
        enabled: updates.enabled ?? true,
        notify_payment_success: updates.notify_payment_success ?? true,
        notify_receipt_ready: updates.notify_receipt_ready ?? true,
        notify_payment_failed: updates.notify_payment_failed ?? false,
        notify_refund: updates.notify_refund ?? true,
        created_at: now,
        updated_at: now,
        ...updates,
      };
      this.data.sms_configs.push(cfg);
    }
    this.persist();
    return cfg;
  }

  // --- Customer Notifications Log ---
  public getCustomerNotifications(businessId: string): CustomerNotification[] {
    return (this.data.customer_notifications || [])
      .filter(n => n.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createCustomerNotification(notification: CustomerNotification): CustomerNotification {
    if (!this.data.customer_notifications) this.data.customer_notifications = [];
    this.data.customer_notifications.push(notification);
    this.persist();
    return notification;
  }

  public updateCustomerNotificationStatus(
    id: string,
    status: CustomerNotificationStatus,
    errorMessage?: string,
    providerMessageId?: string
  ): CustomerNotification | null {
    if (!this.data.customer_notifications) return null;
    const item = this.data.customer_notifications.find(n => n.id === id);
    if (!item) return null;
    item.status = status;
    if (errorMessage !== undefined) item.error_message = errorMessage;
    if (providerMessageId !== undefined) item.provider_message_id = providerMessageId;
    if (status === 'DELIVERED') item.delivered_at = new Date().toISOString();
    this.persist();
    return item;
  }

  // =========================================================================
  // ATOMIC IDEMPOTENT PAYMENT COMPLETION TRANSACTION
  // (Fulfills Section 19, 21, 22, 27)
  // Ensures:
  // 1. Payment status -> PAID
  // 2. Sale status -> COMPLETED
  // 3. Stock reduced ONCE (idempotent, never twice if duplicate callback)
  // 4. Paid receipt generated with unique sequence (BRK-000xxx) & QR verification
  // 5. Customer stats updated
  // 6. Notification event created & SMS triggered
  // =========================================================================
  public completePaymentTransaction(params: {
    paymentId: string;
    providerTransactionId?: string;
    rawReference?: string;
    resultCode?: number;
    resultDescription?: string;
  }): { success: boolean; alreadyProcessed: boolean; receipt?: Receipt; error?: string } {
    const payment = this.getPaymentById(params.paymentId);
    if (!payment) {
      return { success: false, alreadyProcessed: false, error: 'Payment record not found' };
    }

    const sale = this.getSaleById(payment.sale_id);
    if (!sale) {
      return { success: false, alreadyProcessed: false, error: 'Sale record not found' };
    }

    // Check Idempotency: If payment is ALREADY marked PAID, return existing receipt WITHOUT touching inventory!
    if (payment.status === 'PAID') {
      const existingReceipt = this.getReceiptBySaleId(sale.id);
      return {
        success: true,
        alreadyProcessed: true,
        receipt: existingReceipt ? this.hydrateReceipt(existingReceipt) : undefined,
      };
    }

    const now = new Date().toISOString();
    const txId = params.providerTransactionId || `MP${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // 1. Update Payment
    payment.status = 'PAID';
    payment.provider_transaction_id = txId;
    payment.reference = txId;
    payment.completed_at = now;
    payment.updated_at = now;

    // 2. Update Sale
    sale.status = 'completed';
    sale.payment_status = 'PAID';
    sale.payment_method = payment.provider;
    sale.updated_at = now;

    // 3. Reduce inventory for each item ONLY after payment is confirmed PAID
    for (const item of sale.items) {
      this.recordStockMovement(
        sale.business_id,
        item.product_id,
        -item.quantity, // negative delta
        'sale',
        `POS Sale #${sale.sale_number} [Paid via ${payment.method.toUpperCase()}]`,
        sale.worker_id,
        'sale',
        sale.id
      );
    }

    // 4. Update Customer stats
    if (sale.customer_id) {
      const customer = this.getCustomerById(sale.customer_id, sale.business_id);
      if (customer) {
        customer.total_spent = (customer.total_spent || 0) + sale.total;
        customer.orders_count = (customer.orders_count || 0) + 1;
        customer.updated_at = now;
      }
    }

    // 5. Generate Official Paid Receipt
    const receiptNum = this.nextReceiptNumber(sale.business_id);
    const verificationToken = generateToken(24);
    const receipt: Receipt = {
      id: generateId('rec'),
      business_id: sale.business_id,
      sale_id: sale.id,
      receipt_number: receiptNum,
      verification_token: verificationToken,
      issued_at: now,
    };
    this.createReceipt(receipt);

    // 6. Close any open QR sessions for this sale
    const qrSessions = this.data.qr_payment_sessions.filter(q => q.sale_id === sale.id);
    for (const q of qrSessions) {
      q.status = 'paid';
      q.used_at = now;
    }

    // 7. Record Notification
    this.addNotification({
      id: generateId('notif'),
      business_id: sale.business_id,
      type: 'payment_success',
      title: 'Payment Confirmed',
      message: `M-Pesa payment of KES ${sale.total.toLocaleString()} confirmed (Receipt ${receiptNum}).`,
      read: false,
      created_at: now,
    });

    // 8. Record Worker Audit Log
    const worker = this.getProfileById(sale.worker_id);
    this.logAction({
      business_id: sale.business_id,
      user_id: sale.worker_id,
      user_name: worker?.full_name || 'Staff',
      action: 'payment_successful',
      resource_type: 'payment',
      resource_id: payment.id,
      metadata: {
        saleNumber: sale.sale_number,
        receiptNumber: receiptNum,
        amount: sale.total,
        reference: txId,
      },
    });

    this.persist();

    // 9. Fire customer notification SMS asynchronously if phone is present
    if (sale.customer_phone) {
      const business = this.getBusinessById(sale.business_id);
      const verifyUrl = `https://brisksmartbilling.co.ke/verify-receipt/${verificationToken}`;
      const messageText = `${business?.name || 'BRISK SMART BILLING'}: Payment of KES ${sale.total.toLocaleString()} received successfully. Receipt #${receiptNum}. View receipt: ${verifyUrl}`;

      const notifId = generateId('cnotif');
      const normalizedPhone = normalizePhoneNumber(sale.customer_phone);
      const custNotif: CustomerNotification = {
        id: notifId,
        business_id: sale.business_id,
        customer_phone: normalizedPhone,
        customer_phone_masked: maskPhoneNumber(normalizedPhone),
        notification_type: 'PAYMENT_SUCCESS',
        status: 'QUEUED',
        message: messageText,
        amount: sale.total,
        receipt_id: receipt.id,
        receipt_number: receiptNum,
        receipt_token: verificationToken,
        receipt_url: verifyUrl,
        provider: 'simulator',
        created_at: now,
      };
      this.createCustomerNotification(custNotif);

      const smsConfig = this.getSmsConfig(sale.business_id);
      if (smsConfig && smsConfig.enabled && smsConfig.notify_payment_success) {
        SmsService.dispatchSms(smsConfig, {
          businessId: sale.business_id,
          businessName: business?.name || 'BRISK SMART BILLING',
          customerPhone: sale.customer_phone,
          notificationType: 'PAYMENT_SUCCESS',
          amount: sale.total,
          receiptNumber: receiptNum,
          receiptToken: verificationToken,
        })
          .then(res => {
            this.updateCustomerNotificationStatus(
              notifId,
              res.status,
              res.errorMessage,
              res.providerMessageId
            );
          })
          .catch(err => {
            this.updateCustomerNotificationStatus(notifId, 'FAILED', err.message);
          });
      }
    }

    return {
      success: true,
      alreadyProcessed: false,
      receipt: this.hydrateReceipt(receipt),
    };
  }

  // =========================================================================
  // CANCEL PAYMENT TRANSACTION (Section 16, 21, 22)
  // Ensures:
  // - payment status -> CANCELLED
  // - sale status -> pending / not completed
  // - Stock is NOT deducted
  // - Paid receipt is NOT generated
  // =========================================================================
  public cancelPaymentTransaction(params: {
    paymentId: string;
    reason?: string;
  }): { success: boolean; error?: string } {
    const payment = this.getPaymentById(params.paymentId);
    if (!payment) return { success: false, error: 'Payment not found' };

    const sale = this.getSaleById(payment.sale_id);
    const now = new Date().toISOString();

    payment.status = 'CANCELLED';
    payment.failure_reason = params.reason || 'Customer cancelled the M-Pesa payment request.';
    payment.updated_at = now;

    if (sale && sale.payment_status !== 'PAID') {
      sale.payment_status = 'CANCELLED';
      sale.status = 'pending';
      sale.updated_at = now;
    }

    this.logAction({
      business_id: payment.business_id,
      user_id: sale?.worker_id || 'system',
      action: 'payment_cancelled',
      resource_type: 'payment',
      resource_id: payment.id,
      metadata: {
        reason: payment.failure_reason,
        amount: payment.amount,
        phone: payment.phone,
      },
    });

    this.persist();
    return { success: true };
  }

  // =========================================================================
  // FAIL PAYMENT TRANSACTION (Section 17, 21, 22)
  // =========================================================================
  public failPaymentTransaction(params: {
    paymentId: string;
    reason?: string;
  }): { success: boolean; error?: string } {
    const payment = this.getPaymentById(params.paymentId);
    if (!payment) return { success: false, error: 'Payment not found' };

    const sale = this.getSaleById(payment.sale_id);
    const now = new Date().toISOString();

    payment.status = 'FAILED';
    payment.failure_reason = params.reason || 'The M-Pesa payment could not be completed.';
    payment.updated_at = now;

    if (sale && sale.payment_status !== 'PAID') {
      sale.payment_status = 'FAILED';
      sale.status = 'pending';
      sale.updated_at = now;
    }

    this.logAction({
      business_id: payment.business_id,
      user_id: sale?.worker_id || 'system',
      action: 'payment_failed',
      resource_type: 'payment',
      resource_id: payment.id,
      metadata: {
        reason: payment.failure_reason,
        amount: payment.amount,
        phone: payment.phone,
      },
    });

    this.persist();
    return { success: true };
  }

  // =========================================================================
  // EXPIRE PAYMENT TRANSACTION (Section 18, 21, 22)
  // =========================================================================
  public expirePaymentTransaction(params: {
    paymentId: string;
  }): { success: boolean; error?: string } {
    const payment = this.getPaymentById(params.paymentId);
    if (!payment) return { success: false, error: 'Payment not found' };

    const sale = this.getSaleById(payment.sale_id);
    const now = new Date().toISOString();

    payment.status = 'EXPIRED';
    payment.failure_reason = 'The payment request expired before it was completed.';
    payment.updated_at = now;

    if (sale && sale.payment_status !== 'PAID') {
      sale.payment_status = 'EXPIRED';
      sale.status = 'pending';
      sale.updated_at = now;
    }

    this.logAction({
      business_id: payment.business_id,
      user_id: sale?.worker_id || 'system',
      action: 'payment_expired',
      resource_type: 'payment',
      resource_id: payment.id,
      metadata: {
        amount: payment.amount,
        phone: payment.phone,
      },
    });

    this.persist();
    return { success: true };
  }

  // =========================================================================
  // CONTACT MESSAGES (Section 4, 5, 6, 7)
  // =========================================================================
  public getContactMessages(status?: string): ContactMessage[] {
    if (!this.data.contact_messages) this.data.contact_messages = [];
    return this.data.contact_messages
      .filter(m => !status || status === 'ALL' || m.status === status)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createContactMessage(msg: Omit<ContactMessage, 'id' | 'created_at' | 'status'>): ContactMessage {
    if (!this.data.contact_messages) this.data.contact_messages = [];
    const newMsg: ContactMessage = {
      ...msg,
      id: generateId('cmsg'),
      status: 'NEW',
      created_at: new Date().toISOString(),
    };
    this.data.contact_messages.unshift(newMsg);
    this.persist();
    return newMsg;
  }

  public updateContactMessageStatus(id: string, status: ContactMessageStatus, replyNotes?: string): ContactMessage | null {
    if (!this.data.contact_messages) return null;
    const msg = this.data.contact_messages.find(m => m.id === id);
    if (!msg) return null;
    msg.status = status;
    msg.updated_at = new Date().toISOString();
    if (replyNotes !== undefined) {
      msg.reply_notes = replyNotes;
      if (status === 'REPLIED') msg.replied_at = new Date().toISOString();
    }
    this.persist();
    return msg;
  }

  public deleteContactMessage(id: string): boolean {
    if (!this.data.contact_messages) return false;
    const idx = this.data.contact_messages.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.data.contact_messages.splice(idx, 1);
    this.persist();
    return true;
  }

  // =========================================================================
  // PAYMENT PROVIDER CONFIGURATION (Section 22, 23)
  // =========================================================================
  public getPaymentConfig(businessId: string): BusinessPaymentConfig {
    if (!this.data.payment_configs) this.data.payment_configs = [];
    let cfg = this.data.payment_configs.find(c => c.business_id === businessId);
    if (!cfg) {
      cfg = {
        id: generateId('paycfg'),
        business_id: businessId,
        card: {
          enabled: true,
          provider: 'pesapal',
          mode: 'test',
          public_key: 'pk_test_brisk_live_demo',
          supported_brands: ['Visa', 'Mastercard'],
        },
        bank_transfer: {
          enabled: true,
          bank_name: 'Kenya Commercial Bank (KCB)',
          account_name: 'ABC SHOP LIMITED',
          account_number: '1234567890',
          branch: 'Nairobi CBD Branch',
          swift_bic: 'KCBLKENX',
          instructions: 'Use your Receipt or Sale Reference (e.g. BRK-000125) as the transfer payment note. Payment will be verified by store manager.',
        },
        updated_at: new Date().toISOString(),
      };
      this.data.payment_configs.push(cfg);
      this.persist();
    }
    return cfg;
  }

  public updatePaymentConfig(businessId: string, updates: Partial<BusinessPaymentConfig>): BusinessPaymentConfig {
    const cfg = this.getPaymentConfig(businessId);
    if (updates.card) {
      cfg.card = { ...cfg.card, ...updates.card };
    }
    if (updates.bank_transfer) {
      cfg.bank_transfer = { ...cfg.bank_transfer, ...updates.bank_transfer };
    }
    cfg.updated_at = new Date().toISOString();
    this.persist();
    return cfg;
  }

  // =========================================================================
  // BANK TRANSFERS VERIFICATION WORKFLOW (Section 13, 14, 15, 16, 17)
  // =========================================================================
  public getBankTransfers(businessId: string, status?: string): BankTransferRecord[] {
    if (!this.data.bank_transfers) this.data.bank_transfers = [];
    return this.data.bank_transfers
      .filter(t => t.business_id === businessId && (!status || status === 'all' || t.status === status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getBankTransferById(id: string): BankTransferRecord | undefined {
    return (this.data.bank_transfers || []).find(t => t.id === id);
  }

  public getBankTransferByReference(reference: string): BankTransferRecord | undefined {
    return (this.data.bank_transfers || []).find(t => t.reference.toLowerCase() === reference.toLowerCase());
  }

  public createBankTransfer(transfer: BankTransferRecord): BankTransferRecord {
    if (!this.data.bank_transfers) this.data.bank_transfers = [];
    this.data.bank_transfers.unshift(transfer);
    this.persist();
    return transfer;
  }

  public verifyBankTransfer(params: {
    transferId: string;
    verifiedBy: string;
  }): { success: boolean; sale?: Sale; receipt?: Receipt; error?: string } {
    const transfer = this.getBankTransferById(params.transferId);
    if (!transfer) return { success: false, error: 'Bank transfer record not found' };
    if (transfer.status === 'verified') return { success: false, error: 'Transfer already verified' };

    const payment = this.getPaymentById(transfer.payment_id);
    if (!payment) return { success: false, error: 'Associated payment not found' };

    const now = new Date().toISOString();
    transfer.status = 'verified';
    transfer.verified_by = params.verifiedBy;
    transfer.verified_at = now;
    transfer.updated_at = now;

    // Ensure payment metadata stores bank reference
    payment.metadata = {
      ...(payment.metadata || {}),
      bank_reference: transfer.bank_reference || transfer.reference,
      sender_name: transfer.sender_name,
    };

    // Complete transaction idempotently
    const result = this.completePaymentTransaction({
      paymentId: payment.id,
      providerTransactionId: transfer.bank_reference || transfer.transaction_id || `BANK-${transfer.reference}`,
      rawReference: transfer.reference,
      resultCode: 0,
      resultDescription: 'Bank transfer verified by business manager',
    });

    const sale = this.getSaleById(payment.sale_id);
    this.persist();

    return {
      success: true,
      sale,
      receipt: result.receipt,
    };
  }

  public rejectBankTransfer(params: {
    transferId: string;
    verifiedBy: string;
    reason: string;
  }): { success: boolean; error?: string } {
    const transfer = this.getBankTransferById(params.transferId);
    if (!transfer) return { success: false, error: 'Bank transfer record not found' };

    const now = new Date().toISOString();
    transfer.status = 'rejected';
    transfer.rejection_reason = params.reason || 'Payment could not be verified in business bank account.';
    transfer.verified_by = params.verifiedBy;
    transfer.verified_at = now;
    transfer.updated_at = now;

    this.failPaymentTransaction({
      paymentId: transfer.payment_id,
      reason: transfer.rejection_reason,
    });

    this.persist();
    return { success: true };
  }
}

export const db = new Database();
