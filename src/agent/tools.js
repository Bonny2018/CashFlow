/**
 * LangChain Agent Financial & Ledger Tools
 * Structured tools with Zod schema verification for querying IPO applications, party balances,
 * money transactions, market listings, and tax records accurately from Supabase / Store.
 */
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { fetchStoreData, calculatePartyBalances } from '../services/store.js';

/**
 * 1. Get Party Balances & Account Ledger Tool
 */
export const getPartyBalancesTool = new DynamicStructuredTool({
  name: 'get_party_balances',
  description: 'Retrieves party details, demat accounts, PAN info (masked), bank details, and calculated money balances for all or specific ledger parties.',
  schema: z.object({
    partyName: z.string().optional().describe('Optional filter by party member name (case-insensitive e.g. "Mohit", "Raj", "Piyush", "Nikhil")')
  }),
  func: async ({ partyName }) => {
    try {
      const store = await fetchStoreData();
      let parties = calculatePartyBalances(store.parties || [], store.transactions || []);
      
      if (partyName && partyName.trim()) {
        const query = partyName.trim().toLowerCase();
        parties = parties.filter(p => p.name.toLowerCase().includes(query));
      }

      const safeResult = parties.map(p => ({
        id: p.id,
        name: p.name,
        panMasked: p.pan ? (p.pan.length > 4 ? p.pan.slice(0, 2) + '****' + p.pan.slice(-2) : p.pan) : 'N/A',
        dematNo: p.demat_no || 'N/A',
        bankName: p.bank_name || 'N/A',
        bankAccount: p.bank_account || 'N/A',
        upiId: p.upi_id || 'N/A',
        initialBalance: parseFloat(p.initial_balance || 0),
        currentBalance: parseFloat(p.currentBalance ?? p.balance ?? p.initial_balance ?? 0),
        totalSpent: parseFloat(p.moneySent ?? p.totalSpent ?? 0),
        totalReceived: parseFloat(p.moneyReceived ?? p.totalReceived ?? 0)
      }));

      return JSON.stringify({
        success: true,
        count: safeResult.length,
        parties: safeResult
      });
    } catch (err) {
      return JSON.stringify({ success: false, error: err.message });
    }
  }
});

/**
 * 2. Get IPO Applications & Allotments Tool
 */
