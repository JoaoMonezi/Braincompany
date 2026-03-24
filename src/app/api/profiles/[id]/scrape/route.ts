import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfileById } from '@/lib/db/profiles'
import { createScrapingJob } from '@/lib/db/scraping-jobs'
import { triggerScrape } from '@/lib/scraping'

type Context = { params: Promise<{ id: string }> }

/** POST /api/profiles/[id]/scrape — dispara scraping manual de um perfil */
export async function POST(_req: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await getProfileById(id)

    const { data: isOperator } = await supabase.rpc('is_project_operator', { p_project_id: profile.project_id })
    if (!isOperator) return Response.json({ error: 'Forbidden' }, { status: 403 })

    if (profile.status === 'paused') {
      return Response.json({ error: 'Profile está pausado' }, { status: 400 })
    }

    const runId = await triggerScrape(
      profile.platform as 'instagram' | 'tiktok' | 'youtube',
      profile.handle,
      profile.id
    )

    const job = await createScrapingJob(profile.id, 'apify', runId)

    return Response.json({ job, runId }, { status: 202 })
  } catch (error) {
    console.error('[scrape]', error)
    return Response.json({ error: 'Erro ao disparar scraping' }, { status: 500 })
  }
}
