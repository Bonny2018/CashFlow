require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('applications')
    .delete()
    .eq('ipo_name', 'CALIBAR LOGISTIC')
    .eq('party_name', 'RAJ VIDJA');
    
  if (error) console.error('Error deleting:', error);
  else console.log('Successfully deleted the application');
}

run();