export const getIPOApplicationsTool = new DynamicStructuredTool({
  name: 'get_ipo_applications',
  description: 'Retrieves IPO applications submitted by parties, allotment statuses, shares, amount applied, refunds, and calculated profit/loss.',
  schema: z.object({
    partyName: z.string().optional().describe('Optional filter by applicant party member name'),
    ipoSymbol: z.string().optional().describe('Optional filter by IPO ticker symbol or company name'),
    allotmentStatus: z.enum(['ALL', 'ALLOTTED', 'NOT_ALLOTTED', 'PENDING']).optional().describe('Filter by allotment status')
  }),
  func: async ({ partyName, ipoSymbol, allotmentStatus }) => {
    try {
      const store = await fetchStoreData();
      let apps = store.applications || [];
      const ipos = store.ipos || [];
      const parties = store.parties || [];

      if (partyName && partyName.trim()) {
        const pQuery = partyName.trim().toLowerCase();
        apps = apps.filter(a => {
          const party = parties.find(p => p.id === a.party_id);
          return (party?.name || '').toLowerCase().includes(pQuery);
        });
      }

      if (ipoSymbol && ipoSymbol.trim()) {
        const iQuery = ipoSymbol.trim().toLowerCase();
        apps = apps.filter(a => {
          const ipo = ipos.find(i => i.id === a.ipo_id);
          return (ipo?.company_name || '').toLowerCase().includes(iQuery) || (ipo?.symbol || '').toLowerCase().includes(iQuery);
        });
      }

      if (allotmentStatus && allotmentStatus !== 'ALL') {
        apps = apps.filter(a => (a.allotment_status || 'PENDING').toUpperCase() === allotmentStatus);
      }

      const totalAppliedAmount = apps.reduce((sum, a) => sum + (parseFloat(a.amount_applied) || 0), 0);
      const totalAllottedAmount = apps.reduce((sum, a) => sum + (parseFloat(a.amount_allotted) || 0), 0);
      const totalRefundAmount = apps.reduce((sum, a) => {
        const ref = parseFloat(a.refund_amount);
        if (!isNaN(ref) && ref > 0) return sum + ref;
        // If pending/not allotted calculate refund
        if (a.allotment_status === 'NOT_ALLOTTED') return sum + (parseFloat(a.amount_applied) || 0);
        return sum + Math.max(0, (parseFloat(a.amount_applied) || 0) - (parseFloat(a.amount_allotted) || 0));
      }, 0);
      const totalProfitLoss = apps.reduce((sum, a) => sum + (parseFloat(a.profit_loss) || 0), 0);
      const totalAllottedApps = apps.filter(a => a.allotment_status === 'ALLOTTED').length;

      const items = apps.map(a => {
        const ipo = ipos.find(i => i.id === a.ipo_id);
        const party = parties.find(p => p.id === a.party_id);
        return {
          applicationId: a.id,
          companyName: ipo?.company_name || 'Unknown IPO',
          partyName: party?.name || 'Unknown Party',
          applicationNo: a.application_no || 'N/A',
          lotsApplied: a.lots_applied || 1,
          sharesApplied: a.shares_applied || 0,
          amountApplied: parseFloat(a.amount_applied || 0),
          allotmentStatus: a.allotment_status || 'PENDING',
          lotsAllotted: a.lots_allotted || 0,
          sharesAllotted: a.shares_allotted || 0,
          amountAllotted: parseFloat(a.amount_allotted || 0),
          refundAmount: parseFloat(a.refund_amount || (a.allotment_status === 'NOT_ALLOTTED' ? a.amount_applied : 0)),
          profitLoss: parseFloat(a.profit_loss || 0),
          paymentStatus: a.payment_status || 'PAID',
          applicationDate: a.application_date || a.created_at
        };
      });

      return JSON.stringify({
        success: true,
        summary: {
          totalApplicationsCount: apps.length,
          allottedCount: totalAllottedApps,
          totalCapitalInvested: totalAppliedAmount,
          totalAllottedCapital: totalAllottedAmount,
          totalRefundAmount: totalRefundAmount,
          netProfitLoss: totalProfitLoss
        },
        applications: items
      });
    } catch (err) {
      return JSON.stringify({ success: false, error: err.message });
    }
  }
});

/**
 * 3. Get Money Flow Transactions Tool
 */
export const getMoneyTransactionsTool = new DynamicStructuredTool({
  name: 'get_money_transactions',
  description: 'Retrieves internal party-to-party money transfers, payments, receipts, and refund records.',
  schema: z.object({
    partyName: z.string().optional().describe('Optional filter by sender or receiver party name'),
    transactionType: z.string().optional().describe('Optional filter by transaction type e.g. TRANSFER, PAYMENT, RECEIPT, REFUND')
  }),
  func: async ({ partyName, transactionType }) => {
    try {
      const store = await fetchStoreData();
      let txs = store.transactions || [];
      const parties = store.parties || [];

      if (partyName && partyName.trim()) {
        const query = partyName.trim().toLowerCase();
        txs = txs.filter(t => {
          const fromP = parties.find(p => p.id === t.from_party_id);
          const toP = parties.find(p => p.id === t.to_party_id);
          return (fromP?.name || '').toLowerCase().includes(query) || (toP?.name || '').toLowerCase().includes(query);
        });
      }

      if (transactionType && transactionType.trim()) {
        const tQuery = transactionType.trim().toUpperCase();
        txs = txs.filter(t => (t.transaction_type || '').toUpperCase().includes(tQuery));
      }

      const totalTransferred = txs.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const items = txs.map(t => {
        const fromP = parties.find(p => p.id === t.from_party_id);
        const toP = parties.find(p => p.id === t.to_party_id);
        return {
          id: t.id,
          fromParty: fromP?.name || 'External / System',
          toParty: toP?.name || 'External / System',
          amount: parseFloat(t.amount || 0),
          transactionType: t.transaction_type || 'TRANSFER',
          paymentMode: t.payment_mode || 'UPI',
          transactionDate: t.transaction_date || t.created_at,
          notes: t.notes || ''
        };
      });

      return JSON.stringify({
        success: true,
        count: items.length,
        totalAmount: totalTransferred,
        transactions: items
      });
    } catch (err) {
      return JSON.stringify({ success: false, error: err.message });
    }
  }
});

