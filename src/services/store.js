import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Universal Initial Seed Data for Real-World Shared Visibility across all Visitors & Members
const DEFAULT_PARTIES = [];
const DEFAULT_IPOS = [];
const DEFAULT_APPLICATIONS = [];
const DEFAULT_TRANSACTIONS = [];
const DEFAULT_TAX_RECORDS = [];
const DEFAULT_TAX_PAYMENTS = [];

// Local Storage Helper
const getLocalData = (key, defaultVal = []) => {
  try {
    const data = localStorage.getItem(`IPO_STORE_${key}`);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // If empty or first visit, seed default data
    if (Array.isArray(defaultVal) && defaultVal.length > 0) {
      localStorage.setItem(`IPO_STORE_${key}`, JSON.stringify(defaultVal));
    }
    return defaultVal;
  } catch (err) {
    return defaultVal;
  }
};

const setLocalData = (key, val) => {
  try {
    localStorage.setItem(`IPO_STORE_${key}`, JSON.stringify(val));
  } catch (err) {
    console.error('LocalStorage error:', err);
  }
};

// EXPORTED STORE DATA FETCHERS & MUTATORS
export const fetchStoreData = async () => {
  if (isSupabaseConfigured && supabase) {
    try {
      const [
        { data: parties },
        { data: ipos },
        { data: applications },
        { data: transactions },
        { data: taxRecords },
        { data: taxPayments }
      ] = await Promise.all([
        supabase.from('parties').select('*').order('created_at', { ascending: true }),
        supabase.from('ipos').select('*').order('created_at', { ascending: false }),
        supabase.from('ipo_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('money_transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('tax_records').select('*').order('created_at', { ascending: false }),
        supabase.from('tax_payments').select('*').order('created_at', { ascending: false })
      ]);
      
      return { 
        parties: parties || [], 
        ipos: ipos || [], 
        applications: applications || [], 
        transactions: transactions || [], 
        taxRecords: taxRecords || [], 
        taxPayments: taxPayments || [], 
        isSupabase: true,
        dbType: 'Supabase Cloud Database' 
      };
    } catch (err) {
      console.error('Supabase fetch error:', err);
    }
  }

  // 2. Fallback to Universal LocalStorage
  const parties = getLocalData('PARTIES', DEFAULT_PARTIES);
  const ipos = getLocalData('IPOS', DEFAULT_IPOS);
  const applications = getLocalData('APPLICATIONS', DEFAULT_APPLICATIONS);
  const transactions = getLocalData('TRANSACTIONS', DEFAULT_TRANSACTIONS);
  const taxRecords = getLocalData('TAX_RECORDS', DEFAULT_TAX_RECORDS);
  const taxPayments = getLocalData('TAX_PAYMENTS', DEFAULT_TAX_PAYMENTS);

  return { parties, ipos, applications, transactions, taxRecords, taxPayments, isSupabase: false, dbType: 'Local Storage Demo' };
};

// CLEAR ALL DATA
export const clearAllStoreData = async () => {
  localStorage.removeItem('IPO_STORE_PARTIES');
  localStorage.removeItem('IPO_STORE_IPOS');
  localStorage.removeItem('IPO_STORE_APPLICATIONS');
  localStorage.removeItem('IPO_STORE_TRANSACTIONS');
  localStorage.removeItem('IPO_STORE_TAX_RECORDS');
  localStorage.removeItem('IPO_STORE_TAX_PAYMENTS');
};

// SAVE PARTY
export const saveParty = async (partyData) => {
  const newParty = {
    user_email: partyData.user_email || null,
    name: partyData.name,
    pan: partyData.pan || '',
    demat_no: partyData.demat_no || '',
    bank_name: partyData.bank_name || '',
    bank_account: partyData.bank_account || '',
    upi_id: partyData.upi_id || '',
    initial_balance: parseFloat(partyData.initial_balance || 0),
    created_at: partyData.created_at || new Date().toISOString()
  };

  if (partyData.id && !partyData.id.startsWith('p-')) {
    newParty.id = partyData.id;
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('parties').upsert(newParty).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  if (!newParty.id) newParty.id = partyData.id || `p-${Date.now()}`;
  const current = getLocalData('PARTIES', []);
  const index = current.findIndex(p => p.id === newParty.id);
  if (index >= 0) current[index] = newParty;
  else current.unshift(newParty);
  setLocalData('PARTIES', current);

  return newParty;
};

export const deleteParty = async (id) => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('parties').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const current = getLocalData('PARTIES', []);
  const updated = current.filter(p => p.id !== id);
  setLocalData('PARTIES', updated);
};

// SAVE IPO
export const saveIPO = async (ipoData) => {
  const newIPO = {
    user_email: ipoData.user_email || null,
    company_name: ipoData.company_name,
    symbol: ipoData.symbol || '',
    price_per_share: parseFloat(ipoData.price_per_share || 0),
    lot_size: parseInt(ipoData.lot_size || 1, 10),
    bidding_start_date: ipoData.bidding_start_date || new Date().toISOString(),
    bidding_end_date: ipoData.bidding_end_date || new Date().toISOString(),
    allotment_date: ipoData.allotment_date || new Date().toISOString(),
    listing_date: ipoData.listing_date || new Date().toISOString(),
    status: ipoData.status || 'OPEN',
    created_at: ipoData.created_at || new Date().toISOString()
  };

  if (ipoData.id && !ipoData.id.startsWith('ipo-')) {
    newIPO.id = ipoData.id;
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('ipos').upsert(newIPO).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  if (!newIPO.id) newIPO.id = ipoData.id || `ipo-${Date.now()}`;
  const current = getLocalData('IPOS', []);
  const index = current.findIndex(i => i.id === newIPO.id);
  if (index >= 0) current[index] = newIPO;
  else current.unshift(newIPO);
  setLocalData('IPOS', current);

  return newIPO;
};

export const deleteIPO = async (id) => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('ipos').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const current = getLocalData('IPOS', []);
  const updated = current.filter(i => i.id !== id);
  setLocalData('IPOS', updated);
};

// SAVE APPLICATION
export const saveApplication = async (appData) => {
  const sharesApplied = parseInt(appData.lots_applied || 1, 10) * parseInt(appData.lot_size || 1, 10);
  const amountApplied = sharesApplied * parseFloat(appData.price_per_share || 0);
  const appDate = appData.application_date || new Date().toISOString();

  const newApp = {
    user_email: appData.user_email || null,
    ipo_id: appData.ipo_id,
    party_id: appData.party_id,
    application_no: appData.application_no || `APP-${Math.floor(100000 + Math.random() * 900000)}`,
    lots_applied: parseInt(appData.lots_applied || 1, 10),
    shares_applied: sharesApplied,
    amount_applied: amountApplied,
    allotment_status: appData.allotment_status || 'PENDING',
    lots_allotted: parseInt(appData.lots_allotted || 0, 10),
    shares_allotted: parseInt(appData.shares_allotted || 0, 10),
    amount_allotted: parseFloat(appData.amount_allotted || 0),
    refund_amount: parseFloat(appData.refund_amount || 0),
    profit_loss: parseFloat(appData.profit_loss || 0),
    payment_status: appData.payment_status || 'PAID',
    application_date: appDate,
    notes: appData.notes || '',
    created_at: appData.created_at || new Date().toISOString()
  };

  if (appData.id && !appData.id.startsWith('app-')) {
    newApp.id = appData.id;
  }
  
  const isNew = !appData.id;
  let finalApp = newApp;

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('ipo_applications').upsert(newApp).select().single();
    if (error) throw new Error(error.message);
    else finalApp = data;
  } else {
    if (!newApp.id) newApp.id = `app-${Date.now()}`;
    const currentApps = getLocalData('APPLICATIONS', []);
    const index = currentApps.findIndex(a => a.id === newApp.id);
    if (index >= 0) currentApps[index] = newApp;
    else currentApps.unshift(newApp);
    setLocalData('APPLICATIONS', currentApps);
    finalApp = newApp;
  }

  if (isNew) {
    await saveTransaction({
      user_email: finalApp.user_email,
      application_id: finalApp.id,
      from_party_id: finalApp.party_id,
      to_party_id: null,
      amount: finalApp.amount_applied,
      transaction_type: 'IPO_APPLICATION',
      payment_mode: appData.payment_mode || 'ASBA',
      transaction_date: appDate,
      notes: `Application payment for ${appData.company_name || 'IPO'}`
    });
  }

  return finalApp;
};

