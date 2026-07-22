-- =========================================================
-- IPO MANAGEMENT & MONEY FLOW LEDGER SYSTEM - SUPABASE SCHEMA
-- Execute this SQL script in the Supabase SQL Editor
-- =========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PARTIES / MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    pan VARCHAR(20),
    demat_no VARCHAR(50),
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    upi_id VARCHAR(100),
    initial_balance NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. IPOS TABLE
CREATE TABLE IF NOT EXISTS public.ipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50),
    price_per_share NUMERIC(10,2) NOT NULL,
    lot_size INT NOT NULL DEFAULT 1,
    bidding_start_date TIMESTAMPTZ,
    bidding_end_date TIMESTAMPTZ,
    allotment_date TIMESTAMPTZ,
    listing_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'OPEN', -- 'UPCOMING', 'OPEN', 'CLOSED', 'ALLOTTED', 'LISTED'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. IPO APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.ipo_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ipo_id UUID REFERENCES public.ipos(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    application_no VARCHAR(50),
    lots_applied INT DEFAULT 1,
    shares_applied INT NOT NULL,
    amount_applied NUMERIC(12,2) NOT NULL,
    allotment_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'ALLOTTED', 'NOT_ALLOTTED', 'REFUNDED'
    lots_allotted INT DEFAULT 0,
    shares_allotted INT DEFAULT 0,
    amount_allotted NUMERIC(12,2) DEFAULT 0.00,
    refund_amount NUMERIC(12,2) DEFAULT 0.00,
    profit_loss NUMERIC(12,2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'PAID', -- 'PENDING', 'PAID', 'REFUNDED'
    application_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MONEY TRANSACTIONS (COME & GO CASH FLOW)
CREATE TABLE IF NOT EXISTS public.money_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.ipo_applications(id) ON DELETE SET NULL,
    from_party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    to_party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'IPO_APPLICATION', 'IPO_REFUND', 'PROFIT_DISTRIBUTION', 'DIRECT_TRANSFER'
    payment_mode VARCHAR(50) DEFAULT 'UPI', -- 'UPI', 'NET_BANKING', 'ASBA', 'CASH'
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TAX RECORDS & CONFIGURATIONS TABLE
CREATE TABLE IF NOT EXISTS public.tax_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    financial_year VARCHAR(20) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 20.00,
    fee_per_allotment NUMERIC(10,2) DEFAULT 0.00,
    gain_override NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TAX PAYMENTS LOG TABLE
CREATE TABLE IF NOT EXISTS public.tax_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    financial_year VARCHAR(20) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'UPI',
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    reference_no VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_payments ENABLE ROW LEVEL SECURITY;

-- POLICIES: Users can access their own data or public demo data
CREATE POLICY "Users can manage their own parties" ON public.parties
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own ipos" ON public.ipos
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own ipo_applications" ON public.ipo_applications
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own money_transactions" ON public.money_transactions
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own tax_records" ON public.tax_records
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own tax_payments" ON public.tax_payments
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
