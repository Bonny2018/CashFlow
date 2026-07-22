import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://pghcncsmnlpbcqdtxzvo.supabase.co', 'sb_publishable_8OgiEp_dYkuUqC1sEGbbNw_b5x7DK9W');
async function test() {
  const { data, error } = await supabase.from('parties').select('user_email').limit(1);
  console.log('Result:', data);
  console.log('Error:', error);
}
test();
