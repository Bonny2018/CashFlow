import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Dashboard from './pages/Dashboard';
import ExcelGrid from './pages/ExcelGrid';
import Applications from './pages/Applications';
import PartiesLedger from './pages/PartiesLedger';
import MoneyFlow from './pages/MoneyFlow';
import SQLiteManager from './pages/SQLiteManager';

import { 
  fetchStoreData, 
  saveParty, 
  saveIPO, 
  saveApplication, 
  saveTransaction, 
  updateAllotmentStatus, 
  calculatePartyBalances 
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
      const demoUser = localStorage.getItem('IPO_DEMO_USER');
      if (demoUser) setUser(JSON.parse(demoUser));
    }
  }, []);

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('IPO_DEMO_USER');
    setUser(null);
  };

  // Handlers for store updates
  const handleSaveParty = async (partyData) => {
    await saveParty(partyData);
    await loadData();
  };

  const handleSaveIPO = async (ipoData) => {
    const ipo = await saveIPO(ipoData);
    await loadData();
    return ipo;
  };

  const handleSaveApplication = async (appData) => {
    await saveApplication(appData);
    await loadData();
  };

  const handleSaveTransaction = async (txData) => {
    await saveTransaction(txData);
    await loadData();
  };

  const handleUpdateStatus = async (appId, status, allottedLots, profit) => {
    await updateAllotmentStatus(appId, status, allottedLots, profit);
    await loadData();
  };

  const handleResetAllData = async () => {
    await clearAllStoreData();
    await loadData();
  };

  const partiesWithBalances = calculatePartyBalances(parties, transactions);

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
                applications={applications}
                transactions={transactions}
                onOpenNewApp={() => { setActiveTab('applications'); setIsAppModalOpen(true); }}
                onOpenNewTransfer={() => { setActiveTab('money-flow'); setIsTransferModalOpen(true); }}
                onOpenNewParty={() => { setActiveTab('ledger'); setIsPartyModalOpen(true); }}
                onNavigateTab={setActiveTab}
                onResetAll={handleResetAllData}
              />
            )}

            {activeTab === 'analytics' && (
              <GraphicalAnalytics
                applications={applications}
                parties={partiesWithBalances}
                ipos={ipos}
                transactions={transactions}
              />
            )}

            {activeTab === 'excel-grid' && (
              <ExcelGrid 
                applications={applications}
                parties={parties}
                ipos={ipos}
                onUpdateStatus={handleUpdateStatus}
                onOpenNewApp={() => { setActiveTab('applications'); setIsAppModalOpen(true); }}
              />
            )}

            {activeTab === 'applications' && (
              <Applications 
                applications={applications}
                parties={parties}
                ipos={ipos}
                onSaveApplication={handleSaveApplication}
                onUpdateStatus={handleUpdateStatus}
                onSaveIPO={handleSaveIPO}
                isAppModalOpen={isAppModalOpen}
                setIsAppModalOpen={setIsAppModalOpen}
              />
            )}

            {activeTab === 'ledger' && (
              <PartiesLedger 
                partiesWithBalances={partiesWithBalances}
                transactions={transactions}
                ipos={ipos}
                applications={applications}
                onSaveParty={handleSaveParty}
                isPartyModalOpen={isPartyModalOpen}
                setIsPartyModalOpen={setIsPartyModalOpen}
              />
            )}

            {activeTab === 'money-flow' && (
              <MoneyFlow 
                transactions={transactions}
                parties={parties}
                onSaveTransaction={handleSaveTransaction}
                isTransferModalOpen={isTransferModalOpen}
                setIsTransferModalOpen={setIsTransferModalOpen}
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
