import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://pghcncsmnlpbcqdtxzvo.supabase.co', 'sb_publishable_8OgiEp_dYkuUqC1sEGbbNw_b5x7DK9W');
async function test() {
  const newParty = { name: 'raj vidja2', initial_balance: 0 };
  const { data, error } = await supabase.from('parties').upsert(newParty).select();
  console.log('Result:', data);
  console.log('Error:', error);
}
test();
