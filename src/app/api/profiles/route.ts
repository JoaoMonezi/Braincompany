import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProfile, getProfilesByProject } from '@/lib/db/profiles'
import { createScrapingJob } from '@/lib/db/scraping-jobs'
import { CreateProfileSchema } from '@/lib/schemas/profile'
import { ApifyAdapter } from '@/lib/scraping/apify-adapter'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const projectId = request.nextUrl.searchParams.get('project_id')
    if (!projectId) return Response.json({ error: 'project_id obrigatório' }, { status: 400 })

    const profiles = await getProfilesByProject(projectId)
    return Response.json({ profiles })
  } catch (error) {
    return Response.json({ error: 'Erro ao listar profiles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = CreateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 422 })
    }

    const { project_id, platform, handle, display_name, rules, schedule_time } = parsed.data

    // Verificar se o usuário é operator do projeto
    const { data: isOperator } = await supabase.rpc('is_project_operator', { p_project_id: project_id })
    if (!isOperator) return Response.json({ error: 'Forbidden' }, { status: 403 })

    // Criar o schedule na Apify
    let apify_schedule_id = null
    try {
      const adapter = new ApifyAdapter()
      apify_schedule_id = await adapter.createSchedule(
        crypto.randomUUID(), // Temporário pro nome do schedule (já que o DB gera o uuid final)
        platform,
        handle,
        rules as Record<string, unknown>,
        schedule_time
      )
    } catch (scrapeErr) {
      console.error('[profiles] Erro ao criar schedule:', scrapeErr)
      return Response.json({ error: 'Erro ao criar agendamento na Apify' }, { status: 500 })
    }

    // Criar o perfil no banco com o schedule_id
    const profile = await createProfile({
      project_id,
      platform,
      handle,
      display_name: display_name ?? null,
      rules,
      status: 'active',
      schedule_time,
      apify_schedule_id
    } as any) // as any para contornar tipo Database enquanto a migration real n rola no ts types

    return Response.json({ profile }, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown'
    // Unique constraint violation
    if (msg.includes('unique')) {
      return Response.json({ error: 'Perfil já existe neste projeto' }, { status: 409 })
    }
    console.error('[profiles POST]', error)
    return Response.json({ error: 'Erro ao criar perfil' }, { status: 500 })
  }
}
