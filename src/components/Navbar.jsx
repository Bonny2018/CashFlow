import React from 'react';
import { 
  Table, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  ArrowRightLeft, 
  Database, 
  Lock, 
  LogOut, 
  UserCheck, 
  ShieldCheck,
  Sparkles,
  Plus,
  FileText
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  user, 
  isAdmin,
  onOpenAuth, 
  onLogout, 
  isSupabase,
  onOpenNewApp,
  onOpenNewTransfer
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Graphs & Charts', icon: Sparkles, badge: 'NEW' },
    { id: 'excel-grid', label: 'Excel Sheet', icon: FileSpreadsheet, badge: 'PRO' },
    { id: 'applications', label: 'IPO Applications', icon: Table },
    { id: 'ledger', label: 'Party Accounts', icon: Users },
    { id: 'money-flow', label: 'Money Come/Go', icon: ArrowRightLeft },
    { id: 'itr-tax', label: 'ITR & Tax', icon: FileText, badge: 'ITR' },
    { id: 'supabase', label: 'Database Setup', icon: Database, badge: 'ADMIN' }
  ];

  const userEmail = (user?.email || '').trim().toLowerCase();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display text-lg font-bold tracking-tight text-white">IPO<span className="text-emerald-400">Pro</span></span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">Ledger</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Money Flow & Allotment Manager</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons & Auth Status */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Actions */}
            <button
              onClick={onOpenNewApp}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply IPO</span>
            </button>



            {/* User Login/Account */}
            {user ? (
              <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
                {isAdmin ? (
                  <div 
                    title={`Admin Mode: ${user.email}`}
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs font-semibold font-mono truncate max-w-[110px]">👑 Admin</span>
                  </div>
                ) : (
                  <div 
                    title={`User: ${user.email}`}
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-mono text-slate-300 truncate max-w-[100px]">{user.email}</span>
                  </div>
                )}
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Email Login</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Tab Strip */}
        <div className="flex lg:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800/60 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
