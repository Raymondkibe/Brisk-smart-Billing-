-- ============================================================================
-- BRISK SMART BILLING & POS - SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- Application URL: https://brisksmartbilling.vercel.app/
-- Database Target: Supabase PostgreSQL (Auto-Migrating & Instant Execution)
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USERS & PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    full_name TEXT NOT NULL,
    password_hash TEXT,
    avatar_url TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT TRUE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. BUSINESSES & WORKSPACES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY,
    owner_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    category TEXT DEFAULT 'Retail & Supermarket',
    phone TEXT,
    email TEXT,
    address TEXT,
    location TEXT DEFAULT 'Nairobi, Kenya',
    logo_url TEXT,
    currency TEXT DEFAULT 'KES',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
    receipt_footer TEXT DEFAULT 'Thank you for shopping with us! Karibu tena.',
    tax_percentage NUMERIC(5, 2) DEFAULT 16.00,
    vat_enabled BOOLEAN DEFAULT FALSE,
    vat_number TEXT,
    prices_include_vat BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. BUSINESS MEMBERS / STAFF ACCESS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.business_members (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'cashier', 'sales_worker', 'super_admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    employee_id TEXT,
    notes TEXT,
    avatar_url TEXT,
    last_active_at TIMESTAMPTZ,
    today_sales_total NUMERIC(12, 2) DEFAULT 0.00,
    today_sales_count INT DEFAULT 0,
    permissions JSONB DEFAULT '{
        "can_create_sales": true,
        "can_apply_discount": false,
        "max_discount_percent": 10,
        "can_manage_products": false,
        "can_manage_inventory": false,
        "can_manage_workers": false,
        "can_view_reports": false,
        "can_configure_mpesa": false,
        "can_manage_subscription": false,
        "can_issue_refunds": false
    }'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- ============================================================================
-- 4. SUBSCRIPTION PLANS & ACTIVE BUSINESS SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    duration_days INT NOT NULL,
    worker_limit INT DEFAULT 5,
    product_limit INT DEFAULT 500,
    transaction_limit INT DEFAULT 10000,
    features TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan_id TEXT,
    plan_name TEXT NOT NULL,
    status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expiring', 'expired', 'suspended', 'cancelled')),
    trial_started_at TIMESTAMPTZ DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    days_remaining INT DEFAULT 14,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. CATEGORIES & BRANDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.brands (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. PRODUCTS & INVENTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT,
    brand_id TEXT REFERENCES public.brands(id) ON DELETE SET NULL,
    brand_name TEXT,
    name TEXT NOT NULL,
    variant TEXT,
    size TEXT,
    unit TEXT DEFAULT 'piece',
    sku TEXT,
    barcode TEXT,
    buying_price NUMERIC(12, 2) DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL,
    wholesale_price NUMERIC(12, 2),
    vat_type TEXT DEFAULT 'default' CHECK (vat_type IN ('default', 'exempt', 'zero_rated', 'custom')),
    custom_tax_rate NUMERIC(5, 2) DEFAULT 16.00,
    stock_quantity NUMERIC(12, 3) DEFAULT 0.000,
    low_stock_threshold NUMERIC(12, 3) DEFAULT 10.000,
    is_service BOOLEAN DEFAULT FALSE,
    allow_fractional_units BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Movement History
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('SALE', 'PURCHASE', 'ADJUSTMENT', 'DAMAGE', 'RETURN', 'TRANSFER')),
    quantity NUMERIC(12, 3) NOT NULL,
    previous_stock NUMERIC(12, 3) NOT NULL,
    new_stock NUMERIC(12, 3) NOT NULL,
    reason TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. CUSTOMERS & LOYALTY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    loyalty_points INT DEFAULT 0,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. SALES & TRANSACTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL,
    cashier_id TEXT,
    cashier_name TEXT,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mpesa', 'card', 'bank', 'bank_transfer', 'split')),
    payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'voided', 'refunded')),
    notes TEXT,
    items JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    unit TEXT DEFAULT 'piece',
    vat_rate NUMERIC(5, 2) DEFAULT 16.00,
    vat_amount NUMERIC(12, 2) DEFAULT 0.00
);

