import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { normalizers, applyRules } from '@/lib/ingest/normalizer'
import { upsertPost, saveRawResponse } from '@/lib/db/posts'
import {
  getScrapingJobByProviderJobId,
  updateScrapingJob,
  createScrapingJob,
} from '@/lib/db/scraping-jobs'
import { getProfileById } from '@/lib/db/profiles'
import type { ProfileRules } from '@/lib/schemas/profile'

// Validação do secret do webhook (previne chamadas não autorizadas)
function validateWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.INGEST_WEBHOOK_SECRET
  if (!secret) return true // se não configurado, aceita tudo (dev)
  const headerSecret = request.headers.get('x-webhook-secret')
  return headerSecret === secret
}

// Busca os itens do dataset de um run do Apify
async function fetchApifyDataset(datasetId: string): Promise<unknown[]> {
  const token = process.env.APIFY_API_TOKEN
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?format=json&clean=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Apify dataset fetch falhou: ${res.status}`)
  return res.json()
}

const WebhookSchema = z.object({
  eventType: z.string().optional(),
  resource: z
    .object({
      id: z.string(),
      status: z.string(),
      defaultDatasetId: z.string().optional(),
    })
    .optional(),
  // Formato alternativo do Apify
  actorRunId: z.string().optional(),
  defaultDatasetId: z.string().optional(),
  status: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    if (!validateWebhookSecret(request)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = WebhookSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }

    // Extrair runId e datasetId do payload (Apify pode ter formatos diferentes)
    const runId = parsed.data.resource?.id ?? parsed.data.actorRunId
    const datasetId = parsed.data.resource?.defaultDatasetId ?? parsed.data.defaultDatasetId
    const runStatus = parsed.data.resource?.status ?? parsed.data.status

    if (!runId) {
      return Response.json({ error: 'runId não encontrado no payload' }, { status: 400 })
    }

    // Se não terminou com sucesso, marcar job como failed
    if (runStatus && !['SUCCEEDED', 'FINISHED'].includes(runStatus)) {
      const job = await getScrapingJobByProviderJobId(runId)
      if (job) {
        await updateScrapingJob(job.id, {
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_msg: `Apify run status: ${runStatus}`,
        })
      }
      return Response.json({ ok: true, status: 'job_failed' })
    }

    // Buscar o job correspondente ao runId
    let job = await getScrapingJobByProviderJobId(runId)

    // Se não existe job ainda (possível edge case), criar um
    // Neste caso não temos como associar ao profile_id → retornar ok e logar
    if (!job) {
      console.warn(`[ingest] Job não encontrado para runId: ${runId}`)
      return Response.json({ ok: true, status: 'job_not_found' })
    }

    // Atualizar job para running
    await updateScrapingJob(job.id, { status: 'running' })

    // Buscar perfil para obter platform e rules
    const profile = await getProfileById(job.profile_id)
    const platform = profile.platform as 'instagram' | 'tiktok' | 'youtube'
    const rules = profile.rules as unknown as ProfileRules

    // Buscar items do dataset
    if (!datasetId) {
      await updateScrapingJob(job.id, {
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_msg: 'datasetId não encontrado no webhook payload',
      })
      return Response.json({ error: 'datasetId ausente' }, { status: 400 })
    }

    const items = await fetchApifyDataset(datasetId)

    // Salvar raw response para auditoria
    await saveRawResponse(profile.id, 'apify', { runId, datasetId, itemCount: items.length })

    // Normalizar + aplicar rules + upsert
    const normalizer = normalizers[platform]
    let collected = 0

    for (const item of items) {
      try {
        const normalized = normalizer(item)
        if (!normalized) continue

        // Aplicar regras de negócio
        if (!applyRules(normalized, rules)) continue

        const result = await upsertPost({
          profile_id: profile.id,
          external_id: normalized.external_id,
          content_url: normalized.content_url ?? null,
          thumbnail_url: normalized.thumbnail_url ?? null,
          caption: normalized.caption ?? null,
          post_type: normalized.post_type ?? null,
          published_at: normalized.published_at ?? null,
          metrics: normalized.metrics,
        })

        if (result) collected++
      } catch (err) {
        console.error(`[ingest] Erro ao processar item:`, err)
      }
    }

    // Atualizar job como done
    await updateScrapingJob(job.id, {
      status: 'done',
      finished_at: new Date().toISOString(),
      posts_collected: collected,
    })

    // Atualizar status do perfil para active
    const supabase = (await import('@/lib/supabase/admin')).createAdminClient()
    await supabase.from('profiles').update({ status: 'active', error_msg: null }).eq('id', profile.id)

    console.log(`[ingest] ✅ runId=${runId} profile=${profile.handle} collected=${collected}/${items.length}`)

    return Response.json({ ok: true, collected, total: items.length })
  } catch (error) {
    console.error('[ingest] Erro:', error)
    return Response.json(
      { error: 'Erro interno no ingest', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
