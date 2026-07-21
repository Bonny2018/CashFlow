import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Plus, 
  Send, 
  Calendar, 
  DollarSign, 
  X,
  CreditCard,
  Sparkles,
  Trash2
} from 'lucide-react';

export default function MoneyFlow({ 
  transactions, 
  parties, 
  isAdmin,
  onSaveTransaction,
  onDeleteTransaction,
  isTransferModalOpen,
  setIsTransferModalOpen
}) {
  const [fromPartyId, setFromPartyId] = useState(parties[0]?.id || '');
  const [toPartyId, setToPartyId] = useState(parties[1]?.id || parties[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState('DIRECT_TRANSFER');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [notes, setNotes] = useState('');

  // Default to current local system time
  const getCurrentLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const [customDateTime, setCustomDateTime] = useState(getCurrentLocalDateTime());

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const handleDeleteTx = async (tx) => {
    if (!isAdmin) {
      alert('Access Denied: Only Admin (mohitjain12104@gmail.com) has permission to delete transactions.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this money transfer transaction?')) {
      await onDeleteTransaction(tx.id);
    }
  };

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    if (!fromPartyId || !toPartyId || !amount) return;

    await onSaveTransaction({
      from_party_id: fromPartyId,
      to_party_id: toPartyId,
      amount: parseFloat(amount),
      transaction_type: txType,
      payment_mode: paymentMode,
      transaction_date: new Date(customDateTime).toISOString(),
      notes
    });

    setIsTransferModalOpen(false);
    setAmount(''); setNotes('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="font-display font-bold text-xl text-white">Money Flow Calculator (Come & Go)</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track inter-party cash transfers, refunds received, and member settlements</p>
        </div>

        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Money Transfer</span>
        </button>
      </div>

      {/* Transaction Log Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800 font-mono">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Sender (From Party)</th>
                <th className="py-3 px-4">Receiver (To Party)</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Mode</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {transactions.map((tx) => {
                const fromP = parties.find(p => p.id === tx.from_party_id);
                const toP = parties.find(p => p.id === tx.to_party_id);

                return (
                  <tr key={tx.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(tx.transaction_date).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-rose-300 flex items-center space-x-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{fromP ? fromP.name : 'Unknown Party'}</span>
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-emerald-300">
                      <div className="flex items-center space-x-1">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{toP ? toP.name : 'Unknown Party'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatINR(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-400">
                      {tx.payment_mode || 'UPI'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[200px]" title={tx.notes}>
                      {tx.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isAdmin ? (
                        <button
                          onClick={() => handleDeleteTx(tx)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                          title="Admin Only: Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono" title="Only Admin (mohitjain12104@gmail.com) can delete">
                          Locked
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NEW MONEY TRANSFER */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-semibold text-lg text-white">Log Cash Flow Transfer</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-4">
              
              {/* Sender & Receiver Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">From (Money Sender)</label>
                  <select
                    value={fromPartyId}
                    onChange={(e) => setFromPartyId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                  >
                    {parties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">To (Money Receiver)</label>
                  <select
                    value={toPartyId}
                    onChange={(e) => setToPartyId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                  >
                    {parties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="15000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category / Type</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                  >
                    <option value="DIRECT_TRANSFER">Direct Transfer</option>
                    <option value="IPO_APPLICATION">IPO Application Block</option>
                    <option value="IPO_REFUND">IPO Refund Unblock</option>
                    <option value="PROFIT_DISTRIBUTION">Profit Distribution</option>
                    <option value="LOAN">Temporary Loan</option>
                  </select>
                </div>
              </div>

              {/* Date & Time Picker (Current Time Default vs Manual Override) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">Transaction Date & Time</label>
                  <button
                    type="button"
                    onClick={() => setCustomDateTime(getCurrentLocalDateTime())}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Set Current Time</span>
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-emerald-500"
                />
              </div>

              {/* Payment Mode & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="NET_BANKING">Netbanking / NEFT</option>
                    <option value="ASBA">ASBA Block</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Reference Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Returned IPO funds"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition mt-2"
              >
                Log Money Transfer & Recalculate
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