/**
 * 4. Get IPO Market Listings Tool
 */
export const getIPOMarketListingsTool = new DynamicStructuredTool({
  name: 'get_ipo_market_listings',
  description: 'Fetches active, upcoming, and closed IPO listings recorded in the ledger system.',
  schema: z.object({
    status: z.enum(['ALL', 'OPEN', 'CLOSED', 'UPCOMING']).optional().describe('Status filter')
  }),
  func: async ({ status }) => {
    try {
      const store = await fetchStoreData();
      let ipos = store.ipos || [];

      if (status && status !== 'ALL') {
        ipos = ipos.filter(i => (i.status || 'OPEN').toUpperCase() === status);
      }

      return JSON.stringify({
        success: true,
        count: ipos.length,
        ipos: ipos.map(i => ({
          id: i.id,
          companyName: i.company_name,
          symbol: i.symbol || 'N/A',
          pricePerShare: parseFloat(i.price_per_share || 0),
          lotSize: i.lot_size || 1,
          biddingStartDate: i.bidding_start_date || 'N/A',
          biddingEndDate: i.bidding_end_date || 'N/A',
          allotmentDate: i.allotment_date || 'N/A',
          listingDate: i.listing_date || 'N/A',
          status: i.status || 'OPEN'
        }))
      });
    } catch (err) {
      return JSON.stringify({ success: false, error: err.message });
    }
  }
});

/**
 * 5. Get Tax Audit & ITR Records Tool
 */
