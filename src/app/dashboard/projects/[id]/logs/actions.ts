'use server'

import { createClient } from '@/lib/supabase/server'
import { getScrapingJobByProviderJobId, updateScrapingJob } from '@/lib/db/scraping-jobs'
import { getProfileById } from '@/lib/db/profiles'
import { normalizers, applyRules } from '@/lib/ingest/normalizer'
import { upsertPost, saveRawResponse } from '@/lib/db/posts'
import { notifyScrapingError, notifyScrapingSuccess } from '@/lib/notifications'
import { getScraper } from '@/lib/scraping'
import type { ProfileRules } from '@/lib/schemas/profile'

async function fetchApifyDataset(datasetId: string): Promise<unknown[]> {
  const token = process.env.APIFY_API_TOKEN
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?format=json&clean=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Apify dataset fetch falhou: ${res.status}`)
  return res.json()
}

export async function syncJobAction(jobId: string, providerJobId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado' }

    const job = await getScrapingJobByProviderJobId(providerJobId)
    if (!job) return { error: 'Job não encontrado' }
    if (job.status === 'done') return { error: 'Job já finalizado' }

    // Check Apify status
    const token = process.env.APIFY_API_TOKEN
    const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${providerJobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!runRes.ok) return { error: 'Falha ao buscar status na Apify' }
    
    const runData = await runRes.json()
    const status = runData.data.status
    const datasetId = runData.data.defaultDatasetId

    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      await updateScrapingJob(job.id, {
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_msg: `Apify run status: ${status}`,
      })
      await notifyScrapingError(job.profile_id, `Apify run status: ${status}`)
      return { error: `Extração falhou na Apify (${status})` }
    }

    if (!['SUCCEEDED', 'FINISHED'].includes(status)) {
      return { error: `Extração ainda está rodando (${status}). Tente novamente em 1 minuto.` }
    }

    if (!datasetId) return { error: 'Dataset ID não encontrado' }

    // It's SUCCEEDED, fetch data and ingest
    const profile = await getProfileById(job.profile_id)
    const platform = profile.platform as 'instagram' | 'tiktok' | 'youtube'
    const rules = profile.rules as unknown as ProfileRules

    const items = await fetchApifyDataset(datasetId)
    await saveRawResponse(profile.id, 'apify', { runId: providerJobId, datasetId, itemCount: items.length })

    const normalizer = normalizers[platform]
    let collected = 0

    for (const item of items) {
      try {
        const normalized = normalizer(item)
        if (!normalized) continue

        if (!applyRules(normalized, rules)) continue

        const result = await upsertPost({
          profile_id: profile.id,
          external_id: normalized.external_id,
          content_url: normalized.content_url ?? null,
          thumbnail_url: normalized.thumbnail_url ?? null,
          caption: normalized.caption ?? null,
          post_type: normalized.post_type ?? null,
          published_at: normalized.published_at ?? null,
          metrics: Object.keys(normalized.metrics || {}).length > 0 ? normalized.metrics : {},
        })

        if (result) collected++
      } catch (err) {
        console.error(`[sync] Erro ao processar item:`, err)
      }
    }

    await updateScrapingJob(job.id, {
      status: 'done',
      finished_at: new Date().toISOString(),
      posts_collected: collected,
    })
    await notifyScrapingSuccess(profile.id, collected)

    return { message: `Sincronizado: ${collected} posts importados.` }
  } catch (err: any) {
    console.error(err)
    return { error: err.message || 'Erro interno na sincronização' }
  }
}
