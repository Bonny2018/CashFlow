import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from localStorage override or env variables
const customUrl = localStorage.getItem('IPO_SUPABASE_URL');
const customKey = localStorage.getItem('IPO_SUPABASE_ANON_KEY');

const supabaseUrl = customUrl || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = customKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Valid Supabase anon key must be a proper JWT (starts with 'eyJ')
// sb_publishable_... format keys are invalid and will cause auth/db failures
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.includes('supabase.co') &&
  supabaseAnonKey.startsWith('eyJ')
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
