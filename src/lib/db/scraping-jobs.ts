import { createAdminClient } from '@/lib/supabase/admin'

/** Atualiza o status de um scraping_job */
export async function updateScrapingJob(
  id: string,
  update: {
    status: 'scheduled' | 'running' | 'done' | 'failed'
    finished_at?: string
    posts_collected?: number
    error_msg?: string
    started_at?: string
    provider_job_id?: string
  }
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('scraping_jobs')
    .update(update)
    .eq('id', id)

  if (error) throw new Error(`updateScrapingJob: ${error.message}`)
}

/** Cria um scraping_job para um perfil */
export async function createScrapingJob(
  profileId: string,
  provider: string,
  providerJobId: string
) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('scraping_jobs')
    .insert({
      profile_id: profileId,
      provider,
      provider_job_id: providerJobId,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(`createScrapingJob: ${error.message}`)
  return data
}

/** Busca todos os jobs com status 'running' */
export async function getRunningJobs() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('scraping_jobs')
    .select('*, profiles(*)')
    .eq('status', 'running')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getRunningJobs: ${error.message}`)
  return data ?? []
}

/** Busca um job pelo providerJobId */
export async function getScrapingJobByProviderJobId(providerJobId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('scraping_jobs')
    .select('*, profiles(*)')
    .eq('provider_job_id', providerJobId)
    .maybeSingle()

  if (error) throw new Error(`getScrapingJobByProviderJobId: ${error.message}`)
  return data
}
