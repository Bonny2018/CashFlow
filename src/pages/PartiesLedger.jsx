import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Building, 
  FileText, 
  Eye, 
  X,
  Wallet
} from 'lucide-react';

export default function PartiesLedger({ 
  partiesWithBalances, 
  transactions, 
  ipos,
  applications,
  onSaveParty, 
  isPartyModalOpen, 
  setIsPartyModalOpen 
}) {
  const [selectedParty, setSelectedParty] = useState(null);
  const [editingParty, setEditingParty] = useState(null);

  // Form State for Adding/Editing Party
  const [name, setName] = useState('');
  const [pan, setPan] = useState('');
  const [dematNo, setDematNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [initialBalance, setInitialBalance] = useState(0);

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const openAddParty = () => {
    setEditingParty(null);
    setName(''); setPan(''); setDematNo(''); setBankName(''); setBankAccount(''); setUpiId(''); setInitialBalance(0);
    setIsPartyModalOpen(true);
  };

  const openEditParty = (party) => {
    setEditingParty(party);
    setName(party.name || '');
    setPan(party.pan || '');
    setDematNo(party.demat_no || '');
    setBankName(party.bank_name || '');
    setBankAccount(party.bank_account || '');
    setUpiId(party.upi_id || '');
    setInitialBalance(party.initial_balance || 0);
    setIsPartyModalOpen(true);
  };

  const handleCreateParty = async (e) => {
    e.preventDefault();
    if (!name) return;

    await onSaveParty({
      id: editingParty ? editingParty.id : undefined,
      name,
      pan,
      demat_no: dematNo,
      bank_name: bankName,
      bank_account: bankAccount,
      upi_id: upiId,
      initial_balance: initialBalance
    });

    setIsPartyModalOpen(false);
    setEditingParty(null);
    setName(''); setPan(''); setDematNo(''); setBankName(''); setBankAccount(''); setUpiId(''); setInitialBalance(0);
  };

  // Get Party Specific Transactions
  const partyTransactions = selectedParty ? transactions.filter(t => 
    t.from_party_id === selectedParty.id || t.to_party_id === selectedParty.id
  ) : [];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="font-display font-bold text-xl text-white">Party Accounts & Member Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage family members, demat profiles, and individual money statements</p>
        </div>

        <button
          onClick={openAddParty}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Party Member</span>
        </button>
      </div>

      {/* Party Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partiesWithBalances.map((party) => {
          return (
            <div 
              key={party.id}
              className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-4 hover:border-slate-700 transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 font-display font-bold text-base">
                    {party.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-white">{party.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">PAN: {party.pan || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditParty(party)}
                    className="px-2 py-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition text-xs font-semibold flex items-center space-x-1"
                    title="Edit Party Details & Opening Balance"
                  >
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedParty(party)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition flex items-center space-x-1 text-xs"
                    title="View Party Ledger"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Ledger</span>
                  </button>
                </div>
              </div>

              {/* Financial Balance Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Total Money Received (In)</span>
                  <span className="text-emerald-400 font-bold">{formatINR(party.moneyReceived)}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Total Money Sent (Out)</span>
                  <span className="text-rose-400 font-bold">{formatINR(party.moneySent)}</span>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-sans font-medium">Net Current Balance</span>
                  <span className={`text-sm font-bold ${party.currentBalance >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                    {formatINR(party.currentBalance)}
                  </span>
                </div>
              </div>

              {/* Demat & Bank Metadata */}
              <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Demat / DP:</span>
                  <span className="font-mono text-slate-300">{party.demat_no || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank / UPI:</span>
                  <span className="font-mono text-slate-300">{party.bank_name || party.upi_id || 'N/A'}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL 1: ADD / EDIT PARTY */}
      {isPartyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-semibold text-lg text-white">
                {editingParty ? `Edit Profile: ${editingParty.name}` : 'Add Party Member Profile'}
              </h3>
              <button onClick={() => { setIsPartyModalOpen(false); setEditingParty(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateParty} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Member / Party Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Jain (Papa)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase font-mono focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Demat / DP ID</label>
                  <input
                    type="text"
                    placeholder="12081600..."
                    value={dematNo}
                    onChange={(e) => setDematNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">UPI Handle</label>
                  <input
                    type="text"
                    placeholder="name@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Opening Cash Balance (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition mt-2"
              >
                Save Party Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INDIVIDUAL PARTY LEDGER STATEMENT */}
      {selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-display font-bold text-lg text-white">{selectedParty.name} - Ledger Statement</h3>
                <p className="text-xs text-slate-400 font-mono">PAN: {selectedParty.pan || 'N/A'} | Demat: {selectedParty.demat_no || 'N/A'}</p>
              </div>
              <button onClick={() => setSelectedParty(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 font-sans block">Total Inbound</span>
                <span className="text-emerald-400 font-bold">{formatINR(selectedParty.moneyReceived)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans block">Total Outbound</span>
                <span className="text-rose-400 font-bold">{formatINR(selectedParty.moneySent)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans block">Available Balance</span>
                <span className="text-teal-300 font-bold">{formatINR(selectedParty.currentBalance)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Transaction History</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-[11px] text-slate-400 border-b border-slate-800 uppercase font-mono">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Direction</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                      <th className="py-2 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {partyTransactions.map((tx) => {
                      const isInbound = tx.to_party_id === selectedParty.id;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-slate-400 text-[11px]">
                            {new Date(tx.transaction_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-3 font-sans font-medium text-slate-200">
                            {tx.transaction_type}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              isInbound ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {isInbound ? '← MONEY IN' : '→ MONEY OUT'}
                            </span>
                          </td>
                          <td className={`py-2 px-3 text-right font-bold ${
                            isInbound ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isInbound ? '+' : '-'}{formatINR(tx.amount)}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px] font-sans truncate max-w-[150px]">
                            {tx.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
