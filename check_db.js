const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

try {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  async function main() {
    try {
      const { data: jobs, error: jErr } = await supabase
        .from('scraping_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      console.log('--- RECENT JOBS ---');
      console.log(JSON.stringify(jobs, null, 2));

      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, handle, platform, rules, status, error_msg')
        .eq('handle', 'melfizin');

      console.log('--- PROFILES ---');
      console.log(JSON.stringify(profiles, null, 2));

      const { data: raw, error: rErr } = await supabase
        .from('raw_responses')
        .select('id, created_at, error_msg, payload')
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('--- LATEST RAW RESPONSE ---');
      if (raw && raw.length > 0) {
         console.log('ID:', raw[0].id, 'Created At:', raw[0].created_at, 'Error:', raw[0].error_msg);
         console.log('Payload Type/Length:', typeof raw[0].payload);
         // If apify payload has items
         if (raw[0].payload) console.log('Item count in raw payload:', raw[0].payload.itemCount);
      } else {
         console.log('No raw responses found');
      }
    } catch (e) {
      console.error("Async Error:", e);
    }
  }

  main();
} catch (e) {
  console.error("Init Error:", e);
}
