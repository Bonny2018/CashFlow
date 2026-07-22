const getApiUrl = () => {
  const host = typeof window !== 'undefined' && window.location && window.location.hostname ? window.location.hostname : 'localhost';
  return `http://${host}:3001/api`;
};

// Universal Initial Seed Data for Real-World Shared Visibility across all Visitors & Members
const DEFAULT_PARTIES = [
  {
    id: 'p-raj-vidja',
    name: 'Raj Vidja',
    pan: 'ABCDE1234F',
    demat_no: '1208160012345678',
    bank_name: 'HDFC Bank',
    bank_account: '9876543210',
    upi_id: 'rajvidja@hdfc',
    initial_balance: 50000,
    created_at: '2026-04-01T10:00:00.000Z'
  },
  {
    id: 'p-piyush-sen',
    name: 'Piyush Sen',
    pan: 'FGHIJ5678K',
    demat_no: '1208160087654321',
    bank_name: 'ICICI Bank',
    bank_account: '8765432109',
    upi_id: 'piyushsen@icici',
    initial_balance: 40000,
    created_at: '2026-04-01T10:30:00.000Z'
  },
  {
    id: 'p-mohit-jain',
    name: 'Mohit Jain',
    pan: 'LMNOP9012Q',
    demat_no: '1208160011223344',
    bank_name: 'State Bank of India',
    bank_account: '7654321098',
    upi_id: 'mohitjain@sbi',
    initial_balance: 60000,
    created_at: '2026-04-01T11:00:00.000Z'
  },
  {
    id: 'p-nikhil-khilwani',
    name: 'Nikhil Khilwani',
    pan: 'QRSTU3456V',
    demat_no: '1208160055667788',
    bank_name: 'Axis Bank',
    bank_account: '6543210987',
    upi_id: 'nikhilk@axis',
    initial_balance: 35000,
    created_at: '2026-04-01T11:30:00.000Z'
  },
  {
    id: 'p-rajesh-sharma',
    name: 'Rajesh Sharma',
    pan: 'WXYZA7890B',
    demat_no: '1208160099001122',
    bank_name: 'Kotak Bank',
    bank_account: '5432109876',
    upi_id: 'rajesh@kotak',
    initial_balance: 45000,
    created_at: '2026-04-01T12:00:00.000Z'
  }
];

const DEFAULT_IPOS = [
  {
    id: 'ipo-swiggy',
    company_name: 'Swiggy Limited',
    symbol: 'SWIGGY',
    price_per_share: 390,
    lot_size: 38,
    bidding_start_date: '2026-07-06T00:00',
    bidding_end_date: '2026-07-08T00:00',
    allotment_date: '2026-07-11T00:00',
    listing_date: '2026-07-13T00:00',
    status: 'LISTED',
    created_at: '2026-07-01T10:00:00.000Z'
  },
  {
    id: 'ipo-hyundai',
    company_name: 'Hyundai Motor India',
    symbol: 'HYUNDAI',
    price_per_share: 1960,
    lot_size: 7,
    bidding_start_date: '2026-07-10T00:00',
    bidding_end_date: '2026-07-14T00:00',
    allotment_date: '2026-07-16T00:00',
    listing_date: '2026-07-18T00:00',
    status: 'LISTED',
    created_at: '2026-07-05T10:00:00.000Z'
  },
  {
    id: 'ipo-ntpc',
    company_name: 'NTPC Green Energy',
    symbol: 'NTPCGREEN',
    price_per_share: 108,
    lot_size: 138,
    bidding_start_date: '2026-07-15T00:00',
    bidding_end_date: '2026-07-18T00:00',
    allotment_date: '2026-07-20T00:00',
    listing_date: '2026-07-22T00:00',
    status: 'ALLOTTED',
    created_at: '2026-07-10T10:00:00.000Z'
  }
];