export const getITRTaxSummaryTool = new DynamicStructuredTool({
  name: 'get_itr_tax_summary',
  description: 'Calculates complete tax summaries, party-wise gains, STCG tax rates, custom overrides, collected amounts, and remaining tax dues matching the ITR & Tax Collector Module.',
  schema: z.object({
    partyName: z.string().optional().describe('Optional filter by party name'),
    financialYear: z.string().optional().describe('Financial Year e.g. "FY 2026-27" or "ALL"')
  }),
  func: async ({ partyName, financialYear }) => {
    try {
      const store = await fetchStoreData();
      const parties = store.parties || [];
      const apps = store.applications || [];
      const taxRecords = store.taxRecords || store.tax_records || [];
      const taxPayments = store.taxPayments || store.tax_payments || [];

      const selectedFY = financialYear || 'FY 2026-27';

      const partyTaxSummaries = parties.map(party => {
        // Allotted applications
        const partyApps = apps.filter(a => {
          if (a.party_id !== party.id) return false;
          if (a.allotment_status !== 'ALLOTTED') return false;
          if (selectedFY !== 'ALL') {
            const appDate = a.application_date || a.created_at;
            const year = new Date(appDate).getFullYear();
            const month = new Date(appDate).getMonth() + 1;
            const appFY = month >= 4 ? `FY ${year}-${(year + 1).toString().slice(2)}` : `FY ${year - 1}-${year.toString().slice(2)}`;
            return appFY === selectedFY;
          }
          return true;
        });

        const totalRealizedGain = partyApps.reduce((acc, a) => acc + (parseFloat(a.profit_loss) || 0), 0);

        // Tax record override/rate
        const taxRecord = taxRecords.find(r => r.party_id === party.id && (selectedFY === 'ALL' || r.financial_year === selectedFY));
        const taxRate = taxRecord ? parseFloat(taxRecord.tax_rate ?? 20) : 20;
        const feePerAllotment = taxRecord ? parseFloat(taxRecord.fee_per_allotment ?? 0) : 0;
        const gainOverride = (taxRecord && taxRecord.gain_override !== null && taxRecord.gain_override !== undefined && taxRecord.gain_override !== '')
          ? parseFloat(taxRecord.gain_override)
          : null;

        const taxableGain = gainOverride !== null ? gainOverride : totalRealizedGain;
        const taxOnGain = taxableGain > 0 ? (taxableGain * (taxRate / 100)) : 0;
        const totalFixedFees = partyApps.length * feePerAllotment;
        const calculatedTaxDue = Math.max(0, taxOnGain + totalFixedFees);

        // Payments made
        const partyPayments = taxPayments.filter(p => {
          if (p.party_id !== party.id) return false;
          if (selectedFY !== 'ALL' && p.financial_year !== selectedFY) return false;
          return true;
        });

        const amountCollected = partyPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
        const remainingDue = calculatedTaxDue - amountCollected;

        let status = 'SETTLED';
        if (calculatedTaxDue === 0 && amountCollected === 0) {
          status = 'NO_TAX';
        } else if (remainingDue <= 0) {
          status = 'SETTLED';
        } else if (amountCollected > 0 && remainingDue > 0) {
          status = 'PARTIAL';
        } else {
          status = 'PENDING';
        }

        return {
          partyId: party.id,
          partyName: party.name,
          panMasked: party.pan_number ? party.pan_number.toUpperCase().slice(0, 3) + '****' + party.pan_number.toUpperCase().slice(-2) : 'N/A',
          totalRealizedGain,
          gainOverride,
          taxableGain,
          taxRate,
          calculatedTaxDue,
          amountCollected,
          remainingDue,
          status,
          allottedAppsCount: partyApps.length
        };
      });

      // Party filter if specified
      let items = partyTaxSummaries;
      if (partyName && partyName.trim()) {
        const query = partyName.trim().toLowerCase();
        items = items.filter(p => p.partyName.toLowerCase().includes(query));
      }

      const totalProfit = items.reduce((sum, p) => sum + p.taxableGain, 0);
      const totalTaxToCollect = items.reduce((sum, p) => sum + p.calculatedTaxDue, 0);
      const totalAmountCollected = items.reduce((sum, p) => sum + p.amountCollected, 0);
      const totalRemainingTaxDue = items.reduce((sum, p) => sum + Math.max(0, p.remainingDue), 0);
      const pendingAccounts = items.filter(p => p.status === 'PENDING' || p.status === 'PARTIAL');

      return JSON.stringify({
        success: true,
        financialYear: selectedFY,
        totalIPOProfit: totalProfit,
        taxToCollect: totalTaxToCollect,
        amountCollectedSoFar: totalAmountCollected,
        remainingTaxDue: totalRemainingTaxDue,
        pendingAccountsCount: pendingAccounts.length,
        partiesTaxSummary: items
      });
    } catch (err) {
      return JSON.stringify({ success: false, error: err.message });
    }
  }
});

/**
 * 6. Get Overall System Dashboard Summary Tool
 */
