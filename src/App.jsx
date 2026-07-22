import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Dashboard from './pages/Dashboard';
import ExcelGrid from './pages/ExcelGrid';
import Applications from './pages/Applications';
import PartiesLedger from './pages/PartiesLedger';
import MoneyFlow from './pages/MoneyFlow';
import ITRManager from './pages/ITRManager';

import { 
  fetchStoreData, 
  saveParty, 
  deleteParty,
  saveIPO, 
  deleteIPO,
  saveApplication, 
  deleteApplication,
  saveTransaction, 
  deleteTransaction,
  saveTaxRecord,
  saveTaxPayment,
  deleteTaxPayment,
  clearAllTaxPayments,
  updateAllotmentStatus, 
  calculatePartyBalances,
  clearAllStoreData
} from './services/store';

import { supabase, isSupabaseConfigured } from './lib/supabase';

import GraphicalAnalytics from './pages/GraphicalAnalytics';
import SupabaseSetup from './pages/SupabaseSetup';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Store State
  const [parties, setParties] = useState([]);
  const [ipos, setIpos] = useState([]);
  const [applications, setApplications] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [taxRecords, setTaxRecords] = useState([]);
  const [taxPayments, setTaxPayments] = useState([]);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);

  // Modals state
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    const data = await fetchStoreData();
    setParties(data.parties);
    setIpos(data.ipos);
    setApplications(data.applications);
    setTransactions(data.transactions);
    setTaxRecords(data.taxRecords || []);
    setTaxPayments(data.taxPayments || []);
    setIsSupabaseLive(data.isSupabase);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Check Auth session
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    } else {
      const demoUser = localStorage.getItem('IPO_USER_SESSION') || localStorage.getItem('IPO_DEMO_USER');
      if (demoUser) {
        setUser(JSON.parse(demoUser));
      }
    }
  }, []);

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('IPO_USER_SESSION');
    localStorage.removeItem('IPO_DEMO_USER');
    setUser(null);
    setIsAuthOpen(true);
  };

  const userEmail = (user?.email || '').trim().toLowerCase();
  const isAdmin = true; // Everyone is an admin now

  // Real-World Shared Ledger: ALL Members & Visitors see ALL entries when visiting the site
  const scopedParties = React.useMemo(() => parties, [parties]);
  const scopedApplications = React.useMemo(() => applications, [applications]);
  const scopedTransactions = React.useMemo(() => transactions, [transactions]);
  const scopedTaxRecords = React.useMemo(() => taxRecords, [taxRecords]);
  const scopedTaxPayments = React.useMemo(() => taxPayments, [taxPayments]);

  const partiesWithBalances = calculatePartyBalances(scopedParties, scopedTransactions);

  // Handlers for store updates
  const handleSaveParty = async (partyData) => {
    try {
      await saveParty({ ...partyData, user_email: partyData.user_email || user?.email });
      await loadData();
    } catch (err) { alert(`Failed to save party: ${err.message}`); }
  };

  const handleDeleteParty = async (id) => {
    try {
      await deleteParty(id);
      await loadData();
    } catch (err) { alert(`Failed to delete party: ${err.message}`); }
  };

  const handleSaveIPO = async (ipoData) => {
    try {
      const ipo = await saveIPO({ ...ipoData, user_email: ipoData.user_email || user?.email });
      await loadData();
      return ipo;
    } catch (err) { alert(`Failed to save IPO: ${err.message}`); return null; }
  };

  const handleSaveApplication = async (appData) => {
    try {
      await saveApplication({ ...appData, user_email: appData.user_email || user?.email });
      await loadData();
    } catch (err) { alert(`Failed to save application: ${err.message}`); }
  };

  const handleDeleteApplication = async (id) => {
    try {
      await deleteApplication(id);
      await loadData();
    } catch (err) { alert(`Failed to delete application: ${err.message}`); }
  };

  const handleSaveTransaction = async (txData) => {
    try {
      await saveTransaction({ ...txData, user_email: txData.user_email || user?.email });
      await loadData();
    } catch (err) { alert(`Failed to save transaction: ${err.message}`); }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      await loadData();
    } catch (err) { alert(`Failed to delete transaction: ${err.message}`); }
  };

  const handleSaveTaxRecord = async (taxData) => {
    try {
      await saveTaxRecord({ ...taxData, user_email: taxData.user_email || user?.email });
      await loadData();
    } catch (err) { alert(`Failed to save tax record: ${err.message}`); }
  };

  const handleSaveTaxPayment = async (payData) => {
    try {
      await saveTaxPayment({ ...payData, user_email: payData.user_email || user?.email });
      await loadData();
    } catch (err) { alert(`Failed to save tax payment: ${err.message}`); }
  };

  const handleDeleteTaxPayment = async (id) => {
    try {
      await deleteTaxPayment(id);
      await loadData();
    } catch (err) { alert(`Failed to delete tax payment: ${err.message}`); }
  };

  const handleClearTaxPayments = async (partyId = null, FY = null) => {
    try {
      await clearAllTaxPayments(partyId, FY);
      await loadData();
    } catch (err) { alert(`Failed to clear tax payments: ${err.message}`); }
  };

  const handleUpdateStatus = async (appId, status, allottedLots, profit) => {
    try {
      await updateAllotmentStatus(appId, status, allottedLots, profit);
      await loadData();
    } catch (err) { alert(`Failed to update status: ${err.message}`); }
  };

  const handleResetAllData = async () => {
    try {
      await clearAllStoreData();
      await loadData();
    } catch (err) { alert(`Failed to reset data: ${err.message}`); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Navigation */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isAdmin={isAdmin}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        isSupabase={isSupabaseLive}
        onOpenNewApp={() => { setActiveTab('applications'); setIsAppModalOpen(true); }}
        onOpenNewTransfer={() => { setActiveTab('money-flow'); setIsTransferModalOpen(true); }}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 space-x-3 text-slate-400">
            <span className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-400 border-t-transparent" />
            <span className="font-display font-medium text-sm">Loading IPO Ledger Data...</span>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard 
                parties={partiesWithBalances}
                ipos={ipos}
                applications={scopedApplications}
                transactions={scopedTransactions}
                user={user}
                isAdmin={isAdmin}
                onOpenNewApp={() => { setActiveTab('applications'); setIsAppModalOpen(true); }}
                onOpenNewTransfer={() => { setActiveTab('money-flow'); setIsTransferModalOpen(true); }}
                onOpenNewParty={() => { setActiveTab('ledger'); setIsPartyModalOpen(true); }}
                onNavigateTab={setActiveTab}
                onResetAll={handleResetAllData}
              />
            )}

            {activeTab === 'analytics' && (
              <GraphicalAnalytics
                applications={scopedApplications}
                parties={partiesWithBalances}
                ipos={ipos}
                transactions={scopedTransactions}
              />
            )}

            {activeTab === 'excel-grid' && (
              <ExcelGrid 
                applications={scopedApplications}
                parties={scopedParties}
                ipos={ipos}
                isAdmin={isAdmin}
                onUpdateStatus={handleUpdateStatus}
                onDeleteApplication={handleDeleteApplication}
                onOpenNewApp={() => { setActiveTab('applications'); setIsAppModalOpen(true); }}
              />
            )}

            {activeTab === 'applications' && (
              <Applications 
                applications={scopedApplications}
                parties={scopedParties}
                ipos={ipos}
                isAdmin={isAdmin}
                onSaveApplication={handleSaveApplication}
                onDeleteApplication={handleDeleteApplication}
                onUpdateStatus={handleUpdateStatus}
                onSaveIPO={handleSaveIPO}
                isAppModalOpen={isAppModalOpen}
                setIsAppModalOpen={setIsAppModalOpen}
              />
            )}

            {activeTab === 'ledger' && (
              <PartiesLedger 
                partiesWithBalances={partiesWithBalances}
                transactions={scopedTransactions}
                ipos={ipos}
                applications={scopedApplications}
                isAdmin={isAdmin}
                onSaveParty={handleSaveParty}
                onDeleteParty={handleDeleteParty}
                isPartyModalOpen={isPartyModalOpen}
                setIsPartyModalOpen={setIsPartyModalOpen}
              />
            )}

            {activeTab === 'money-flow' && (
              <MoneyFlow 
                transactions={scopedTransactions}
                parties={scopedParties}
                isAdmin={isAdmin}
                onSaveTransaction={handleSaveTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                isTransferModalOpen={isTransferModalOpen}
                setIsTransferModalOpen={setIsTransferModalOpen}
              />
            )}

            {activeTab === 'itr-tax' && (
              <ITRManager 
                parties={scopedParties}
                applications={scopedApplications}
                ipos={ipos}
                transactions={scopedTransactions}
                taxRecords={scopedTaxRecords}
                taxPayments={scopedTaxPayments}
                isAdmin={isAdmin}
                onSaveTaxRecord={handleSaveTaxRecord}
                onSaveTaxPayment={handleSaveTaxPayment}
                onDeleteTaxPayment={handleDeleteTaxPayment}
                onClearTaxPayments={handleClearTaxPayments}
              />
            )}

            {activeTab === 'supabase' && (
              <SupabaseSetup />
            )}
          </>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
      />

    </div>
  );
}
