import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfileById, updateProfile, deleteProfile } from '@/lib/db/profiles'
import { UpdateProfileSchema } from '@/lib/schemas/profile'

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
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Erro ao deletar profile' }, { status: 500 })
  }
}
