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
  onOpenNewTransfer,
  onToggleChatbot,
  isAuthLoading
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Graphs & Charts', icon: Sparkles, badge: 'NEW', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { id: 'excel-grid', label: 'Excel Sheet', icon: FileSpreadsheet, badge: 'PRO', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { id: 'applications', label: 'IPO Applications', icon: Table },
    { id: 'ledger', label: 'Party Accounts', icon: Users },
    { id: 'money-flow', label: 'Money Come/Go', icon: ArrowRightLeft },
    { id: 'itr-tax', label: 'ITR & Tax', icon: FileText, badge: 'ITR', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    { id: 'supabase', label: 'Database Setup', icon: Database, badge: 'ADMIN', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div className="w-full max-w-[1500px] mx-auto px-3 sm:px-5">
        
        {/* Top Header Row: Logo & Actions */}
        <div className="flex items-center justify-between h-14 border-b border-slate-900/80 gap-3">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer group" 
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display text-base font-extrabold tracking-tight text-white">
                  IPO<span className="text-emerald-400">Pro</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  Ledger
                </span>
                {isSupabase && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Supabase Live
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Controls & Auth User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* AI Assistant Drawer Trigger */}
            <button
              onClick={onToggleChatbot}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs shadow-md transition-all group"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition" />
              <span className="font-bold">AI Assistant</span>
            </button>

            {/* Quick Apply IPO */}
            <button
              onClick={onOpenNewApp}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/40 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply IPO</span>
            </button>

            {/* Auth / Account Profile */}
            {isAuthLoading ? (
              <div className="flex items-center pl-2 border-l border-slate-800">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-600 border-t-slate-400" />
              </div>
            ) : user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                {isAdmin ? (
                  <div 
                    title={`Admin User: ${user.email}`}
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg text-amber-300"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs font-semibold font-mono truncate max-w-[100px]">Admin</span>
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
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-medium transition"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Login</span>
              </button>
            )}

          </div>
        </div>

        {/* Bottom Navigation Bar Row (Single Screen Fit, High Contrast & Readable) */}
        <nav className="flex items-center justify-between py-2 overflow-x-auto no-scrollbar gap-1 text-slate-300">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/10 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="tracking-wide">{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.3 text-[9px] font-extrabold uppercase rounded border ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
