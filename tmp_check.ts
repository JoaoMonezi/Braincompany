import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log('--- SCRAPING JOBS ---')
  const { data: jobs, error } = await supabase
    .from('scraping_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) console.error(error)
  console.log(JSON.stringify(jobs, null, 2))

  console.log('--- RAW RESPONSES ---')
  const { data: raw, error: rError } = await supabase
    .from('raw_responses')
    .select('id, profile_id, created_at')
    .order('created_at', { ascending: false })
    .limit(3)
  if (rError) console.error(rError)
  console.log(raw)

  console.log('--- POSTS ---')
  const { data: posts, error: pError } = await supabase
    .from('post_metrics')
    .select('id, profile_id, external_id')
    .limit(5)
  if (pError) console.error(pError)
  console.log(posts)
}

check()
