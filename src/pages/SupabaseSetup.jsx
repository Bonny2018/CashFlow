import React, { useState } from 'react';
import { updateSupabaseCredentials, isSupabaseConfigured } from '../lib/supabase';
import { 
  Database, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Key, 
  RefreshCw, 
  Sparkles,
  ShieldCheck,
  Code
} from 'lucide-react';

const SQL_SCHEMA = `-- Execute this in Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS public.parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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


CREATE TABLE IF NOT EXISTS public.ipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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


CREATE TABLE IF NOT EXISTS public.ipo_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    application_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS public.money_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255),
    application_id UUID REFERENCES public.ipo_applications(id) ON DELETE SET NULL,
    from_party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    to_party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'UPI',
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS public.tax_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255),
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    financial_year VARCHAR(20) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 20.00,
    fee_per_allotment NUMERIC(10,2) DEFAULT 0.00,
    gain_override NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS public.tax_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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


-- RLS POLICIES
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_payments ENABLE ROW LEVEL SECURITY;

-- POLICIES: Everyone can read, but only Admin can modify
CREATE POLICY "Public read access for parties" ON public.parties FOR SELECT USING (true);
CREATE POLICY "Admin write access for parties" ON public.parties FOR ALL USING (auth.jwt() ->> 'email' IN ('mohitsjain12104@gmail.com', 'mohitsjain12104@gmail'));

CREATE POLICY "Public read access for ipos" ON public.ipos FOR SELECT USING (true);
CREATE POLICY "Admin write access for ipos" ON public.ipos FOR ALL USING (auth.jwt() ->> 'email' IN ('mohitsjain12104@gmail.com', 'mohitsjain12104@gmail'));

CREATE POLICY "Public read access for ipo_applications" ON public.ipo_applications FOR SELECT USING (true);
CREATE POLICY "Admin write access for ipo_applications" ON public.ipo_applications FOR ALL USING (auth.jwt() ->> 'email' IN ('mohitsjain12104@gmail.com', 'mohitsjain12104@gmail'));

CREATE POLICY "Public read access for money_transactions" ON public.money_transactions FOR SELECT USING (true);
CREATE POLICY "Admin write access for money_transactions" ON public.money_transactions FOR ALL USING (auth.jwt() ->> 'email' IN ('mohitsjain12104@gmail.com', 'mohitsjain12104@gmail'));
`;

export default function SupabaseSetup() {
  const [url, setUrl] = useState(localStorage.getItem('IPO_SUPABASE_URL') || '');
  const [key, setKey] = useState(localStorage.getItem('IPO_SUPABASE_ANON_KEY') || '');
  const [copied, setCopied] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateSupabaseCredentials(url, key);
  };

  const handleClear = () => {
    updateSupabaseCredentials('', '');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto pb-12">
      
      {/* Status Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Database className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white">Supabase Database Integration</h2>
            <p className="text-xs text-slate-400">Manage cloud database backend & SQL schema</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 border ${
            isSupabaseConfigured 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isSupabaseConfigured ? 'Cloud Database Connected' : 'Local Storage Demo Mode'}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Credentials Form */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Key className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display font-semibold text-base text-white">API Credentials</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Supabase Project URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyz.supabase.co"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white placeholder-slate-600 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Supabase Anon Key</label>
              <textarea
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJh..."
                rows="3"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white placeholder-slate-600 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20"
              >
                Connect Supabase
              </button>
              {isSupabaseConfigured && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition border border-slate-700"
                >
                  Disconnect
                </button>
              )}
            </div>
          </form>
        </div>

        {/* SQL Schema Copy Box */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-indigo-400" />
              <h3 className="font-display font-semibold text-base text-white">Database SQL Schema</h3>
            </div>

            <button
              onClick={handleCopySql}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied SQL!' : 'Copy SQL'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Copy and run this SQL query in your Supabase SQL Editor to instantly construct the 6 core tables: <code className="text-emerald-400">parties</code>, <code className="text-emerald-400">ipos</code>, <code className="text-emerald-400">ipo_applications</code>, <code className="text-emerald-400">money_transactions</code>, <code className="text-emerald-400">tax_records</code>, and <code className="text-emerald-400">tax_payments</code>.
          </p>

          <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto no-scrollbar">
            {SQL_SCHEMA}
          </pre>
        </div>

      </div>

    </div>
  );
}
