import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://pghcncsmnlpbcqdtxzvo.supabase.co', 'sb_publishable_8OgiEp_dYkuUqC1sEGbbNw_b5x7DK9W');
async function test() {
  const tables = ['parties', 'ipos', 'ipo_applications', 'money_transactions', 'tax_records', 'tax_payments'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('user_email').limit(1);
    console.log(`Table ${table} user_email:`, error ? error.message : 'OK');
  }
}
test();
