import React, { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Building2, 
  DollarSign, 
  Layers, 
  Edit3, 
  Check, 
  X,
  Sparkles,
  Trash2
} from 'lucide-react';

export default function Applications({ 
  applications, 
  parties, 
  ipos, 
  isAdmin,
  onSaveApplication, 
  onDeleteApplication,
  onUpdateStatus,
  onSaveIPO,
  isAppModalOpen,
  setIsAppModalOpen 
}) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [editingApp, setEditingApp] = useState(null);
  
  // Status Update Modal State
  const [statusModalApp, setStatusModalApp] = useState(null);
  const [modalStatus, setModalStatus] = useState('ALLOTTED');
  const [modalLotsAllotted, setModalLotsAllotted] = useState(1);
  const [modalProfit, setModalProfit] = useState(0);

  // New/Edit Application Form State
  const [selectedPartyId, setSelectedPartyId] = useState(parties[0]?.id || '');
  const [selectedIpoId, setSelectedIpoId] = useState(ipos[0]?.id || '');
  const [lotsApplied, setLotsApplied] = useState(1);
  const [paymentMode, setPaymentMode] = useState('ASBA');
  const [notes, setNotes] = useState('');
  
  // DateTime state
  const getCurrentLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const [customDateTime, setCustomDateTime] = useState(getCurrentLocalDateTime());

  const handleDeleteApp = async (app) => {
    if (!isAdmin) {
      alert('Access Denied: Only Admin (admin@gmail.com) has permission to delete applications.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this IPO application?')) {
      await onDeleteApplication(app.id);
    }
  };

  const openAddApp = () => {
    setEditingApp(null);
    setSelectedPartyId(parties[0]?.id || '');
    setSelectedIpoId(ipos[0]?.id || '');
    setLotsApplied(1);
    setPaymentMode('ASBA');
    setNotes('');
    setCustomDateTime(getCurrentLocalDateTime());
    setIsAppModalOpen(true);
  };

  const openEditApp = (app) => {
    setEditingApp(app);
    setSelectedPartyId(app.party_id);
    setSelectedIpoId(app.ipo_id);
    setLotsApplied(app.lots_applied || 1);
    setPaymentMode(app.payment_mode || 'ASBA');
    setNotes(app.notes || '');
    if (app.application_date) {
      const d = new Date(app.application_date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setCustomDateTime(d.toISOString().slice(0, 16));
    }
    setIsAppModalOpen(true);
  };

  // New IPO Inline State
  const [isAddingNewIpo, setIsAddingNewIpo] = useState(false);
  const [newIpoName, setNewIpoName] = useState('');
  const [newIpoSymbol, setNewIpoSymbol] = useState('');
  const [newIpoPrice, setNewIpoPrice] = useState(500);
  const [newIpoLotSize, setNewIpoLotSize] = useState(30);

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const filteredApps = applications.filter((app) => {
    if (activeFilter === 'ALL') return true;
    return app.allotment_status === activeFilter;
  });

  const handleCreateNewIpo = async () => {
    if (!newIpoName) { alert('Please enter the company name.'); return; }
    const ipo = await onSaveIPO({
      company_name: newIpoName,
      symbol: newIpoSymbol || newIpoName.slice(0, 5).toUpperCase(),
      price_per_share: parseFloat(newIpoPrice) || 0,
      lot_size: parseInt(newIpoLotSize, 10) || 1,
      status: 'OPEN'
    });
    if (ipo && ipo.id) {
      setSelectedIpoId(ipo.id);
      setIsAddingNewIpo(false);
      setNewIpoName('');
      setNewIpoSymbol('');
      setNewIpoPrice(500);
      setNewIpoLotSize(30);
    } else {
      alert('Failed to save IPO. Please try again.');
    }
  };

  const handleCreateApplication = async (e) => {
    e.preventDefault();
    const ipo = ipos.find(i => i.id === selectedIpoId);
    if (!ipo || !selectedPartyId) return;

    await onSaveApplication({
      id: editingApp ? editingApp.id : undefined,
      party_id: selectedPartyId,
      ipo_id: selectedIpoId,
      lots_applied: parseInt(lotsApplied, 10),
      lot_size: ipo.lot_size,
      price_per_share: ipo.price_per_share,
      company_name: ipo.company_name,
      payment_mode: paymentMode,
      notes,
      application_date: new Date(customDateTime).toISOString()
    });

    setIsAppModalOpen(false);
    setEditingApp(null);
    setNotes('');
  };

  const handleSaveStatusModal = async (e) => {
    e.preventDefault();
    if (!statusModalApp) return;

    await onUpdateStatus(
      statusModalApp.id,
      modalStatus,
      modalStatus === 'ALLOTTED' ? parseInt(modalLotsAllotted, 10) : 0,
      parseFloat(modalProfit || 0)
    );

    setStatusModalApp(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="font-display font-bold text-xl text-white">IPO Applications & Allotment</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage family bids, allotment statuses, and money unblocks</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAppModalOpen(true)}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Application</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        {['ALL', 'PENDING', 'ALLOTTED', 'NOT_ALLOTTED'].map((st) => (
          <button
            key={st}
            onClick={() => setActiveFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilter === st 
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {st === 'ALL' ? 'All Bids' : st === 'NOT_ALLOTTED' ? 'Not Allotted (Refunded)' : st}
          </button>
        ))}
      </div>

      {/* Applications Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApps.map((app) => {
          const party = parties.find(p => p.id === app.party_id);
          const ipo = ipos.find(i => i.id === app.ipo_id);

          return (
            <div 
              key={app.id}
              className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-4 hover:border-slate-700 transition relative group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-white">{ipo ? ipo.company_name : 'IPO'}</h3>
                  <p className="text-xs font-medium text-emerald-400 mt-0.5">{party ? party.name : 'Unknown Party'}</p>
                </div>
                
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                  app.allotment_status === 'ALLOTTED' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : app.allotment_status === 'NOT_ALLOTTED'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {app.allotment_status}
                </span>
              </div>

              {/* Financial & Bid Details */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Applied Lots</span>
                  <span className="text-slate-200 font-bold">{app.lots_applied} Lot ({app.shares_applied} shares)</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Blocked Amount</span>
                  <span className="text-emerald-400 font-bold">{formatINR(app.amount_applied)}</span>
                </div>

                {app.allotment_status === 'ALLOTTED' && (
                  <>
                    <div className="col-span-1">
                      <span className="text-[10px] text-slate-500 font-sans block">Allotted</span>
                      <span className="text-emerald-300 font-bold">{app.lots_allotted} Lot ({formatINR(app.amount_allotted)})</span>
                    </div>

                    <div className="col-span-1">
                      <span className="text-[10px] text-slate-500 font-sans block">Profit Realized</span>
                      <span className="text-indigo-300 font-bold">{formatINR(app.profit_loss)}</span>
                    </div>
                  </>
                )}

                {app.allotment_status === 'NOT_ALLOTTED' && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 font-sans block">Refund Unblocked</span>
                    <span className="text-teal-300 font-bold">{formatINR(app.refund_amount)}</span>
                  </div>
                )}
              </div>

              {/* Date & Note Info */}
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1 font-mono">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{new Date(app.application_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </span>

                <div className="flex items-center space-x-2">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => {
                          setStatusModalApp(app);
                          setModalStatus(app.allotment_status === 'PENDING' ? 'ALLOTTED' : app.allotment_status);
                          setModalLotsAllotted(app.lots_applied);
                          setModalProfit(app.profit_loss || 0);
                        }}
                        className="flex items-center space-x-1 text-emerald-400 font-semibold hover:underline"
                        title="Admin: Update Allotment Result"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Update Result</span>
                      </button>

                      <button
                        onClick={() => handleDeleteApp(app)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                        title="Admin Only: Delete Application"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800" title="Only Admin (admin@gmail.com) can update or delete">
                      Locked
                    </span>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL 1: NEW APPLICATION */}
      {isAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-semibold text-lg text-white">Record IPO Application</h3>
              <button onClick={() => setIsAppModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-4">
              
              {/* Party Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Member / Party</label>
                <select
                  value={selectedPartyId}
                  onChange={(e) => setSelectedPartyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                >
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (PAN: {p.pan || 'N/A'})</option>
                  ))}
                </select>
              </div>

              {/* IPO Selector / Add New */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">IPO Company</label>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingNewIpo(!isAddingNewIpo)}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    {isAddingNewIpo ? '← Choose Existing' : '+ Add Custom IPO'}
                  </button>
                </div>

                {isAddingNewIpo ? (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <input
                      type="text"
                      placeholder="Company Name (e.g. Swiggy Ltd)"
                      value={newIpoName}
                      onChange={(e) => setNewIpoName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Symbol"
                        value={newIpoSymbol}
                        onChange={(e) => setNewIpoSymbol(e.target.value)}
                        className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                      />
                      <input
                        type="number"
                        placeholder="Price ₹"
                        value={newIpoPrice}
                        onChange={(e) => setNewIpoPrice(e.target.value)}
                        className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                      />
                      <input
                        type="number"
                        placeholder="Lot Size"
                        value={newIpoLotSize}
                        onChange={(e) => setNewIpoLotSize(e.target.value)}
                        className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateNewIpo}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-400 rounded-lg"
                    >
                      Save New IPO
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedIpoId}
                    onChange={(e) => setSelectedIpoId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                  >
                    {ipos.map(i => (
                      <option key={i.id} value={i.id}>{i.company_name} (₹{i.price_per_share} x {i.lot_size} qty)</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Lots Applied & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Lots Applied</label>
                  <input
                    type="number"
                    min="1"
                    value={lotsApplied}
                    onChange={(e) => setLotsApplied(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                  >
                    <option value="ASBA">3-in-1 / ASBA Netbanking</option>
                    <option value="UPI">UPI Mandate</option>
                    <option value="CASH">Direct Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Date & Time Picker (Manual Override vs Default Current Time) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">Application Date & Time</label>
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
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Application No.</label>
                <input
                  type="text"
                  placeholder="Optional reference or Demat account notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition"
              >
                Submit & Block Funds
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE ALLOTMENT STATUS */}
      {statusModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-semibold text-lg text-white">Update Allotment Status</h3>
              <button onClick={() => setStatusModalApp(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatusModal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status Result</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                >
                  <option value="ALLOTTED">ALLOTTED (Shares Received)</option>
                  <option value="NOT_ALLOTTED">NOT ALLOTTED (Auto Unblock Refund)</option>
                  <option value="PENDING">PENDING (Awaiting Result)</option>
                </select>
              </div>

              {modalStatus === 'ALLOTTED' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Lots Allotted</label>
                    <input
                      type="number"
                      min="1"
                      value={modalLotsAllotted}
                      onChange={(e) => setModalLotsAllotted(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Listing Profit / Gain (₹)</label>
                    <input
                      type="number"
                      value={modalProfit}
                      onChange={(e) => setModalProfit(e.target.value)}
                      placeholder="e.g. 4500"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition"
              >
                Save & Update Ledger Balances
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
