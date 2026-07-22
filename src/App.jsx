import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Dashboard from './pages/Dashboard';
import ExcelGrid from './pages/ExcelGrid';
import Applications from './pages/Applications';
import PartiesLedger from './pages/PartiesLedger';
import MoneyFlow from './pages/MoneyFlow';
import SQLiteManager from './pages/SQLiteManager';
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
      } else {
        // Auto open login modal if no user logged in
        setIsAuthOpen(true);
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
  const isAdmin = Boolean(user && (userEmail.includes('mohitjain12104@gmail') || userEmail === 'admin'));

  // Filtering for Regular Users vs Admin
  const scopedParties = React.useMemo(() => {
    if (isAdmin) return parties;
    if (!user) return [];
    return parties.filter(p => !p.user_email || p.user_email.trim().toLowerCase() === userEmail);
  }, [parties, userEmail, isAdmin, user]);

  const scopedPartyIds = React.useMemo(() => scopedParties.map(p => p.id), [scopedParties]);

  const scopedApplications = React.useMemo(() => {
    if (isAdmin) return applications;
    if (!user) return [];
    return applications.filter(a => !a.user_email || (a.user_email && a.user_email.trim().toLowerCase() === userEmail) || scopedPartyIds.includes(a.party_id));
  }, [applications, scopedPartyIds, userEmail, isAdmin, user]);

  const scopedTransactions = React.useMemo(() => {
    if (isAdmin) return transactions;
    if (!user) return [];
    return transactions.filter(t => 
      !t.user_email ||
      (t.user_email && t.user_email.trim().toLowerCase() === userEmail) || 
      scopedPartyIds.includes(t.from_party_id) || 
      scopedPartyIds.includes(t.to_party_id)
    );
  }, [transactions, scopedPartyIds, userEmail, isAdmin, user]);

  const scopedTaxRecords = React.useMemo(() => {
    if (isAdmin) return taxRecords;
    if (!user) return [];
    return taxRecords.filter(r => !r.user_email || (r.user_email && r.user_email.trim().toLowerCase() === userEmail) || scopedPartyIds.includes(r.party_id));
  }, [taxRecords, scopedPartyIds, userEmail, isAdmin, user]);

  const scopedTaxPayments = React.useMemo(() => {
    if (isAdmin) return taxPayments;
    if (!user) return [];
    return taxPayments.filter(p => !p.user_email || (p.user_email && p.user_email.trim().toLowerCase() === userEmail) || scopedPartyIds.includes(p.party_id));
  }, [taxPayments, scopedPartyIds, userEmail, isAdmin, user]);

  const partiesWithBalances = calculatePartyBalances(scopedParties, scopedTransactions);

  // Handlers for store updates
  const handleSaveParty = async (partyData) => {
    await saveParty({ ...partyData, user_email: partyData.user_email || user?.email });
    await loadData();
  };

  const handleDeleteParty = async (id) => {
    if (!isAdmin) {
      alert('Access Denied: Only Admin (mohitjain12104@gmail.com) has permission to delete party accounts.');
      return;
    }
    await deleteParty(id);
    await loadData();
  };

  const handleSaveIPO = async (ipoData) => {
    const ipo = await saveIPO({ ...ipoData, user_email: ipoData.user_email || user?.email });
    await loadData();
    return ipo;
  };

  const handleSaveApplication = async (appData) => {
    await saveApplication({ ...appData, user_email: appData.user_email || user?.email });
    await loadData();
  };

  const handleDeleteApplication = async (id) => {
    if (!isAdmin) {
      alert('Access Denied: Only Admin (mohitjain12104@gmail.com) has permission to delete applications.');
      return;
    }
    await deleteApplication(id);
    await loadData();
  };

  const handleSaveTransaction = async (txData) => {
    await saveTransaction({ ...txData, user_email: txData.user_email || user?.email });
    await loadData();
  };

  const handleDeleteTransaction = async (id) => {
    if (!isAdmin) {
      alert('Access Denied: Only Admin (mohitjain12104@gmail.com) has permission to delete transactions.');
      return;
    }
    await deleteTransaction(id);
    await loadData();
  };

  const handleSaveTaxRecord = async (taxData) => {
    await saveTaxRecord({ ...taxData, user_email: taxData.user_email || user?.email });
    await loadData();
  };

  const handleSaveTaxPayment = async (payData) => {
    await saveTaxPayment({ ...payData, user_email: payData.user_email || user?.email });
    await loadData();
  };

  const handleDeleteTaxPayment = async (id) => {
    await deleteTaxPayment(id);
    await loadData();
  };

  const handleClearTaxPayments = async (partyId = null, FY = null) => {
    await clearAllTaxPayments(partyId, FY);
    await loadData();
  };

  const handleUpdateStatus = async (appId, status, allottedLots, profit) => {
    if (!isAdmin) {
      alert('Access Denied: Only Admin (mohitjain12104@gmail.com) has permission to update allotment results.');
      return;
    }
    await updateAllotmentStatus(appId, status, allottedLots, profit);
    await loadData();
  };

  const handleResetAllData = async () => {
    if (!isAdmin) {
      alert('Access Denied: Only Admin (mohitjain12104@gmail.com) has permission to wipe system data.');
      return;
    }
    await clearAllStoreData();
    await loadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Navigation */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
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

            {activeTab === 'sqlite' && (
              <SQLiteManager />
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