export const deleteApplication = async (id) => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('ipo_applications').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const current = getLocalData('APPLICATIONS', []);
  const updated = current.filter(a => a.id !== id);
  setLocalData('APPLICATIONS', updated);
};

// SAVE TRANSACTION
export const saveTransaction = async (txData) => {
  const newTx = {
    user_email: txData.user_email || null,
    application_id: txData.application_id || null,
    from_party_id: txData.from_party_id,
    to_party_id: txData.to_party_id,
    amount: parseFloat(txData.amount || 0),
    transaction_type: txData.transaction_type || 'DIRECT_TRANSFER',
    payment_mode: txData.payment_mode || 'UPI',
    transaction_date: txData.transaction_date || new Date().toISOString(),
    notes: txData.notes || '',
    created_at: txData.created_at || new Date().toISOString()
  };

  if (txData.id && !txData.id.startsWith('tx-')) {
    newTx.id = txData.id;
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('money_transactions').upsert(newTx).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  if (!newTx.id) newTx.id = `tx-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  const currentTxs = getLocalData('TRANSACTIONS', []);
  const index = currentTxs.findIndex(t => t.id === newTx.id);
  if (index >= 0) currentTxs[index] = newTx;
  else currentTxs.unshift(newTx);
  setLocalData('TRANSACTIONS', currentTxs);

  return newTx;
};

export const deleteTransaction = async (id) => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('money_transactions').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const current = getLocalData('TRANSACTIONS', []);
  const updated = current.filter(t => t.id !== id);
  setLocalData('TRANSACTIONS', updated);
};

// UPDATE ALLOTMENT STATUS
export const updateAllotmentStatus = async (applicationId, status, allottedLots = 0, profit = 0) => {
  let app;
  let ipo;
  
  if (isSupabaseConfigured && supabase) {
    const { data: fetchedApp } = await supabase.from('ipo_applications').select('*').eq('id', applicationId).single();
    if (!fetchedApp) return;
    app = fetchedApp;
    const { data: fetchedIpo } = await supabase.from('ipos').select('*').eq('id', app.ipo_id).single();
    ipo = fetchedIpo;
  } else {
    const apps = getLocalData('APPLICATIONS', []);
    const ipos = getLocalData('IPOS', []);
    app = apps.find(a => a.id === applicationId);
    if (!app) return;
    ipo = ipos.find(i => i.id === app.ipo_id);
  }

  const lotSize = ipo ? ipo.lot_size : 1;
  const price = ipo ? ipo.price_per_share : (app.amount_applied / app.shares_applied);

  let lotsAllotted = 0;
  let sharesAllotted = 0;
  let amountAllotted = 0;
  let refundAmount = 0;
  let profitLoss = parseFloat(profit || 0);
  let paymentStatus = 'PAID';

  if (status === 'ALLOTTED') {
    lotsAllotted = allottedLots || app.lots_applied;
    sharesAllotted = lotsAllotted * lotSize;
    amountAllotted = sharesAllotted * price;
    refundAmount = app.amount_applied - amountAllotted;
  } else if (status === 'NOT_ALLOTTED') {
    lotsAllotted = 0;
    sharesAllotted = 0;
    amountAllotted = 0;
    refundAmount = app.amount_applied;
    paymentStatus = 'REFUNDED';
  }

  app.allotment_status = status;
  app.lots_allotted = lotsAllotted;
  app.shares_allotted = sharesAllotted;
  app.amount_allotted = amountAllotted;
  app.refund_amount = refundAmount;
  app.profit_loss = profitLoss;
  app.payment_status = paymentStatus;

  await saveApplication(app);

  // Remove existing refund/profit transactions for this application to avoid duplicates
  if (isSupabaseConfigured && supabase) {
    await supabase.from('money_transactions').delete().eq('application_id', app.id).in('transaction_type', ['IPO_REFUND', 'PROFIT_DISTRIBUTION']);
  } else {
    const currentTxs = getLocalData('TRANSACTIONS', []);
    const filteredTxs = currentTxs.filter(t => !(t.application_id === app.id && ['IPO_REFUND', 'PROFIT_DISTRIBUTION'].includes(t.transaction_type)));
    setLocalData('TRANSACTIONS', filteredTxs);
  }

  if (refundAmount > 0) {
    await saveTransaction({
      application_id: app.id,
      from_party_id: null,
      to_party_id: app.party_id,
      amount: refundAmount,
      transaction_type: 'IPO_REFUND',
      payment_mode: 'ASBA_UNBLOCK',
      transaction_date: new Date().toISOString(),
      notes: `Refund received for ${ipo ? ipo.company_name : 'IPO'} (${status})`
    });
  }

  if (profitLoss > 0) {
    await saveTransaction({
      application_id: app.id,
      from_party_id: null,
      to_party_id: app.party_id,
      amount: profitLoss,
      transaction_type: 'PROFIT_DISTRIBUTION',
      payment_mode: 'BANK_CREDIT',
      transaction_date: new Date().toISOString(),
      notes: `Listing gain / profit payout for ${ipo ? ipo.company_name : 'IPO'}`
    });
  }
};

// CALCULATE PARTY BALANCES
export const calculatePartyBalances = (parties, transactions) => {
  return parties.map(party => {
    let moneyReceived = 0;
    let moneySent = 0;
    let currentBalance = parseFloat(party.initial_balance || 0);

    transactions.forEach(tx => {
      const amt = parseFloat(tx.amount || 0);
      const isInternalIpoTx = ['IPO_APPLICATION', 'IPO_REFUND', 'PROFIT_DISTRIBUTION'].includes(tx.transaction_type);
      
      // Calculate Available Balance (ALL transactions affect this, including IPO blocks)
      if (tx.to_party_id === party.id) currentBalance += amt;
      if (tx.from_party_id === party.id) currentBalance -= amt;

      // For dashboard metrics (In/Out), exclude IPO internal movements
      // so it doesn't artificially inflate the user's cash flow totals.
      if (tx.to_party_id === party.id && !isInternalIpoTx) {
        moneyReceived += amt;
      }
      if (tx.from_party_id === party.id && !isInternalIpoTx) {
        moneySent += amt;
      }
    });

    const netCashFlow = currentBalance - parseFloat(party.initial_balance || 0);

    return {
      ...party,
      moneyReceived,
      moneySent,
      netCashFlow,
      currentBalance
    };
  });
};

// GET INDIAN FINANCIAL YEAR FROM DATE STRING
export const getFinancialYear = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return 'FY 2026-27';
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed: 3 = April
  if (month >= 3) {
    const nextYr = (year + 1).toString().slice(2);
    return `FY ${year}-${nextYr}`;
  } else {
    const currYrStr = year.toString().slice(2);
    return `FY ${year - 1}-${currYrStr}`;
  }
};

// SAVE TAX CONFIG RECORD (Per party per FY)
export const saveTaxRecord = async (taxData) => {
  const newRecord = {
    user_email: taxData.user_email || null,
    party_id: taxData.party_id,
    financial_year: taxData.financial_year,
    tax_rate: parseFloat(taxData.tax_rate ?? 20),
    fee_per_allotment: parseFloat(taxData.fee_per_allotment ?? 0),
    gain_override: taxData.gain_override !== undefined && taxData.gain_override !== null && taxData.gain_override !== '' ? parseFloat(taxData.gain_override) : null,
    notes: taxData.notes || '',
    created_at: taxData.created_at || new Date().toISOString()
  };

  if (taxData.id && !taxData.id.startsWith('tr-')) {
    newRecord.id = taxData.id;
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('tax_records').upsert(newRecord).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  if (!newRecord.id) newRecord.id = `tr-${Date.now()}`;
  const current = getLocalData('TAX_RECORDS', []);
  const index = current.findIndex(r => r.id === newRecord.id);
  if (index >= 0) current[index] = newRecord;
  else current.unshift(newRecord);
  setLocalData('TAX_RECORDS', current);

  return newRecord;
};

// SAVE TAX PAYMENT LOG
export const saveTaxPayment = async (payData) => {
  const newPay = {
    user_email: payData.user_email || null,
    party_id: payData.party_id,
    financial_year: payData.financial_year,
    amount: parseFloat(payData.amount || 0),
    payment_mode: payData.payment_mode || 'UPI',
    payment_date: payData.payment_date || new Date().toISOString(),
    reference_no: payData.reference_no || '',
    notes: payData.notes || '',
    created_at: payData.created_at || new Date().toISOString()
  };

  if (payData.id && !payData.id.startsWith('tp-')) {
    newPay.id = payData.id;
  }

  let finalPay = newPay;
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('tax_payments').upsert(newPay).select().single();
    if (error) throw new Error(error.message);
    else finalPay = data;
  } else {
    if (!newPay.id) newPay.id = `tp-${Date.now()}`;
    const current = getLocalData('TAX_PAYMENTS', []);
    const index = current.findIndex(p => p.id === newPay.id);
    if (index >= 0) current[index] = newPay;
    else current.unshift(newPay);
    setLocalData('TAX_PAYMENTS', current);
    finalPay = newPay;
  }

  // Automatically record money_transaction of type TAX_COLLECTION
  try {
    await saveTransaction({
      user_email: finalPay.user_email,
      from_party_id: finalPay.party_id,
      to_party_id: null,
      amount: finalPay.amount,
      transaction_type: 'TAX_COLLECTION',
      payment_mode: finalPay.payment_mode,
      transaction_date: finalPay.payment_date,
      notes: `ITR Tax Collection for ${finalPay.financial_year}. Ref: ${finalPay.reference_no || 'N/A'}`
    });
  } catch (e) {}

  return finalPay;
};

export const deleteTaxPayment = async (id) => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('tax_payments').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const current = getLocalData('TAX_PAYMENTS', []);
  const updated = current.filter(p => p.id !== id);
  setLocalData('TAX_PAYMENTS', updated);
};

export const clearAllTaxPayments = async (partyId = null, financialYear = null) => {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('tax_payments').delete();
    if (partyId) query = query.eq('party_id', partyId);
    if (financialYear && financialYear !== 'ALL') query = query.eq('financial_year', financialYear);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return;
  }

  const current = getLocalData('TAX_PAYMENTS', []);
  const remaining = current.filter(p => {
    if (partyId && p.party_id === partyId) return false;
    if (financialYear && financialYear !== 'ALL' && p.financial_year === financialYear) return false;
    return true;
  });
  setLocalData('TAX_PAYMENTS', remaining);
};
