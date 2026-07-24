import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from localStorage override or env variables
const customUrl = (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') ? localStorage.getItem('IPO_SUPABASE_URL') : null;
const customKey = (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') ? localStorage.getItem('IPO_SUPABASE_ANON_KEY') : null;

const envUrl = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://pghcncsmnlpbcqdtxzvo.supabase.co';
const envKey = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_8OgiEp_dYkuUqC1sEGbbNw_b5x7DK9W';

const supabaseUrl = customUrl || envUrl;
const supabaseAnonKey = customKey || envKey;

// Valid Supabase anon key: either a JWT (eyJ...) or new publishable key (sb_publishable_...)
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.includes('supabase.co') &&
  (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_publishable_'))
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const updateSupabaseCredentials = (url, key) => {
  if (url && key) {
    localStorage.setItem('IPO_SUPABASE_URL', url.trim());
    localStorage.setItem('IPO_SUPABASE_ANON_KEY', key.trim());
  } else {
    localStorage.removeItem('IPO_SUPABASE_URL');
    localStorage.removeItem('IPO_SUPABASE_ANON_KEY');
  }
  window.location.reload();
};