const DEFAULT_APPLICATIONS = [
  {
    id: 'app-1',
    ipo_id: 'ipo-swiggy',
    party_id: 'p-raj-vidja',
    application_no: 'SWG-2026-881',
    lots_applied: 1,
    shares_applied: 38,
    amount_applied: 14820,
    allotment_status: 'ALLOTTED',
    lots_allotted: 1,
    shares_allotted: 38,
    amount_allotted: 14820,
    refund_amount: 0,
    profit_loss: 5400,
    payment_status: 'PAID',
    application_date: '2026-07-07T14:30',
    notes: 'Allotted 1 Lot - HDFC Bank ASBA',
    created_at: '2026-07-07T14:30:00.000Z'
  },
  {
    id: 'app-2',
    ipo_id: 'ipo-hyundai',
    party_id: 'p-piyush-sen',
    application_no: 'HYU-2026-442',
    lots_applied: 1,
    shares_applied: 7,
    amount_applied: 13720,
    allotment_status: 'ALLOTTED',
    lots_allotted: 1,
    shares_allotted: 7,
    amount_allotted: 13720,
    refund_amount: 0,
    profit_loss: 2800,
    payment_status: 'PAID',
    application_date: '2026-07-12T11:15',
    notes: 'Allotted 1 Lot - ICICI Bank ASBA',
    created_at: '2026-07-12T11:15:00.000Z'
  },
  {
    id: 'app-3',
    ipo_id: 'ipo-swiggy',
    party_id: 'p-mohit-jain',
    application_no: 'SWG-2026-905',
    lots_applied: 1,
    shares_applied: 38,
    amount_applied: 14820,
    allotment_status: 'ALLOTTED',
    lots_allotted: 1,
    shares_allotted: 38,
    amount_allotted: 14820,
    refund_amount: 0,
    profit_loss: 4900,
    payment_status: 'PAID',
    application_date: '2026-07-07T16:00',
    notes: 'Allotted 1 Lot - SBI ASBA',
    created_at: '2026-07-07T16:00:00.000Z'
  },
  {
    id: 'app-4',
    ipo_id: 'ipo-ntpc',
    party_id: 'p-nikhil-khilwani',
    application_no: 'NTPC-2026-119',
    lots_applied: 1,
    shares_applied: 138,
    amount_applied: 14904,
    allotment_status: 'NOT_ALLOTTED',
    lots_allotted: 0,
    shares_allotted: 0,
    amount_allotted: 0,
    refund_amount: 14904,
    profit_loss: 0,
    payment_status: 'REFUNDED',
    application_date: '2026-07-16T10:45',
    notes: 'Refunded back to Axis Bank account',
    created_at: '2026-07-16T10:45:00.000Z'
  },
  {
    id: 'app-5',
    ipo_id: 'ipo-hyundai',
    party_id: 'p-raj-vidja',
    application_no: 'HYU-2026-551',
    lots_applied: 1,
    shares_applied: 7,
    amount_applied: 13720,
    allotment_status: 'ALLOTTED',
    lots_allotted: 1,
    shares_allotted: 7,
    amount_allotted: 13720,
    refund_amount: 0,
    profit_loss: 3600,
    payment_status: 'PAID',
    application_date: '2026-07-13T09:30',
    notes: 'Allotted 1 Lot',
    created_at: '2026-07-13T09:30:00.000Z'
  }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx-1',
    application_id: 'app-1',
    from_party_id: 'p-bank',
    to_party_id: 'p-raj-vidja',
    amount: 5400,
    transaction_type: 'PROFIT_DISTRIBUTION',
    payment_mode: 'BANK_CREDIT',
    transaction_date: '2026-07-13T10:00',
    notes: 'Listing gain payout for Swiggy Limited',
    created_at: '2026-07-13T10:00:00.000Z'
  },
  {
    id: 'tx-2',
    application_id: 'app-2',
    from_party_id: 'p-bank',
    to_party_id: 'p-piyush-sen',
    amount: 2800,
    transaction_type: 'PROFIT_DISTRIBUTION',
    payment_mode: 'BANK_CREDIT',
    transaction_date: '2026-07-18T10:00',
    notes: 'Listing gain payout for Hyundai Motor',
    created_at: '2026-07-18T10:00:00.000Z'
  },
  {
    id: 'tx-3',
    application_id: 'app-4',
    from_party_id: 'p-bank',
    to_party_id: 'p-nikhil-khilwani',
    amount: 14904,
    transaction_type: 'IPO_REFUND',
    payment_mode: 'ASBA_UNBLOCK',
    transaction_date: '2026-07-20T10:00',
    notes: 'Refund unblocked for NTPC Green Energy',
    created_at: '2026-07-20T10:00:00.000Z'
  }
];

