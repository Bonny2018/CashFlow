import React, { useState, useEffect } from 'react';
import { Database, Server, CheckCircle2, HardDrive, RefreshCw, Table, ShieldCheck } from 'lucide-react';

export default function SQLiteManager() {
  const [dbInfo, setDbInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSQLite = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/data');
      if (res.ok) {
        const data = await res.json();
        setDbInfo(data);
      }
    } catch (e) {
      console.error('SQLite fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSQLite();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto pb-12">
      
      {/* Status Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Database className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white">SQLite Local Database Management</h2>
            <p className="text-xs text-slate-400">Embedded zero-configuration database backend</p>
          </div>
        </div>

        <button
          onClick={checkSQLite}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Database Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-slate-400">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Database File</span>
          </div>
          <p className="font-mono text-sm font-bold text-white truncate" title="/Users/mohitjain/Desktop/RAJ/ipo_ledger.db">
            ipo_ledger.db
          </p>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
            SQLite3 Engine Active
          </span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-slate-400">
            <Server className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">API Endpoint</span>
          </div>
          <p className="font-mono text-sm font-bold text-white">
            http://localhost:3001
          </p>
          <span className="text-[10px] text-teal-300 font-semibold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 inline-block">
            Express Backend Online
          </span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Data Persistence</span>
          </div>
          <p className="font-mono text-sm font-bold text-white">
            100% Local Offline
          </p>
          <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block">
            No Cloud Dependency
          </span>
        </div>

      </div>

      {/* Table Records Summary */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-display font-semibold text-base text-white">SQLite Database Tables & Record Counts</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block font-sans">PARTIES</span>
            <span className="text-emerald-400 font-bold text-lg">{dbInfo?.parties?.length || 0}</span>
          </div>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block font-sans">IPOS</span>
            <span className="text-teal-400 font-bold text-lg">{dbInfo?.ipos?.length || 0}</span>
          </div>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block font-sans">APPLICATIONS</span>
            <span className="text-indigo-400 font-bold text-lg">{dbInfo?.applications?.length || 0}</span>
          </div>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block font-sans">TRANSACTIONS</span>
            <span className="text-amber-400 font-bold text-lg">{dbInfo?.transactions?.length || 0}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
