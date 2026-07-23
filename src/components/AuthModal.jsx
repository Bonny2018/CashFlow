import React, { useState } from 'react';
import { X, Mail, Lock, Sparkles, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (loginEmail, loginPassword) => {
    setErrorMsg('');
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    setLoading(true);

    // Hardcoded Admin Bypass — supports both admin accounts
    // Trim both email and password to avoid whitespace issues
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    const ADMIN_ACCOUNTS = [
      { email: 'admin@gmail.com', password: 'admin123' },
      { email: 'mohitjain12104@gmail.com', password: 'mohit123' },
    ];
    const matchedAdmin = ADMIN_ACCOUNTS.find(
      a => a.email === cleanEmail && a.password === cleanPassword
    );
    if (matchedAdmin) {
      const adminUser = { email: matchedAdmin.email, id: 'admin-1', role: 'admin' };
      localStorage.setItem('IPO_USER_SESSION', JSON.stringify(adminUser));
      localStorage.setItem('IPO_DEMO_USER', JSON.stringify(adminUser));
      setLoading(false);
      onAuthSuccess(adminUser);
      onClose();
      return;
    }

    if (isSupabaseConfigured && supabase) {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: loginEmail,
          password: loginPassword,
        });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setErrorMsg('Please check your email inbox and click the confirmation link to verify your account before logging in.');
          } else {
            setErrorMsg(error.message);
          }
          setLoading(false);
          return;
        }
        onAuthSuccess(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setErrorMsg('Please check your email inbox and click the confirmation link to verify your account before logging in.');
          } else if (error.message.includes('Invalid login credentials')) {
            setErrorMsg('Invalid email or password. Hint: admin@gmail.com / admin123');
          } else {
            setErrorMsg(error.message);
          }
          setLoading(false);
          return;
        }
        onAuthSuccess(data.user);
      }
      setLoading(false);
      onClose();
    } else {
      setTimeout(() => {
        const localUser = { email: cleanEmail, id: `user-${Date.now()}` };
        localStorage.setItem('IPO_USER_SESSION', JSON.stringify(localUser));
        localStorage.setItem('IPO_DEMO_USER', JSON.stringify(localUser));
        onAuthSuccess(localUser);
        setLoading(false);
        onClose();
      }, 300);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(email, password);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
        
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h3 className="font-display font-semibold text-lg text-white">
              {isSignUp ? 'Create IPO Ledger Account' : 'Sign In with Email & Password'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>


        {errorMsg && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com or user@domain.com"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isSignUp ? 'Create Account' : 'Sign In Now'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center pt-3 border-t border-slate-800 text-xs text-slate-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
            className="text-emerald-400 font-semibold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Create One'}
          </button>
        </div>

      </div>
    </div>
  );
}
