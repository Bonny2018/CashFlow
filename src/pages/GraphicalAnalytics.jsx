import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingUp, DollarSign, Sparkles } from 'lucide-react';

export default function GraphicalAnalytics({ applications, parties, ipos, transactions }) {
  
  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  // 1. Allotment Status Pie Chart Data
  const allottedCount = applications.filter(a => a.allotment_status === 'ALLOTTED').length;
  const notAllottedCount = applications.filter(a => a.allotment_status === 'NOT_ALLOTTED').length;
  const pendingCount = applications.filter(a => a.allotment_status === 'PENDING').length;

  const pieData = [
    { name: 'Allotted', value: allottedCount, color: '#10b981' },
    { name: 'Not Allotted (Refunded)', value: notAllottedCount, color: '#f43f5e' },
    { name: 'Pending Result', value: pendingCount, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  // 2. Party Funds Bar Chart Data
  const partyFundsData = parties.map(p => {
    const partyApps = applications.filter(a => a.party_id === p.id);
    const totalBlocked = partyApps.reduce((acc, a) => acc + (a.amount_applied || 0), 0);
    const totalAllotted = partyApps.reduce((acc, a) => acc + (a.amount_allotted || 0), 0);

    return {
      name: p.name.split(' ')[0], // First name
      fullName: p.name,
      'Blocked Funds': totalBlocked,
      'Allotted Value': totalAllotted,
      'Available Balance': p.currentBalance || p.initial_balance || 0
    };
  });

  // 3. IPO Performance Gains Bar Chart Data
  const ipoGainsData = ipos.map(ipo => {
    const ipoApps = applications.filter(a => a.ipo_id === ipo.id);
    const totalApplied = ipoApps.reduce((acc, a) => acc + (a.amount_applied || 0), 0);
    const totalProfit = ipoApps.reduce((acc, a) => acc + (a.profit_loss || 0), 0);

    return {
      name: ipo.symbol || ipo.company_name.slice(0, 10),
      fullName: ipo.company_name,
      'Total Funds Applied': totalApplied,
      'Realized Profit': totalProfit
    };
  });

  // Custom Tooltip Formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs font-mono">
          <p className="font-sans font-bold text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="flex justify-between space-x-4">
              <span>{entry.name}:</span>
              <span className="font-bold">{formatINR(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white">Graphical Analytics & Reports</h2>
            <p className="text-xs text-slate-400">Visual breakdowns of party investments, allotment rates, and cash flow trends</p>
          </div>
        </div>

        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-xs font-semibold">
          Interactive Graphs
        </span>
      </div>

      {/* Grid 1: Allotment Pie Chart & Party Funds Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Allotment Ratio Pie Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <PieIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display font-semibold text-base text-white">Allotment Distribution</h3>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-bold text-white">{item.value} ({((item.value / applications.length) * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Party Funds Comparison Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            <h3 className="font-display font-semibold text-base text-white">Party Account Balances & Blocked Capital</h3>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partyFundsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Blocked Funds" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Allotted Value" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Available Balance" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Grid 2: IPO Performance & Profit Breakdown */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h3 className="font-display font-semibold text-base text-white">IPO Wise Capital Blocked vs Realized Profit</h3>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ipoGainsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Total Funds Applied" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Realized Profit" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
