import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfileById, updateProfile, deleteProfile } from '@/lib/db/profiles'
import { UpdateProfileSchema } from '@/lib/schemas/profile'
import { ApifyAdapter } from '@/lib/scraping/apify-adapter'

type Context = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await getProfileById(id)

    // Verificar acesso ao projeto
    const { data: hasAccess } = await supabase.rpc('has_project_access', { p_project_id: profile.project_id })
    if (!hasAccess) return Response.json({ error: 'Forbidden' }, { status: 403 })

    return Response.json({ profile })
  } catch {
    return Response.json({ error: 'Profile não encontrado' }, { status: 404 })
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = UpdateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 422 })
    }

    const profile = await getProfileById(id)

    // Apenas operator do projeto pode editar
    const { data: isOperator } = await supabase.rpc('is_project_operator', { p_project_id: profile.project_id })
    if (!isOperator) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const updated = await updateProfile(id, parsed.data)

    // Sync with Apify se houver agendamento atrelado e algum dado alterado impactar
    if (profile.apify_schedule_id) {
      try {
        const adapter = new ApifyAdapter()
        const isEnabled = updated.status === 'active'
        const time = updated.schedule_time || profile.schedule_time || '08:00'
        await adapter.updateSchedule(
          profile.apify_schedule_id,
          updated.platform || profile.platform,
          updated.handle || profile.handle,
          (updated.rules || profile.rules) as Record<string, unknown>,
          time,
          isEnabled
        )
      } catch (apifyErr) {
        console.error('[profiles] Erro updateSchedule na Apify:', apifyErr)
        // Optamos por não falhar a req local caso a sync com Apify dê timeout
      }
    }

    return Response.json({ profile: updated })
  } catch {
    return Response.json({ error: 'Erro ao atualizar profile' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await getProfileById(id)

    const { data: isOperator } = await supabase.rpc('is_project_operator', { p_project_id: profile.project_id })
    if (!isOperator) return Response.json({ error: 'Forbidden' }, { status: 403 })

    await deleteProfile(id)

    // Delete do Schedule na Apify
    if (profile.apify_schedule_id) {
      try {
        const adapter = new ApifyAdapter()
        await adapter.deleteSchedule(profile.apify_schedule_id)
      } catch (apifyErr) {
        console.error('[profiles] Erro deleteSchedule na Apify:', apifyErr)
      }
    }

    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Erro ao deletar profile' }, { status: 500 })
  }
}