const DEFAULT_TAX_RECORDS = [
  {
    id: 'tr-1',
    party_id: 'p-raj-vidja',
    financial_year: 'FY 2026-27',
    tax_rate: 20,
    fee_per_allotment: 0,
    gain_override: null,
    notes: 'Standard 20% STCG Rate',
    created_at: '2026-07-01T10:00:00.000Z'
  },
  {
    id: 'tr-2',
    party_id: 'p-piyush-sen',
    financial_year: 'FY 2026-27',
    tax_rate: 20,
    fee_per_allotment: 0,
    gain_override: null,
    notes: 'Standard 20% STCG Rate',
    created_at: '2026-07-01T10:00:00.000Z'
  },
  {
    id: 'tr-3',
    party_id: 'p-mohit-jain',
    financial_year: 'FY 2026-27',
    tax_rate: 20,
    fee_per_allotment: 0,
    gain_override: null,
    notes: 'Standard 20% STCG Rate',
    created_at: '2026-07-01T10:00:00.000Z'
  }
];

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
  // 1. Try SQLite Backend first
  try {
    const res = await fetch(`${getApiUrl()}/data`);
    if (res.ok) {
      const data = await res.json();
      if (data.parties && data.parties.length > 0) {
        return {
          parties: data.parties || [],
          ipos: data.ipos || [],
          applications: data.applications || [],
          transactions: data.transactions || [],
          taxRecords: data.taxRecords || [],
          taxPayments: data.taxPayments || [],
          dbType: 'SQLite (ipo_ledger.db)'
        };
      }
    }
  } catch (e) {}

  // 2. Fallback to Universal LocalStorage / Universal Default Shared State
  const parties = getLocalData('PARTIES', DEFAULT_PARTIES);
  const ipos = getLocalData('IPOS', DEFAULT_IPOS);
  const applications = getLocalData('APPLICATIONS', DEFAULT_APPLICATIONS);
  const transactions = getLocalData('TRANSACTIONS', DEFAULT_TRANSACTIONS);
  const taxRecords = getLocalData('TAX_RECORDS', DEFAULT_TAX_RECORDS);
  const taxPayments = getLocalData('TAX_PAYMENTS', DEFAULT_TAX_PAYMENTS);

  return { parties, ipos, applications, transactions, taxRecords, taxPayments, dbType: 'Universal Shared Ledger' };
};

// CLEAR ALL DATA
export const clearAllStoreData = async () => {
  try {
    await fetch(`${getApiUrl()}/reset`, { method: 'POST' });
  } catch (e) {}

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
    id: partyData.id || `p-${Date.now()}`,
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

  try {
    await fetch(`${getApiUrl()}/parties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newParty)
    });
  } catch (e) {}

  const current = getLocalData('PARTIES', []);
  const index = current.findIndex(p => p.id === newParty.id);
  if (index >= 0) current[index] = newParty;
  else current.unshift(newParty);
  setLocalData('PARTIES', current);

  return newParty;
};

// DELETE PARTY
export const deleteParty = async (id) => {
  try {
    await fetch(`${getApiUrl()}/parties/${id}`, { method: 'DELETE' });
  } catch (e) {}

  const current = getLocalData('PARTIES', []);
  const updated = current.filter(p => p.id !== id);
  setLocalData('PARTIES', updated);
};

// SAVE IPO
export const saveIPO = async (ipoData) => {
  const newIPO = {
    id: ipoData.id || `ipo-${Date.now()}`,
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

  try {
    await fetch(`${getApiUrl()}/ipos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newIPO)
    });
  } catch (e) {}

  const current = getLocalData('IPOS', []);
  const index = current.findIndex(i => i.id === newIPO.id);
  if (index >= 0) current[index] = newIPO;
  else current.unshift(newIPO);
  setLocalData('IPOS', current);

  return newIPO;
};

// DELETE IPO
export const deleteIPO = async (id) => {
  try {
    await fetch(`${getApiUrl()}/ipos/${id}`, { method: 'DELETE' });
  } catch (e) {}

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
    id: appData.id || `app-${Date.now()}`,
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

  try {
    await fetch(`${getApiUrl()}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp)
    });
  } catch (e) {}

  const currentApps = getLocalData('APPLICATIONS', []);
  const isNew = !appData.id;
  const index = currentApps.findIndex(a => a.id === newApp.id);
  if (index >= 0) currentApps[index] = newApp;
  else currentApps.unshift(newApp);
  setLocalData('APPLICATIONS', currentApps);

  if (isNew) {
    await saveTransaction({
      user_email: newApp.user_email,
      application_id: newApp.id,
      from_party_id: newApp.party_id,
      to_party_id: 'p-bank',
      amount: newApp.amount_applied,
      transaction_type: 'IPO_APPLICATION',
      payment_mode: appData.payment_mode || 'ASBA',
      transaction_date: appDate,
      notes: `Application payment for ${appData.company_name || 'IPO'}`
    });
  }

  return newApp;
};

// DELETE APPLICATION
export const deleteApplication = async (id) => {
  try {
    await fetch(`${getApiUrl()}/applications/${id}`, { method: 'DELETE' });
  } catch (e) {}

  const current = getLocalData('APPLICATIONS', []);
  const updated = current.filter(a => a.id !== id);
  setLocalData('APPLICATIONS', updated);
};

// SAVE TRANSACTION
export const saveTransaction = async (txData) => {
  const newTx = {
    id: txData.id || `tx-${Date.now()}-${Math.floor(Math.random()*1000)}`,
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

  try {
    await fetch(`${getApiUrl()}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTx)
    });
  } catch (e) {}

  const currentTxs = getLocalData('TRANSACTIONS', []);
  const index = currentTxs.findIndex(t => t.id === newTx.id);
  if (index >= 0) currentTxs[index] = newTx;
  else currentTxs.unshift(newTx);
  setLocalData('TRANSACTIONS', currentTxs);

  return newTx;
};