-- ============================================================================
-- 9. PAYMENTS & M-PESA TRANSACTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    sale_id TEXT REFERENCES public.sales(id) ON DELETE SET NULL,
    receipt_number TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT DEFAULT 'KES',
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'PAID', 'CANCELLED', 'FAILED', 'EXPIRED', 'REFUNDED')),
    mpesa_receipt_number TEXT,
    phone_number TEXT,
    checkout_request_id TEXT,
    merchant_request_id TEXT,
    result_code TEXT,
    result_desc TEXT,
    customer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. DIGITAL RECEIPTS & VERIFICATION TOKENS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.receipts (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    sale_id TEXT REFERENCES public.sales(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL,
    verification_token TEXT UNIQUE NOT NULL,
    qr_code_data TEXT,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    cashier_name TEXT,
    items_snapshot JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. QR PAYMENT & SELF-CHECKOUT SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.qr_payment_sessions (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT DEFAULT 'KES',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    sale_draft JSONB DEFAULT '{}'::JSONB,
    mpesa_receipt TEXT,
    customer_phone TEXT,
    payment_id TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. EXPENSES & ACCOUNTING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    receipt_url TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. SETTINGS: SMS & PAYMENT INTEGRATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sms_configs (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
    provider TEXT DEFAULT 'africastalking',
    sender_id TEXT DEFAULT 'BRISK',
    api_key TEXT,
    username TEXT,
    auto_sms_receipts BOOLEAN DEFAULT TRUE,
    auto_sms_daily_summary BOOLEAN DEFAULT FALSE,
    receipt_template TEXT DEFAULT 'Thank you for shopping at {{business_name}}! Total: KES {{total}}. Receipt #{{receipt_no}}. Verify: {{link}}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_notifications (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_configs (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
    mpesa_shortcode TEXT DEFAULT '174379',
    mpesa_consumer_key TEXT,
    mpesa_consumer_secret TEXT,
    mpesa_passkey TEXT,
    mpesa_environment TEXT DEFAULT 'test',
    bank_name TEXT,
    bank_account_name TEXT,
    bank_account_number TEXT,
    bank_paybill TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bank_transfers (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    payment_id TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    reference_code TEXT NOT NULL,
    sender_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 14. CONTACT MESSAGES & AUDIT LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    business_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'NEW',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    user_id TEXT,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 15. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_sales_business_id ON public.sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_receipts_verification_token ON public.receipts(verification_token);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_token ON public.qr_payment_sessions(token);

-- ============================================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES - PERMISSIVE FOR APPLICATION CLIENTS
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_payment_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated service roles and anon clients to select/insert
CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow service insert on profiles" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Allow public read on businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Allow service on businesses" ON public.businesses FOR ALL USING (true);

CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow service on products" ON public.products FOR ALL USING (true);

CREATE POLICY "Allow public read on receipts" ON public.receipts FOR SELECT USING (true);
CREATE POLICY "Allow service on receipts" ON public.receipts FOR ALL USING (true);

CREATE POLICY "Allow service on all tables" ON public.sales FOR ALL USING (true);
CREATE POLICY "Allow service on payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Allow service on qr_sessions" ON public.qr_payment_sessions FOR ALL USING (true);

-- ============================================================================
-- 17. INITIAL SEED DATA FOR PLATFORM SUPER ADMIN & ABC SHOP
-- ============================================================================
INSERT INTO public.profiles (id, email, phone, full_name, password_hash, is_super_admin, email_verified)
VALUES 
    ('user_admin_001', 'admin@briskbilling.co.ke', '254700000000', 'Platform Super Admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', true, true),
    ('user_admin_techray', 'techray91@gmail.com', '254712345678', 'TechRay Super Admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', true, true)
ON CONFLICT (email) DO UPDATE SET is_super_admin = TRUE, email_verified = TRUE;

INSERT INTO public.businesses (id, owner_id, name, slug, category, location, currency, status)
VALUES 
    ('biz_abc_shop_001', 'user_admin_techray', 'ABC SHOP', 'abc-shop-ke', 'Retail & Supermarket', 'Nairobi CBD, Kenya', 'KES', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscription_plans (id, name, price, duration_days, worker_limit, product_limit, transaction_limit, features)
VALUES 
    ('plan_starter', 'Starter Retail', 1500.00, 30, 2, 200, 2000, ARRAY['POS Register', 'Cash & M-Pesa STK', 'Thermal Receipts']),
    ('plan_standard', 'Standard Pro', 3000.00, 30, 5, 1000, 10000, ARRAY['Everything in Starter', 'Multi-Worker Roles', 'QR Shelf Labels', 'Digital Receipts', 'SMS Alerts']),
    ('plan_enterprise', 'Enterprise Retail', 6000.00, 30, 20, 10000, 100000, ARRAY['Unlimited Everything', 'Multi-Branch', 'Dedicated Account Manager', 'Custom API Access'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscriptions (id, business_id, plan_id, plan_name, status, days_remaining)
VALUES 
    ('sub_abc_shop_001', 'biz_abc_shop_001', 'plan_standard', 'Standard Pro (14-Day Free Trial)', 'trial', 14)
ON CONFLICT (id) DO NOTHING;
