/**
 * BRISK BILLING - Core TypeScript Data Types & Interfaces
 */

export type UserRole = 'owner' | 'manager' | 'cashier' | 'sales_worker' | 'super_admin';

export type PaymentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

export type SaleStatus = 
  | 'pending'
  | 'completed'
  | 'partially_refunded'
  | 'refunded'
  | 'cancelled';

export type SubscriptionStatus = 
  | 'trial'
  | 'active'
  | 'expiring'
  | 'expired'
  | 'suspended'
  | 'cancelled';

export type PaymentProvider = 'mpesa' | 'cash' | 'card' | 'bank' | 'bank_transfer';

// Standard Measurement Units (Section 15)
export type MeasurementUnit =
  // Weight
  | 'mg' | 'g' | 'kg' | 'tonne'
  // Volume
  | 'ml' | 'cl' | 'L'
  // Length
  | 'mm' | 'cm' | 'm' | 'km'
  // Quantity
  | 'piece' | 'pair' | 'dozen' | 'box' | 'pack' | 'carton' | 'bottle' | 'bag' | 'crate';

export interface UserProfile {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  password?: string;
  password_hash?: string;
  avatar_url?: string;
  is_super_admin?: boolean;
  email_verified?: boolean;
  mfa_enabled?: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailVerificationToken {
  id: string;
  email: string;
  token: string;
  verified: boolean;
  created_at: string;
  expires_at: string;
  last_sent_at: string;
}

export interface PasswordResetToken {
  id: string;
  email: string;
  token: string;
  used: boolean;
  created_at: string;
  expires_at: string;
}

export interface WorkerInvitation {
  id: string;
  business_id: string;
  business_name: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  permissions: BusinessMember['permissions'];
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
}

export interface LoginActivity {
  id: string;
  user_id: string;
  email: string;
  ip?: string;
  user_agent?: string;
  status: 'success' | 'failed';
  role?: string;
  timestamp: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  category: string;
  phone: string;
  email: string;
  address?: string;
  location: string;
  logo_url?: string;
  currency: string;
  status: 'active' | 'suspended' | 'deactivated';
  receipt_footer?: string;
  tax_percentage?: number;
  vat_enabled?: boolean;
  vat_number?: string;
  prices_include_vat?: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  employee_id?: string;
  notes?: string;
  avatar_url?: string;
  last_active_at?: string;
  today_sales_total?: number;
  today_sales_count?: number;
  permissions: {
    can_create_sales: boolean;
    can_apply_discount: boolean;
    max_discount_percent: number;
    can_manage_products: boolean;
    can_manage_inventory: boolean;
    can_manage_workers: boolean;
    can_view_reports: boolean;
    can_configure_mpesa: boolean;
    can_manage_subscription: boolean;
    can_issue_refunds: boolean;
  };
  user_details?: {
    full_name: string;
    email: string;
    phone: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // in KES
  duration_days: number;
  worker_limit: number;
  product_limit: number;
  transaction_limit: number;
  features: string[];
  active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan_id: string;
  plan_name: string;
  status: SubscriptionStatus;
  trial_started_at: string;
  trial_ends_at: string;
  started_at?: string;
  ends_at: string;
  days_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  created_at: string;
}

export interface Brand {
  id: string;
  business_id: string;
  name: string;
  created_at: string;
}

export type ProductVatType = 'default' | 'exempt' | 'custom';

export interface Product {
  id: string;
  business_id: string;
  category_id?: string;
  category_name?: string;
  brand_id?: string;
  brand_name?: string;
  variant?: string; // e.g. "Fresh Milk", "Whole Milk", "Low Fat"
  size?: string; // e.g. "500", "1", "250", "400"
  unit: string; // e.g. 'ml', 'cl', 'L', 'g', 'kg', 'piece', 'bottle', 'bag', 'carton', 'box'
  unit_size?: string; // e.g. '500 ml', '1 L', '25 kg'
  name: string; // e.g. "Brookside Fresh Milk 500ml" or "Fresh Milk"
  sku: string;
  barcode?: string;
  description?: string;
  selling_price: number; // in KES per unit
  buying_price: number;
  vat_type?: ProductVatType; // 'default' | 'exempt' | 'custom'
  custom_tax_rate?: number; // percent if vat_type === 'custom'
  tax_rate: number; // resolved percent e.g. 16 or 0
  stock_quantity: number;
  low_stock_threshold: number;
  fractional_quantity_allowed?: boolean; // allow 0.5 kg, 250 ml
  image_url?: string;
  is_service?: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  business_id: string;
  product_id: string;
  product_name: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'damaged' | 'returned';
  quantity: number; // negative for reductions, positive for additions
  opening_stock: number;
  remaining_stock: number;
  reference_type?: 'sale' | 'manual' | 'refund';
  reference_id?: string;
  reason: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  total_spent?: number;
  orders_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name_snapshot: string;
  brand_name?: string;
  variant?: string;
  size?: string;
  quantity: number;
  unit?: string;
  unit_size?: string;
  unit_price: number;
  discount: number;
  tax_rate?: number; // e.g. 16 or 0
  tax_amount?: number; // exact VAT in KES
  tax: number; // tax amount
  subtotal?: number; // subtotal excluding VAT or net
  total: number; // line total
  created_at: string;
}

export interface Sale {
  id: string;
  business_id: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  worker_id: string;
  worker_name: string;
  sale_number: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: SaleStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentProvider;
  items: SaleItem[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  business_id: string;
  sale_id: string;
  provider: PaymentProvider;
  method: string;
  amount: number;
  currency?: string;
  phone: string;
  status: PaymentStatus;
  provider_request_id?: string;
  provider_transaction_id?: string;
  reference: string;
  failure_reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface MpesaConfig {
  id: string;
  business_id: string;
  environment: 'sandbox' | 'production' | 'test';
  consumer_key_masked: string;
  shortcode: string;
  passkey_masked: string;
  active: boolean;
  has_credentials: boolean;
  updated_at: string;
}

export interface Receipt {
  id: string;
  business_id: string;
  sale_id: string;
  receipt_number: string;
  verification_token: string;
  pdf_url?: string;
  issued_at: string;
  // Hydrated fields for rendering
  business?: {
    name: string;
    logo_url?: string;
    location: string;
    address?: string;
    phone: string;
    email: string;
    receipt_footer?: string;
    currency: string;
  };
  sale?: Sale;
  payment?: {
    method: string;
    reference: string;
    status: PaymentStatus;
    phone_masked?: string;
    completed_at?: string;
  };
}

export interface QRPaymentSession {
  id: string;
  business_id: string;
  sale_id: string;
  token: string;
  amount: number;
  status: 'active' | 'paid' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  used_at?: string;
}

export interface Expense {
  id: string;
  business_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  business_id: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id?: string;
  user_id?: string;
  user_name?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  ip?: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  business_id: string;
  business_name?: string;
  user_id: string;
  user_name: string;
  subject: string;
  category: 'payment' | 'account' | 'subscription' | 'receipt' | 'technical' | 'mpesa';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_reply?: string;
  created_at: string;
  updated_at: string;
}

export interface ExtractedProductAI {
  name: string;
  brand?: string;
  variant?: string;
  size?: string;
  stock_quantity: number;
  unit: string;
  unit_size?: string;
  selling_price: number;
  buying_price?: number;
  category?: string;
  fractional_quantity_allowed?: boolean;
}

export type SmsProviderType = 'africastalking' | 'twilio' | 'safaricom' | 'simulator' | 'generic_webhook';

export interface SmsConfig {
  id: string;
  business_id: string;
  provider: SmsProviderType;
  sender_id: string;
  api_key_masked?: string;
  api_key_secret?: string; // Stored securely server-side only
  api_username?: string; // Africa's Talking username
  account_sid?: string; // Twilio Account SID
  status: 'connected' | 'not_connected' | 'simulated';
  enabled: boolean;
  notify_payment_success: boolean;
  notify_receipt_ready: boolean;
  notify_payment_failed: boolean;
  notify_refund: boolean;
  created_at: string;
  updated_at: string;
}

export type CustomerNotificationStatus = 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export interface CustomerNotification {
  id: string;
  business_id: string;
  customer_name?: string;
  customer_phone: string; // normalized
  customer_phone_masked: string; // e.g. "07******45"
  notification_type: 'PAYMENT_SUCCESS' | 'RECEIPT_GENERATED' | 'PAYMENT_FAILED' | 'REFUND';
  status: CustomerNotificationStatus;
  message: string;
  amount?: number;
  receipt_id?: string;
  receipt_number?: string;
  receipt_token?: string;
  receipt_url?: string;
  provider: string;
  provider_message_id?: string;
  error_message?: string;
  created_at: string;
  delivered_at?: string;
}

export type ContactMessageStatus = 'NEW' | 'READ' | 'REPLIED' | 'CLOSED';

export interface ContactMessage {
  id: string;
  name: string;
  business_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
  updated_at?: string;
  reply_notes?: string;
  replied_at?: string;
}

export interface CardPaymentConfig {
  enabled: boolean;
  provider: 'stripe' | 'pesapal' | 'flutterwave' | 'paystack';
  mode: 'test' | 'live';
  public_key?: string;
  secret_key_masked?: string;
  supported_brands: string[]; // e.g. ['Visa', 'Mastercard']
}

export interface BankTransferConfig {
  enabled: boolean;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string;
  swift_bic?: string;
  instructions?: string;
}

export interface BusinessPaymentConfig {
  id: string;
  business_id: string;
  card: CardPaymentConfig;
  bank_transfer: BankTransferConfig;
  updated_at: string;
}

export interface BankTransferRecord {
  id: string;
  business_id: string;
  sale_id: string;
  payment_id: string;
  reference: string; // e.g. BRK-00125
  amount: number;
  customer_name?: string;
  customer_phone?: string;
  bank_reference?: string;
  transaction_id?: string;
  transfer_date?: string;
  sender_name?: string;
  proof_notes?: string;
  proof_document_name?: string;
  proof_document_data?: string;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

