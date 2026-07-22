import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock3, 
  TrendingUp, 
  Percent, 
  UserCheck, 
  Download, 
  Printer, 
  Plus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Building2, 
  Receipt,
  X,
  Sparkles,
  CreditCard,
  Check
} from 'lucide-react';
import { getFinancialYear } from '../services/store';

export default function ITRManager({
  parties = [],
  applications = [],
  ipos = [],
  transactions = [],
  taxRecords = [],
  taxPayments = [],
  isAdmin = false,
  onSaveTaxRecord,
  onSaveTaxPayment,
  onDeleteTaxPayment
}) {
  const currentFY = getFinancialYear(new Date().toISOString());
  const [selectedFY, setSelectedFY] = useState(currentFY);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [paymentModalParty, setPaymentModalParty] = useState(null);
  const [configModalParty, setConfigModalParty] = useState(null);
  const [statementModalParty, setStatementModalParty] = useState(null);

  // Payment Form State
  const getCurrentLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payDateTime, setPayDateTime] = useState(getCurrentLocalDateTime());
  const [payRefNo, setPayRefNo] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Config Form State
  const [cfgTaxRate, setCfgTaxRate] = useState(20);
  const [cfgFeePerAllotment, setCfgFeePerAllotment] = useState(0);
  const [cfgGainOverride, setCfgGainOverride] = useState('');
  const [cfgNotes, setCfgNotes] = useState('');

  const availableFYs = useMemo(() => {
    const list = ['FY 2026-27', 'FY 2025-26', 'FY 2024-25', 'FY 2023-24'];
    if (!list.includes(currentFY)) list.unshift(currentFY);
    return Array.from(new Set(list));
  }, [currentFY]);

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  // Party Map for quick lookup
  const ipoMap = useMemo(() => new Map(ipos.map(i => [i.id, i])), [ipos]);

  // Aggregate Tax Data per Party
  const partyTaxSummary = useMemo(() => {
    return parties.map(party => {
      // Allotted applications for this party
      const partyApps = applications.filter(a => {
        if (a.party_id !== party.id) return false;
        if (a.allotment_status !== 'ALLOTTED') return false;
        if (selectedFY !== 'ALL') {
          const appFY = getFinancialYear(a.application_date || a.created_at);
          return appFY === selectedFY;
        }
        return true;
      });

      const totalAllottedCount = partyApps.reduce((acc, a) => acc + (a.lots_allotted || 1), 0);
      const totalInvestment = partyApps.reduce((acc, a) => acc + (parseFloat(a.amount_allotted || 0)), 0);
      const totalRealizedGain = partyApps.reduce((acc, a) => acc + (parseFloat(a.profit_loss || 0)), 0);

      // Tax record settings for party & FY
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

      // Tax Payment logs
      const partyPayments = taxPayments.filter(p => {
        if (p.party_id !== party.id) return false;
        if (selectedFY !== 'ALL' && p.financial_year !== selectedFY) return false;
        return true;
      });

      const amountCollected = partyPayments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
      const remainingDue = calculatedTaxDue - amountCollected;

      let status = 'SETTLED';
      if (calculatedTaxDue === 0 && amountCollected === 0) status = 'NO_TAX';
      else if (remainingDue <= 0 && calculatedTaxDue > 0) status = 'SETTLED';
      else if (amountCollected > 0 && remainingDue > 0) status = 'PARTIAL';
      else status = 'PENDING';

      return {
        party,
        partyApps,
        partyPayments,
        taxRecord,
        totalAllottedCount,
        totalInvestment,
        totalRealizedGain,
        taxRate,
        feePerAllotment,
        gainOverride,
        taxableGain,
        calculatedTaxDue,
        amountCollected,
        remainingDue,
        status
      };
    });
  }, [parties, applications, selectedFY, taxRecords, taxPayments]);

  // Search Filter
  const filteredSummary = useMemo(() => {
    if (!searchQuery.trim()) return partyTaxSummary;
    const q = searchQuery.toLowerCase();
    return partyTaxSummary.filter(item => 
      item.party.name.toLowerCase().includes(q) ||
      (item.party.pan && item.party.pan.toLowerCase().includes(q)) ||
      (item.party.demat_no && item.party.demat_no.toLowerCase().includes(q))
    );
  }, [partyTaxSummary, searchQuery]);

  // Overall Financial Totals
  const overallMetrics = useMemo(() => {
    let totalGain = 0;
    let totalTaxDue = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let settledCount = 0;

    partyTaxSummary.forEach(item => {
      totalGain += item.taxableGain;
      totalTaxDue += item.calculatedTaxDue;
      totalCollected += item.amountCollected;
      if (item.remainingDue > 0) totalPending += item.remainingDue;
      if (item.status === 'SETTLED' || item.status === 'NO_TAX') settledCount++;
    });

    return {
      totalGain,
      totalTaxDue,
      totalCollected,
      totalPending,
      settledCount,
      totalParties: partyTaxSummary.length
    };
  }, [partyTaxSummary]);

  // Handlers for Modals
  const openPaymentModal = (item) => {
    setPaymentModalParty(item);
    setPayAmount(item.remainingDue > 0 ? item.remainingDue.toString() : '');
    setPayMode('UPI');
    setPayDateTime(getCurrentLocalDateTime());
    setPayRefNo('');
    setPayNotes('');
  };

  const handleSavePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentModalParty || !payAmount || parseFloat(payAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    await onSaveTaxPayment({
      party_id: paymentModalParty.party.id,
      financial_year: selectedFY === 'ALL' ? currentFY : selectedFY,
      amount: parseFloat(payAmount),
      payment_mode: payMode,
      payment_date: new Date(payDateTime).toISOString(),
      reference_no: payRefNo,
      notes: payNotes
    });

    setPaymentModalParty(null);
  };

  const openConfigModal = (item) => {
    setConfigModalParty(item);
    setCfgTaxRate(item.taxRate ?? 20);
    setCfgFeePerAllotment(item.feePerAllotment ?? 0);
    setCfgGainOverride(item.gainOverride !== null ? item.gainOverride.toString() : '');
    setCfgNotes(item.taxRecord?.notes || '');
  };

  const handleSaveConfigSubmit = async (e) => {
    e.preventDefault();
    if (!configModalParty) return;

    await onSaveTaxRecord({
      id: configModalParty.taxRecord?.id,
      party_id: configModalParty.party.id,
      financial_year: selectedFY === 'ALL' ? currentFY : selectedFY,
      tax_rate: parseFloat(cfgTaxRate),
      fee_per_allotment: parseFloat(cfgFeePerAllotment),
      gain_override: cfgGainOverride !== '' ? parseFloat(cfgGainOverride) : null,
      notes: cfgNotes
    });

    setConfigModalParty(null);
  };

  const openStatementModal = (item) => {
    setStatementModalParty(item);
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/60 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
                ITR & Tax Collector Module
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Year-Wise Ledger
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Track annual IPO listing gains, compute STCG tax liabilities, collect year-wise payments with date-time logs, & generate ITR filings.
              </p>
            </div>
          </div>
        </div>

        {/* Financial Year Selector */}
        <div className="flex items-center space-x-3 relative z-10 self-start md:self-auto bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-400 font-medium">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Select FY:</span>
          </div>
          <div className="flex items-center space-x-1">
            {availableFYs.map(fy => (
              <button
                key={fy}
                onClick={() => setSelectedFY(fy)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedFY === fy
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {fy}
              </button>
            ))}
            <button
              onClick={() => setSelectedFY('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedFY === 'ALL'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              All FYs
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Realized Gain */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total IPO Profit ({selectedFY})</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-display text-white tracking-tight">
              {formatINR(overallMetrics.totalGain)}
            </h3>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center space-x-1">
              <span>Short Term Capital Gain (STCG)</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Total Calculated Tax */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tax / Fee to Collect</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-display text-white tracking-tight">
              {formatINR(overallMetrics.totalTaxDue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Based on party tax rates (default 20%)
            </p>
          </div>
        </div>

        {/* Metric 3: Total Collected */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-teal-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Amount Collected So Far</span>
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-display text-emerald-400 tracking-tight">
              {formatINR(overallMetrics.totalCollected)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {overallMetrics.settledCount} of {overallMetrics.totalParties} Accounts Settled
            </p>
          </div>
        </div>

        {/* Metric 4: Balance Due to Collect */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Remaining Tax Due</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-display text-amber-400 tracking-tight">
              {formatINR(overallMetrics.totalPending)}
            </h3>
            <p className="text-[11px] text-amber-400/80 mt-1">
              Pending collection from clients
            </p>
          </div>
        </div>

      </div>

      {/* Main Table Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Controls Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search person, PAN, or Demat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-64 sm:w-80 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 font-medium">
              Active FY: <strong className="text-emerald-400">{selectedFY}</strong>
            </span>
            <span className="px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 font-medium">
              Records: <strong className="text-white">{filteredSummary.length}</strong>
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Party / Client</th>
                <th className="py-3.5 px-4 text-center">Allotted IPOs</th>
                <th className="py-3.5 px-4 text-right">FY IPO Gain</th>
                <th className="py-3.5 px-4 text-center">Tax Rate %</th>
                <th className="py-3.5 px-4 text-right">Calculated Tax</th>
                <th className="py-3.5 px-4 text-right">Collected</th>
                <th className="py-3.5 px-4 text-right">Tax Due</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredSummary.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-medium text-sm text-slate-400">No Tax Records Found</p>
                      <p className="text-xs text-slate-500">
                        {searchQuery ? 'No matching parties for your search query.' : `No allotted IPO applications found for ${selectedFY}.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSummary.map((item) => (
                  <tr key={item.party.id} className="hover:bg-slate-850/50 transition-all">
                    
                    {/* Party info */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white flex items-center space-x-2">
                        <span>{item.party.name}</span>
                        {item.party.pan && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
                            {item.party.pan}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                        {item.party.demat_no && <span>Demat: {item.party.demat_no}</span>}
                        {item.party.bank_name && <span>• {item.party.bank_name}</span>}
                      </div>
                    </td>

                    {/* Allotted IPO Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        item.partyApps.length > 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800/60 text-slate-400'
                      }`}>
                        {item.partyApps.length} IPOs
                      </span>
                    </td>

                    {/* FY Realized Gain */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-semibold text-emerald-400">
                        {formatINR(item.taxableGain)}
                      </div>
                      {item.gainOverride !== null && (
                        <div className="text-[10px] text-amber-400">
                          (Custom Override)
                        </div>
                      )}
                    </td>

                    {/* Tax Rate % */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openConfigModal(item)}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-slate-800 hover:border-indigo-500/40 rounded-lg text-xs font-semibold transition-all inline-flex items-center space-x-1"
                        title="Click to edit tax rate or fees"
                      >
                        <span>{item.taxRate}%</span>
                        <Edit3 className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>

                    {/* Calculated Tax Due */}
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {formatINR(item.calculatedTaxDue)}
                    </td>

                    {/* Collected Amount */}
                    <td className="py-3.5 px-4 text-right font-semibold text-teal-400">
                      {formatINR(item.amountCollected)}
                    </td>

                    {/* Remaining Tax Due */}
                    <td className="py-3.5 px-4 text-right font-semibold">
                      {item.remainingDue > 0 ? (
                        <span className="text-amber-400">{formatINR(item.remainingDue)}</span>
                      ) : (
                        <span className="text-slate-400">{formatINR(0)}</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {item.status === 'SETTLED' && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>SETTLED</span>
                        </span>
                      )}
                      {item.status === 'PARTIAL' && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 inline-flex items-center space-x-1">
                          <Clock3 className="w-3 h-3" />
                          <span>PARTIAL</span>
                        </span>
                      )}
                      {item.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>PENDING</span>
                        </span>
                      )}
                      {item.status === 'NO_TAX' && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          NO TAX
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => openPaymentModal(item)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs shadow-sm transition-all flex items-center space-x-1"
                          title="Record Tax Collection"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Collect</span>
                        </button>

                        <button
                          onClick={() => openStatementModal(item)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 transition-all"
                          title="View Full ITR Statement"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openConfigModal(item)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 transition-all"
                          title="Tax Settings & Notes"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL 1: RECORD TAX COLLECTION PAYMENT */}
      {paymentModalParty && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-white text-base">Collect Tax Payment</h3>
                  <p className="text-xs text-slate-400">For {paymentModalParty.party.name} ({selectedFY})</p>
                </div>
              </div>
              <button 
                onClick={() => setPaymentModalParty(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentSubmit} className="space-y-4">
              
              {/* Summary Note */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Calculated Tax Due:</span>
                  <strong className="text-white">{formatINR(paymentModalParty.calculatedTaxDue)}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Already Collected:</span>
                  <strong className="text-teal-400">{formatINR(paymentModalParty.amountCollected)}</strong>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
                  <span>Remaining Due:</span>
                  <strong className="text-amber-400">{formatINR(paymentModalParty.remainingDue)}</strong>
                </div>
              </div>

              {/* Amount to collect */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Collection Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="any"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter amount collected..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Payment Mode & DateTime */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="NET_BANKING">Net Banking / NEFT</option>
                    <option value="CASH">Cash Payment</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={payDateTime}
                    onChange={(e) => setPayDateTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Reference / UTR Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Transaction Ref / UTR No.</label>
                <input
                  type="text"
                  value={payRefNo}
                  onChange={(e) => setPayRefNo(e.target.value)}
                  placeholder="e.g. UPI-1234567890 / Bank Ref"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes / Remarks</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Collected via PhonePe for FY 2026-27"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalParty(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20"
                >
                  Save Tax Collection
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: CONFIGURE TAX RULES */}
      {configModalParty && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-white text-base">Configure Tax & Fees</h3>
                  <p className="text-xs text-slate-400">{configModalParty.party.name} ({selectedFY})</p>
                </div>
              </div>
              <button 
                onClick={() => setConfigModalParty(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfigSubmit} className="space-y-4">
              
              {/* Tax Rate % */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Short Term Capital Tax Rate (%)</label>
                <input
                  type="number"
                  required
                  step="any"
                  value={cfgTaxRate}
                  onChange={(e) => setCfgTaxRate(e.target.value)}
                  placeholder="e.g. 20 (Standard STCG Rate)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Default is 20% STCG under current tax rules.</p>
              </div>

              {/* Fixed Fee per Allotment */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fixed Commission Fee Per Allotted IPO (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={cfgFeePerAllotment}
                  onChange={(e) => setCfgFeePerAllotment(e.target.value)}
                  placeholder="e.g. 500 or 1000 per allotted lot"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Manual Gain Override */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Total Realized Gain Override (Optional ₹)</label>
                <input
                  type="number"
                  step="any"
                  value={cfgGainOverride}
                  onChange={(e) => setCfgGainOverride(e.target.value)}
                  placeholder={`Computed Gain: ${configModalParty.totalRealizedGain} (Leave blank to use computed gain)`}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Custom Notes / Terms</label>
                <input
                  type="text"
                  value={cfgNotes}
                  onChange={(e) => setCfgNotes(e.target.value)}
                  placeholder="e.g. Special 15% rate agreed for FY 2026-27"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setConfigModalParty(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
                >
                  Save Configuration
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: DETAILED PERSON ITR STATEMENT */}
      {statementModalParty && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-white text-lg">Detailed ITR & Gain Statement</h3>
                  <p className="text-xs text-slate-400">
                    {statementModalParty.party.name} • {selectedFY} Report
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrintStatement}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
                <button 
                  onClick={() => setStatementModalParty(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Client Profile Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Client Name</span>
                <strong className="text-white font-semibold">{statementModalParty.party.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">PAN Number</span>
                <strong className="text-emerald-400 font-mono">{statementModalParty.party.pan || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Demat / BO ID</span>
                <strong className="text-slate-200 font-mono">{statementModalParty.party.demat_no || 'N/A'}</strong>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total IPO Gain</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{formatINR(statementModalParty.taxableGain)}</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tax Rate / Rule</span>
                <p className="text-base font-bold text-indigo-300 mt-0.5">{statementModalParty.taxRate}% STCG</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tax Due</span>
                <p className="text-base font-bold text-white mt-0.5">{formatINR(statementModalParty.calculatedTaxDue)}</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tax Collected</span>
                <p className="text-base font-bold text-teal-400 mt-0.5">{formatINR(statementModalParty.amountCollected)}</p>
              </div>
            </div>

            {/* Itemized Allotted IPO List */}
            <div className="space-y-2">
              <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">Allotted IPOs ({statementModalParty.partyApps.length})</h4>
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3 text-center">Lots</th>
                      <th className="py-2.5 px-3 text-right">Investment</th>
                      <th className="py-2.5 px-3 text-right">Profit / Gain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {statementModalParty.partyApps.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">No allotted IPOs recorded for this financial year.</td>
                      </tr>
                    ) : (
                      statementModalParty.partyApps.map((app) => {
                        const ipo = ipoMap.get(app.ipo_id);
                        return (
                          <tr key={app.id} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 text-slate-400">
                              {app.application_date ? new Date(app.application_date).toLocaleDateString('en-IN') : 'N/A'}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-white">
                              {ipo ? ipo.company_name : 'IPO Application'}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-300 font-semibold">
                              {app.lots_allotted || 1}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-300">
                              {formatINR(app.amount_allotted)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-emerald-400">
                              {formatINR(app.profit_loss)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Collection History Log with Exact Timestamps */}
            <div className="space-y-2">
              <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">Tax Payment Collection History</h4>
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3">Reference / UTR</th>
                      <th className="py-2.5 px-3 text-right">Amount Collected</th>
                      {isAdmin && <th className="py-2.5 px-3 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {statementModalParty.partyPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">No payment collection logs recorded yet.</td>
                      </tr>
                    ) : (
                      statementModalParty.partyPayments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 text-slate-300 flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{new Date(pay.payment_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-teal-300 rounded border border-slate-700">
                              {pay.payment_mode || 'UPI'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">
                            {pay.reference_no || 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-teal-400">
                            {formatINR(pay.amount)}
                          </td>
                          {isAdmin && (
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={async () => {
                                  if (window.confirm('Delete this tax payment log?')) {
                                    await onDeleteTaxPayment(pay.id);
                                    setStatementModalParty(null);
                                  }
                                }}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all"
                                title="Delete Log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Generated by IPOPro Ledger System</span>
              <span>Financial Year: {selectedFY}</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
