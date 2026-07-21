const getApiUrl = () => {
  const host = typeof window !== 'undefined' && window.location && window.location.hostname ? window.location.hostname : 'localhost';
  return `http://${host}:3001/api`;
};

// Local Storage Helper
const getLocalData = (key, defaultVal = []) => {
  try {
    const data = localStorage.getItem(`IPO_STORE_${key}`);
    return data ? JSON.parse(data) : defaultVal;
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
      if (data.parties && data.ipos) {
        return {
          parties: data.parties || [],
          ipos: data.ipos || [],
          applications: data.applications || [],
          transactions: data.transactions || [],
          dbType: 'SQLite (ipo_ledger.db)'
        };
      }
    }
  } catch (e) {}

  // 2. Fallback to LocalStorage
  const parties = getLocalData('PARTIES', []);
  const ipos = getLocalData('IPOS', []);
  const applications = getLocalData('APPLICATIONS', []);
  const transactions = getLocalData('TRANSACTIONS', []);

  return { parties, ipos, applications, transactions, dbType: 'Local Demo Storage' };
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
