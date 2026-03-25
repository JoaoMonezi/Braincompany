import { getRunningJobs, updateScrapingJob } from '@/lib/db/scraping-jobs'
import { getProfileById } from '@/lib/db/profiles'
import { normalizers, applyRules } from '@/lib/ingest/normalizer'
import { upsertPost, saveRawResponse } from '@/lib/db/posts'
import { notifyScrapingError, notifyScrapingSuccess } from '@/lib/notifications'
import type { ProfileRules } from '@/lib/schemas/profile'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const APIFY_BASE = 'https://api.apify.com/v2'

async function fetchApifyRun(providerJobId: string) {
  const token = process.env.APIFY_API_TOKEN
  const res = await fetch(`${APIFY_BASE}/actor-runs/${providerJobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Apify getRunStatus falhou: ${res.status}`)
  return (await res.json() as { data: { status: string; defaultDatasetId: string } }).data
}

async function fetchApifyDataset(datasetId: string): Promise<unknown[]> {
  const token = process.env.APIFY_API_TOKEN
  const res = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?format=json&clean=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Apify dataset fetch falhou: ${res.status}`)
  return res.json()
}

async function ingestDataset(
  job: { id: string; profile_id: string; provider_job_id: string },
  datasetId: string
) {
  const profile = await getProfileById(job.profile_id)
  const platform = profile.platform as 'instagram' | 'tiktok' | 'youtube'
  const rules = profile.rules as unknown as ProfileRules

  const items = await fetchApifyDataset(datasetId)
  await saveRawResponse(profile.id, 'apify', {
    runId: job.provider_job_id,
    datasetId,
    itemCount: items.length,
  })

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
        metrics:
          Object.keys(normalized.metrics || {}).length > 0
            ? normalized.metrics
            : {},
      })
      if (result) collected++
    } catch (err) {
      console.error(`[poll-jobs] Erro ao processar item:`, err)
    }
  }

  await updateScrapingJob(job.id, {
    status: 'done',
    finished_at: new Date().toISOString(),
    posts_collected: collected,
  })
  await notifyScrapingSuccess(profile.id, collected)

  console.log(
    `[poll-jobs] ✅ job=${job.id} profile=${profile.handle} collected=${collected}/${items.length}`
  )
  return collected
}

/** GET /api/cron/poll-jobs — Verifica jobs em 'running' e ingere dados automaticamente */
export async function GET() {
  try {
    const jobs = await getRunningJobs()

    if (jobs.length === 0) {
      return Response.json({ ok: true, message: 'Nenhum job pendente', polled: 0 })
    }

    const results: { jobId: string; status: string; collected?: number }[] = []

    for (const job of jobs) {
      try {
        const run = await fetchApifyRun(job.provider_job_id)

        if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) {
          await updateScrapingJob(job.id, {
            status: 'failed',
            finished_at: new Date().toISOString(),
            error_msg: `Apify run status: ${run.status}`,
          })
          await notifyScrapingError(job.profile_id, `Apify run status: ${run.status}`)
          results.push({ jobId: job.id, status: 'failed' })
          continue
        }

        if (!['SUCCEEDED', 'FINISHED'].includes(run.status)) {
          results.push({ jobId: job.id, status: 'still_running' })
          continue
        }

        // SUCCEEDED → ingest
        const collected = await ingestDataset(job, run.defaultDatasetId)
        results.push({ jobId: job.id, status: 'done', collected })
      } catch (err) {
        console.error(`[poll-jobs] Erro ao processar job ${job.id}:`, err)
        results.push({ jobId: job.id, status: 'error' })
      }
    }

    return Response.json({ ok: true, polled: jobs.length, results })
  } catch (error) {
    console.error('[poll-jobs] Erro global:', error)
    return Response.json(
      { error: 'Erro ao verificar jobs pendentes' },
      { status: 500 }
    )
  }
}
