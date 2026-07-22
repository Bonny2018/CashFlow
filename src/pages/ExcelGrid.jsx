import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  RefreshCw,
  Sparkles,
  Trash2
} from 'lucide-react';

export default function ExcelGrid({ 
  applications, 
  parties, 
  ipos, 
  isAdmin,
  onUpdateStatus, 
  onDeleteApplication,
  onOpenNewApp 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [partyFilter, setPartyFilter] = useState('ALL');

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const handleDeleteApp = async (appId) => {
    if (!isAdmin) {
      alert('Access Denied: Only Admin (admin@gmail.com) has permission to delete applications.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this row?')) {
      await onDeleteApplication(appId);
    }
  };

  // Filtered Rows
  const filteredRows = applications.filter((app) => {
    const party = parties.find(p => p.id === app.party_id);
    const ipo = ipos.find(i => i.id === app.ipo_id);
    
    const matchesStatus = statusFilter === 'ALL' || app.allotment_status === statusFilter;
    const matchesParty = partyFilter === 'ALL' || app.party_id === partyFilter;
    
    const query = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (party?.name.toLowerCase().includes(query)) ||
      (ipo?.company_name.toLowerCase().includes(query)) ||
      (app.application_no?.toLowerCase().includes(query)) ||
      (app.notes?.toLowerCase().includes(query));

    return matchesStatus && matchesParty && matchesSearch;
  });

  // Totals Calculation for Spreadsheet Bottom Row
  const totalAppliedSum = filteredRows.reduce((acc, r) => acc + (r.amount_applied || 0), 0);
  const totalAllottedSum = filteredRows.reduce((acc, r) => acc + (r.amount_allotted || 0), 0);
  const totalRefundSum = filteredRows.reduce((acc, r) => acc + (r.refund_amount || 0), 0);
  const totalProfitSum = filteredRows.reduce((acc, r) => acc + (r.profit_loss || 0), 0);

  // Export to Real XLSX File
  const handleExportExcel = () => {
    const exportData = filteredRows.map((app, index) => {
      const party = parties.find(p => p.id === app.party_id);
      const ipo = ipos.find(i => i.id === app.ipo_id);
      return {
        'S.No': index + 1,
        'Application Date & Time': new Date(app.application_date).toLocaleString('en-IN'),
        'Party / Member Name': party ? party.name : '',
        'PAN Number': party ? party.pan : '',
        'IPO Company': ipo ? ipo.company_name : '',
        'Symbol': ipo ? ipo.symbol : '',
        'Applied Lots': app.lots_applied,
        'Applied Shares': app.shares_applied,
        'Issue Price (₹)': ipo ? ipo.price_per_share : 0,
        'Total Blocked Amount (₹)': app.amount_applied,
        'Allotment Status': app.allotment_status,
        'Allotted Lots': app.lots_allotted || 0,
        'Allotted Amount (₹)': app.amount_allotted || 0,
        'Refund Amount (₹)': app.refund_amount || 0,
        'Listing Profit/Loss (₹)': app.profit_loss || 0,
        'Payment Status': app.payment_status,
        'Notes': app.notes || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'IPO Allotments & Ledger');
    
    // Auto-fit column width
    const max_width = exportData.reduce((w, r) => Math.max(w, JSON.stringify(r).length), 10);
    worksheet['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 25 }];

    XLSX.writeFile(workbook, `IPO_Ledger_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-white">IPO Excel Grid View</h2>
            <p className="text-xs text-slate-400">High-density accounting table & 1-click XLSX export</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search member, IPO, notes..."
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 md:w-56"
            />
          </div>

          {/* Allotment Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Allotment Statuses</option>
            <option value="ALLOTTED">Allotted Only</option>
            <option value="NOT_ALLOTTED">Not Allotted (Refunded)</option>
            <option value="PENDING">Pending Only</option>
          </select>

          {/* Party Filter */}
          <select
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Parties / Members</option>
            {parties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export XLSX</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Container */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[650px]">
          <table className="w-full text-left border-collapse excel-grid-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th className="min-w-[150px]">Date & Time</th>
                <th className="min-w-[160px]">Party / Member</th>
                <th className="min-w-[180px]">IPO Company</th>
                <th className="w-20 text-center">Lots</th>
                <th className="w-24 text-right">Applied (₹)</th>
                <th className="min-w-[130px] text-center">Allotment Status</th>
                <th className="w-24 text-right">Allotted (₹)</th>
                <th className="w-24 text-right">Refund (₹)</th>
                <th className="w-24 text-right">Profit/Loss</th>
                <th className="min-w-[100px] text-center">Payment</th>
                <th className="min-w-[160px]">Notes</th>
                <th className="w-24 text-center">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredRows.length > 0 ? (
                filteredRows.map((app, index) => {
                  const party = parties.find(p => p.id === app.party_id);
                  const ipo = ipos.find(i => i.id === app.ipo_id);

                  return (
                    <tr key={app.id} className="hover:bg-slate-900/60 transition">
                      <td className="text-center font-mono text-slate-500">{index + 1}</td>
                      <td className="text-slate-300 font-mono text-[11px]">
                        {new Date(app.application_date).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="font-sans font-medium text-white">
                        {party ? party.name : 'Unknown'}
                      </td>
                      <td className="font-sans font-semibold text-emerald-300">
                        {ipo ? ipo.company_name : 'IPO'}
                      </td>
                      <td className="text-center font-mono text-slate-300">{app.lots_applied}</td>
                      <td className="text-right font-mono font-semibold text-slate-200">
                        {formatINR(app.amount_applied)}
                      </td>
                      <td className="text-center font-sans">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          app.allotment_status === 'ALLOTTED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : app.allotment_status === 'NOT_ALLOTTED'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {app.allotment_status}
                        </span>
                      </td>
                      <td className="text-right font-mono text-emerald-400 font-semibold">
                        {formatINR(app.amount_allotted)}
                      </td>
                      <td className="text-right font-mono text-teal-300">
                        {formatINR(app.refund_amount)}
                      </td>
                      <td className={`text-right font-mono font-bold ${
                        app.profit_loss > 0 ? 'text-emerald-400' : app.profit_loss < 0 ? 'text-rose-400' : 'text-slate-500'
                      }`}>
                        {formatINR(app.profit_loss)}
                      </td>
                      <td className="text-center font-sans">
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                          {app.payment_status}
                        </span>
                      </td>
                      <td className="text-slate-400 font-sans text-[11px] truncate max-w-[180px]" title={app.notes}>
                        {app.notes || '-'}
                      </td>
                      <td className="text-center font-sans">
                        {isAdmin ? (
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => onUpdateStatus(app.id, 'ALLOTTED', app.lots_applied, 3000)}
                              title="Admin: Mark Allotted"
                              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onUpdateStatus(app.id, 'NOT_ALLOTTED')}
                              title="Admin: Mark Not Allotted / Refund"
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteApp(app.id)}
                              title="Admin Only: Delete Record"
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800" title="Only Admin (admin@gmail.com) can update or delete">
                            Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="13" className="py-8 text-center text-slate-500 font-sans">
                    No matching records found in spreadsheet view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Excel Formula Summary Footer */}
        <div className="bg-slate-900/90 border-t border-slate-800 p-3 px-4 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center space-x-4">
            <span className="text-slate-500">COUNT: <strong className="text-white">{filteredRows.length}</strong> rows</span>
            <span className="text-slate-500">SUM APPLIED: <strong className="text-white">{formatINR(totalAppliedSum)}</strong></span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-500">SUM ALLOTTED: <strong className="text-emerald-400">{formatINR(totalAllottedSum)}</strong></span>
            <span className="text-slate-500">SUM REFUNDED: <strong className="text-teal-300">{formatINR(totalRefundSum)}</strong></span>
            <span className="text-slate-500">TOTAL PROFIT: <strong className="text-emerald-300">{formatINR(totalProfitSum)}</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
}