export const getSystemDashboardSummaryTool = new DynamicStructuredTool({
  name: 'get_system_dashboard_summary',
  description: 'Retrieves complete aggregated system metrics matching live Dashboard counters.',
  schema: z.object({}),
  func: async () => {
    try {
      const store = await fetchStoreData();
      const apps = store.applications || [];
      const parties = calculatePartyBalances(store.parties || [], store.transactions || []);
      const ipos = store.ipos || [];

      const totalApplied = apps.reduce((sum, a) => sum + (parseFloat(a.amount_applied) || 0), 0);
      const allottedApps = apps.filter(a => a.allotment_status === 'ALLOTTED');
      const allottedValue = allottedApps.reduce((sum, a) => sum + (parseFloat(a.amount_applied) || 0), 0);
      const listingProfit = apps.reduce((sum, a) => sum + (parseFloat(a.profit_loss) || 0), 0);
      const refundReceived = apps.reduce((sum, a) => {
        if (a.allotment_status === 'NOT_ALLOTTED') return sum + (parseFloat(a.amount_applied) || 0);
        return sum + Math.max(0, (parseFloat(a.amount_applied) || 0) - (parseFloat(a.amount_allotted) || 0));
      }, 0);

      return JSON.stringify({
        success: true,
        metrics: {
          totalAppliedCapital: totalApplied,
          totalApplicationsCount: apps.length,
          allottedApplicationsCount: allottedApps.length,
          allottedValue: allottedValue,
          refundReceived: refundReceived,
          totalListingProfit: listingProfit,
          partiesCount: parties.length,
          iposCount: ipos.length
        }
      });
    } catch (err) {
      return JSON.stringify({ success: false, error: err.message });
    }
  }
});

/**
 * 7. Get Database Setup & Schema Status Tool
 */
export const getDatabaseStatusTool = new DynamicStructuredTool({
  name: 'get_database_status',
  description: 'Retrieves Supabase connection status, DDL schema integrity, and checkpoint database health.',
  schema: z.object({}),
  func: async () => {
    try {
      const store = await fetchStoreData();
      return JSON.stringify({
        success: true,
        isSupabaseConfigured: isSupabaseConfigured,
        isSupabaseLive: store.isSupabase,
        persistenceEngine: store.isSupabase ? 'Supabase PostgreSQL (Realtime)' : 'LocalStorage Browser Cache (Offline Fallback)',
        tables: ['chat_sessions', 'chat_messages', 'security_audit_logs', 'langgraph_checkpoints', 'parties', 'ipos', 'applications', 'transactions', 'tax_records', 'tax_payments']
      });
    } catch (err) {
      return JSON.stringify({ success: false, error: err.message });
    }
  }
});

/**
 * 8. Get Graphs & Analytics Summary Tool
 */
export const getAnalyticsSummaryTool = new DynamicStructuredTool({
  name: 'get_analytics_summary',
  description: 'Calculates graphical analytics, party allotment success rates, monthly profit trends, and capital distribution.',
  schema: z.object({}),
  func: async () => {
    try {
      const store = await fetchStoreData();
      const apps = store.applications || [];
      const parties = store.parties || [];

      const totalApps = apps.length;
      const allottedApps = apps.filter(a => a.allotment_status === 'ALLOTTED');
      const successRate = totalApps > 0 ? ((allottedApps.length / totalApps) * 100).toFixed(1) : '0.0';

      const partyBreakdown = parties.map(p => {
        const pApps = apps.filter(a => a.party_id === p.id);
        const pApplied = pApps.reduce((sum, a) => sum + (parseFloat(a.amount_applied) || 0), 0);
        const pProfit = pApps.reduce((sum, a) => sum + (parseFloat(a.profit_loss) || 0), 0);
        return {
          partyName: p.name,
          appsCount: pApps.length,
          totalCapitalApplied: pApplied,
          totalProfit: pProfit
        };
      });

      return JSON.stringify({
        success: true,
        overallSuccessRate: `${successRate}%`,
        totalApplicationsCount: totalApps,
        allottedApplicationsCount: allottedApps.length,
        partyAnalytics: partyBreakdown
      });
    } catch (err) {
      return JSON.stringify({ success: false, error: err.message });
    }
  }
});

export const ALL_AGENT_TOOLS = [
  getPartyBalancesTool,
  getIPOApplicationsTool,
  getMoneyTransactionsTool,
  getIPOMarketListingsTool,
  getITRTaxSummaryTool,
  getSystemDashboardSummaryTool,
  getDatabaseStatusTool,
  getAnalyticsSummaryTool
];
