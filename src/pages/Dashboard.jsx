import React from 'react';
import { 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Plus, 
  FileSpreadsheet, 
  Sparkles,
  PieChart
} from 'lucide-react';

export default function Dashboard({ 
  parties, 
  ipos, 
  applications, 
  transactions, 
  user,
  isAdmin,
  onOpenNewApp, 
  onOpenNewTransfer,
  onOpenNewParty,
  onNavigateTab,
  onResetAll 
}) {
  // Financial Calculations
  const totalApplied = applications.reduce((acc, a) => acc + (a.amount_applied || 0), 0);
  const totalAllottedValue = applications.reduce((acc, a) => acc + (a.amount_allotted || 0), 0);
  const totalRefunded = applications.reduce((acc, a) => acc + (a.refund_amount || 0), 0);
  const totalProfit = applications.reduce((acc, a) => acc + (a.profit_loss || 0), 0);

  const allottedCount = applications.filter(a => a.allotment_status === 'ALLOTTED').length;
  const notAllottedCount = applications.filter(a => a.allotment_status === 'NOT_ALLOTTED').length;
  const pendingCount = applications.filter(a => a.allotment_status === 'PENDING').length;
  
  const totalDecided = allottedCount + notAllottedCount;
  const successRate = totalDecided > 0 ? ((allottedCount / totalDecided) * 100).toFixed(1) : '0.0';

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header & Quick Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-display font-bold text-2xl text-white">IPO Overview & Money Flow</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">Live Dashboard</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin ? '👑 Admin Mode: Full System Visibility across all members' : `👤 Logged in as: ${user?.email || 'User'} (Your Data View)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewApp}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Apply New IPO</span>
          </button>
          
          <button
            onClick={onOpenNewTransfer}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span>Log Cash Flow</span>
          </button>

          <button
            onClick={() => onNavigateTab('excel-grid')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-medium transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>Excel Sheet</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all data and make all values 0?')) {
                  onResetAll();
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium transition"
              title="Admin Only: Clear all data and reset to 0"
            >
              <XCircle className="w-4 h-4" />
              <span>Reset All (00)</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Funds Blocked / Applied */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Applied</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-white tracking-tight">{formatINR(totalApplied)}</div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
              <span>{applications.length} Total Applications</span>
            </p>
          </div>
        </div>

        {/* Allotted Value */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Allotted Value</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-emerald-400 tracking-tight">{formatINR(totalAllottedValue)}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {allottedCount} Applications Allotted ({successRate}% Success)
            </p>
          </div>
        </div>

        {/* Refund Received */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Refund Received</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
              <ArrowDownLeft className="w-4 h-4 text-teal-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-teal-300 tracking-tight">{formatINR(totalRefunded)}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {notAllottedCount} Unblocked / Refunded
            </p>
          </div>
        </div>

        {/* Realized Profit */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Listing Profit</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-indigo-300 tracking-tight">{formatINR(totalProfit)}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Total Realized Gain
            </p>
          </div>
        </div>

      </div>

      {/* Main Content Split: Recent IPO Applications & Party Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active IPO Applications */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="font-display font-semibold text-base text-white">Recent Applications & Allotments</h2>
              <p className="text-xs text-slate-400">Status breakdown per family member</p>
            </div>
            <button
              onClick={() => onNavigateTab('applications')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>View All ({applications.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] text-slate-400 uppercase border-b border-slate-800/60 font-semibold">
                  <th className="py-2.5 px-3">Party Member</th>
                  <th className="py-2.5 px-3">IPO Company</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {applications.slice(0, 5).map((app) => {
                  const party = parties.find(p => p.id === app.party_id);
                  const ipo = ipos.find(i => i.id === app.ipo_id);
                  
                  return (
                    <tr key={app.id} className="hover:bg-slate-900/40 transition font-mono">
                      <td className="py-3 px-3 font-sans font-medium text-slate-200">
                        {party ? party.name : 'Unknown Party'}
                      </td>
                      <td className="py-3 px-3 font-sans font-semibold text-white">
                        {ipo ? ipo.company_name : 'IPO Application'}
                      </td>
                      <td className="py-3 px-3 text-emerald-400 font-semibold">
                        {formatINR(app.amount_applied)}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                          app.allotment_status === 'ALLOTTED' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : app.allotment_status === 'NOT_ALLOTTED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {app.allotment_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                        {new Date(app.application_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Party Accounts Balance Overview */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="font-display font-semibold text-base text-white">Party Balances</h2>
              <p className="text-xs text-slate-400">Current money state</p>
            </div>
            <button
              onClick={() => onNavigateTab('ledger')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {parties.map((p) => (
              <div key={p.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{p.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">PAN: {p.pan || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-mono font-bold ${
                    p.currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {formatINR(p.currentBalance || p.initial_balance || 0)}
                  </div>
                  <span className="text-[10px] text-slate-400">Available</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onOpenNewParty}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition flex items-center justify-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add New Party Member</span>
          </button>
        </div>

      </div>

    </div>
  );
}