// DELETE TRANSACTION
export const deleteTransaction = async (id) => {
  try {
    await fetch(`${getApiUrl()}/transactions/${id}`, { method: 'DELETE' });
  } catch (e) {}

  const current = getLocalData('TRANSACTIONS', []);
  const updated = current.filter(t => t.id !== id);
  setLocalData('TRANSACTIONS', updated);
};

// UPDATE ALLOTMENT STATUS
export const updateAllotmentStatus = async (applicationId, status, allottedLots = 0, profit = 0) => {
  const apps = getLocalData('APPLICATIONS', []);
  const ipos = getLocalData('IPOS', []);
  const app = apps.find(a => a.id === applicationId);

  if (!app) return;

  const ipo = ipos.find(i => i.id === app.ipo_id);
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

  if (refundAmount > 0) {
    await saveTransaction({
      application_id: app.id,
      from_party_id: 'p-bank',
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
      from_party_id: 'p-bank',
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

    transactions.forEach(tx => {
      const amt = parseFloat(tx.amount || 0);
      if (tx.to_party_id === party.id) moneyReceived += amt;
      if (tx.from_party_id === party.id) moneySent += amt;
    });

    const netCashFlow = moneyReceived - moneySent;
    const currentBalance = (parseFloat(party.initial_balance || 0)) + netCashFlow;

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
    id: taxData.id || `tr-${Date.now()}`,
    user_email: taxData.user_email || null,
    party_id: taxData.party_id,
    financial_year: taxData.financial_year,
    tax_rate: parseFloat(taxData.tax_rate ?? 20),
    fee_per_allotment: parseFloat(taxData.fee_per_allotment ?? 0),
    gain_override: taxData.gain_override !== undefined && taxData.gain_override !== null && taxData.gain_override !== '' ? parseFloat(taxData.gain_override) : null,
    notes: taxData.notes || '',
    created_at: taxData.created_at || new Date().toISOString()
  };

  try {
    await fetch(`${getApiUrl()}/tax-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });
  } catch (e) {}

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
    id: payData.id || `tp-${Date.now()}`,
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

  try {
    await fetch(`${getApiUrl()}/tax-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPay)
    });
  } catch (e) {}

  const current = getLocalData('TAX_PAYMENTS', []);
  const index = current.findIndex(p => p.id === newPay.id);
  if (index >= 0) current[index] = newPay;
  else current.unshift(newPay);
  setLocalData('TAX_PAYMENTS', current);

  // Automatically record money_transaction of type TAX_COLLECTION
  try {
    await saveTransaction({
      user_email: payData.user_email,
      from_party_id: payData.party_id,
      to_party_id: 'p-bank',
      amount: newPay.amount,
      transaction_type: 'TAX_COLLECTION',
      payment_mode: newPay.payment_mode,
      transaction_date: newPay.payment_date,
      notes: `ITR Tax Collection for ${newPay.financial_year}. Ref: ${newPay.reference_no || 'N/A'}`
    });
  } catch (e) {}

  return newPay;
};

// DELETE TAX PAYMENT LOG
export const deleteTaxPayment = async (id) => {
  try {
    await fetch(`${getApiUrl()}/tax-payments/${id}`, { method: 'DELETE' });
  } catch (e) {}

  const current = getLocalData('TAX_PAYMENTS', []);
  const updated = current.filter(p => p.id !== id);
  setLocalData('TAX_PAYMENTS', updated);
};

// CLEAR / RESET ALL TAX PAYMENTS (Optionally filtered by partyId and FY)
export const clearAllTaxPayments = async (partyId = null, financialYear = null) => {
  const current = getLocalData('TAX_PAYMENTS', []);
  const toDelete = current.filter(p => {
    if (partyId && p.party_id !== partyId) return false;
    if (financialYear && financialYear !== 'ALL' && p.financial_year !== financialYear) return false;
    return true;
  });

  for (const pay of toDelete) {
    try {
      await fetch(`${getApiUrl()}/tax-payments/${pay.id}`, { method: 'DELETE' });
    } catch (e) {}
  }

  const remaining = current.filter(p => !toDelete.some(td => td.id === p.id));
  setLocalData('TAX_PAYMENTS', remaining);
};
