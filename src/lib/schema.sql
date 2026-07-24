-- =========================================================
-- IPO MANAGEMENT & MONEY FLOW LEDGER SYSTEM - SUPABASE SCHEMA
-- Execute this SQL script in the Supabase SQL Editor
-- Project: https://pghcncsmnlpbcqdtxzvo.supabase.co
-- =========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PARTIES / MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255),
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
    user_email VARCHAR(255),
    company_name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50),
    price_per_share NUMERIC(10,2) NOT NULL,
    lot_size INT NOT NULL DEFAULT 1,
    bidding_start_date TIMESTAMPTZ,
    bidding_end_date TIMESTAMPTZ,
    allotment_date TIMESTAMPTZ,
    listing_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. IPO APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.ipo_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255),
    ipo_id UUID REFERENCES public.ipos(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    application_no VARCHAR(50),
    lots_applied INT DEFAULT 1,
    shares_applied INT NOT NULL,
    amount_applied NUMERIC(12,2) NOT NULL,
    allotment_status VARCHAR(50) DEFAULT 'PENDING',
    lots_allotted INT DEFAULT 0,
    shares_allotted INT DEFAULT 0,
    amount_allotted NUMERIC(12,2) DEFAULT 0.00,
    refund_amount NUMERIC(12,2) DEFAULT 0.00,
    profit_loss NUMERIC(12,2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'PAID',
    payment_mode VARCHAR(50) DEFAULT 'ASBA',
    application_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MONEY TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.money_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255),
    application_id UUID REFERENCES public.ipo_applications(id) ON DELETE SET NULL,
    from_party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
    to_party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'UPI',
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TAX RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.tax_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255),
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    financial_year VARCHAR(20) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 20.00,
    fee_per_allotment NUMERIC(10,2) DEFAULT 0.00,
    gain_override NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TAX PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.tax_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255),
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    financial_year VARCHAR(20) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'UPI',
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    reference_no VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================================
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_payments ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- DROP OLD POLICIES (if any exist from previous runs)
-- =========================================================
DROP POLICY IF EXISTS "Public read access for parties" ON public.parties;
DROP POLICY IF EXISTS "Authenticated write access for parties" ON public.parties;
DROP POLICY IF EXISTS "Public read access for ipos" ON public.ipos;
DROP POLICY IF EXISTS "Authenticated write access for ipos" ON public.ipos;
DROP POLICY IF EXISTS "Public read access for ipo_applications" ON public.ipo_applications;
DROP POLICY IF EXISTS "Authenticated write access for ipo_applications" ON public.ipo_applications;
DROP POLICY IF EXISTS "Public read access for money_transactions" ON public.money_transactions;
DROP POLICY IF EXISTS "Authenticated write access for money_transactions" ON public.money_transactions;
DROP POLICY IF EXISTS "Public read access for tax_records" ON public.tax_records;
DROP POLICY IF EXISTS "Authenticated write access for tax_records" ON public.tax_records;
DROP POLICY IF EXISTS "Public read access for tax_payments" ON public.tax_payments;
DROP POLICY IF EXISTS "Authenticated write access for tax_payments" ON public.tax_payments;

-- =========================================================
-- OPEN POLICIES: Allow ALL operations for anon + authenticated
-- (Family-use app — admin bypass login handles security in app)
-- =========================================================
CREATE POLICY "Allow all for parties" ON public.parties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for ipos" ON public.ipos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for ipo_applications" ON public.ipo_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for money_transactions" ON public.money_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for tax_records" ON public.tax_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for tax_payments" ON public.tax_payments FOR ALL USING (true) WITH CHECK (true);

-- =========================================================
-- 7. CHATBOT SESSIONS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255),
    title VARCHAR(255) DEFAULT 'New Chat Session',
    system_prompt_version VARCHAR(50) DEFAULT 'v1.0',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 8. CHATBOT MESSAGES TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system', 'tool', 'guardrail_alert'
    content TEXT NOT NULL,
    guardrail_status JSONB DEFAULT '{"passed": true}'::jsonb,
    tools_used JSONB DEFAULT '[]'::jsonb,
    langsmith_trace_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 9. AI SECURITY AUDIT LOGS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    event_type VARCHAR(100) NOT NULL, -- 'PROMPT_INJECTION', 'PII_DETECTED', 'UNAUTHORIZED_TOOL', 'OUTPUT_LEAK_PREVENTED', 'OFF_TOPIC'
    threat_level VARCHAR(50) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    input_text TEXT,
    sanitized_text TEXT,
    action_taken VARCHAR(100) NOT NULL, -- 'BLOCKED', 'SANITIZED', 'AUDITED', 'WARNING_SENT'
    details JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 10. LANGGRAPH STATE CHECKPOINTER TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.langgraph_checkpoints (
    thread_id VARCHAR(255) NOT NULL,
    checkpoint_ns VARCHAR(255) NOT NULL DEFAULT '',
    checkpoint_id VARCHAR(255) NOT NULL,
    parent_checkpoint_id VARCHAR(255),
    checkpoint JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

-- RLS & Policies for Chatbot Tables
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.langgraph_checkpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for chat_sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Allow all for chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all for security_audit_logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Allow all for langgraph_checkpoints" ON public.langgraph_checkpoints;

CREATE POLICY "Allow all for chat_sessions" ON public.chat_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for security_audit_logs" ON public.security_audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for langgraph_checkpoints" ON public.langgraph_checkpoints FOR ALL USING (true) WITH CHECK (true);

